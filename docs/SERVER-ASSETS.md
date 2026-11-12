# 服务器图片存储与上传约定

> 2026-11-12 21:41 实测：磁盘 40G，已用 7.7G，可用 30G；内存 1.7Gi，已用 726Mi，可用约 1.0Gi。

## 结论

- 图片放服务器完全够：1000 张 WebP 约 150–200MB，当前剩余 30G。
- **不要在这台服务器上跑图像生成/AI 模型**：只有 1.7Gi 内存，Stable Diffusion 一类会 OOM；图片在本机或在线工具生成，最终图上传。
- 静态图片和 3D 模型不占多少内存，Nginx 直接托管即可，不需要对象存储/CDN。

## 目录

最终前端可访问图（Nginx 静态）：

- /var/www/wangshu/images/paints/{model}/{color}.webp
- /var/www/wangshu/images/brands/{slug}.webp
- 访问 URL：https://ziphare.me/images/paints/...、https://ziphare.me/images/brands/...

原始素材（不暴露到 Web，保留 AI 原图/prompt）：

- /opt/wangshu/assets/paints-src/
- /opt/wangshu/assets/brand-src/

已创建目录并验证：/images/paints/ 探针文件返回 200，随后已删除。

## 上传方式

单张/少量：

    scp han-hero-black.webp deploy@203.0.113.10:/var/www/wangshu/images/paints/han-ev/black.webp

批量：

    rsync -av ./paints/ deploy@203.0.113.10:/var/www/wangshu/images/paints/

原始大图：

    rsync -av ./paints-src/ deploy@203.0.113.10:/opt/wangshu/assets/paints-src/

## 规则

1. 前端只引用 **WebP**，1600×1000，质量 82–88；原图 PNG 只放 assets，不进 Web 根。
2. 文件名只用小写英文/数字/短横线，不要中文和空格：black.webp、white.webp、tesla-model3.webp。
3. 不要提交几十 MB 的原始 PNG 到 Git；Git 只保留最终 WebP 或路径清单。
4. 部署脚本不做 rsync --delete；部署后用 dist/assets 清单清理旧 hash chunk（2026-11-13 已清一次 1022 个），重装/迁移仍要单独备份图片。
5. 每日 SQLite 备份不包含图片；图片目录建议每周做一次 tar 备份到 /opt/wangshu/backups/assets-YYYYMMDD.tar.gz。
6. 不要把 .secrets、数据库、API key 放到 /var/www。
7. 大图上传后先本地验收，再传服务器；服务器不做图像处理。

## 容量估算

- 10 张换色图（当前 demo）：约 1–2MB
- 100 张（20 款车 × 5 色）：约 15–20MB
- 1000 张：约 150–200MB
- 原始 PNG 若每张 10MB，1000 张约 10GB；仍放得下，但建议只留精选原图。

## 相关文档

- 图片提示词与命名：docs/IMAGE-PROMPTS.md
- 部署：docs/deploy-ip.md、docs/DEPLOY-STATE.md
