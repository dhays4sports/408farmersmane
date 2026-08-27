#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const id = process.env.PVX_FOCUSED_SPRINT;
if (!id) {
  console.log('PVX focused QA skipped: set PVX_FOCUSED_SPRINT to run a historical focused sprint gate.');
  process.exit(0);
}
const registry = JSON.parse(read('PVX_PROGRAM_CAPABILITIES.json'));
const capability = registry.capabilities.find(item => item.id === id);
assert.ok(capability, `Registered capability required for ${id}`);

const checks = [];
const check = (name, condition) => { assert.ok(condition, name); checks.push(name); };

check('capability status is implemented or complete', ['implemented', 'complete'].includes(capability.status));
for (const file of capability.files || []) check(`${file} exists`, fs.existsSync(path.join(root, file)));
for (const marker of capability.markers || []) {
  const source = read(marker.file);
  for (const value of marker.includes || []) check(`${marker.file} includes ${value}`, source.includes(value));
  for (const value of marker.excludes || []) check(`${marker.file} excludes ${value}`, !source.includes(value));
}

if (id === 'CF-PVX-UX-1.0') {
  const api = require('../assets/js/pvx-experience-foundation.js');
  const contract = JSON.parse(read('CF_PVX_UX_1_0_CONTRACT.json'));
  check('runtime identity matches contract', api.CONTRACT_ID === contract.id && api.BUILD === id);
  check('sample has five component-demonstration steps', api.SAMPLE_STEPS.length === 5);
  check('sample includes required control types', ['single','multi','address','confirmation'].every(type => api.SAMPLE_STEPS.some(step => step.type === type)));
  check('single choices auto advance', api.SAMPLE_STEPS.filter(step => step.type === 'single').every(step => step.autoAdvance));
  check('copy limits pass', api.SAMPLE_STEPS.flatMap(api.validateCopy).length === 0);
  check('progress reaches one hundred', api.progressFor(4, 5).percent === 100);
  check('address normalization preserves explicit source boundary outside value', api.normalizeAddress({ line1: ' 1 Main ', city: ' San Jose ', state: 'ca', postalCode: '95118' }).state === 'CA');
  check('feature flag fails closed', api.featureEnabled({ search: '' }, { getItem: () => null }) === false);
  check('preview query enables isolated route', api.featureEnabled({ search: '?preview=1' }, null) === true);
  check('seven-day resume ttl configured', api.TTL_MS === 7 * 24 * 60 * 60 * 1000);
  check('contract preserves legacy route', contract.migration.legacyAssessmentRoutePreserved === true && contract.migration.businessLogicDuplicated === false);
  check('foundation creates no advisory business outcome', Object.values(contract.boundaries).every(value => value === false));
  const taxonomy = JSON.parse(read('CF_PVX_EVENT_TAXONOMY.json'));
  check('event taxonomy bans sensitive answer content', /never free-text answers, addresses, policy values, document contents, or contact details/i.test(taxonomy.privacyRule));
  check('viewport fixtures include 320px and short landscape', read('fixtures/pvx-ux-1.0/viewports.json').includes('"width":320') && read('fixtures/pvx-ux-1.0/viewports.json').includes('short-landscape'));
}

if (id === 'CF-PVX-1.1') {
  const api = require('../assets/js/pvx-journey-contract.js');
  const contract = JSON.parse(read('CF_PVX_1_1_JOURNEY_CHECKPOINT_CONTRACT.json'));
  check('journey runtime identity matches contract', api.CONTRACT_ID === contract.id && api.BUILD === id);
  const base = api.createJourneyProfile({ journeyId: 'journey_test', consent: { reportSaved: true, contact: false }, authorization: { acceptedLogic: true, bindAuthorized: false } });
  check('new profile initializes independent paths', base.homeProfilePath.status === 'not_started' && base.currentPolicyPath.status === 'not_started');
  const both = api.chooseContinuation(base, 'both', '2026-08-21T00:00:00Z');
  check('both paths can start independently', both.homeProfilePath.status === 'in_progress' && both.currentPolicyPath.status === 'in_progress');
  const checkpoint = { checkpointId: 'cp_1', checkpointType: 'snapshot_saved', reportRevision: '1', contactConsent: false };
  const once = api.recordCheckpoint(both, checkpoint, '2026-08-21T00:01:00Z');
  const twice = api.recordCheckpoint(once, checkpoint, '2026-08-21T00:02:00Z');
  check('checkpoint append is idempotent', twice.leadCheckpoints.length === 1);
  const revision = api.addReportRevision(twice, { revisionId: 'rev_1', revision: '1', contentRef: 'snapshot_1' });
  check('report revision is immutable by contract', revision.reportRevisions[0].immutable === true);
  const semantics = api.semanticAssertions(revision);
  check('all prohibited semantic equivalences fail closed', Object.values(semantics).every(value => value === false));
  check('report save does not create contact consent', revision.consent.reportSaved === true && revision.consent.contact === false);
  check('accepted logic does not bind', revision.authorization.acceptedLogic === true && revision.authorization.bindAuthorized === false);
  check('contract is additive and reuses discovery profile', contract.appendOnly === true && contract.reusesDiscoveryProfile === true && contract.parallelCustomerStore === false);
}

if (id === 'CF-PVX-1.2') {
  const api = require('../assets/js/pvx-entry.js');
  const contract = JSON.parse(read('CF_PVX_1_2_ENTRY_CONTRACT.json'));
  check('entry runtime identity matches contract', api.CONTRACT_ID === contract.id && api.BUILD === id);
  const storage = { getItem: () => JSON.stringify({ firstName: 'Dylan', propertyAddress: '1 Main St, San Jose, CA 95118', integration: { source: '408farmers', prefilled: true } }) };
  const known = api.resolveEntry({ query: '', sessionStorage: storage, localStorage: null });
  check('known address resolves without repeat', known.knownAddress === true && known.prefilled === true && known.source === '408farmers');
  const direct = api.resolveEntry({ query: '', sessionStorage: { getItem: () => null }, localStorage: { getItem: () => null } });
  check('direct entry stays address-unknown', direct.knownAddress === false && direct.source === 'direct');
  const validation = api.validateAddress({ line1: '1 Main St', city: 'San Jose', state: 'ca', postalCode: '95118' });
  check('one address interaction validates', validation.valid === true && validation.address.state === 'CA');
  const confirmed = api.confirmAddress(validation.address, '2026-08-21T00:00:00Z');
  check('confirmation preserves explicit provenance', confirmed.source === 'customer-confirmed' && confirmed.confirmed === true);
  check('technical opening list is empty', contract.openingTechnicalFields.length === 0 && contract.migratedToHomeProfile.length === 8);
  check('contact and score gates are absent', contract.contactGateBeforeValue === false && contract.protectionScoreBeforePolicyEvidence === false);
}

if (id === 'CF-PVX-1.3') {
  const api = require('../assets/js/pvx-discovery.js');
  const contract = JSON.parse(read('CF_PVX_1_3_DISCOVERY_CONTRACT.json'));
  check('discovery runtime identity matches contract', api.CONTRACT_ID === contract.id && api.BUILD === id);
  check('catalog contains exactly eight questions', api.QUESTIONS.length === 8 && contract.questionCount === 8);
  check('catalog is nontechnical and bounded', api.validateCatalog().valid === true && api.validateCatalog().technicalTermsFound.length === 0);
  check('single choice questions auto advance', api.QUESTIONS.filter(item => item.type === 'single').every(item => item.autoAdvance === true));
  let profile = api.initialState();
  for (const question of api.QUESTIONS) profile = api.captureAnswer(profile, question.id, question.type === 'multi' ? [question.options[0].value] : question.options[0].value, question.id === 'shoppingReason' ? 'My renewal jumped again.' : '');
  const completed = api.completeProfile(profile, '2026-08-21T00:00:00Z');
  check('complete profile contains all answers', Object.keys(completed.answers).length === 8 && completed.currentQuestionId === 'complete');
  check('exact customer wording is retained safely', completed.exactCustomerWords.shoppingReason === 'My renewal jumped again.');
  check('contract excludes scoring and contact', contract.scoredQuestions === false && contract.contactForm === false && contract.currentCoverageLimits === false);
}

