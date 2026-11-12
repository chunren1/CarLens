import puppeteer from "puppeteer-core";

const base = "http://127.0.0.1:5173";
const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--window-size=1440,900"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));

async function clickText(text) {
  const ok = await page.evaluate((needle) => {
    const nodes = [...document.querySelectorAll("button, a")];
    const el = nodes.find((node) => (node.textContent || "").includes(needle) && !node.disabled);
    if (!el) return false;
    el.click();
    return true;
  }, text);
  if (!ok) throw new Error("button not found: " + text);
}

await page.goto(base + "/configurator/s7", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForSelector("canvas", { timeout: 30000 });
await new Promise((r) => setTimeout(r, 5000));

await clickText("生成报价单");
await page.waitForFunction(() => location.pathname === "/quote", { timeout: 15000 });
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: "docs/screens/demo-quote.png" });
console.log("quote ok");

await clickText("立即下订");
await page.waitForFunction(() => location.pathname === "/order/new", { timeout: 15000 });
await page.waitForFunction(() => document.querySelectorAll("#store option").length > 1, { timeout: 15000 });
await page.type("#customer-name", "张三");
await page.type("#customer-phone", "13800138000");
const storeValue = await page.$eval("#store option:not([disabled])", (el) => el.value);
await page.select("#store", storeValue);
await new Promise((r) => setTimeout(r, 300));
await clickText("提交订单并支付定金");
await page.waitForFunction(() => location.pathname.startsWith("/pay/"), { timeout: 20000 });
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: "docs/screens/demo-pay.png" });
console.log("pay page", await page.evaluate(() => location.pathname));

await clickText("确认模拟支付");
await page.waitForFunction(() => location.pathname.startsWith("/orders/"), { timeout: 20000 });
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: "docs/screens/demo-order.png" });
console.log("order page", await page.evaluate(() => location.pathname));
await browser.close();
