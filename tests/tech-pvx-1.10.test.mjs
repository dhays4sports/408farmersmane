import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapWebToPvx, validateWebPvxMapping, TECH_PVX_ROLES
} from '../server/web-pvx-mapping-core.mjs';
import {
  handlePvxWebBootstrap, createOrReusePvxWebJourney, advancePvxWebJourney,
  pvxWebJourneyKey, resolvePvxWebDestination, TECH_LEAD_STAGES
} from '../server/pvx-web-journey-core.mjs';
import { handlePVXCheckpoint } from '../server/pvx-checkpoint-core.mjs';
import { projectUnifiedProducerRecord } from '../server/pvx-unified-producer-record-core.mjs';
import renterContract from '../assets/js/tech-pvx-contract-1.10.js';

class Store {
  constructor(){this.rows=new Map()}
  async get(key){return this.rows.get(key)||null}
  async setJSON(key,value,options={}){if(options.onlyIfNew&&this.rows.has(key))throw new Error('exists');this.rows.set(key,structuredClone(value));return true}
  async delete(key){this.rows.delete(key)}
  async list({prefix,limit=500}){return{blobs:[...this.rows.keys()].filter(key=>key.startsWith(prefix)).slice(0,limit).map(key=>({key}))}}
}

const base = {
  entry_type:'professional', customer_selection:'secure_continue', source:'408farmers_tech', route_path:'/tech/',
  professional_program:'technology', professional_role:'software_engineering', professional_role_label:'Software / Engineering',
  housing_context:'owner', occupancy:'owner', review_track:'home_snapshot',
  tech_lead_checkpoint_id:'techlc_ABCDEFGHIJKLMNOPQRSTUV', bootstrap_id:'pvxb_ABCDEFGHIJKLMNOP',
  campaign_id:'occupation_tech_meta_v1', campaign_variant:'puesto_a', utm_source:'puesto', utm_medium:'windshield_card', utm_campaign:'santa_clara_tech', utm_content:'variant_a'
};
const confirmed = {
  ...base, early_capture_status:'confirmed', early_lead_confirmed:'true', first_name:'Ada', mobile:'+14085551212',
  agency_contact_consent:'true', agency_contact_consent_version:'tech-pvx-early-agency-contact-v1',
  agency_contact_consent_timestamp:'2026-08-27T17:02:00.000Z', sms_consent:'false', call_consent:'false', email_consent:'false'
};
const skipped = {...base, early_capture_status:'skipped', early_lead_confirmed:'false'};

test('CoverageFit maps confirmed TECH identity without inferring later or channel consent',()=>{
  const mapping=mapWebToPvx(confirmed),validation=validateWebPvxMapping(mapping);
  assert.deepEqual(validation,{valid:true,errors:[]});
  assert.equal(mapping.build,'TECH-PVX-1.10');
  assert.equal(mapping.identity.firstName,'Ada');
  assert.equal(mapping.identity.mobile,'+14085551212');
  assert.equal(mapping.consent.earlyAgencyContact.agencyContact,true);
  assert.equal(mapping.consent.contact,false);
  assert.equal(mapping.consent.sms,false);
  assert.equal(mapping.consent.call,false);
  assert.equal(mapping.consent.email,false);
  assert.equal(mapping.semantics.earlyAgencyContactIsLaterContactRequest,false);
  assert.equal(mapping.semantics.phoneNumberIsSmsPermission,false);
  assert.equal(mapping.reconciliation.identityMergeAuthorized,false);
});

test('CoverageFit keeps skipped TECH journeys anonymous and renter-capable',()=>{
  const mapping=mapWebToPvx({...skipped,housing_context:'renter',occupancy:'renter',review_track:'renter_snapshot',professional_role:'design_ux',professional_role_label:'Design / UX'});
  assert.equal(validateWebPvxMapping(mapping).valid,true);
  assert.equal(mapping.canEnterPvx,true);
  assert.equal(mapping.identity.supplied,false);
  assert.equal(mapping.identity.firstName,'');
  assert.equal(mapping.identity.mobile,'');
  assert.equal(mapping.context.housing.occupancy,'renter');
  assert.equal(mapping.fallbackDestination,'/contact/');
});

test('CoverageFit rejects malformed TECH roles, labels, housing, and consent evidence',()=>{
  for(const change of [
    {professional_role:'chief_wizard'},
    {professional_role_label:'Approved engineer'},
    {housing_context:'landlord',occupancy:'landlord'},
    {agency_contact_consent_version:'invented-v2'},
    {tech_lead_checkpoint_id:'bad'}
  ]){
    const validation=validateWebPvxMapping(mapWebToPvx({...confirmed,...change}));
    assert.equal(validation.valid,false,JSON.stringify(change));
  }
  assert.deepEqual(Object.keys(TECH_PVX_ROLES),['software_engineering','it_cybersecurity','data_analytics','product_program','design_ux','tech_operations_support','other_tech']);
});

