import type { AppDb } from "./client";
import { news } from "./schema";

export interface NewsSeed {
  slug: string;
  title: string;
  tag: string;
  summary: string;
  body: string;
  status: "published" | "draft";
  publishedAt: string;
}

export const NEWS_SEED: NewsSeed[] = [
  {
    slug: "r1-configurator-launch",
    title: "比亚迪海豹配置器上线：五套车漆与 21 英寸轮毂",
    tag: "产品",
    summary: "从版本、车漆、轮毂到选装包，高清车型图与价格实时联动，违规组合会在配置器内直接提示。",
    body:
      "比亚迪海豹的在线配置器已经上线。你可以从三个版本开始，依次选择车漆、轮毂、内饰与选装包，车型图与价格会实时联动。\n\n" +
      "所有价格与规则都在服务端计算：前端只提交选项 ID，服务端重新校验组合并返回报价。21 英寸轮毂需要搭配四驱性能版，这类规则会在配置器里直接提示，而不是等提交后才报错。\n\n" +
      "配置完成后，可以生成逐项列明的报价单，或直接进入下订与模拟支付流程。",
    status: "published",
    publishedAt: "2026-11-12",
  },
  {
    slug: "four-city-test-drive",
    title: "首批四家直营门店开放试驾预约",
    tag: "服务",
    summary: "广州、深圳、上海四家比亚迪中心开放预约；试驾不收费，配置与报价可在门店内完成。",
    body:
      "比亚迪首批四家直营门店开放试驾预约：广州天河、广州白云、深圳南山、上海静安。\n\n" +
      "试驾不收取费用，也不代表下单。门店顾问会先与你确认时间，再安排静态体验与城市道路试驾。配置与报价可以在手机上完成，到店只需要看车和聊需求。\n\n" +
      "预约入口在官网「预约试驾」，选择车型、门店与期望时间即可；提交后门店会在 24 小时内联系确认。",
    status: "published",
    publishedAt: "2026-11-08",
  },
  {
    slug: "why-dark-gallery",
    title: "为什么我们把展厅做成白色",
    tag: "品牌",
    summary: "白色不是留白，而是让车的比例、颜色和一条准确的腰线成为主角。这是比亚迪的展示方法。",
    body:
      "很多汽车官网把信息堆在首屏。我们选择先给车留出空间：白色背景、清晰的车身照片、克制的红色，让车成为画面里唯一的主角。\n\n" +
      "白色不是留白。它让车漆的颜色、曲面的转折和灯带的形状更容易被看清。用户不需要先被背景吸引，再去找车。\n\n" +
      "所以比亚迪的首页、配置器和品牌页都用同一种语言：白底、真实照片、少量红色，把复杂的信息留在后面。",
    status: "published",
    publishedAt: "2026-10-30",
  },
  {
    slug: "900v-5c-charging",
    title: "800V 平台与 5C 超充：10 分钟补能 400 km",
    tag: "技术",
    summary: "比亚迪海豹/汉 EV 采用 800V 高压平台；配合 5C 超充桩，补能时间被压缩到一杯咖啡的长度。",
    body:
      "比亚迪海豹/汉 EV 采用 800V 高压平台。更高的电压意味着更小的电流与更低的线束损耗，也为 5C 超充留出余量。\n\n" +
      "在匹配的 5C 超充桩上，10 分钟可以补能约 400 km。这个数字不是实验室里的峰值，而是从 10% 到 60% 的日常补能区间。\n\n" +
      "补能之外，800V 平台也让整车线束更轻、能耗更低。技术参数不是全部，但它决定了日常使用的底线。",
    status: "published",
    publishedAt: "2026-10-18",
  },
];

/** 幂等写入新闻：已存在的 slug 不覆盖，适合线上已有数据时补内容。 */
export function seedNews(db: AppDb): void {
  const now = new Date().toISOString();
  db.insert(news)
    .values(
      NEWS_SEED.map((item) => ({
        ...item,
        createdAt: now,
        updatedAt: now,
      })),
    )
    .onConflictDoNothing()
    .run();
}