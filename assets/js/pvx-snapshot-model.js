(function(root, factory) {
  'use strict';
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CoverageFitPVXSnapshotModel = api;
})(typeof window !== 'undefined' ? window : globalThis, function(root) {
  'use strict';
  const VERSION = '1.1.0', BUILD = 'CF-PVX-1.6', READINESS_BUILD = 'CF-PVX-READY-1.1';
  const CONTRACT_ID = 'coveragefit-discovery-only-snapshot-v1', MAX_HOME_CHIPS = 3, MAX_TOPICS = 3;
  const LABELS = Object.freeze({
    shoppingReason:{renewal_increase:'Your renewal price changed',buying_home:'You are buying a home',service_change:'You want a different service experience',life_change:'Something changed in your life',comparison:'You are comparing options',something_else:'You have another reason for reviewing'},
    improvementPriorities:{understanding:'Understand what you have',claim_support:'Feel supported in a claim',agent_access:'Reach your agent more easily',coordination:'Coordinate your insurance',price_only:'Keep price central',not_sure:'Still deciding what to improve'},
    ownershipDuration:{buying_now:'Buying the home now',under_1:'Owned less than a year','1_4':'Owned 1–4 years','5_9':'Owned 5–9 years','10_plus':'Owned 10+ years'},
    stayIntent:{long_term:'Planning to stay long term',few_years:'Likely staying a few years',may_move:'May move soon'},
    upgradeSummary:{yes_major:'Meaningful improvements made',some:'Some improvements made',none:'No significant updates'},
    otherProperties:{rental:'Also owns a rental',second_home:'Also owns a second home',multiple:'Owns multiple other properties'},
    claimExperience:{yes_smooth:'Prior claim went smoothly',yes_difficult:'Prior claim was difficult',yes_neutral:'Prior claim experience'}
  });
  const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
  const fact = (key,value,label) => ({key,value,label,evidenceRef:{source:'pvx_discovery',key,value,status:'customer-reported'}});
  const labelFor = (group,value) => LABELS[group]?.[value] || '';
  function derive(discovery={}, topics=[]) {
    const answers=discovery.answers||{}, words=discovery.exactCustomerWords||{};
    const whyLabel=words.shoppingReason||labelFor('shoppingReason',answers.shoppingReason);
    const priorityValues=Array.isArray(answers.improvementPriorities)?answers.improvementPriorities:[];
    const improvements=priorityValues.map(value=>({value,label:labelFor('improvementPriorities',value)})).filter(item=>item.label);
    const candidates=[['ownershipDuration',answers.ownershipDuration],['stayIntent',answers.stayIntent],['upgradeSummary',answers.upgradeSummary],['otherProperties',answers.otherProperties],['claimExperience',answers.claimExperience]]
      .map(([key,value])=>{const label=labelFor(key,value);return label?fact(key,value,label):null;}).filter(Boolean).filter(item=>!['prefer_not','not_sure'].includes(item.value));
    const seen=new Set();
    const safeTopics=(Array.isArray(topics)?topics:[]).filter(topic=>topic?.status==='worth_reviewing'&&topic?.evidenceRefs?.length&&topic.recommendation===false)
      .filter(topic=>{const key=String(topic.topicKey||'');if(!key||seen.has(key))return false;seen.add(key);return true;})
      .slice(0,MAX_TOPICS).map((topic,index)=>({...clone(topic),scanOrder:index+1,scanLabel:String(index+1).padStart(2,'0')}));
    const topicCount=safeTopics.length, whyNowThread=root.CoverageFitPVXWhyNow?.derive?.(discovery)||null, triggerNarrative=root.CoverageFitPVXTriggerNarrative?.derive?.(whyNowThread,safeTopics[0]||null)||null;
    return {schemaVersion:'1.0',contractId:CONTRACT_ID,reportRevision:'1',title:'Your CoverageFit Snapshot',generatedAt:new Date().toISOString(),anonymousPreview:true,
      whyReviewing:whyLabel?fact('shoppingReason',answers.shoppingReason,whyLabel):null,whyNowThread,triggerNarrative,
      wantsToImprove:improvements.map(item=>fact('improvementPriorities',item.value,item.label)),homeContext:candidates.slice(0,MAX_HOME_CHIPS),whatSeemsImportant:improvements.map(item=>item.label).slice(0,3),whatDylanWouldLookAtFirst:safeTopics,
      signalSurface:{topicCount,countLabel:topicCount===0?'No forced areas to review':`${topicCount} ${topicCount===1?'area':'areas'} worth reviewing`,primaryTopic:safeTopics[0]||null,numberingMeaning:'scan_order_only'},
      policyFindings:[],recommendations:[],contactRequiredToView:false,guardrails:{discoveryOnly:true,currentPolicyEvaluated:false,policyDeficiencyFound:false,protectionScoreCreated:false,eligibilityDetermined:false,severityRanking:false,fakeActivity:false}};
  }
  function traceable(model){const facts=[model.whyReviewing,...(model.wantsToImprove||[]),...(model.homeContext||[])].filter(Boolean);const threadSafe=!model.whyNowThread||model.whyNowThread.evidenceRefs?.every(ref=>ref.status==='customer-reported');return threadSafe&&facts.every(item=>item.evidenceRef?.key&&item.evidenceRef?.status==='customer-reported')&&(model.whatDylanWouldLookAtFirst||[]).every(topic=>topic.evidenceRefs?.length);}
  return Object.freeze({VERSION,BUILD,READINESS_BUILD,CONTRACT_ID,MAX_HOME_CHIPS,MAX_TOPICS,LABELS,labelFor,derive,traceable});
});
