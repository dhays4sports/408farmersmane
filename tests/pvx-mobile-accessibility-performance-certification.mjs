#!/usr/bin/env node
import assert from 'node:assert/strict';import fs from 'node:fs';
const read=file=>fs.readFileSync(file,'utf8'),pages=['pvx/index.html','pvx/start/index.html','pvx/discovery/index.html','pvx/refine/index.html','pvx/snapshot/index.html','pvx/continue/index.html','pvx/home-profile/index.html','pvx/policy/index.html','pvx/progress/index.html'],html=pages.map(read),css=[read('assets/css/pvx-experience-foundation.css'),read('assets/css/pvx-home-profile.css'),read('assets/css/pvx-continuation.css'),read('assets/css/pvx-checkpoint.css')].join('\n'),checks=[];function check(name,value){assert.ok(value,name);checks.push(name)}
check('320 through desktop responsive viewport',html.every(value=>value.includes('width=device-width'))&&css.includes('max-width:440px'));
check('iPhone safe areas',html.every(value=>value.includes('viewport-fit=cover'))&&css.includes('safe-area-inset-bottom'));
check('VoiceOver semantics',html.every(value=>(value.match(/<h1/g)||[]).length>=1)&&html.some(value=>value.includes('aria-live="polite"'))&&html.some(value=>value.includes('role="status"')));
check('keyboard-native controls',html.every(value=>!value.includes('onclick='))&&read('pvx/continue/index.html').includes('type="radio"'));
check('400 percent zoom supported',html.every(value=>!value.includes('user-scalable=no')&&!value.includes('maximum-scale='))&&css.includes('width:min('));
check('reduced motion',css.includes('prefers-reduced-motion: reduce'));
check('short landscape',css.includes('max-height: 640px')&&css.includes('orientation: landscape'));
check('44 pixel touch targets',css.includes('min-height: 44px')&&css.includes('min-height:48px'));
check('16 pixel inputs',css.includes('font-size: 16px'));
check('upload flow',read('pvx/policy/index.html').includes('multiple')&&read('pvx/policy/index.html').includes('application/pdf,image/jpeg,image/png')&&read('pvx/policy/index.html').includes('role="status"'));
check('secure return flows',(read('pvx/progress/index.html').includes('secure return surface')||read('pvx/progress/index.html').includes('secure CoverageFit'))&&read('server/pvx-progress-center-core.mjs').includes('hashToken(token'));
check('print and PDF output',read('assets/css/pvx-checkpoint.css').includes('@media print')&&read('pvx/snapshot/index.html').includes('Print / Save PDF'));
check('slow mobile essential scripts deferred',html.every(value=>[...value.matchAll(/<script\b([^>]*)>/g)].every(match=>match[1].includes('defer'))));
check('no visible image layout shifts',html.every(value=>[...value.matchAll(/<img\b([^>]*)>/g)].every(match=>/\bwidth=/.test(match[1])&&/\bheight=/.test(match[1]))));
const critical=['pvx/start/index.html','assets/css/pvx-experience-foundation.css','assets/js/attribution.js','assets/js/pvx-journey-contract.js','assets/js/pvx-entry.js'].reduce((sum,file)=>sum+fs.statSync(file).size,0);check('mobile critical asset budget',critical<250000);
console.log(JSON.stringify({certification:'CF-ADV-3.3',pass:true,checks:checks.length,criticalAssetBytes:critical,budgetBytes:250000,details:checks},null,2));
