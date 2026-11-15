import puppeteer from 'puppeteer';
import { environment } from '../config/environment';

// Chromium keeps its sandbox unless the container host explicitly requires otherwise.
export function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    args: [
      '--disable-dev-shm-usage',
      ...(environment.chromiumDisableSandbox ? ['--no-sandbox', '--disable-setuid-sandbox'] : []),
    ],
  });
}
