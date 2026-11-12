# 海豹 AI 换色两套结果对比（2026-11-13）

## 对比对象

- A 套：apps/web/public/images/paints/seal-det/，确定性 Lab 重映射；原 paints/seal/ 被选为展示后移到此处。
- B 套：/tmp/opencode/paint/s-{color}.jpg，另一套生成结果，已转 WebP 写入 paints/seal/。

两套都是 1600×1000、5 色（black / white / gray / slate / blue）。汉 EV 只有 A 套，保留在 paints/han-ev/。

## 客观指标（以 masks/seal.png 的非漆面区域为基准）

| 颜色 | A 非漆面 MAE | A PSNR | B 非漆面 MAE | B PSNR |
|---|---:|---:|---:|---:|
| black | 0.497 | 46.84 dB | 2.071 | 26.54 dB |
| white | 0.528 | 45.74 dB | 2.552 | 24.19 dB |
| gray | 0.523 | 46.00 dB | 1.236 | 31.82 dB |
| slate | 0.554 | 44.59 dB | 1.503 | 31.04 dB |
| blue | 0.697 | 37.74 dB | 1.282 | 32.96 dB |

A 套在“非漆面区尽量不动”上明显更强；B 套有更大的整体色调/转码差异，不能宣称 bitwise 不变。

## 主观判断

- B 套更像真实车漆：黑车有深色高光，白车更干净，灰/蓝更通透；门把手、灯组、轮毂附近的青色边界比 A 套少。
- A 套更严谨：非漆面 MAE 约 0.5，PSNR 45–47 dB（蓝色 37.7 dB），适合回答“怎么证明只改了车漆”。
- A 套已知问题：海豹车顶/门缝有细青色边界；汉 EV 白/浅灰保留原图树影反射，显脏。

## 当前选择

- 海豹 r1：用 B 套（paints/seal/），优先展示效果。
- 汉 EV s7：用 A 套（paints/han-ev/），没有 B 套可用。
- A 套海豹备份在 paints/seal-det/，答辩若被追问“是否只改车漆”，可展示 A 套和指标。
- 入库来源分别标记为 other-ai 与 deterministic，reviewed=1。

## 诚实说明

B 套非漆面并非 bitwise 不变；如果论文/答辩必须坚持“像素级只改车漆”，应改用 A 套，或对 B 套做逐像素复核后再宣称。
