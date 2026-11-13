import assert from "node:assert/strict";
import test from "node:test";
import puppeteer from "puppeteer-core";

const BASE = process.env.E2E_BASE_URL ?? "http://127.0.0.1:5173";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";

async function launch() {
  return puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--window-size=1440,900"],
  });
}

async function clickText(page, text) {
  const ok = await page.evaluate((needle) => {
    const nodes = [...document.querySelectorAll("button, a")];
    const el = nodes.find((node) => (node.textContent || "").trim().includes(needle) && !node.disabled);
    if (!el) return false;
    el.click();
    return true;
  }, text);
  assert.equal(ok, true, "找不到可点击元素: " + text);
}

test("核心链路：2D 配置 → 报价 → 下单 → 模拟支付", { timeout: 120000 }, async () => {
  const browser = await launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const pageErrors = [];
  const threeRequests = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    if (/\/assets\/three-|basis_transcoder/.test(request.url())) threeRequests.push(request.url());
  });
  try {
    await page.goto(BASE + "/configurator/s7", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector(".stage-frame", { timeout: 30000 });

    // 2D 模式避免 E2E 依赖 WebGL，同时验证海报切换。
    await clickText(page, "2D 海报");
    await page.waitForFunction(() => {
      const active = document.querySelector(".stage-modes__btn--active")?.textContent ?? "";
      return active.includes("2D") && Boolean(document.querySelector(".stage-photo"));
    }, { timeout: 15000 });
    assert.equal(threeRequests.length, 0, "2D 模式不应请求 three.js: " + threeRequests.join(", "));

    await clickText(page, "生成报价单");
    await page.waitForFunction(() => location.pathname === "/quote", { timeout: 15000 });
    assert.match(await page.title(), /报价/);

    await clickText(page, "立即下订");
    await page.waitForFunction(() => location.pathname === "/order/new", { timeout: 15000 });
    await page.waitForSelector("#customer-name", { timeout: 15000 });
    await page.type("#customer-name", "E2E 测试用户");
    await page.type("#customer-phone", "13800138000");
    await page.waitForFunction(() => document.querySelectorAll("#store option").length > 1, { timeout: 15000 });
    const storeValue = await page.$eval("#store option:not([disabled])", (el) => el.value);
    await page.select("#store", storeValue);
    await clickText(page, "提交订单并支付定金");
    await page.waitForFunction(() => location.pathname.startsWith("/pay/"), { timeout: 20000 });

    await clickText(page, "确认模拟支付");
    await page.waitForFunction(() => location.pathname.startsWith("/orders/"), { timeout: 20000 });
    assert.match(await page.title(), /订单/);
    assert.equal(pageErrors.length, 0, pageErrors.join("\n"));
  } finally {
    await browser.close();
  }
});

test("后台登录 → 换色图审核页", { timeout: 90000 }, async () => {
  assert.ok(ADMIN_PASSWORD, "缺少 E2E_ADMIN_PASSWORD");
  const browser = await launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  try {
    await page.goto(BASE + "/login", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.type("#login-email", "admin@wangshu.test");
    await page.type("#login-password", ADMIN_PASSWORD);
    await page.click('form button[type="submit"]');
    await page.waitForFunction(() => !location.pathname.startsWith("/login"), { timeout: 15000 });

    await page.goto(BASE + "/admin", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(() => document.body.innerText.includes("运营工作台"), { timeout: 20000 });
    await clickText(page, "换色图");
    await page.waitForFunction(() => document.body.innerText.includes("海报审核"), { timeout: 10000 });
    await page.waitForFunction(() => document.body.innerText.includes("换色图"), { timeout: 10000 });
  } finally {
    await browser.close();
  }
});
