const assert = require('node:assert/strict');

function allowed(base, head) {
  if (base === 'develop') return /^(feature|bugfix|hotfix)\/[a-z0-9][a-z0-9-]*$/.test(head) || ['qa', 'master'].includes(head);
  if (base === 'qa') return head === 'develop' || /^bugfix\/qa-[a-z0-9][a-z0-9-]*$/.test(head);
  if (base === 'master') return head === 'qa' || /^hotfix\/[a-z0-9][a-z0-9-]*$/.test(head);
  return false;
}

if (process.argv.includes('--self-test')) {
  for (const [base, head] of [['develop', 'feature/f01-ajustes-inventario'], ['qa', 'develop'], ['master', 'qa'], ['qa', 'bugfix/qa-f01-stock'], ['develop', 'qa'], ['develop', 'master'], ['master', 'hotfix/123-login']]) assert.equal(allowed(base, head), true, `${head} -> ${base}`);
  for (const [base, head] of [['master', 'develop'], ['master', 'feature/f01'], ['qa', 'feature/f01'], ['main', 'develop'], ['develop', 'main'], ['qa', 'bugfix/normal'], ['develop', 'feature/']]) assert.equal(allowed(base, head), false, `${head} -> ${base}`);
  console.log('Branch flow policy cases passed');
} else if (!allowed(process.env.PR_BASE, process.env.PR_HEAD)) {
  console.error(`Invalid promotion: ${process.env.PR_HEAD} -> ${process.env.PR_BASE}. See docs/git-flow.md.`);
  process.exitCode = 1;
} else {
  console.log(`Valid promotion: ${process.env.PR_HEAD} -> ${process.env.PR_BASE}`);
}
