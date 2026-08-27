#!/usr/bin/env node
import assert from 'node:assert/strict';
import {handlePVXCheckpoint,TOKEN_PATTERN,hashToken} from '../server/pvx-checkpoint-core.mjs';

const records=new Map();
const store={
  async get(key){return records.get(key)||null},
  async setJSON(key,value){assert.equal(records.has(key),false);records.set(key,value)},
  async delete(key){records.delete(key)}
};
const now=new Date('2026-08-21T00:00:00.000Z');
const snapshot={
  contractId:'coveragefit-discovery-only-snapshot-v1',reportRevision:'1',
  whyReviewing:{text:'My renewal jumped.',evidenceRefs:[{key:'shoppingReason'}]},
  wantsToImprove:[],homeContext:[],whatSeemsImportant:[],whatDylanWouldLookAtFirst:[],
  guardrails:{discoveryOnly:true}
};
const request=body=>new Request('https://coveragefit.example/api/pvx/checkpoint',{method:'POST',headers:{Origin:'https://coveragefit.example','Content-Type':'application/json'},body:JSON.stringify(body)});

const saved=await handlePVXCheckpoint(request({snapshot,consent:{reportSaved:true,contact:false,sms:false},topicResponses:[{recordType:'topicResponse',topicKey:'cost_focused_comparison',state:'cost_first'}]}),{store,now});
assert.equal(saved.status,201);
const created=await saved.json();
assert.match(created.token,TOKEN_PATTERN);
assert.equal(created.checkpoint.checkpointType,'snapshot_saved');
assert.equal(created.checkpoint.contactRequested,false);
assert.equal(records.has(`pvx/checkpoint/${created.token}`),false);
assert.equal(records.has(`pvx/checkpoint/${await hashToken(created.token)}`),true);
const record=records.values().next().value;
assert.equal(record.consent.reportSaved,true);
assert.equal(record.consent.contact,false);
assert.equal(record.authorization.bindAuthorized,false);

const opened=await handlePVXCheckpoint(request({action:'read',token:created.token}),{store,now});
assert.equal(opened.status,200);
assert.equal((await opened.json()).snapshot.contractId,snapshot.contractId);

const scored=await handlePVXCheckpoint(request({snapshot:{...snapshot,protectionScore:90},consent:{reportSaved:true}}),{store,now});
assert.equal(scored.status,422);
const recommended=await handlePVXCheckpoint(request({snapshot:{...snapshot,recommendations:[{id:'x'}]},consent:{reportSaved:true}}),{store,now});
assert.equal(recommended.status,422);
const contactMissing=await handlePVXCheckpoint(request({snapshot,consent:{reportSaved:true,contact:true}}),{store,now});
assert.equal(contactMissing.status,422);
const smsWithoutContact=await handlePVXCheckpoint(request({snapshot,contact:{mobile:'4085551212'},consent:{reportSaved:true,sms:true}}),{store,now});
assert.equal(smsWithoutContact.status,422);

console.log(JSON.stringify({pass:true,checks:18}));
