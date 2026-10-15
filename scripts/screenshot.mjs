/**
 * node scripts/screenshot.mjs <url> <out.png> [width] [height]
 *
 * Screenshots a page in headless Chrome (GPU via ANGLE/Metal on macOS) once
 * the 3D experience reports live (<html data-experience="live">), plus a
 * settle delay for the poster crossfade. Prints console errors from the page.
 */
import { existsSync } from "node:fs";
import { chromium } from "playwright-core";

const [url, out, width = "1600", height = "900"] = process.argv.slice(2);
if (!url || !out) throw new Error("usage: node scripts/screenshot.mjs <url> <out.png> [width] [height]");

const executablePath =
  process.env.CHROME_PATH ??
  ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find(existsSync);

const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ["--use-angle=metal", "--ignore-gpu-blocklist", "--enable-gpu"],
});
try {
  const page = await browser.newPage({ viewport: { width: Number(width), height: Number(height) } });
  page.on("console", (m) => m.type() === "error" && console.error("console:", m.text()));
  page.on("pageerror", (e) => console.error("page error:", e.message));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector('html[data-experience="live"]', { timeout: 60_000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: out });
  console.log("saved", out);
} finally {
  await browser.close();
}
