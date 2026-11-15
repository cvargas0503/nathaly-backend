const fs=require('node:fs');
const path=require('node:path');
const puppeteer=require(process.env.PUPPETEER_MODULE_PATH||'puppeteer');
const root=path.resolve(__dirname,'..');
const prefix=process.env.EVIDENCE_PREFIX||'';
const values=Object.fromEntries(fs.readFileSync(process.env.PRIVATE_ENV_FILE||path.join(root,'.env'),'utf8').trim().split(/\r?\n/).map(x=>{const i=x.indexOf('=');return[x.slice(0,i),x.slice(i+1)]}));
(async()=>{
 const browser=await puppeteer.launch({executablePath:process.env.BROWSER_EXECUTABLE_PATH,headless:false,userDataDir:path.join(root,'tmp/browser-demo'),defaultViewport:{width:1280,height:800},args:['--no-first-run','--no-default-browser-check']});
 try {
  const [page]=await browser.pages();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const base=process.env.DEMO_URL||'http://127.0.0.1:8080';
  await page.goto(base+'/login',{waitUntil:'networkidle0'});
  await page.screenshot({path:path.join(root,'evidence',prefix+'browser-login.png')});
  await page.type('input[type="text"]','demo.admin');
  await page.type('input[type="password"]',values.DEMO_ADMIN_PASSWORD);
  await Promise.all([page.waitForResponse(r=>r.url().endsWith('/auth/login')&&r.status()===200),page.click('button[type="submit"]')]);
  await page.waitForFunction(()=>location.pathname!='/login');
  await page.goto(base+'/dashboard',{waitUntil:'networkidle0'});
  await page.screenshot({path:path.join(root,'evidence',prefix+'browser-dashboard.png')});
  await page.goto(base+'/productos',{waitUntil:'networkidle0'});
  await page.screenshot({path:path.join(root,'evidence',prefix+'browser-productos.png')});
  await page.goto(base+'/facturas',{waitUntil:'networkidle0'});
  await page.screenshot({path:path.join(root,'evidence',prefix+'browser-facturas.png')});
  if(errors.length)throw new Error('Browser errors: '+errors.join('; '));
  fs.writeFileSync(path.join(root,'evidence',prefix+'browser-proof.json'),JSON.stringify({base,login:true,dashboard:true,productos:true,facturas:true,pageErrors:errors},null,2));
  console.log('Visible browser: login, dashboard, products and invoices rendered; screenshots saved.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1});
