# 车鉴 CarLens · 20 款车型 AI 换色图提示词

> 目标：基于每款车的官方海报，生成 5 个车漆颜色；配置器 2D 模式按颜色切图。
> 尺寸：1600×1000（16:10）WebP，sRGB，质量 82–88。

## 0. 基准图与输出目录

| 车型 slug | 车型 | 基准图 |
|---|---|---|
| r1 | 比亚迪 海豹 | /images/seal-hero.webp |
| s7 | 比亚迪 汉 EV | /images/han-hero.webp |
| tesla-model3 | 特斯拉 Model 3 | /images/brands/tesla-model3.webp |
| tesla-modely | 特斯拉 Model Y | /images/brands/tesla-modely.webp |
| xpeng-p7 | 小鹏 P7+ | /images/brands/xpeng-p7.webp |
| zeekr-001 | 极氪 001 | /images/brands/zeekr-001.webp |
| xiaomi-su7 | 小米 SU7 | /images/brands/xiaomi-su7.webp |
| nio-et5 | 蔚来 ET5 | /images/brands/nio-et5.webp |
| li-l6 | 理想 L6 | /images/brands/li-l6.webp |
| aito-m7 | 问界 M7 | /images/brands/aito-m7.webp |
| leapmotor-c10 | 零跑 C10 | /images/brands/leapmotor-c10.webp |
| aion-i60 | 埃安 AION i60 | /images/brands/aion-i60.webp |
| xpeng-g6 | 小鹏 G6 | /images/brands/xpeng-g6.webp |
| xpeng-g9 | 小鹏 G9 | /images/brands/xpeng-g9.webp |
| nio-es6 | 蔚来 ES6 | /images/brands/nio-es6.webp |
| li-l7 | 理想 L7 | /images/brands/li-l7.webp |
| aito-m5 | 问界 M5 | /images/brands/aito-m5.webp |
| leapmotor-c11 | 零跑 C11 | /images/brands/leapmotor-c11.webp |
| xiaomi-yu7 | 小米 YU7 | /images/brands/xiaomi-yu7.webp |
| zeekr-7x | 极氪 7X | /images/brands/zeekr-7x.webp |

输出：apps/web/public/images/paints/{slug}/{color}.webp

颜色 key：black 玄空黑 #0B0D10、white 雪域白 #E8E6E1、gray 时光灰 #7A828C、slate 亚特兰蒂斯灰 #3B4A5A、blue 极光蓝 #1B4F8A。

## 1. 先做哪批

优先 6 款：特斯拉 Model 3、小米 SU7、极氪 001、小鹏 P7+、小鹏 G6、小米 YU7。先每款做黑/白/灰 3 色，共 18 张；确认效果后再补 slate / blue。

## 2. 通用中文提示词（只替换颜色名与色值）

> 以我上传的这张汽车海报为唯一基准图，必须保留原构图、机位、背景、天空、地面反射、光影方向、车身造型、四门/五门比例、轮毂、车窗、车灯、格栅、车标、车牌，全部不变。只对车身外覆盖件的车漆做局部重绘：把车漆改为「玄空黑」#0B0D10，呈高光金属漆质感；保留原有环境反射和高光层次，不要变成死黑。除车漆颜色外，其他任何像素都不要改变。输出与原图完全相同的 1600×1000 构图和比例；不要新增文字、水印、人物、第二辆车；不要改变车型、车门数量、轮毂样式和背景。

## 3. 英文版（适合英文更稳的工具）

> Use the uploaded car poster as the ONLY reference. Preserve exactly composition, camera angle, background, sky, ground reflection, lighting direction, body shape, door count, wheels, windows, lights, grille, badges, license plate, and shadows. Repaint ONLY the exterior body paint to 玄空黑 #0B0D10 with a glossy metallic finish; keep original reflections and highlights. Do not change any other pixel. Output the same 1600×1000 crop and aspect ratio. No text, watermark, people, or second car; do not change the model, door count, wheel design, or background.

## 4. 负面提示词

> 不要改变车身造型、车门数量、轮毂、轮胎、车窗、车灯、格栅、车标、车牌、背景、山脉、道路、天空、文字、水印；不要新增或删除车辆/人物/车门/后视镜；不要改变视角、透视、构图、比例；不要出现第二辆车；不要塑料感、死黑、过曝、偏色、重复轮毂、错误车标、融化边缘。

## 5. 出图方式

1. 局部重绘 / inpainting / 生成式填充，不要整张文生图；
2. Mask 只涂车身外覆盖件漆面：引擎盖、车顶、车门、翼子板、前后包围；
3. Mask 避开玻璃、轮胎、轮毂、灯组、格栅、车标、车牌、地面、背景、阴影；
4. Denoise 0.25–0.45，每次 3–5 张候选；
5. 选图后只轻微校色，不重新裁切；
6. 原图/prompt/日期留存，答辩可说明。

## 6. 颜色微调

- 玄空黑 #0B0D10：保留高光与反射，不要死黑；
- 雪域白 #E8E6E1：珍珠白/暖白，避免过曝，保留腰线；
- 时光灰 #7A828C：中性灰，不偏蓝/棕；
- 亚特兰蒂斯灰 #3B4A5A：深蓝灰，暗部有层次；
- 极光蓝 #1B4F8A：深金属蓝，不要亮青。

## 7. 新车型的基准图

新加的 8 款（G6/G9/ES6/L7/M5/C11/YU7/7X）基准图已从品牌官网下载，路径见上表。不要用 AI 重画整车再去换色，否则车型结构容易错。

## 8. 交付后怎么接

按目录命名放好后，系统通过 model_paint_images 表映射颜色；没有图的颜色自动回退到 heroImage。入库时只使用 reviewed=1 的图。

## 9. 当前已交付

- 海豹 r1：apps/web/public/images/paints/seal/（确定性 v3，已入库）
- 汉 EV s7：apps/web/public/images/paints/han-ev/（确定性 A 套，已入库）
- 海豹旧 A 套备份：apps/web/public/images/paints/seal-det/
- 两套差异与指标：docs/IMAGE-COMPARISON.md
