import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--window-size=1440,900"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.goto("http://127.0.0.1:5173/test-drive", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForSelector("#td-name", { timeout: 20000 });
await page.type("#td-name", "王五");
await page.type("#td-phone", "13700137000");
await page.$eval("#td-slot", (el) => {
  el.value = "2026-11-18T15:00";
  el.dispatchEvent(new Event("input", { bubbles: true }));
});
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find((b) => (b.textContent || "").includes("提交试驾预约"));
  if (btn) btn.click();
});
await page.waitForFunction(() => document.body.innerText.includes("预约已提交"), { timeout: 20000 });
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: "docs/screens/page-test-drive-success.png" });
console.log("test drive UI ok");
await browser.close();
