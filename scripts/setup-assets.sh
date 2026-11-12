#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODELS="$ROOT/apps/web/public/models"
BASIS="$ROOT/apps/web/public/basis"
mkdir -p "$MODELS" "$BASIS"

if [ ! -f "$MODELS/s7.glb" ]; then
  SRC="${1:-/mnt/d/edge/generic_sedan_car.glb}"
  if [ ! -f "$SRC" ]; then
    echo "S7 源文件不存在：$SRC" >&2
    echo "用法：$0 /path/to/generic_sedan_car.glb" >&2
    exit 1
  fi
  echo "==> 压缩 S7 到 1K WebP + 简化几何（8.5MB → 约 4.3MB）"
  pnpm dlx @gltf-transform/cli resize "$SRC" /tmp/wangshu-s7-1k.glb --width 1024 --height 1024
  pnpm dlx @gltf-transform/cli webp /tmp/wangshu-s7-1k.glb /tmp/wangshu-s7-1k-webp.glb --quality 78
  pnpm dlx @gltf-transform/cli simplify /tmp/wangshu-s7-1k-webp.glb /tmp/wangshu-s7-simplified.glb --ratio 0.8 --error 0.001
  pnpm dlx @gltf-transform/cli prune /tmp/wangshu-s7-simplified.glb "$MODELS/s7.glb"
else
  echo "==> S7 已存在，跳过"
fi

THREE_BASIS="$ROOT/apps/web/node_modules/three/examples/jsm/libs/basis"
if [ -d "$THREE_BASIS" ]; then
  cp "$THREE_BASIS/basis_transcoder.js" "$BASIS/"
  cp "$THREE_BASIS/basis_transcoder.wasm" "$BASIS/"
  echo "==> KTX2 transcoder 已复制"
else
  echo "警告：找不到 three 的 basis transcoder，s7 的 KTX2 贴图可能无法加载" >&2
fi

echo "==> 资源就绪：$MODELS"