// Run inside the built image with this file mounted at /app/container-pdf.cjs.
// These isolated settings only satisfy configuration validation; no DB connection is made.
Object.assign(process.env, {
  DB_HOST: 'example.invalid', DB_USER: 'test', DB_PASSWORD: 'test-only',
  DB_NAME: 'test', JWT_SECRET: 'container-pdf-test-only-'.repeat(3),
  CHROMIUM_DISABLE_SANDBOX: 'true',
});
const assert = require('node:assert/strict');
const { launchBrowser } = require(require('node:path').resolve('dist/src/utils/browser'));

(async () => {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><html lang="es"><meta charset="utf-8"><body><h1>Factura de prueba</h1><p>Demostración de generación PDF en contenedor.</p></body></html>');
    const pdf = await page.pdf({ format: 'A4' });
    assert.equal(Buffer.from(pdf).subarray(0, 5).toString(), '%PDF-');
    console.log(JSON.stringify({ pdf: 'ok', bytes: pdf.length, browser: await browser.version(), uid: process.getuid() }));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
