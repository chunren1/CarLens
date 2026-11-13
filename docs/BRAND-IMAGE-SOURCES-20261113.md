# 2026-11-13 高清基准图替换

本次从品牌官网/官方发布会素材重新拉取并裁切 8 款车型的 1600×1000 WebP 基准图：

| slug | 来源页 | 原始图 |
|---|---|---|
| tesla-modely | https://www.tesla.cn/modely | https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Model-Y-L-Hero-Localized-Desktop-CN.jpg |
| nio-et5 | https://www.nio.cn/et5 | https://cdn-public.nio.com/www-nio-cn/admin-file-upload/2/2026-06-12/c20496/top-hero-desktop.jpg |
| nio-es6 | https://www.nio.cn/es6 | https://cdn-public.nio.com/www-nio-cn/admin-file-upload/2/2026-04-02/1aa8c4/top-hero-desktop.jpg |
| xpeng-g9 | https://www.xiaopeng.com/g9.html | https://xps01.xiaopeng.com/cms/material/pic/2026/01-06/pic_20260106210945_22014.jpg |
| aito-m5 | https://aito.auto/model/m5/ | https://aito.auto/dam/content/dam/aito/cn/homepage/main/img/250319/m5-new-pc.jpg |
| leapmotor-c11 | https://cn.leapmotor.com/C11-aggregation.html | https://lp-website.oss-cn-hangzhou.aliyuncs.com/Leapmotor-Chinese-web/c11-2026-new/pc/1.jpg |
| li-l7 | https://www.lixiang.com/l7 | https://p.ampmake.com/lilibrary/563679654744788/d737135c-b813-44d3-890c-dddfd91c3655.jpg@d_progressive |
| xiaomi-su7 | https://www.xiaomiev.com/ | https://s1.xiaomiev.com/activity-outer-assets/0328/images/su7_20260107/home.jpg |

说明：

- SU7 使用官网首页无人物车图，按车身边界裁切，去掉人物；图上仍带“新一代 SU7”官方标题字样，若后续换色需要纯净底图，建议再找一张无标题版本。
- 其余 5 款（zeekr-7x、aito-m7、li-l6、leapmotor-c10、aion-i60）保留现有 1600×1000 官方图；暂未找到比现图更干净、且无人物/双车的官方原图。
- 仅替换基准图，不影响已接入的 5 款换色图（zeekr-001、tesla-model3、xpeng-g6、xpeng-p7、xiaomi-yu7）。
