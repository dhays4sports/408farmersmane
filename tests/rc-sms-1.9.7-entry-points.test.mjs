import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  SMS_LINK_ENTRY_MESSAGES,
  createSimulatorConversation,
  normalizeSmsEntryPoint,
  normalizeSmsIntent,
  processSimulatorInbound,
  routeSmsInbound
} from '../server/sms-conversation-core.mjs';
import {
  resolveSmsInboundRoute,
  startSmsWorkflowEpisode
} from '../server/sms-orchestrator-core.mjs';
import { buildSmsProducerSummary, determineGuidedResumeState } from '../server/sms-producer-handoff-core.mjs';
import { actionableSmsAlertType, buildSmsProducerAlertEmail } from '../server/sms-producer-alert.mjs';
import { mapSmsToPvx, validateSmsPvxMapping } from '../server/sms-pvx-mapping-core.mjs';
import { handleRingCentralWebhook } from '../server/ringcentral-sms-connection-core.mjs';
import { smsLiveConversationId } from '../server/sms-outbound-gateway.mjs';

const contract = JSON.parse(fs.readFileSync(new URL('../contracts/RC_SMS_1_9_7_ENTRY_POINT_CONTRACT.json', import.meta.url), 'utf8'));
const at = '2026-08-27T12:00:00.000Z';
const input = (conversation, body, n) => processSimulatorInbound(conversation, { body, messageId: `sim-msg-entry-${n}` }, { now: new Date(at) }).conversation;

test('408FARMERS link messages are exact, bounded, and enter CoverageFit routing', () => {
  assert.equal(contract.contract_id, 'coveragefit-408farmers-sms-entry-points-v1');
  assert.deepEqual(Object.keys(SMS_LINK_ENTRY_MESSAGES), ['home', 'auto', 'life', 'business']);
  for (const [entryPoint, message] of Object.entries(SMS_LINK_ENTRY_MESSAGES)) {
    assert.equal(message, contract.entry_points[entryPoint].starter_message);
    assert.equal(normalizeSmsEntryPoint(message), entryPoint);
    assert.equal(normalizeSmsIntent(message), contract.entry_points[entryPoint].intent);
    const decision = resolveSmsInboundRoute({ state: 'new' }, message, { occurredAt: at });
    assert.equal(decision.route, 'coveragefit');
    assert.equal(decision.reason, 'explicit_coveragefit_intent');
  }
  assert.equal(normalizeSmsEntryPoint('I need auto insurance'), '');
});

test('HOME enters the inherited home review and secure-handoff preparation path', () => {
  let conversation = createSimulatorConversation({ conversationId: 'sms-sim-entry-home', now: new Date(at) });
  conversation = input(conversation, SMS_LINK_ENTRY_MESSAGES.home, 101);
  assert.equal(conversation.entryPoint, 'home');
  assert.equal(conversation.intent, 'home_review');
  assert.equal(conversation.state, 'home_review_address_requested');
  conversation = input(conversation, '123 Main St, San Jose, CA 95118', 102);
  assert.equal(conversation.state, 'home_review_reason_requested');
  conversation = input(conversation, '3', 103);
  assert.equal(conversation.state, 'coveragefit_ready');
  assert.equal(conversation.answers.reviewReason, 'coverage');
  assert.equal(mapSmsToPvx({ ...conversation, conversationId: conversation.id }).canEnterPvx, true);
});

