<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { Reflector } from "three/addons/objects/Reflector.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const props = defineProps<{
  modelSlug: string;
  paintHex: string;
  wheelFinish: "silver" | "black" | "gold";
  view?: "front" | "side" | "rear";
}>();

const emit = defineEmits<{
  ready: [];
  error: [message: string];
  progress: [percent: number];
}>();

const host = ref<HTMLDivElement | null>(null);

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let composer: EffectComposer | null = null;
let ktx2: KTX2Loader | null = null;
let current: THREE.Group | null = null;
let paints: THREE.MeshPhysicalMaterial[] = [];
let rims: THREE.MeshStandardMaterial[] = [];
let raf = 0;
let resizeObserver: ResizeObserver | null = null;
let loadToken = 0;
let loadTimer: ReturnType<typeof setTimeout> | null = null;
let dragging = false;
let lastX = 0;
let targetY = Math.PI * 0.12;
let currentY = targetY;

const VIEW_ANGLES: Record<"front" | "side" | "rear", number> = {
  front: Math.PI * 0.24,
  side: Math.PI * 0.5,
  rear: Math.PI * 0.78,
};

const wheelColors: Record<string, number> = {
  silver: 0xb8bcc4,
  black: 0x2a2d33,
  gold: 0xc8a96b,
};

const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    offset: { value: 1.05 },
    darkness: { value: 0.9 },
  },
  vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader:
    "uniform sampler2D tDiffuse; uniform float offset; uniform float darkness; varying vec2 vUv; void main(){ vec4 tex = texture2D(tDiffuse, vUv); vec2 uv = (vUv - 0.5) * offset; float v = 1.0 - dot(uv, uv) * darkness; gl_FragColor = vec4(tex.rgb * clamp(v, 0.0, 1.0), tex.a); }",
};

function envPlane(
  target: THREE.Scene,
  hex: number,
  power: number,
  pos: [number, number, number],
  rot: [number, number, number],
  scale: [number, number, number],
) {
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(hex).multiplyScalar(power),
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  mesh.position.set(...pos);
  mesh.rotation.set(...rot);
  mesh.scale.set(...scale);
  target.add(mesh);
}

function init() {
  const el = host.value;
  if (!el) return;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(el.clientWidth || 800, el.clientHeight || 600);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.66;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  el.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07090c);
  scene.fog = new THREE.Fog(0x07090c, 18, 40);

  camera = new THREE.PerspectiveCamera(
    32,
    (el.clientWidth || 800) / (el.clientHeight || 600),
    0.1,
    200,
  );
  camera.position.set(6.4, 2.35, 8.8);
  camera.lookAt(-0.4, 0.85, 0);

  RectAreaLightUniformsLib.init();

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envPlane(envScene, 0xffffff, 1.8, [0, 7, 0], [-Math.PI / 2, 0, 0], [12, 7, 1]);
  envPlane(envScene, 0xffe4bd, 1.2, [-7, 2.4, 4], [0, Math.PI / 2, 0], [7, 5, 1]);
  envPlane(envScene, 0x9fc4ff, 0.8, [7, 2.4, -3], [0, -Math.PI / 2, 0], [6, 5, 1]);
  envPlane(envScene, 0xffffff, 0.6, [0, 2.4, -9], [0, 0, 0], [14, 6, 1]);
  scene.environment = pmrem.fromScene(envScene, 0.05).texture;
  scene.environmentIntensity = 0.78;

  const key = new THREE.SpotLight(0xfff4e2, 120, 45, Math.PI / 5.2, 0.8, 1.3);
  key.position.set(-5.5, 8.5, 3.5);
  key.target.position.set(0, 0.4, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0002;
  scene.add(key, key.target);

  const softbox = new THREE.RectAreaLight(0xfff4e2, 2.2, 10, 5);
  softbox.position.set(-3.0, 7.2, 0.8);
  softbox.lookAt(0, 0.8, 0);
  scene.add(softbox);

  const rim = new THREE.DirectionalLight(0xc8a96b, 2.2);
  rim.position.set(5.5, 2.6, -7.2);
  scene.add(rim);

  const rim2 = new THREE.DirectionalLight(0x7fa6d8, 1.2);
  rim2.position.set(-6, 2.2, -5.5);
  scene.add(rim2);

  const fill = new THREE.HemisphereLight(0x7fa6d8, 0x05070a, 0.2);
  scene.add(fill);

  const mirror = new Reflector(new THREE.CircleGeometry(30, 96), {
    clipBias: 0.003,
    textureWidth: 1024,
    textureHeight: 1024,
    color: 0x151920,
  });
  mirror.rotation.x = -Math.PI / 2;
  mirror.position.y = 0.001;
  scene.add(mirror);

  const shadowGeo = new THREE.CircleGeometry(3.2, 64);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  shadow.scale.set(1.6, 1, 1);
  scene.add(shadow);

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(
    new UnrealBloomPass(
      new THREE.Vector2(el.clientWidth || 800, el.clientHeight || 600),
      0.05,
      0.35,
      0.95,
    ),
  );
  composer.addPass(new ShaderPass(VignetteShader));
  composer.addPass(new OutputPass());

  ktx2 = new KTX2Loader();
  ktx2.setTranscoderPath(import.meta.env.BASE_URL + "basis/");
  ktx2.detectSupport(renderer);

  el.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  el.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("resize", resize);
  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(el);

  loadModel();
  animate();
}

