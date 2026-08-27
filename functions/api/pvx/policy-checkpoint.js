import { withD1RateLimit } from '../../../server/api-rate-limit.mjs';
import { createPVXRecordStore, createSmsConversationStore } from '../../../server/d1-json-store.mjs';
import { handlePVXPolicyCheckpoint } from '../../../server/pvx-policy-checkpoint-core.mjs';
import { advancePvxSmsJourney, loadPvxSmsJourneyFromRequest } from '../../../server/pvx-sms-journey-core.mjs';

export const onRequest = context => withD1RateLimit(context, { route: 'pvx-policy-checkpoint', limit: 20, windowSeconds: 60 }, async () => {
  const db = context.env?.COVERAGEFIT_DB;
  const store = db ? createPVXRecordStore(db) : null;
  const operationsStore = db ? createSmsConversationStore(db) : null;
  const response = await handlePVXPolicyCheckpoint(context.request, { store });
  if (response.status === 201) {
    const loaded = await loadPvxSmsJourneyFromRequest(context.request, { store });
    if (loaded) await advancePvxSmsJourney(loaded, { store, operationsStore, stage: 'coverage_review_ready', currentStage: 'current-policy', currentStep: 'complete', completedStage: 'coverage_review_ready' });
  }
  return response;
});