test('AUTO completes a minimal producer-ready intake without VIN or license collection', () => {
  let conversation = createSimulatorConversation({ conversationId: 'sms-sim-entry-auto', now: new Date(at) });
  conversation = input(conversation, SMS_LINK_ENTRY_MESSAGES.auto, 201);
  assert.equal(conversation.state, 'auto_vehicle_count_requested');
  assert.match(conversation.transcript.at(-1).body, /don't send VINs/i);
  const rejected = input(conversation, '1HGCM82633A004352', 202);
  assert.equal(rejected.state, 'auto_vehicle_count_requested');
  conversation = input(conversation, '2', 203);
  assert.equal(conversation.state, 'auto_driver_count_requested');
  conversation = input(conversation, '3', 204);
  assert.equal(conversation.state, 'auto_review_reason_requested');
  conversation = input(conversation, '1', 205);
  assert.equal(conversation.state, 'awaiting_producer');
  assert.deepEqual({ vehicles: conversation.answers.vehicleCount, drivers: conversation.answers.driverCount, reason: conversation.answers.autoReviewReason }, { vehicles: '2', drivers: '3', reason: 'renewal_or_price' });
  assert.equal(determineGuidedResumeState(conversation), 'awaiting_producer');
  assert.match(buildSmsProducerSummary(conversation).text, /NEW 408FARMERS AUTO REVIEW/);
});

test('LIFE completes bounded intent intake without health or financial data', () => {
  let conversation = createSimulatorConversation({ conversationId: 'sms-sim-entry-life', now: new Date(at) });
  conversation = input(conversation, SMS_LINK_ENTRY_MESSAGES.life, 301);
  assert.equal(conversation.state, 'life_protection_goal_requested');
  assert.match(conversation.transcript.at(-1).body, /don't send health details/i);
  conversation = input(conversation, '2', 302);
  assert.equal(conversation.state, 'life_covered_person_requested');
  conversation = input(conversation, '1', 303);
  assert.equal(conversation.state, 'awaiting_producer');
  assert.deepEqual({ goal: conversation.answers.lifeProtectionGoal, covered: conversation.answers.lifeCoveredPerson }, { goal: 'mortgage', covered: 'self' });
  assert.match(buildSmsProducerSummary(conversation).text, /NEW 408FARMERS LIFE REVIEW/);
});

test('BUSINESS completes bounded industry and coverage intake', () => {
  let conversation = createSimulatorConversation({ conversationId: 'sms-sim-entry-business', now: new Date(at) });
  conversation = input(conversation, SMS_LINK_ENTRY_MESSAGES.business, 401);
  assert.equal(conversation.state, 'business_industry_requested');
  assert.match(conversation.transcript.at(-1).body, /don't send EINs/i);
  conversation = input(conversation, '1', 402);
  assert.equal(conversation.state, 'business_coverage_requested');
  conversation = input(conversation, '4', 403);
  assert.equal(conversation.state, 'awaiting_producer');
  assert.deepEqual({ industry: conversation.answers.businessIndustry, need: conversation.answers.businessCoverageNeed }, { industry: 'contractor_trades', need: 'workers_comp' });
  assert.match(buildSmsProducerSummary(conversation).text, /NEW 408FARMERS BUSINESS REVIEW/);
});

test('AUTO LIFE and BUSINESS remain producer-safe and never enter home PVX', () => {
  for (const intent of ['auto', 'life', 'business']) {
    const mapping = mapSmsToPvx({ intent, conversationId: `sms-sim-safe-${intent}`, mobile: '+14085550199' });
    assert.equal(mapping.canEnterPvx, false);
    assert.equal(mapping.destination, '');
    assert.equal(mapping.producerSafeFallback, true);
    assert.equal(mapping.fallbackReason, 'producer_owned_line_intake');
    assert.equal(mapping.contact.contactConsent, false);
    assert.equal(mapping.contact.callConsent, false);
    assert.equal(mapping.contact.emailConsent, false);
    assert.equal(validateSmsPvxMapping(mapping).valid, true);
  }
});

test('completed specialized intake creates one privacy-safe producer alert', () => {
  for (const intent of ['auto', 'life', 'business']) {
    const conversation = { id: `sms-live-${'a'.repeat(32)}`, state: 'awaiting_producer', intent, entryPoint: intent, answers: {}, contactPhone: '+14085550199' };
    assert.equal(actionableSmsAlertType({ beforeState: `${intent}_coverage_requested`, conversation, routed: {} }), 'direct_handling_required');
    const email = buildSmsProducerAlertEmail(conversation, { type: 'direct_handling_required' }, { origin: 'https://review.408farmers.com' });
    assert.match(email.text, new RegExp(`${intent[0].toUpperCase()}${intent.slice(1)} review`));
    assert.doesNotMatch(email.text + email.html, /4085550199|HOME:|AUTO:|LIFE:|BUSINESS:/);
  }
});

test('STOP and existing producer ownership remain authoritative', () => {
  for (const message of Object.values(SMS_LINK_ENTRY_MESSAGES)) {
    const stopped = routeSmsInbound({ state: 'auto_vehicle_count_requested', intent: 'auto' }, 'STOP', { mode: 'live' });
    assert.equal(stopped.state, 'opted_out');
    const optedOut = resolveSmsInboundRoute({ state: 'opted_out', smsConsent: { status: 'opted_out' } }, message, { occurredAt: at });
    assert.equal(optedOut.route, 'suppressed');
    const producerOwned = resolveSmsInboundRoute({ state: 'human_takeover', orchestration: { ownership: { owner: 'producer' }, automationMode: 'human_only' } }, message, { occurredAt: at });
    assert.equal(producerOwned.route, 'producer');
  }
});

test('producer can explicitly restart each new bounded workflow', () => {
  const expected = {
    coveragefit_auto_intake: ['auto_vehicle_count_requested', 'auto'],
    coveragefit_life_intake: ['life_protection_goal_requested', 'life'],
    coveragefit_business_intake: ['business_industry_requested', 'business']
  };
  for (const [workflow, [state, intent]] of Object.entries(expected)) {
    const started = startSmsWorkflowEpisode({ id: 'sms-live-' + 'b'.repeat(32), state: 'completed' }, workflow, { occurredAt: at });
    assert.equal(started.legacyState, state);
    assert.equal(started.intent, intent);
    assert.equal(started.orchestration.ownership.owner, 'coveragefit');
    assert.equal(started.orchestration.automationMode, 'automated');
  }
});

test('simulator idempotency prevents duplicate logical processing', () => {
  const conversation = createSimulatorConversation({ conversationId: 'sms-sim-entry-dedupe', now: new Date(at) });
  const first = processSimulatorInbound(conversation, { body: SMS_LINK_ENTRY_MESSAGES.auto, messageId: 'sim-msg-entry-duplicate' }, { now: new Date(at) });
  const duplicate = processSimulatorInbound(first.conversation, { body: SMS_LINK_ENTRY_MESSAGES.auto, messageId: 'sim-msg-entry-duplicate' }, { now: new Date(at) });
  assert.equal(duplicate.deduped, true);
  assert.equal(duplicate.conversation.transcript.length, first.conversation.transcript.length);
});

test('live RingCentral webhook processes and deduplicates an AUTO link journey', async () => {
  class Store {
    constructor() { this.records = new Map(); }
    async get(key) { return structuredClone(this.records.get(key) || null); }
    async setJSON(key, value, options = {}) {
      if (options.onlyIfNew && this.records.has(key)) throw new Error('exists');
      this.records.set(key, structuredClone(value));
    }
    async delete(key) { this.records.delete(key); }
    async list({ prefix = '' } = {}) { return { blobs: [...this.records.keys()].filter(key => key.startsWith(prefix)).map(key => ({ key })) }; }
  }
  const store = new Store();
  const sent = [];
  const env = {
    RINGCENTRAL_CLIENT_ID: 'test-client',
    RINGCENTRAL_CLIENT_SECRET: 'test-secret',
    RINGCENTRAL_JWT_TOKEN: 'test-jwt',
    RINGCENTRAL_FROM_NUMBER: '+14083276377',
    RINGCENTRAL_WEBHOOK_URL: 'https://review.408farmers.com/api/sms/ringcentral/webhook',
    RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN: 'validation-secret',
    RINGCENTRAL_CONVERSATION_HASH_SECRET: 'entry-point-test-secret-32-bytes',
    RCSMS_PRODUCER_ALERTS_ENABLED: 'false'
  };
  const fetchImpl = async (url, init = {}) => {
    if (String(url).endsWith('/restapi/oauth/token')) return Response.json({ access_token: 'test-access-token', expires_in: 3600 });
    if (String(url).endsWith('/sms')) {
      sent.push(JSON.parse(init.body));
      return Response.json({ id: `provider-${sent.length}` });
    }
    throw new Error(`Unexpected request: ${url}`);
  };
  let messageNumber = 0;
  const inbound = async body => {
    messageNumber += 1;
    const payload = {
      body: {
        type: 'SMS',
        direction: 'Inbound',
        id: `entry-live-${messageNumber}`,
        from: { phoneNumber: '+14085550101' },
        to: [{ phoneNumber: '+14083276377', target: true }],
        subject: body,
        creationTime: `2026-08-27T12:0${messageNumber}:00.000Z`
      }
    };
    return handleRingCentralWebhook(new Request(env.RINGCENTRAL_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Validation-Token': env.RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN },
      body: JSON.stringify(payload)
    }), { env, store, fetchImpl, now: new Date(at) });
  };

  let response = await inbound(SMS_LINK_ENTRY_MESSAGES.auto);
  assert.equal(response.status, 200);
  let result = await response.json();
  assert.equal(result.replied, true);
  assert.equal(result.state, 'auto_vehicle_count_requested');
  assert.equal(result.intent, 'auto');
  assert.equal(sent.length, 1);

  const duplicatePayload = {
    body: {
      type: 'SMS', direction: 'Inbound', id: 'entry-live-1',
      from: { phoneNumber: '+14085550101' },
      to: [{ phoneNumber: '+14083276377', target: true }],
      subject: SMS_LINK_ENTRY_MESSAGES.auto,
      creationTime: '2026-08-27T12:01:00.000Z'
    }
  };
  response = await handleRingCentralWebhook(new Request(env.RINGCENTRAL_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Validation-Token': env.RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN },
    body: JSON.stringify(duplicatePayload)
  }), { env, store, fetchImpl, now: new Date(at) });
  assert.equal((await response.json()).deduped, true);
  assert.equal(sent.length, 1);

  for (const answer of ['2', '2', '1']) response = await inbound(answer);
  result = await response.json();
  assert.equal(result.state, 'awaiting_producer');
  assert.equal(result.routedTo, 'producer');
  assert.equal(sent.length, 4);

  const conversationId = await smsLiveConversationId('+14085550101', '+14083276377', env.RINGCENTRAL_CONVERSATION_HASH_SECRET);
  const conversation = await store.get(`sms-live-conversations/${conversationId}`);
  assert.equal(conversation.entryPoint, 'auto');
  assert.equal(conversation.answers.vehicleCount, '2');
  assert.equal(conversation.answers.driverCount, '2');
  assert.equal(conversation.answers.autoReviewReason, 'renewal_or_price');
  assert.equal(conversation.producerAlert.type, 'direct_handling_required');
  assert.equal(conversation.smsConsent.status, 'active');
  assert.equal(Object.prototype.hasOwnProperty.call(conversation.smsConsent, 'callConsent'), false);
});