function loadModel() {
  if (!scene || !renderer || !ktx2) return;
  const token = ++loadToken;
  if (loadTimer !== null) clearTimeout(loadTimer);
  loadTimer = setTimeout(() => {
    if (token === loadToken) emit("error", "3D 模型加载超时");
  }, 45_000);
  const loader = new GLTFLoader();
  loader.setKTX2Loader(ktx2);
  loader.load(
    `${import.meta.env.BASE_URL}models/${props.modelSlug}.glb`,
    (gltf) => {
      if (loadTimer !== null) {
        clearTimeout(loadTimer);
        loadTimer = null;
      }
      if (token !== loadToken || !scene) return;
      if (current) {
        scene.remove(current);
        disposeObject(current);
      }
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const scale = 5.9 / Math.max(size.x, size.z);
      model.scale.setScalar(scale);
      model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
      const initialView = VIEW_ANGLES[props.view ?? "front"];
      model.rotation.y = initialView;
      targetY = initialView;
      currentY = targetY;

      paints = [];
      rims = [];
      model.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.name === "License Plate" || mesh.name === "InteriorSteeringEmblem") {
          mesh.visible = false;
        }
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const material of materials) {
          if (!material) continue;
          const name = material.name;
          if (name === "Car_Paint_-_All_Colors") {
            const paintMaterial = material as THREE.MeshPhysicalMaterial;
            paintMaterial.map = null;
            paintMaterial.roughness = 0.48;
            paintMaterial.metalness = 0.4;
            paintMaterial.needsUpdate = true;
            paints.push(paintMaterial);
          } else if (name === "Paint 1 Carmine" || name === "Paint 2 Carmine") {
            paints.push(material as THREE.MeshPhysicalMaterial);
          }
          if (name === "Rim1" || name === "Rim2") {
            rims.push(material as THREE.MeshStandardMaterial);
          }
          if (name === "License") {
            mesh.visible = false;
          }
        }
      });
      paints = [...new Set(paints)];
      rims = [...new Set(rims)];
      current = model;
      scene.add(model);
      applyPaint();
      applyWheels();
      emit("ready");
    },
    (progress) => {
      const total = progress.total || 0;
      const percent = total > 0 ? Math.round((progress.loaded / total) * 100) : 0;
      emit("progress", Math.min(percent, 99));
    },
    (error) => {
      console.error("3D load failed", error);
      emit("error", "3D 模型加载失败");
    },
  );
}

function applyPaint() {
  const color = new THREE.Color(props.paintHex || "#8a0f14");
  for (const material of paints) {
    material.color.copy(color);
    if ("clearcoat" in material) {
      material.clearcoat = Math.min(material.clearcoat ?? 0.7, 0.32);
    }
    if ("roughness" in material) {
      material.roughness = Math.max(material.roughness ?? 0.3, 0.46);
    }
    if ("envMapIntensity" in material) {
      material.envMapIntensity = 0.55;
    }
    material.needsUpdate = true;
  }
}

function applyWheels() {
  const color = wheelColors[props.wheelFinish] ?? wheelColors.silver;
  for (const material of rims) {
    material.color.set(color);
    material.metalness = 1;
    material.roughness = 0.18;
    material.needsUpdate = true;
  }
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.geometry?.dispose();
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of materials) material?.dispose();
    }
  });
}

function resize() {
  const el = host.value;
  if (!el || !renderer || !camera || !composer) return;
  const width = el.clientWidth || 800;
  const height = el.clientHeight || 600;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  composer.setSize(width, height);
}

function onPointerDown(event: PointerEvent) {
  dragging = true;
  lastX = event.clientX;
}

function onPointerMove(event: PointerEvent) {
  if (!dragging) return;
  targetY += (event.clientX - lastX) * 0.006;
  lastX = event.clientX;
}

function onPointerUp() {
  dragging = false;
}

function onWheel(event: WheelEvent) {
  if (!camera) return;
  event.preventDefault();
  camera.position.z = THREE.MathUtils.clamp(
    camera.position.z + event.deltaY * 0.004,
    6.8,
    13.0,
  );
  camera.lookAt(-0.4, 0.85, 0);
}

function animate() {
  raf = requestAnimationFrame(animate);
  currentY += (targetY - currentY) * 0.08;
  if (current) current.rotation.y = currentY;
  composer?.render();
}

onMounted(() => {
  try {
    init();
  } catch (error) {
    console.error("3D init failed", error);
    emit("error", "3D 初始化失败");
  }
});

onBeforeUnmount(() => {
  if (loadTimer !== null) {
    clearTimeout(loadTimer);
    loadTimer = null;
  }
  cancelAnimationFrame(raf);
  resizeObserver?.disconnect();
  const el = host.value;
  if (el) {
    el.removeEventListener("pointerdown", onPointerDown);
    el.removeEventListener("wheel", onWheel);
  }
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);
  window.removeEventListener("resize", resize);
  if (current) disposeObject(current);
  composer?.dispose();
  renderer?.dispose();
  el?.replaceChildren();
});

watch(() => props.paintHex, applyPaint);
watch(() => props.wheelFinish, applyWheels);
watch(() => props.modelSlug, loadModel);
watch(
  () => props.view,
  (next) => {
    targetY = VIEW_ANGLES[next ?? "front"];
  },
);
</script>

<template>
  <div ref="host" class="stage" role="img" aria-label="3D 车辆预览，可拖动旋转、滚轮缩放"></div>
</template>

<style scoped>
.stage {
  position: absolute;
  inset: 0;
  cursor: grab;
  touch-action: none;
}
.stage:active {
  cursor: grabbing;
}
.stage :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>