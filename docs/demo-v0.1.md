# Demo v0.1 · 可展示的一版

> 目标：本地一条命令跑起来，3 分钟内演示「选车 → 配置 → 报价 → 下订 → 模拟支付 → 订单」。

## 范围

### 做

- 首页：R1 hero、品牌主张、3 个数字、R1/S7 两张车型卡。
- 车型矩阵：R1 / S7。
- 车型详情：参数、3 个版本、进入配置器。
- 配置器：3D 车、车漆、轮毂、选装、实时价格、约束提示。
- 报价单：裸车/购置税/保险/上牌/落地，打印。
- 下订：姓名、手机、门店、配置快照、定金。
- 模拟支付：订单号、定金、按钮、成功跳订单。
- 订单：状态时间线、配置快照。
- 素材致谢页。

### 暂不做

- 登录/注册、后台管理、试驾预约、金融计算器、对比、向导、内容页。
- 真实支付、真实库存、物流。

## 路由

    /                       首页
    /models                 车型矩阵
    /models/:slug           车型详情
    /configurator/:slug     配置器
    /quote                  报价单（sessionStorage 快照）
    /order/new              下订
    /pay/:orderNo           模拟支付
    /orders/:orderNo        订单详情
    /credits                素材致谢

## API

见 docs/api-contract.md。核心：

    GET  /api/models
    GET  /api/models/:slug
    GET  /api/models/:slug/options
    POST /api/quote
    GET  /api/stores
    POST /api/orders
    GET  /api/orders/:orderNo
    POST /api/orders/:orderNo/pay

## 种子数据

- 车型：R1（双门 GT，3 版本）、S7（四门轿跑，3 版本）。
- 车漆 5、轮毂 3、内饰 2、选装包 3、门店 4。
- 规则：21 英寸轮毂需性能/赛道版本。

## 验收

1. pnpm dev 后 http://127.0.0.1:5173 可打开。
2. 首页/车型/详情无报错。
3. 配置器换漆、换轮毂、加选装，价格条实时变；非法组合有提示。
4. 下订 → 支付 → 订单状态 paid；刷新后仍可查。
5. 1440×900 截图 4 张：首页、配置器、报价、订单。

## 运行

    pnpm install
    pnpm dev
    # API http://127.0.0.1:3100
    # Web http://127.0.0.1:5173

## 资产

R1：/models/r1.glb；S7：/models/s7.glb；hero 图：/images/r1-hero.webp、/images/s7-hero.webp。
模型文件不入库（.gitignore），由 scripts/setup-assets.sh 从本地源复制。
