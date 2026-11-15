const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const values=Object.fromEntries(fs.readFileSync(process.env.PRIVATE_ENV_FILE||path.join(root,'.env'),'utf8').trim().split(/\r?\n/).map(x=>{const i=x.indexOf('=');return[x.slice(0,i),x.slice(i+1)]}));
const prior=JSON.parse(fs.readFileSync(path.join(root,'tmp','last-invoice.private'),'utf8'));
(async()=>{
 const login=await fetch(prior.base+'/api/v1/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({login:'demo.admin',password:values.DEMO_ADMIN_PASSWORD}),signal:AbortSignal.timeout(180000)});
 assert.equal(login.status,200);const Cookie=login.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ');
 const retry=await fetch(prior.base+'/api/v1/ventas/',{method:'POST',headers:{Cookie,'Content-Type':'application/json','Idempotency-Key':prior.key},body:JSON.stringify(prior.sale),signal:AbortSignal.timeout(180000)});
 assert.equal(retry.status,200);const result=await retry.json();assert.equal(result.reutilizada,true);assert.deepEqual(result.data,prior.result);
 const proof={base:prior.base,invoicePreservedAcrossRevision:true,sameRequestReturnsSameInvoice:true,status:retry.status,reutilizada:result.reutilizada};
 fs.writeFileSync(path.join(root,'evidence','cloud-update-verification.json'),JSON.stringify(proof,null,2));console.log(JSON.stringify(proof,null,2));
 await fetch(prior.base+'/api/v1/auth/logout',{method:'POST',headers:{Cookie},signal:AbortSignal.timeout(120000)});
})().catch(e=>{console.error(e.message);process.exitCode=1});
