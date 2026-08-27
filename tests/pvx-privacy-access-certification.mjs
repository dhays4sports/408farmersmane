#!/usr/bin/env node
import assert from 'node:assert/strict';import fs from 'node:fs';
const read=file=>fs.readFileSync(file,'utf8'),checks=[];const check=(name,value)=>{assert.ok(value,name);checks.push(name)};
const snapshot=read('assets/js/pvx-snapshot-model.js'),checkpoint=read('server/pvx-checkpoint-core.mjs'),intake=read('server/pvx-policy-intake-core.mjs'),progress=read('server/pvx-progress-center-core.mjs'),producer=read('server/pvx-producer-status-core.mjs'),retention=read('server/pvx-privacy-retention.mjs'),ledger=read('assets/js/pvx-report-revision-ledger.js');
check('anonymous preview',snapshot.includes('anonymousPreview:true'));
check('independent report/contact/SMS consent',checkpoint.includes('reportSaved:Boolean')&&checkpoint.includes('contact:Boolean')&&checkpoint.includes('sms:Boolean'));
check('private policy files',intake.includes("access:'private'")&&!intake.includes('publicUrl'));
check('secure report links',checkpoint.includes('hashToken(token')&&checkpoint.includes("'Cache-Control':'no-store'"));
check('expiring return tokens',checkpoint.includes('TTL_DAYS=30')&&progress.includes('expiresAt'));
check('authenticated producer access',producer.includes('authorizeProducer'));
check('immutable report history',ledger.includes('immutable:true')&&ledger.includes('Immutable report revision already exists'));
check('internal notes separated',(progress.includes('customerProducerStatus')||progress.includes('projectCustomerProducerStatus'))&&!progress.includes('record.internalNotes'));
check('retention purge',retention.includes('purgeExpired')&&retention.includes("prefix:'pvx/checkpoint/'"));
check('explicit deletion',retention.includes("action!=='delete_my_journey'")&&retention.includes('deleteFiles'));
console.log(JSON.stringify({certification:'CF-ADV-3.2',pass:true,checks:checks.length,details:checks},null,2));