if (id === 'CF-PVX-1.4') {
  const api = require('../assets/js/pvx-contextual-branching.js');
  const contract = JSON.parse(read('CF_PVX_1_4_BRANCHING_CONTRACT.json'));
  check('branch runtime identity matches contract', api.CONTRACT_ID === contract.id && api.BUILD === id);
  const profile = { answers: { stayIntent:'long_term', upgradeSummary:'yes_major', claimExperience:'yes_difficult', improvementPriorities:['price_only'] } };
  const branches = api.deriveBranches(profile, {});
  check('eligible evidence creates bounded refinements', branches.map(item=>item.id).join('|') === 'updateAreas|claimType' && branches.every(api.validateBranch));
  check('every branch stays one level deep', branches.every(item=>item.depth === 1) && api.MAX_DEPTH === 1);
  check('price-only acknowledgment remains direct', api.acknowledgment(profile,'improvementPriorities') === 'Got it. We’ll keep the price issue central.');
  check('upgrade acknowledgment is evidence backed', /updated the home/.test(api.acknowledgment(profile,'upgradeSummary')) && /plan to stay/.test(api.acknowledgment(profile,'upgradeSummary')));
  check('not-sure profile produces no branch', api.deriveBranches({answers:{stayIntent:'not_sure',upgradeSummary:'not_sure',claimExperience:'not_sure'}},{}).length === 0);
  check('inactive branch answers are cleared', Object.keys(api.reconcileBranchAnswers({updateAreas:['Roof'],claimType:'Water'},[branches[0]])).join('') === 'updateAreas');
  check('contract bans deep or fear-based branching', contract.maximumDepth === 1 && contract.fearLanguage === false && contract.unsupportedEmotionalInterpretation === false);
}

if (id === 'CF-PVX-1.5') {
  const api = require('../assets/js/pvx-review-topic-engine.js');
  const contract = JSON.parse(read('CF_PVX_1_5_REVIEW_TOPIC_CONTRACT.json'));
  check('topic engine identity matches contract', api.CONTRACT_ID === contract.id && api.BUILD === id);
  const topics = api.derive({answers:{ownershipDuration:'10_plus',upgradeSummary:'yes_major',stayIntent:'long_term',otherProperties:'rental',claimExperience:'yes_difficult',improvementPriorities:['agent_access']}},{});
  check('topics are capped at three', topics.length === 3 && api.MAX_TOPICS === 3);
  check('all emitted topics satisfy truthful contract', topics.every(api.validateTopic));
  check('rebuilding topic has two evidence references', topics.some(topic=>topic.topicKey==='rebuilding_assumptions'&&topic.evidenceRefs.length===2));
  check('no topic becomes a finding or recommendation', topics.every(topic=>topic.policyFinding===false&&topic.recommendation===false));
  check('no policy or limit claim is emitted', topics.every(topic=>topic.currentPolicyClaim==null&&topic.recommendedLimit==null));
  check('missing evidence produces no forced topic', api.derive({answers:{}},{}).length===0);
  const conflicted = api.derive({answers:{ownershipDuration:{status:'conflict'},upgradeSummary:'yes_major'}},{});
  check('conflicting evidence fails closed', conflicted.every(topic=>topic.topicKey!=='rebuilding_assumptions'));
  check('contract preserves score boundary', contract.affectsProtectionScore===false&&contract.createsRecommendation===false);
}

if (id === 'CF-PVX-1.6') {
  const topicApi = require('../assets/js/pvx-review-topic-engine.js');
  const api = require('../assets/js/pvx-snapshot-model.js');
  const contract = JSON.parse(read('CF_PVX_1_6_SNAPSHOT_CONTRACT.json'));
  check('snapshot model identity matches contract', api.CONTRACT_ID === contract.id && api.BUILD === id);
  const discovery={answers:{shoppingReason:'renewal_increase',improvementPriorities:['price_only','agent_access'],ownershipDuration:'10_plus',stayIntent:'long_term',upgradeSummary:'yes_major',otherProperties:'rental',claimExperience:'prefer_not'}};
  const model=api.derive(discovery,topicApi.derive(discovery,{}));
  check('snapshot is anonymous and ungated', model.anonymousPreview===true&&model.contactRequiredToView===false);
  check('snapshot fact display is capped', model.homeContext.length<=3&&model.whatDylanWouldLookAtFirst.length<=3);
  check('privacy response is omitted', !JSON.stringify(model.homeContext).includes('prefer_not'));
  check('all personal statements are traceable', api.traceable(model)===true);
  check('no score property or recommendations exist', !Object.prototype.hasOwnProperty.call(model,'protectionScore')&&model.recommendations.length===0&&model.policyFindings.length===0);
  check('guardrails deny policy and eligibility conclusions', Object.values(model.guardrails).filter(value=>value===true).length===1&&model.guardrails.discoveryOnly===true);
  check('contract prohibits fake analysis delay', contract.analysisDelay==='none'&&contract.protectionScore===false&&contract.policyDeficiency===false);
}

if (id === 'CF-PVX-1.7') {
  const api = require('../assets/js/pvx-review-topic-cards.js');
  const contract = JSON.parse(read('CF_PVX_1_7_TOPIC_CARD_CONTRACT.json'));
  check('topic card identity matches contract', api.CONTRACT_ID===contract.id&&api.BUILD===id);
  check('four early relevance states exist', api.RESPONSE_STATES.map(item=>item.value).join('|')==='relevant|explain|cost_first|unsure');
  const response=api.createResponse('rebuilding_assumptions','relevant','That makes sense.','2026-08-21T00:00:00Z');
  check('response is a topicResponse only', response.recordType==='topicResponse'&&response.recommendationResponse===false&&response.bindAuthorization===false);
  check('response upsert is stable by topic', api.upsert(api.upsert([],response),{...response,state:'explain'}).length===1);
  const topic={topicKey:'rebuilding_assumptions',label:'Rebuilding assumptions',status:'worth_reviewing',becauseYouToldUs:'You updated the home.',whyWorthReviewing:'Assumptions may have changed.',whatDylanWouldWantToUnderstand:'Which areas changed?',evidenceRefs:[{key:'upgradeSummary'}]};
  const html=api.renderCardHtml(topic,response);
  check('card anatomy is complete', ['Worth reviewing','Because you told us','Why it may matter','What Dylan would want to understand','How does this land with you?'].every(value=>html.includes(value)));
  check('unsafe card content is escaped', !api.renderCardHtml({...topic,label:'<script>x</script>'}).includes('<script>'));
  check('contract preserves response boundary', contract.storedAs==='topicResponses'&&contract.storedAsRecommendationResponses===false&&contract.affectsProtectionScore===false);
}

