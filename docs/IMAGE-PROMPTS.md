# 极速智选 · 图片需求与提示词

> 当前最优先：2 款车 × 5 个车漆颜色 = 10 张换色海报。
> 基准图不要重画，只做“局部重绘/换色”；否则车型、背景、轮毂会跑。

## 0. 基准图（直接用现有海报）

- 汉 EV：apps/web/public/images/han-hero.webp
- 海豹：apps/web/public/images/seal-hero.webp
- 尺寸：1600 × 1000（16:10）
- 这两张是唯一基准，构图、机位、背景、车、轮毂、车标、车牌都不能变。

## 1. 输出文件清单（先做这 10 张）

目录：apps/web/public/images/paints/

汉 EV：

- han-ev/black.webp — 玄空黑 #0B0D10
- han-ev/white.webp — 雪域白 #E8E6E1
- han-ev/gray.webp — 时光灰 #7A828C
- han-ev/slate.webp — 亚特兰蒂斯灰 #3B4A5A
- han-ev/blue.webp — 极光蓝 #1B4F8A

海豹：

- seal/black.webp — 玄空黑 #0B0D10
- seal/white.webp — 雪域白 #E8E6E1
- seal/gray.webp — 时光灰 #7A828C
- seal/slate.webp — 亚特兰蒂斯灰 #3B4A5A
- seal/blue.webp — 极光蓝 #1B4F8A

如果先做 3 色，就先做 black / white / gray 共 6 张；slate / blue 后补。

## 2. 通用提示词（中文，直接复制）

把下面提示词里的「颜色名 + 色值」替换掉，其他不要改：

> 以我上传的这张汽车海报为唯一基准图（必须保留原构图、机位、背景、山脉/道路、天空、地面反射、光影方向、车身造型、四门比例、轮毂、车窗、车灯、格栅、车标、车牌，全部不变），只对车身外覆盖件的车漆做局部重绘：把车漆改为「玄空黑」#0B0D10，呈高光金属漆质感；保留原有环境反射和高光层次，不要变成死黑。除车漆颜色外，其他任何像素都不要改变。输出与原图完全相同的 1600×1000 构图和比例；不要新增文字、水印、人物、第二辆车；不要改变车型、车门数量、轮毂样式和背景。

## 3. 英文版（如果工具对英文更稳）

> Use the uploaded car poster as the ONLY reference. Preserve exactly: composition, camera angle, background, mountains/road, sky, ground reflection, lighting direction, four-door body shape, wheels, windows, lights, grille, badges, license plate, and shadows. Repaint ONLY the exterior body paint to 玄空黑 #0B0D10 with a glossy metallic finish, keeping the original reflections and highlights; do not turn it into flat black. Do not change any other pixel. Output the same 1600×1000 crop and aspect ratio. No added text, watermark, people, or second car; do not change the model, door count, wheel design, or background.

## 4. 每个颜色的微调

- 玄空黑 #0B0D10：保留高光、天空/地面反射；不要一团黑；轮毂和轮胎边缘不能被吃掉。
- 雪域白 #E8E6E1：珍珠白/暖白，不要过曝；腰线、门缝、轮拱要保留。
- 时光灰 #7A828C：中性灰金属漆，不要偏蓝或偏棕。
- 亚特兰蒂斯灰 #3B4A5A：深蓝灰金属漆，暗部保留层次。
- 极光蓝 #1B4F8A：深金属蓝，不要变成亮青色；与海豹原图青色区分开。

## 5. 负面提示词

> 不要改变车身造型、四门数量、轮毂、轮胎、车窗、车灯、格栅、车标、车牌、背景、山脉、道路、天空、文字、水印；不要新增或删除车辆/人物/车门/后视镜；不要改变视角、透视、构图、比例；不要出现第二辆车；不要塑料感、死黑、过曝、偏色、重复轮毂、错误车标、融化边缘。

## 6. 出图方式（关键）

1. 用局部重绘 / inpainting / 生成式填充，不要直接文生图重画整张；
2. Mask 只涂车身外覆盖件漆面：引擎盖、车顶、车门、翼子板、前后包围；
3. Mask 必须避开：玻璃、轮胎、轮毂、灯组、格栅、车标、车牌、地面、背景、阴影；
4. 重绘幅度/Denoise 低一些（约 0.25–0.45），多出 3–5 张候选；
5. 选图后只做轻微校色，不要重新裁切；
6. 导出 WebP，sRGB，1600×1000，质量 82–88，无透明通道；
7. 原图、prompt、生成日期保留，答辩时能说明 AI 处理流程。

## 7. 其他品牌车型的图片

真实品牌车型不建议纯文生图：AI 会画错大灯、格栅、车身比例和车标，容易被看出“假车”。
更稳的做法是：

- 从品牌官网/官方新闻稿收集 1600×1000 以上的官方海报；
- 用上面的“只换色”流程做同品牌颜色变体；
- 图片 alt/credits 标来源；
- 如果确实要用 AI 生成，只能标“示意图”，不能写成官方实拍。

下一批建议先收 6 款，用来把首页从“只有比亚迪”变成多品牌：

- public/images/brands/tesla-model3.webp
- public/images/brands/xpeng-p7.webp
- public/images/brands/zeekr-001.webp
- public/images/brands/xiaomi-su7.webp
- public/images/brands/nio-et5.webp
- public/images/brands/li-l6.webp

通用“品牌无关”棚拍提示词（只能做示意，不要冒充官方图）：

> 高端汽车官网主视觉，四门轿车/SUV，三分之四前侧视角，车身位于画面右侧，左侧留白；浅灰或纯白摄影棚，柔和顶光与地面反射，真实车漆质感；无品牌车标、无车牌、无文字、无水印、无人物；16:10，1600×1000，商业汽车摄影，干净、克制、层次清晰。

## 8. 交付前检查

- 尺寸严格 1600×1000，比例 16:10；
- 同一车型 5 张放一起，像同一台车换漆，不是 5 台车；
- 轮毂、车窗、车灯、车牌、车标、背景、山脉、道路完全一致；
- 黑车有高光、白车不过曝、灰/蓝不偏色；
- 无 AI 涂抹、重复轮毂、错误车门、错误车标、文字乱码；
- 文件命名和目录完全按第 1 节。