test('Secure bootstrap is POST-only, origin-bound, body-limited, opaque, cookie-secure, and idempotent',async()=>{
  const store=new Store(),body=new URLSearchParams(confirmed),now=new Date('2026-08-27T17:03:00Z');
  const request=()=>new Request('https://review.408farmers.com/api/pvx/web-bootstrap',{method:'POST',headers:{Origin:'https://408farmers.com','Content-Type':'application/x-www-form-urlencoded'},body});
  let response=await handlePvxWebBootstrap(request(),{store,now});
  assert.equal(response.status,303);assert.equal(response.headers.get('location'),'/pvx/web/');
  assert.match(response.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Lax/);
  assert.equal(response.headers.get('location').includes('Ada'),false);assert.equal(response.headers.get('location').includes('4085551212'),false);
  assert.equal(response.headers.get('x-coveragefit-bootstrap'),'created');
  response=await handlePvxWebBootstrap(request(),{store,now});
  assert.equal(response.status,303);assert.equal(response.headers.get('x-coveragefit-bootstrap'),'reused');
  response=await handlePvxWebBootstrap(new Request('https://review.408farmers.com/api/pvx/web-bootstrap'),{store,now});assert.equal(response.status,405);
  response=await handlePvxWebBootstrap(new Request('https://review.408farmers.com/api/pvx/web-bootstrap',{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'},body:'{}'}),{store,now});assert.equal(response.status,403);
  response=await handlePvxWebBootstrap(new Request('https://review.408farmers.com/api/pvx/web-bootstrap',{method:'POST',headers:{Origin:'https://408farmers.com','Content-Type':'application/json','Content-Length':'17000'},body:'{}'}),{store,now});assert.equal(response.status,413);
});

test('Professional role and identity survive the secure stored journey',async()=>{
  const store=new Store(),result=await createOrReusePvxWebJourney(confirmed,{store,sourceOrigin:'https://408farmers.com',now:new Date('2026-08-27T17:03:00Z')});
  assert.equal(result.record.seed.context.professional.role,'software_engineering');
  assert.equal(result.record.seed.context.professional.roleLabel,'Software / Engineering');
  assert.equal(result.record.seed.identity.firstName,'Ada');
  assert.equal(result.record.leadLifecycle.techLeadCheckpointId,base.tech_lead_checkpoint_id);
  assert.deepEqual(result.record.leadLifecycle.stages.map(item=>item.stage),['started']);
  assert.equal(resolvePvxWebDestination(result.record),'/pvx/start/');
});

test('Correlated TECH lifecycle progresses without a passive Snapshot notification',async()=>{
  const store=new Store(),created=await createOrReusePvxWebJourney(confirmed,{store,sourceOrigin:'https://408farmers.com',now:new Date('2026-08-27T17:03:00Z')}),key=await pvxWebJourneyKey(created.token);
  let loaded={key,token:created.token,record:created.record};
  for(const [stage,expected] of [['snapshot_completed','snapshot_completed'],['home_profile_ready','home_profile_ready'],['policy_review_ready','policy_review_ready']]){
    const record=await advancePvxWebJourney(loaded,{store,stage,currentStep:'test',completedStage:stage,now:new Date('2026-08-27T17:04:00Z')});
    loaded={key,token:created.token,record};assert.equal(record.leadLifecycle.highestStage,expected);
  }
  assert.deepEqual(loaded.record.leadLifecycle.stages.map(item=>item.stage),['started','snapshot_completed','home_profile_ready','policy_review_ready']);
  assert.equal([...store.rows.keys()].some(keyName=>keyName.startsWith('pvx/notification/')),false);
  assert.deepEqual(TECH_LEAD_STAGES,['started','snapshot_completed','contact_requested','home_profile_ready','policy_review_ready']);
});

test('Renter contract provides value with no contact and no Protection Score',()=>{
  const context={valid:true,role:'design_ux',roleLabel:'Design / UX',housing:'renter',reviewTrack:'renter_snapshot',identity:{supplied:false,techLeadCheckpointId:base.tech_lead_checkpoint_id},attribution:{},journeyId:'pvxj_test'};
  let state=renterContract.initialState();
  state=renterContract.capture(state,'review_focus','auto_renters');state.answers.current_setup='auto_only';state.answers.priority='professional_program';
  const snapshot=renterContract.deriveSnapshot(state,context);
  assert.equal(snapshot.contractId,'coveragefit-discovery-only-snapshot-v1');
  assert.equal(snapshot.guardrails.discoveryOnly,true);assert.equal(snapshot.guardrails.protectionScoreCreated,false);assert.equal(snapshot.guardrails.eligibilityDetermined,false);
  assert.equal(snapshot.whatDylanWouldLookAtFirst.length>=2,true);
  assert.equal(JSON.stringify(snapshot).includes('contact'),false);
});

test('Known-identity renter contact upgrades the same checkpoint and unified producer record',async()=>{
  const store=new Store(),now=new Date('2026-08-27T17:05:00Z'),created=await createOrReusePvxWebJourney({...confirmed,housing_context:'renter',occupancy:'renter',review_track:'renter_snapshot'},{store,sourceOrigin:'https://408farmers.com',now});
  const state={step:3,answers:{review_focus:'auto_renters',current_setup:'auto_only',priority:'coverage_fit'}},context={valid:true,role:'software_engineering',roleLabel:'Software / Engineering',housing:'renter',reviewTrack:'renter_snapshot',identity:{supplied:true,firstName:'Ada',mobile:'+14085551212',techLeadCheckpointId:base.tech_lead_checkpoint_id},attribution:created.record.seed.attribution,journeyId:created.record.journeyId},snapshot=renterContract.deriveSnapshot(state,context);
  const payload={action:'contact_only',idempotencyKey:'pvxc_ABCDEFGHIJKLMNOPQRSTUV',snapshot,topicResponses:[],actionReadinessExpressions:[],changeScopeExpressions:[],desiredNextActions:[],contact:{name:'Ada',mobile:'+14085551212',preferredMethod:'call',bestTime:'',requestType:'call',purpose:'comparison',question:'TECH renter review'},consent:{reportSaved:false,contact:true,sms:false,call:true,email:false},attribution:renterContract.attribution(context)};
  const request=new Request('https://review.408farmers.com/api/pvx/checkpoint',{method:'POST',headers:{Origin:'https://review.408farmers.com','Content-Type':'application/json',Cookie:`cf_pvx_web_resume=${created.token}`},body:JSON.stringify(payload)});
  const response=await handlePVXCheckpoint(request,{store,journeyStore:store,operationsStore:store,now});assert.equal(response.status,201);
  const notifications=[...store.rows.values()].filter(value=>value.recordType==='pvx_producer_notification');assert.equal(notifications.length,1);assert.equal(notifications[0].event,'contact_requested');assert.equal(notifications[0].subjectRef,base.tech_lead_checkpoint_id);
  const checkpoint=[...store.rows.values()].find(value=>value.recordType==='pvx_journey_state');assert.equal(checkpoint.attribution.techLeadCheckpointId,base.tech_lead_checkpoint_id);assert.equal(checkpoint.contact.name,'Ada');
  const web=[...store.rows.values()].find(value=>value.recordType==='pvx_web_journey'),producer=projectUnifiedProducerRecord(checkpoint,web,null);
  assert.equal(producer.techLeadCheckpointId,base.tech_lead_checkpoint_id);assert.equal(producer.contact.mobile,'+14085551212');assert.equal(producer.currentStage,'contact_requested');assert.equal(producer.consent.earlyAgencyContact,true);
});

test('Anonymous renter can request contact later without identity merging',async()=>{
  const store=new Store(),now=new Date('2026-08-27T17:06:00Z'),anonymous={...skipped,bootstrap_id:'pvxb_ZYXWVUTSRQPONMLK',tech_lead_checkpoint_id:'techlc_ZYXWVUTSRQPONMLKJIHGFE',housing_context:'renter',occupancy:'renter',review_track:'renter_snapshot'},created=await createOrReusePvxWebJourney(anonymous,{store,sourceOrigin:'https://408farmers.com',now});
  const context={valid:true,role:'software_engineering',roleLabel:'Software / Engineering',housing:'renter',reviewTrack:'renter_snapshot',identity:{supplied:false,techLeadCheckpointId:anonymous.tech_lead_checkpoint_id},attribution:created.record.seed.attribution,journeyId:created.record.journeyId},snapshot=renterContract.deriveSnapshot({answers:{review_focus:'renters',current_setup:'renters_only',priority:'move_change'}},context);
  const payload={action:'contact_only',idempotencyKey:'pvxc_ZYXWVUTSRQPONMLKJIHG',snapshot,topicResponses:[],actionReadinessExpressions:[],changeScopeExpressions:[],desiredNextActions:[],contact:{name:'Grace',mobile:'+14085559876',preferredMethod:'text',bestTime:'',requestType:'text',purpose:'comparison',question:'Renter review'},consent:{reportSaved:false,contact:true,sms:true,call:false,email:false},attribution:renterContract.attribution(context)};
  const response=await handlePVXCheckpoint(new Request('https://review.408farmers.com/api/pvx/checkpoint',{method:'POST',headers:{Origin:'https://review.408farmers.com','Content-Type':'application/json',Cookie:`cf_pvx_web_resume=${created.token}`},body:JSON.stringify(payload)}),{store,journeyStore:store,operationsStore:store,now});
  assert.equal(response.status,201);const checkpoint=[...store.rows.values()].find(value=>value.recordType==='pvx_journey_state');assert.equal(checkpoint.contact.name,'Grace');assert.equal(checkpoint.consent.sms,true);assert.equal(created.record.seed.identity.supplied,false);assert.equal(created.record.seed.reconciliation.identityMergeAuthorized,false);
});