if (id === 'CF-PVX-1.8') {
  const cp=require('node:child_process');
  const api=require('../assets/js/pvx-checkpoint.js');
  const contract=JSON.parse(read('CF_PVX_1_8_CHECKPOINT_CONTRACT.json'));
  check('checkpoint client identity matches contract',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  const payload=api.buildPayload({snapshot:{contractId:'coveragefit-discovery-only-snapshot-v1'},contact:{name:'A <Customer>',email:'Person@Example.COM'},consent:{reportSaved:true}});
  check('client keeps save and contact consent independent',payload.consent.reportSaved===true&&payload.consent.contact===false&&payload.semanticBoundary.reportSavedIsContactConsent===false);
  check('client sanitizes bounded contact fields',payload.contact.name==='A Customer'&&payload.contact.email==='person@example.com');
  check('client rejects contact without reachable details',api.validatePayload(api.buildPayload({snapshot:{contractId:'coveragefit-discovery-only-snapshot-v1'},consent:{reportSaved:true,contact:true}})).errors.includes('contact'));
  check('client rejects SMS without independent contact permission',api.validatePayload(api.buildPayload({snapshot:{contractId:'coveragefit-discovery-only-snapshot-v1'},contact:{mobile:'4085551212'},consent:{reportSaved:true,sms:true}})).errors.includes('sms'));
  const serverQa=cp.spawnSync(process.execPath,['tests/pvx-checkpoint-core-qa.mjs'],{cwd:root,encoding:'utf8'});
  check(`server checkpoint QA passes: ${serverQa.stderr||serverQa.stdout}`,serverQa.status===0&&serverQa.stdout.includes('"pass":true'));
  check('contract forbids score, recommendation and authorization',contract.recommendationResponsesIncluded===false&&contract.bindAuthorization===false);
  check('contract uses expiring hashed bearer access',contract.token==='opaque_256_bit'&&contract.tokenStoredPlaintext===false&&contract.ttlDays===30);
}

if (id === 'CF-PVX-1.9') {
  const cp=require('node:child_process'),api=require('../assets/js/pvx-continuation.js'),contract=JSON.parse(read('CF_PVX_1_9_CONTINUATION_CONTRACT.json'));
  check('continuation client identity matches contract',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  check('all four choices are explicit',api.CHOICES.join('|')==='home_profile|current_policy|both|continue_later');
  const token='pvx_'+Buffer.alloc(32,7).toString('base64url'),payload=api.payload(token,'continue_later');
  check('valid opaque return token and pause choice pass',api.validate(payload).valid===true);
  check('invalid bearer token fails closed',api.validate(api.payload('plain-token','home_profile')).errors.includes('token'));
  check('semantic client boundary preserves success and snapshot',payload.semanticBoundary.continueLaterIsFailure===false&&payload.semanticBoundary.existingSnapshotPreserved===true);
  const serverQa=cp.spawnSync(process.execPath,['tests/pvx-resume-core-qa.mjs'],{cwd:root,encoding:'utf8'});
  check(`server resume QA passes: ${serverQa.stderr||serverQa.stdout}`,serverQa.status===0&&serverQa.stdout.includes('"pass":true'));
  check('contract needs no account and supports exact-stage return',contract.accountRequired===false&&contract.exactStageResume===true&&contract.secureReturn==='opaque_expiring_token');
  check('Home Profile remains primary without converting readiness to eligibility',contract.homeProfileVisuallyPrimary===true&&contract.quoteReadinessIsEligibility===false);
}

if(id==='CF-HOME-3.1'){
  const api=require('../assets/js/pvx-home-profile-contract.js'),contract=JSON.parse(read('CF_HOME_3_1_DATA_CONTRACT.json'));
  check('Home Profile contract runtime identity matches',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  check('all required normalized sections exist',api.SECTIONS.length===11&&api.SECTIONS.every(section=>section in api.create()));
  const reported=api.setFact(api.create({profileId:'hp_1'}),'physicalCharacteristics','yearBuilt',1988,{source:'property_source_reported',evidenceRef:'propertySource.yearBuilt'});
  check('property-source fact is not silently confirmed',reported.physicalCharacteristics.yearBuilt.source==='property_source_reported'&&api.needsConfirmation(reported.physicalCharacteristics.yearBuilt));
  const confirmed=api.confirmFact(reported,'physicalCharacteristics','yearBuilt',1989,'2026-08-21T00:00:00Z');
  check('customer confirmation has explicit provenance',confirmed.physicalCharacteristics.yearBuilt.source==='customer_confirmed'&&confirmed.physicalCharacteristics.yearBuilt.confirmedAt==='2026-08-21T00:00:00Z');
  const verified=api.verifyFact(confirmed,'physicalCharacteristics','yearBuilt',1989,'2026-08-22T00:00:00Z');
  check('producer verification remains a separate state',verified.physicalCharacteristics.yearBuilt.source==='producer_verified'&&verified.physicalCharacteristics.yearBuilt.verifiedAt==='2026-08-22T00:00:00Z');
  check('unknown and conflict need confirmation',api.needsConfirmation(api.fact(null))&&api.needsConfirmation(api.fact(1988,{source:'conflict_needs_confirmation'})));
  check('readiness and eligibility are semantically separate',contract.quoteReadinessIsCarrierEligibility===false&&api.READINESS.includes('manual_review_required'));
}

if(id==='CF-HOME-3.2'){
  const contractApi=require('../assets/js/pvx-home-profile-contract.js'),api=require('../assets/js/pvx-property-prefill.js'),contract=JSON.parse(read('CF_HOME_3_2_PREFILL_CONTRACT.json'));
  check('property prefill identity matches',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  const profile=contractApi.create({physicalCharacteristics:{yearBuilt:contractApi.fact(1988,{source:'property_source_reported'}),livingArea:contractApi.fact(1842,{source:'customer_confirmed'})}}),items=api.queue(profile);
  check('only unconfirmed source facts enter queue',items.length===1&&items[0].key==='yearBuilt');
  check('found fact prompt is plain and specific',api.prompt(items[0])==='We found that the home was built in 1988. Is that still correct?');
  const yes=api.answer(profile,items[0],'yes',null,'2026-08-21T00:00:00Z');
  check('yes explicitly confirms customer provenance',yes.physicalCharacteristics.yearBuilt.source==='customer_confirmed');
  const changed=api.answer(profile,items[0],'change',1990,'2026-08-21T00:00:00Z');
  check('change records customer-reported value',changed.physicalCharacteristics.yearBuilt.value===1990&&changed.physicalCharacteristics.yearBuilt.source==='customer_reported');
  const unsure=api.answer(profile,items[0],'not_sure',null,'2026-08-21T00:00:00Z');
  check('not sure never verifies source value',unsure.physicalCharacteristics.yearBuilt.source==='unknown');
  check('contract prevents silent verification',contract.propertySourceIsVerified===false&&contract.silentVerification===false);
}

if(id==='CF-HOME-3.3'){
  const profileApi=require('../assets/js/pvx-home-profile-contract.js'),api=require('../assets/js/pvx-home-core-characteristics.js'),contract=JSON.parse(read('CF_HOME_3_3_CORE_CHARACTERISTICS_CONTRACT.json'));
  check('core characteristics identity matches',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  check('required core characteristic set is complete',api.FIELDS.length===11&&contract.fields.every(key=>api.FIELDS.some(field=>field.key===key)));
  const profile=profileApi.create({occupancy:{occupancy:profileApi.fact('primary_home',{source:'customer_confirmed'})},physicalCharacteristics:{yearBuilt:profileApi.fact(1988,{source:'property_source_reported'}),livingArea:profileApi.fact(1842,{source:'conflict_needs_confirmation'}),stories:profileApi.fact('two',{source:'producer_verified'})}}),pending=api.pending(profile);
  check('confirmed and verified facts are never repeated',!pending.some(field=>field.key==='occupancy'||field.key==='stories'));
  check('source-reported and conflict facts remain askable',pending.some(field=>field.key==='yearBuilt')&&pending.some(field=>field.key==='livingArea'));
  const unknown=api.apply(profile,api.FIELDS.find(field=>field.key==='roofType'),'not_sure','2026-08-21T00:00:00Z');
  check('not sure stores durable unknown provenance',unknown.roof.roofType.source==='unknown'&&unknown.roof.roofType.value===null);
  const answer=api.apply(profile,api.FIELDS.find(field=>field.key==='garage'),'attached','2026-08-21T00:00:00Z');
  check('customer answer has customer-reported provenance',answer.physicalCharacteristics.garage.source==='customer_reported');
  check('technical questions are explicitly post-Snapshot',contract.technicalFieldsBeforeSnapshot===false&&contract.singleDecisionPerStep===true);
}

if(id==='CF-HOME-3.4'){
  const profileApi=require('../assets/js/pvx-home-profile-contract.js'),api=require('../assets/js/pvx-home-updates.js'),contract=JSON.parse(read('CF_HOME_3_4_UPDATES_CONTRACT.json'));
  check('updates branching identity matches',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  check('upgrade evidence unlocks contextual entry',api.entry({answers:{upgradeSummary:'yes_major'}}).reusesEvidenceRef==='discovery.answers.upgradeSummary');
  check('no upgrade evidence creates no repeated question',api.entry({answers:{upgradeSummary:'no'}})===null&&contract.asksUpgradeQuestionAgain===false);
  const branches=api.followUps(['roof','kitchen','unknown','roof']);
  check('only selected supported updates create branches',branches.length===2&&branches.map(item=>item.area).join('|')==='roof|kitchen');
  check('branches stay one level deep and allow uncertainty',branches.every(item=>item.depth===1&&item.notSureAllowed));
  const profile=api.apply(profileApi.create(),['roof','high_end_materials'],{roof:'Replaced in 2022',high_end_materials:'Custom stone'},'2026-08-21T00:00:00Z');
  check('normalized updates preserve discovery provenance',profile.systemsAndUpdates.updates.source==='customer_reported'&&profile.systemsAndUpdates.updates.evidenceRef==='discovery.answers.upgradeSummary');
  check('all roadmap update areas are present',api.AREAS.length===10&&contract.areas.every(area=>api.AREAS.includes(area)));
}

if(id==='CF-HOME-3.5'){
  const profileApi=require('../assets/js/pvx-home-profile-contract.js'),api=require('../assets/js/pvx-home-features.js'),contract=JSON.parse(read('CF_HOME_3_5_FEATURES_CONTRACT.json'));
  check('features branching identity matches',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  check('all feature and use options are present',api.FEATURES.length===11&&contract.features.every(feature=>api.FEATURES.includes(feature)));
  check('none clears conflicting selections',api.normalize(['pool_spa','none','solar']).length===0);
  const branches=api.branches(['pool_spa','solar']);
  check('only selected feature follow-ups appear',branches.every(branch=>['pool_spa','solar'].includes(branch.feature))&&branches.some(branch=>branch.key==='fenced')&&branches.some(branch=>branch.key==='owned_or_leased'));
  check('feature follow-ups remain shallow and uncertainty-safe',branches.every(branch=>branch.depth===1&&branch.notSureAllowed));
  const profile=api.apply(profileApi.create(),['home_business'],{home_business:{business_use:'Consulting office'}},'2026-08-21T00:00:00Z');
  check('feature evidence has customer-reported provenance',profile.specialFeatures.featuresAndUses.source==='customer_reported'&&profile.specialFeatures.featuresAndUses.value.selected[0]==='home_business');
  check('contract creates no eligibility outcome',contract.eligibilityDecision===false&&contract.followUpOnlyWhenSelected===true);
}

if(id==='CF-HOME-3.6'){
  const profileApi=require('../assets/js/pvx-home-profile-contract.js'),api=require('../assets/js/pvx-home-history-mitigation.js'),contract=JSON.parse(read('CF_HOME_3_6_HISTORY_MITIGATION_CONTRACT.json'));
  check('history and mitigation identity matches',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  check('history and mitigation catalog is complete',api.FIELDS.length===12&&contract.insuranceHistory.concat(contract.mitigation).every(key=>api.FIELDS.some(field=>field.key===key)));
  const seeded=api.seedFromDiscovery(profileApi.create(),{answers:{claimExperience:'yes_difficult'},branchAnswers:{claimType:'water'}},'2026-08-21T00:00:00Z');
  check('discovery claim is reused with evidence',seeded.claimsAndInsuranceHistory.priorClaimSummary.evidenceRef==='discovery.answers.claimExperience'&&seeded.claimsAndInsuranceHistory.priorClaimSummary.value.claimType==='water');
  const profile=api.apply(seeded,{currentCarrier:'Example Mutual',openClaims:'yes',nonrenewalOrCancellation:'no',waterDetection:'not_sure'},'2026-08-21T00:01:00Z');
  check('reported history retains provenance',profile.claimsAndInsuranceHistory.currentCarrier.source==='customer_reported');
  check('not sure mitigation remains unknown',profile.safetyAndMitigation.waterDetection.source==='unknown');
  check('open claim creates producer review, not eligibility',api.manualReviewItems(profile).includes('open_claim')&&contract.automaticEligibilityDecision===false&&contract.automaticIneligibilityDecision===false);
  check('reported facts never become verified automatically',contract.reportedIsVerified===false);
}

if(id==='CF-HOME-3.7'){
  const profileApi=require('../assets/js/pvx-home-profile-contract.js'),api=require('../assets/js/pvx-quote-readiness.js'),contract=JSON.parse(read('CF_HOME_3_7_READINESS_CONTRACT.json'));
  check('quote readiness identity matches',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  check('six exact readiness states exist',api.STATES.join('|')===contract.states.join('|'));
  check('empty profile stays not started',api.evaluate(profileApi.create()).state==='not_started');
  let profile=profileApi.create({profileId:'hp_1'});for(const [section,key] of api.REQUIRED)profile=profileApi.setFact(profile,section,key,key,{source:'customer_confirmed'});
  const ready=api.evaluate(profile);
  check('complete confirmed profile is producer-review ready',ready.state==='ready_for_producer_review'&&ready.stillNeeded.length===0);
  const conflict=profileApi.setFact(profile,'roof','roofAge',12,{source:'conflict_needs_confirmation'});
  check('conflict requires property verification',api.evaluate(conflict).state==='needs_property_verification');
  check('document request has distinct state',api.evaluate(profile,{requiredDocuments:['roof_age_proof']}).state==='needs_document');
  check('manual review takes precedence safely',api.evaluate(profile,{manualReviewItems:['open_claim']}).state==='manual_review_required');
  check('guardrails deny commercial conclusions',Object.values(ready.guardrails).every(value=>value===false)&&contract.carrierEligibility===false&&contract.ratePromise===false);
}

if(id==='CF-HOME-3.8'){
  const cp=require('node:child_process'),api=require('../assets/js/pvx-home-report.js'),contract=JSON.parse(read('CF_HOME_3_8_REPORT_CONTRACT.json'));
  check('Home report client identity matches',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  const payload=api.payload('pvx_'+Buffer.alloc(32,9).toString('base64url'),{contractId:'coveragefit-home-profile-v1'},{contractId:'coveragefit-quote-readiness-v1'});
  check('payload uses checkpoint 2H semantics',payload.checkpointType==='home_profile_ready'&&payload.reportRevision==='2H');
  check('client cannot convert readiness to eligibility',payload.semanticBoundary.quoteReadinessIsEligibility===false&&payload.semanticBoundary.bindAuthorized===false);
  const qa=cp.spawnSync(process.execPath,['tests/pvx-home-checkpoint-core-qa.mjs'],{cwd:root,encoding:'utf8'});
  check(`Home checkpoint server QA passes: ${qa.stderr||qa.stdout}`,qa.status===0&&qa.stdout.includes('"pass":true'));
  check('report contract preserves prior Snapshot',contract.priorSnapshotPreserved===true&&contract.immutable===true);
  check('report contains every roadmap addition',contract.adds.length===8&&contract.adds.includes('producerNextAction'));
  check('report contract denies commercial conclusions',contract.carrierEligibility===false&&contract.underwritingApproval===false&&contract.ratePromise===false);
}

if(id==='CF-HOME-3.9'){
  const profileApi=require('../assets/js/pvx-home-profile-contract.js'),api=require('../assets/js/pvx-producer-quote-package.js'),contract=JSON.parse(read('CF_HOME_3_9_PRODUCER_PACKAGE_CONTRACT.json'));
  check('producer package identity matches',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  let profile=profileApi.create({profileId:'hp_1'});profile=profileApi.setFact(profile,'physicalCharacteristics','yearBuilt',1988,{source:'customer_confirmed',evidenceRef:'homeProfile.physicalCharacteristics.yearBuilt'});profile=profileApi.setFact(profile,'roof','roofAge',12,{source:'conflict_needs_confirmation',conflicts:[10,12],evidenceRef:'propertySource.roofAge'});
  const pkg=api.create(profile,{stillNeeded:['foundation.foundationType']},{carrierRequirementRefs:['roof-age-review'],producerNotes:'Confirm roof documents.'});
  check('normalized values and sources stay aligned',pkg.normalizedQuoteInputs['physicalCharacteristics.yearBuilt']===1988&&pkg.sourceLabels['physicalCharacteristics.yearBuilt'].source==='customer_confirmed');
  check('conflict queue preserves competing evidence',pkg.conflictQueue.length===1&&pkg.conflictQueue[0].field==='roof.roofAge');
  check('missing information remains an explicit queue',pkg.missingInformationQueue[0]==='foundation.foundationType');
  check('producer aids are complete',pkg.copyableValues.length===2&&pkg.printableWorksheet.sections.length===5&&pkg.producerNotes==='Confirm roof documents.');
  check('quote status updates without rating',api.updateStatus(pkg,'started').quoteStartStatus==='started');
  check('no duplicate production engine or commercial conclusion exists',Object.values(pkg.guardrails).every(value=>value===false)&&contract.duplicateQuoteEngine===false&&contract.ratingEngine===false);
  check('all roadmap outputs are delivered',contract.delivers.every(key=>Object.prototype.hasOwnProperty.call(pkg,key)));
}

if(id==='CF-POL-1.1'){
  const api=require('../assets/js/pvx-policy-profile-contract.js'),contract=JSON.parse(read('CF_POL_1_1_PROFILE_CONTRACT.json'));
  check('policy profile identity matches',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  check('four optional completion paths exist',api.PATHS.join('|')===contract.paths.join('|'));
  let profile=api.create({profileId:'pol_1',completionPath:'upload_declarations'});profile=api.setFact(profile,'propertyCoverage','dwellingLimit',500000,{source:'document_identified',documentRef:'doc_1',evidenceRef:'doc_1.page_1'});
  check('document fact is identified but unconfirmed',profile.propertyCoverage.dwellingLimit.source==='document_identified'&&!profile.propertyCoverage.dwellingLimit.confirmedAt);
  profile=api.confirm(profile,'propertyCoverage','dwellingLimit','2026-08-21T00:00:00Z');
  check('customer confirmation is explicit',profile.propertyCoverage.dwellingLimit.source==='customer_confirmed'&&profile.propertyCoverage.dwellingLimit.confirmedAt);
  profile=api.verify(profile,'propertyCoverage','dwellingLimit','2026-08-22T00:00:00Z');
  check('producer verification is separately explicit',profile.propertyCoverage.dwellingLimit.source==='producer_verified'&&profile.propertyCoverage.dwellingLimit.verifiedAt);
  check('all coverage sections initialize durably',api.SECTIONS.every(section=>section in api.create()));
  check('contract retains manual fallback and optionality',contract.worksWithoutExtraction===true&&contract.optionalPath===true&&contract.documentIdentifiedIsConfirmed===false);
}

if(id==='CF-POL-1.2'){
  const cp=require('node:child_process'),api=require('../assets/js/pvx-policy-intake.js'),contract=JSON.parse(read('CF_POL_1_2_INTAKE_CONTRACT.json'));
  check('policy intake client identity matches',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  const good={type:'application/pdf',size:1024},badType={type:'text/plain',size:5},tooBig={type:'application/pdf',size:11*1024*1024};
  check('client accepts supported policy media',api.validate([good]).valid===true);
  check('client rejects unsafe media',api.validate([badType]).errors.includes('file_type'));
  check('client enforces per-file size',api.validate([tooBig]).errors.includes('file_size'));
  check('client enforces multi-file count',api.validate(Array(13).fill(good)).errors.includes('too_many_files'));
  const qa=cp.spawnSync(process.execPath,['tests/pvx-policy-intake-core-qa.mjs'],{cwd:root,encoding:'utf8'});
  check(`policy intake server QA passes: ${qa.stderr||qa.stdout}`,qa.status===0&&qa.stdout.includes('"pass":true'));
  check('contract keeps storage private and token hash only',contract.privateAccess===true&&contract.bearerTokenStored===false);
  check('manual fallback is independent of extraction',contract.manualFallback===true&&contract.automatedExtractionRequired===false);
}

if(id==='CF-POL-1.3'){
  const policyApi=require('../assets/js/pvx-policy-profile-contract.js'),api=require('../assets/js/pvx-policy-scored-review.js'),scoreApi=require('../assets/js/protection-score.js'),contract=JSON.parse(read('CF_POL_1_3_SCORED_REVIEW_CONTRACT.json'));
  check('scored policy review identity matches',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  const empty=policyApi.create({profileId:'pol_1'});
  check('no meaningful evidence means no score',api.review({policyProfile:empty,questions:[{key:'q',weight:10}],selections:{}}).scoreAvailable===false);
  const profile=policyApi.setFact(empty,'deductibles','allOtherPerils',2500,{source:'document_identified',documentRef:'doc_1'}),items=api.confirmationItems(profile);
  check('document fact produces confirmation item',items.length===1&&items[0].states.includes('not_sure'));
  const questions=[{key:'deductible',title:'Deductible',weight:10,required:true}],selections={deductible:{label:'Confirmed',scoreImpact:0,evidenceQuality:'confirmed'}},review=api.review({policyProfile:profile,questions,selections}),direct=scoreApi.evaluate({questions,selections});
  check('adapter preserves exact score engine result',review.score===direct.score&&review.methodology.id===direct.methodology.id);
  check('presentation changes but formula does not',review.presentationLabel==='Review Readiness'&&review.scoreFormulaChanged===false);
  check('discovery is explicitly excluded from score inputs',review.personalDiscoveryAffectsScore===false&&contract.personalDiscoveryAffectsScore===false);
  check('protected methodology and math remain unchanged by contract',contract.protectionScoreMethodologyChanged===false&&contract.protectionScoreMathChanged===false);
}

if(id==='CF-POL-1.4'){
  const api=require('../assets/js/pvx-topic-recommendation-bridge.js'),contract=JSON.parse(read('CF_POL_1_4_RECOMMENDATION_BRIDGE_CONTRACT.json')),topic={topicKey:'rebuilding_assumptions',label:'Rebuilding assumptions',status:'worth_reviewing',evidenceRefs:[{key:'upgradeSummary'}]},evidence=[{source:'customer_confirmed',key:'propertyCoverage.dwellingLimit',value:500000}],candidate={recommendationKey:'verify_reconstruction_basis',title:'Verify the reconstruction basis',explanation:'Confirm the current estimate before choosing a structure.'};
  check('recommendation bridge identity matches',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  check('discovery topic alone cannot create recommendation',api.convert({topic,candidate,authority:'existing_recommendation_engine'}).created===false);
  check('document identified alone is insufficient',api.convert({topic,policyEvidence:[{source:'document_identified',key:'x'}],candidate,authority:'existing_recommendation_engine'}).created===false);
  check('unsupported authority fails closed',api.convert({topic,policyEvidence:evidence,candidate,authority:'early_topic_engine'}).reason==='recommendation_authority_required');
  const result=api.convert({topic,policyEvidence:evidence,candidate,authority:'existing_recommendation_engine',discoveryProfile:{customerSignals:[]}});
  check('authorized evidence creates actual recommendation',result.created===true&&result.recommendation.status==='actual_recommendation'&&result.recommendation.authority==='existing_recommendation_engine');
  check('finding does not claim a policy deficiency',result.finding.policyDeficiencyFound===false);
  check('early topic and response semantics remain separate',result.earlyTopicPreserved.status==='worth_reviewing'&&result.topicResponsePromoted===false);
  check('contract limits recommendation authority',api.AUTHORITIES.join('|')===contract.authorities.join('|')&&contract.recommendationRequiresEvidence===true);
}

if(id==='CF-ADV-1.13'){
  const api=require('../assets/js/pvx-recommendation-buy-in.js'),contract=JSON.parse(read('CF_ADV_1_13_BUY_IN_CONTRACT.json'));
  check('recommendation buy-in identity matches',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  check('four protected buy-in states exist',api.STATES.join('|')===contract.states.join('|'));
  const topic={status:'worth_reviewing',recommendation:false,evidenceRefs:[{key:'x'}]};
  check('early topic is ineligible for buy-in',api.eligible(topic)===false);
  const recommendation={status:'actual_recommendation',recommendation:true,recommendationKey:'verify_reconstruction_basis',authority:'licensed_producer_verified',evidenceRefs:[{source:'producer_verified',key:'dwellingLimit'}]},response=api.capture(recommendation,'accepted_logic','That makes sense.','2026-08-21T00:00:00Z');
  check('actual evidence-backed recommendation captures response',response.recordType==='recommendationResponse'&&response.state==='accepted_logic');
  check('exact customer wording is retained safely',response.exactCustomerWords==='That makes sense.');
  check('response is not relevance preference decision or authorization',response.topicResponse===false&&response.coveragePreference===false&&response.finalDecision===false&&response.bindAuthorization===false);
  check('upsert remains stable per recommendation',api.upsert(api.upsert([],response),{...response,state:'undecided'}).length===1);
  check('contract enforces semantic separation',contract.storedAsTopicResponses===false&&contract.isFinalDecision===false&&contract.isBindAuthorization===false);
}

if(id==='CF-POL-1.5'){
  const cp=require('node:child_process'),api=require('../assets/js/pvx-policy-report.js'),contract=JSON.parse(read('CF_POL_1_5_REPORT_CONTRACT.json'));
  check('policy report client identity matches',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  const payload=api.payload('token',{contractId:'coveragefit-current-policy-profile-v1'},{scoreAvailable:true},[{status:'actual_recommendation'}],[{recordType:'recommendationResponse'}]);
  check('client uses coverage checkpoint and revision 2P',payload.checkpointType==='coverage_review_ready'&&payload.reportRevision==='2P');
  const qa=cp.spawnSync(process.execPath,['tests/pvx-policy-checkpoint-core-qa.mjs'],{cwd:root,encoding:'utf8'});
  check(`policy checkpoint server QA passes: ${qa.stderr||qa.stdout}`,qa.status===0&&qa.stdout.includes('"pass":true'));
  check('report adds all evidence-backed review sections',contract.adds.length===9&&contract.adds.includes('recommendations')&&contract.adds.includes('neededVerification'));
  check('prior report revisions remain immutable history',contract.priorRevisionsPreserved===true&&contract.immutable===true);
  check('score and reaction boundaries remain strict',contract.personalDiscoveryAffectsScore===false&&contract.topicResponseIsBuyIn===false&&contract.bindAuthorization===false);
}

if(id==='CF-FLOW-2.1'){
  const api=require('../assets/js/pvx-multipath-orchestrator.js'),contract=JSON.parse(read('CF_FLOW_2_1_ORCHESTRATOR_CONTRACT.json'));
  check('multipath orchestrator identity matches',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  const base=api.create(),policyFirst=api.start(base,'current_policy','2026-08-21T00:00:00Z'),policyDone=api.complete(policyFirst,'current_policy','2026-08-21T00:01:00Z'),homeSecond=api.start(policyDone,'home_profile','2026-08-21T00:02:00Z'),both=api.complete(homeSecond,'home_profile','2026-08-21T00:03:00Z');
  check('policy-first order is preserved',both.pathOrder.join('|')==='snapshot|current_policy|home_profile');
  check('both complete paths make combined review ready',both.paths.home_profile==='complete'&&both.paths.current_policy==='complete'&&both.combinedReview==='ready');
  check('both order converges to producer review',api.nextAction(both).action==='producer_review');
  const paused=api.pause(api.start(base,'home_profile'),'roof_age','2026-08-21T00:00:00Z');
  check('pause returns to exact path and step',api.nextAction(paused).action==='secure_return'&&api.nextAction(paused).path==='home_profile'&&api.nextAction(paused).step==='roof_age');
  check('producer assistance preserves same path state',api.assist(paused).mode==='producer_assisted'&&api.assist(paused).paths.home_profile==='in_progress');
  check('contract includes all seven approved journey forms',contract.supports.length===7&&contract.pathIndependence===true);
}

if(id==='CF-FLOW-2.2'){
  const api=require('../assets/js/pvx-report-revision-ledger.js'),contract=JSON.parse(read('CF_FLOW_2_2_LEDGER_CONTRACT.json'));
  check('report ledger identity matches',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  let ledger=api.append(api.create(),{revision:'1',contents:{title:'Snapshot'}});ledger=api.append(ledger,{revision:'2H',contents:{home:true}});ledger=api.append(ledger,{revision:'2P',contents:{policy:true}});ledger=api.append(ledger,{revision:'3',contents:{combined:true}});ledger=api.append(ledger,{revision:'Final',contents:{next:'quote'}});
  check('five report revisions retain exact order',ledger.revisions.map(item=>item.revision).join('|')==='1|2H|2P|3|Final');
  check('all revisions are immutable and non-superseding',ledger.revisions.every(item=>item.immutable===true&&item.supersedes===null));
  check('prior Snapshot remains retrievable at Final',api.get(ledger,'1').contents.title==='Snapshot'&&api.latest(ledger).revision==='Final');
  const idempotent=api.append(ledger,{revision:'2H',contents:{home:true}});
  check('identical append is idempotent',idempotent.revisions.length===5);
  check('conflicting overwrite is rejected',(()=>{try{api.append(ledger,{revision:'2H',contents:{home:false}});return false}catch(error){return /Immutable/.test(error.message)}})());
  check('combined revision fails without both paths',(()=>{try{api.append(api.append(api.create(),{revision:'2H',contents:{}}),{revision:'3',contents:{}});return false}catch(error){return true}})());
  check('contract guarantees revision history',contract.immutable===true&&contract.silentlyOverwritten===false&&contract.priorRevisionsAvailable===true);
}

if(id==='CF-FLOW-2.3'){
  const api=require('../assets/js/pvx-zero-repeat-reconciliation.js'),contract=JSON.parse(read('CF_FLOW_2_3_RECONCILIATION_CONTRACT.json'));
  check('reconciliation identity matches',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  check('all nine source systems are modeled',api.SOURCES.length===9&&contract.sources.every(source=>api.SOURCES.includes(source)));
  const agreement=api.reconcile('yearBuilt',[{source:'property_intelligence',sourceState:'property_source_reported',value:1988},{source:'home_profile',sourceState:'customer_reported',value:1988}]);
  check('agreement is reused without repeat',agreement.status==='agreement_reused'&&agreement.value===1988&&agreement.askCustomer===false);
  const trusted=api.reconcile('yearBuilt',[{source:'property_intelligence',sourceState:'property_source_reported',value:1988},{source:'home_profile',sourceState:'customer_confirmed',value:1989}]);
  check('trusted confirmation updates with history',trusted.status==='trusted_confirmation_updated'&&trusted.value===1989&&trusted.history.length===2);
  const conflict=api.reconcile('roofAge',[{source:'policy_document',sourceState:'document_identified',value:10},{source:'home_profile',sourceState:'customer_reported',value:12}]);
  check('equal-trust conflict fails closed and asks once',conflict.status==='conflict_needs_confirmation'&&conflict.value===null&&conflict.askCustomer===true&&conflict.silentWinner===false);
  check('previously asked conflict does not repeat',api.reconcile('roofAge',conflict.history,['roofAge']).askCustomer===false);
  check('unknown remains unknown',api.reconcile('foundation',[]).status==='unknown');
  check('contract prohibits silent winner selection',contract.rules.silentWinner===false&&contract.historyPreserved===true);
}

if(id==='CF-FLOW-2.4'){
  const cp=require('node:child_process'),contract=JSON.parse(read('CF_FLOW_2_4_NOTIFICATION_CONTRACT.json'));
  check('notification contract registers eight events',contract.events.length===8);
  const qa=cp.spawnSync(process.execPath,['tests/pvx-notification-orchestrator-qa.mjs'],{cwd:root,encoding:'utf8'});
  check(`notification orchestrator QA passes: ${qa.stderr||qa.stdout}`,qa.status===0&&qa.stdout.includes('"pass":true'));
  check('notification semantics preserve ownership',contract.ownershipPreserved===true);
  check('notifications are deduplicated and retryable',contract.deduplicated===true&&contract.outbox===true&&contract.retryState===true);
  check('customer never receives internal notes',contract.customerInternalNotesExposed===false);
}

if(id==='CF-FLOW-2.5'){
  const cp=require('node:child_process'),api=require('../assets/js/pvx-progress-center.js'),contract=JSON.parse(read('CF_FLOW_2_5_PROGRESS_CONTRACT.json'));
  check('progress center client identity matches',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  const qa=cp.spawnSync(process.execPath,['tests/pvx-progress-center-core-qa.mjs'],{cwd:root,encoding:'utf8'});
  check(`progress center server QA passes: ${qa.stderr||qa.stdout}`,qa.status===0&&qa.stdout.includes('"pass":true'));
  check('progress surface contains all customer needs',contract.shows.length===6&&contract.shows.includes('latestReport')&&contract.shows.includes('continueButtons'));
  check('secure return needs no account',contract.accountRequired===false&&contract.secureTokenRequired===true);
  check('private producer and file data remain hidden',contract.internalNotesExposed===false&&contract.underwritingNotesExposed===false&&contract.policyObjectKeysExposed===false);
}

if(id==='CF-FLOW-2.6'){
  const cp=require('node:child_process'),contract=JSON.parse(read('CF_FLOW_2_6_STATUS_CONTRACT.json'));
  check('producer status contract has nine exact states',contract.producerStatuses.length===9);
  const qa=cp.spawnSync(process.execPath,['tests/pvx-producer-status-core-qa.mjs'],{cwd:root,encoding:'utf8'});
  check(`producer status server QA passes: ${qa.stderr||qa.stdout}`,qa.status===0&&qa.stdout.includes('"pass":true'));
  check('producer authentication and ownership are required',contract.producerAuthenticationRequired===true&&contract.ownershipPreserved===true);
  check('status history is append only',contract.historyAppendOnly===true);
  check('customer view remains simple and private',contract.customerLabelsSimplified===true&&contract.underwritingNotesExposed===false&&contract.internalNotesExposed===false);
}

if(id==='CF-ADV-1.14'){
  const api=require('../assets/js/pvx-what-i-learned.js'),contract=JSON.parse(read('CF_ADV_1_14_LEARNED_CONTRACT.json'));
  check('What I Learned identity matches',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  const model=api.derive({discoveryProfile:{answers:{shoppingReason:'renewal_increase',improvementPriorities:['price_only']},exactCustomerWords:{shoppingReason:'My renewal jumped.'}},topicResponses:[{recordType:'topicResponse'}],homeProfilePath:{status:'complete'},quoteReadiness:{state:'ready_for_producer_review'},currentPolicyPath:{status:'complete'},coverageReview:{evidence:{state:'complete'}},recommendations:[{status:'actual_recommendation'}],recommendationResponses:[{recordType:'recommendationResponse'}],reportRevisions:[{revision:'1'},{revision:'2P'}]});
  check('discovery and exact customer words are preserved',model.discovery.shoppingReason==='renewal_increase'&&model.discovery.exactCustomerWords.shoppingReason==='My renewal jumped.');
  check('early and actual reactions remain separate arrays',model.earlyReactions[0].recordType==='topicResponse'&&model.policyReview.buyIn[0].recordType==='recommendationResponse');
  check('Home and policy status coexist',model.homeProfile.status==='complete'&&model.policyReview.status==='complete');
  check('latest report and next action are path aware',model.latestReportRevision==='2P'&&/recommendations/.test(model.nextAction));
  check('semantic boundaries all fail closed',Object.values(model.semanticBoundary).every(value=>value===false));
  check('contract combines all nine required inputs',contract.combines.length===9&&contract.customerWordsPreserved===true);
}

if(id==='CF-ADV-1.15'){
  const api=require('../assets/js/pvx-evidence-aware-copilot.js'),contract=JSON.parse(read('CF_ADV_1_15_COPILOT_CONTRACT.json'));
  check('evidence-aware Copilot identity matches',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  const model=api.derive({advisoryReviewTopics:[{topicKey:'water',label:'Water protection',status:'worth_reviewing',evidenceRefs:[{key:'claim'}]}],recommendations:[{recommendationKey:'water_backup',title:'Add water backup',status:'actual_recommendation',recommendation:true,authority:'licensed_producer_verified',evidenceRefs:[{key:'endorsement'}],anchor:{discussionPrompt:'Here is why.'}}]});
  check('early topic is visibly discussion only',model.discussionTopics[0].badge==='Discussion topic · Not a recommendation'&&model.discussionTopics[0].allowedAction==='discuss_and_verify');
  check('actual recommendation has separate lane',model.actualRecommendations[0].badge==='Dylan’s recommendation'&&model.actualRecommendations[0].allowedAction==='recommend_and_ask');
  const noEvidence=api.derive({advisoryReviewTopics:[{status:'worth_reviewing'}]});
  check('no recommendation keeps verification mode',/Stay in discussion mode/.test(noEvidence.producerPrompt));
  check('all semantic guardrails fail closed',Object.values(model.guardrails).every(value=>value===false));
  check('contract preserves conversation principle',contract.listenConnectRecommendAsk===true&&contract.fearLanguage===false);
}

if(id==='CF-ADV-1.16'){
  const api=require('../assets/js/pvx-focus-mode.js'),contract=JSON.parse(read('CF_ADV_1_16_FOCUS_CONTRACT.json'));
  check('Focus Mode identity matches',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  check('six ordered stages match contract',api.STAGES.join('|')===contract.stages.join('|'));
  const snapshot=api.plan({advisoryReviewTopics:[{status:'worth_reviewing'}]});
  check('Snapshot path can discuss but cannot recommend',snapshot.activePath==='snapshot'&&snapshot.stages.find(item=>item.id==='discuss').ready===true&&snapshot.stages.find(item=>item.id==='recommend').ready===false);
  const home=api.plan({homeProfilePath:{status:'complete'}});
  check('Home path verifies quote inputs and enables next step',home.activePath==='home_profile'&&home.stages.find(item=>item.id==='verify').ready&&home.stages.find(item=>item.id==='next_step').ready);
  const combined=api.plan({homeProfilePath:{status:'complete'},currentPolicyPath:{status:'complete'},recommendations:[{status:'actual_recommendation'}]});
  check('combined evidence unlocks recommendation and decision',combined.activePath==='combined'&&combined.stages.find(item=>item.id==='recommend').ready&&combined.stages.find(item=>item.id==='decide').ready);
  check('contract preserves buy-in boundary',contract.recommendationLockedWithoutEvidence===true&&contract.buyInIsAuthorization===false);
}

if(id==='CF-ADV-1.17'){
  const api=require('../assets/js/pvx-live-notes.js'),contract=JSON.parse(read('CF_ADV_1_17_NOTES_CONTRACT.json'));
  check('live notes identity matches',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  const base=api.create({exactCustomerWords:{shoppingReason:'My renewal jumped.'},topicResponses:[{topicKey:'cost',state:'cost_first',exactCustomerWords:'Start with price.'}]});
  check('customer wording remains exact and immutable',base.preCall[0].text==='My renewal jumped.'&&base.preCall[0].immutable===true);
  check('pre-call reaction remains separate record type',base.preCall[1].recordType==='pre_call_topic_reaction'&&base.preCall[1].state==='cost_first');
  const added=api.add(base,{body:'Ask about renewal timing. <script>','anchor':'renewalDate',createdAt:'2026-08-21T00:00:00Z'});
  check('producer note is sanitized and anchored',added.live[0].body==='Ask about renewal timing. script'&&added.live[0].anchor==='renewalDate');
  check('adding producer note does not change pre-call records',added.preCall.length===base.preCall.length&&added.preCall[0].text===base.preCall[0].text);
  check('producer note remains internal',added.live[0].customerVisible===false&&added.live[0].source==='producer');
  check('contract keeps notes outside evidence',contract.notesDoNotChangeEvidence===true&&contract.producerNotesCustomerVisible===false);
}

if(id==='CF-ADV-1.18'){
  const api=require('../assets/js/pvx-progressive-guardrails.js'),contract=JSON.parse(read('CF_ADV_1_18_GUARDRAILS_CONTRACT.json'));
  check('progressive guardrails identity matches',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  check('truthful discovery-only Snapshot passes',api.validate('snapshot',{title:'Worth reviewing',guardrails:{discoveryOnly:true}}).valid===true);
  check('Snapshot deficiency claim fails closed',api.validate('snapshot',{text:'You are underinsured',guardrails:{discoveryOnly:true}}).failClosed===true);
  check('readiness eligibility and rate claims fail',api.validate('quote_readiness','Carrier eligible with rate guaranteed').violations.length===2);
  const rec={status:'actual_recommendation',authority:'licensed_producer_verified',evidenceRefs:[{key:'x'}]};
  check('evidence-backed authorized recommendation passes',api.validate('recommendation',rec).valid===true);
  check('missing evidence and authority fail recommendation',api.validate('recommendation',{status:'actual_recommendation'}).violations.length===2);
  check('fear-based producer prompt fails',api.validate('producer_prompt','You could lose everything.').valid===false);
  check('safe labels match semantic stage',api.safeLabel('snapshot')==='Worth reviewing'&&api.safeLabel('quote_readiness')==='Producer review needed');
  check('contract fails closed across four surfaces',contract.surfaces.length===4&&contract.missingEvidenceFailsClosed===true&&contract.fearLanguage===false);
}

if(id==='CF-ADV-1.19'){
  const api=require('../assets/js/pvx-agent-guide.js'),contract=JSON.parse(read('CF_ADV_1_19_GUIDE_CONTRACT.json'));
  check('Agent Guide identity matches',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  const guide=api.derive({learned:{discovery:{shoppingReason:'renewal',exactCustomerWords:{shoppingReason:'Price jumped.'}},nextAction:'Call customer.'},homePackage:{normalizedQuoteInputs:{'roof.roofAge':12},sourceLabels:{'roof.roofAge':{source:'customer_confirmed'}},missingInformationQueue:['foundation.type'],conflictQueue:[{field:'livingArea'}]},policyReview:{evidence:{state:'complete'},neededVerification:['deductibles.wind']},copilot:{discussionTopics:[{key:'cost'}],actualRecommendations:[{key:'water',prompt:'Discuss water.',evidenceRefs:[{key:'endorsement'}],authority:'licensed_producer_verified'}]}});
  check('opening preserves exact customer words',guide.opening.exactCustomerWords.shoppingReason==='Price jumped.');
  check('property value and source remain aligned',guide.propertyFacts['roof.roofAge']===12&&guide.sourceLabels['roof.roofAge'].source==='customer_confirmed');
  check('missing inputs merge without semantic loss',guide.missingInformation.join('|')==='foundation.type|deductibles.wind');
  check('discussion and recommendation lanes remain separate',guide.discussionTopics[0].key==='cost'&&guide.recommendationAnchors[0].key==='water');
  check('conversation principle is exact',guide.conversationPrinciple.join('|')===contract.conversationPrinciple.join('|'));
  check('guardrails keep reported readiness semantics truthful',Object.values(guide.guardrails).every(value=>value===false));
  check('all nine guide sections exist',contract.sections.every(section=>Object.prototype.hasOwnProperty.call(guide,section)));
}

if(id==='CF-ADV-1.20'){
  const ledgerApi=require('../assets/js/pvx-report-revision-ledger.js'),api=require('../assets/js/pvx-client-snapshot-final.js'),contract=JSON.parse(read('CF_ADV_1_20_CLIENT_REPORT_CONTRACT.json'));
  check('Client Snapshot 2 identity matches',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  let ledger=ledgerApi.append(ledgerApi.create(),{revision:'1',contents:{snapshot:true}});ledger=ledgerApi.append(ledger,{revision:'2P',contents:{policy:true}});
  check('unverified producer cannot finalize',(()=>{try{api.finalize(ledger,{producerVerified:false});return false}catch(error){return true}})());
  const recommendation={recommendationKey:'water',status:'actual_recommendation',recommendation:true,internalNote:'private',producerNotes:'private'},final=api.finalize(ledger,{producerVerified:true,recommendations:[recommendation],decisions:[{type:'preference',internalNote:'private'}],nextSteps:['Review quote'],quoteSummary:{status:'prepared',customerVisiblePremium:1234},finalizedAt:'2026-08-21T00:00:00Z'}),report=ledgerApi.latest(final);
  check('Final revision is appended without replacing history',final.revisions.map(item=>item.revision).join('|')==='1|2P|Final');
  check('only customer-safe recommendation fields remain',report.contents.recommendations[0].internalNote===undefined&&report.contents.recommendations[0].producerNotes===undefined);
  check('customer-visible quote summary is bounded',report.contents.quoteSummary.premium===1234&&report.contents.quoteSummary.status==='prepared');
  check('final report explicitly avoids binding implication',/not bound/.test(report.contents.disclosure)&&contract.bindAuthorizationImplied===false);
  check('contract excludes internal and underwriting notes',contract.internalNotesExposed===false&&contract.underwritingNotesExposed===false);
}

if(id==='CF-ADV-1.21'){
  const api=require('../assets/js/pvx-decision-ledger.js'),contract=JSON.parse(read('CF_ADV_1_21_DECISION_CONTRACT.json'));
  check('decision ledger identity matches',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  check('five decision types are exact',api.TYPES.join('|')===contract.recordTypes.join('|'));
  const relevance=api.record('relevance','relevant',{subjectKey:'water',sourceRecordType:'topicResponse',createdAt:'2026-08-21T00:00:00Z'}),buyIn=api.record('recommendation_buy_in','accepted_logic',{subjectKey:'water_backup',sourceRecordType:'recommendationResponse',createdAt:'2026-08-21T00:01:00Z'}),choice=api.record('final_choice','selected',{subjectKey:'quote_a',createdAt:'2026-08-21T00:02:00Z'});
  check('relevance and buy-in preserve different sources',relevance.sourceRecordType==='topicResponse'&&buyIn.sourceRecordType==='recommendationResponse');
  check('final choice is not authorization',choice.type==='final_choice'&&choice.authorizedByCustomer===false);
  check('authorization cannot be inferred',(()=>{try{api.record('authorization',true,{scope:'bind policy'});return false}catch(error){return true}})());
  const authorization=api.record('authorization',true,{authorizedByCustomer:true,scope:'Bind quote A effective 2026-09-01',createdAt:'2026-08-21T00:03:00Z'});
  check('explicit authorization is scoped and immutable',authorization.authorizedByCustomer===true&&authorization.scope&&authorization.immutable===true&&authorization.inferred===false);
  let ledger=api.create();for(const item of [relevance,buyIn,choice,authorization])ledger=api.append(ledger,item);
  check('ledger retains each semantic stream',api.byType(ledger,'authorization').length===1&&api.byType(ledger,'relevance').length===1);
  check('contract forbids inference',contract.inferenceAllowed===false&&contract.authorizationRequiresExplicitCustomerAction===true);
}

if(id==='CF-ADV-1.22'){
  const api=require('../assets/js/pvx-value-learning-loop.js'),contract=JSON.parse(read('CF_ADV_1_22_LEARNING_CONTRACT.json'));
  check('value learning identity matches',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  const first=api.movement({journeyId:'journey_1',from:'snapshot_viewed',to:'home_profile_started',influences:['review_topic','topic_response','unsafe_free_text'],occurredAt:'2026-08-21T00:00:00Z'}),second=api.movement({journeyId:'journey_1',from:'home_profile_ready',to:'quote_started',influences:['home_profile_value','producer_contact'],occurredAt:'2026-08-22T00:00:00Z'});
  check('forward transition captures only allowed influences',first.influences.join('|')==='review_topic|topic_response');
  check('learning record is association only',first.interpretation==='association_only');
  check('sensitive and identifying payloads are excluded',first.sensitiveContentIncluded===false&&first.customerWordsIncluded===false&&first.contactDetailsIncluded===false);
  check('backward transitions fail closed',(()=>{try{api.movement({from:'quote_started',to:'snapshot_saved'});return false}catch(error){return true}})());
  const summary=api.summarize([first,second]);
  check('summary counts checkpoints and influences independently',summary.byDestination.home_profile_started===1&&summary.byDestination.quote_started===1&&summary.influenceCounts.producer_contact===1);
  check('summary makes no causal claim',summary.causalClaims===false&&contract.associationsNotCausation===true);
  check('contract covers all downstream outcomes',contract.outcomes.length===8&&contract.identityMinimized===true);
}

if(id==='CF-ADV-1.23'){
  const api=require('../assets/js/pvx-checkpoint-analytics.js'),contract=JSON.parse(read('CF_ADV_1_23_ANALYTICS_CONTRACT.json'));
  check('checkpoint analytics identity matches',api.CONTRACT_ID===contract.id&&api.BUILD===id);
  check('all fifteen independent events exist',api.EVENTS.length===15&&api.EVENTS.join('|')===contract.events.join('|'));
  const payload=api.event('question_abandoned',{journeyId:'journey_1',questionKey:'roofAge',stage:'home_profile',answer:'secret',email:'person@example.com',address:'1 Main St',policyLimit:500000});
  check('allowlisted operational fields survive',payload.properties.questionKey==='roofAge'&&payload.properties.stage==='home_profile');
  check('sensitive and unlisted fields are removed',!('answer'in payload.properties)&&!('email'in payload.properties)&&!('address'in payload.properties)&&!('policyLimit'in payload.properties));
  check('privacy assertions all fail closed',Object.values(payload.privacy).every(value=>value===false));
  const counts=api.aggregate([api.event('journey_started'),api.event('snapshot_completed'),api.event('snapshot_completed')]);
  check('checkpoints aggregate independently',counts.journey_started===1&&counts.snapshot_completed===2&&counts.quote_started===0);
  let observed=null;api.track('snapshot_saved',{checkpointType:'snapshot_saved'},{track:(name,props)=>observed={name,props}});
  check('tracker receives only sanitized event properties',observed.name==='snapshot_saved'&&observed.props.checkpointType==='snapshot_saved');
  check('contract invents no target',contract.conversionTargetsInvented===false&&contract.independentCheckpointMeasurement===true);
}

if(id==='CF-PVX-UX-2.0'){
  const cp=require('node:child_process'),contract=JSON.parse(read('CF_PVX_UX_2_0_CERTIFICATION.json'));
  const qa=cp.spawnSync(process.execPath,['tests/pvx-consumer-experience-certification.mjs'],{cwd:root,encoding:'utf8'});
  check(`consumer experience certification passes: ${qa.stderr||qa.stdout}`,qa.status===0&&qa.stdout.includes('"pass": true'));
  check('certificate declares production-candidate code scope',contract.status==='pass'&&contract.scope==='production_candidate_code_and_packaged_artifact');
  check('all twelve consumer certification domains are covered',contract.checks.length===12);
  check('observed timing is reserved for pilot telemetry',contract.livePilotTelemetryRequiredForObservedTiming===true&&contract.conversionTargetsInvented===false);
}

if(id==='CF-ADV-3.1'){
  const cp=require('node:child_process'),contract=JSON.parse(read('CF_ADV_3_1_SEMANTIC_AUDIT.json'));
  const qa=cp.spawnSync(process.execPath,['tests/pvx-semantic-truthfulness-audit.mjs'],{cwd:root,encoding:'utf8'});
  check(`semantic truthfulness audit passes: ${qa.stderr||qa.stdout}`,qa.status===0&&qa.stdout.includes('"pass": true'));
  check('six semantic boundaries are certified',contract.boundaries.length===6&&contract.status==='pass');
  check('early Snapshot never implies deficiency',contract.earlySnapshotPolicyDeficiencyImplied===false);
  check('missing evidence fails closed',contract.missingEvidenceFailsClosed===true);
}

if(id==='CF-ADV-3.2'){
  const cp=require('node:child_process'),contract=JSON.parse(read('CF_ADV_3_2_PRIVACY_CERTIFICATION.json'));
  const privacy=cp.spawnSync(process.execPath,['tests/pvx-privacy-access-certification.mjs'],{cwd:root,encoding:'utf8'}),retention=cp.spawnSync(process.execPath,['tests/pvx-privacy-retention-qa.mjs'],{cwd:root,encoding:'utf8'});
  check(`privacy/access certification passes: ${privacy.stderr||privacy.stdout}`,privacy.status===0&&privacy.stdout.includes('"pass": true'));
  check(`retention/deletion QA passes: ${retention.stderr||retention.stdout}`,retention.status===0&&retention.stdout.includes('"pass":true'));
  check('eleven privacy controls are certified',contract.controls.length===11&&contract.status==='pass');
  check('consents remain separate',contract.reportSaveIsContactConsent===false&&contract.contactIsSmsConsent===false);
  check('authorization is never inferred',contract.bindAuthorizationInferred===false);
}

if(id==='CF-ADV-3.3'){
  const cp=require('node:child_process'),contract=JSON.parse(read('CF_ADV_3_3_MOBILE_ACCESSIBILITY_PERFORMANCE.json'));
  const qa=cp.spawnSync(process.execPath,['tests/pvx-mobile-accessibility-performance-certification.mjs'],{cwd:root,encoding:'utf8'});
  check(`mobile/accessibility/performance certification passes: ${qa.stderr||qa.stdout}`,qa.status===0&&qa.stdout.includes('"pass": true'));
  check('fifteen certification domains are covered',contract.domains.length===15&&contract.status==='pass');
  check('critical asset budget is explicit',contract.criticalAssetBudgetBytes===250000);
  check('certificate scope stays truthful',contract.scope==='production_candidate_automated_gate'&&contract.physicalDevicePilotStillRequired===true);
}

if(id==='CF-ADV-3.4'){
  const cp=require('node:child_process'),contract=JSON.parse(read('CF_ADV_3_4_PRODUCTION_CERTIFICATION.json'));
  const qa=cp.spawnSync(process.execPath,['tests/pvx-end-to-end-production-certification.mjs'],{cwd:root,encoding:'utf8'});
  check(`end-to-end production certification passes: ${qa.stderr||qa.stdout}`,qa.status===0&&qa.stdout.includes('"pass": true'));
  check('nine-stage journey is certified',contract.journey.length===9&&contract.status==='pass');
  check('all five living report revisions are certified',contract.reportRevisions.join('|')==='1|2H|2P|3|Final');
  check('all final quality gates are asserted',contract.focusedQa&&contract.fullRegressionComparison&&contract.protectedHashes&&contract.packageExtractionVerification&&contract.rootDirectlyDeployable&&contract.securityPrivacyBoundaries);
  check('production candidate does not invent pilot results',contract.conversionTargetsInvented===false&&contract.deploymentApprovalRequired===true);
}

module.exports = { run: () => ({ sprint: id, pass: true, checks }) };
if (require.main === module || process.env.PVX_FOCUSED_SPRINT) console.log(JSON.stringify({ sprint: id, pass: true, checks: checks.length, details: checks }, null, 2));
