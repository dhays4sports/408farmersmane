/* TECH-PVX-1.0 — CoverageFit renter continuity and context persistence */
(function(){
  'use strict';
  var CONTRACT=window.CoverageFitTechPVXContract;
  if(!CONTRACT)return;
  var params=CONTRACT.readParams(location.href);
  var isTech=params.professional_program==='technology'||params.campaign_id==='occupation_tech_meta_v1'||/(^|_)tech($|_)/i.test(params.utm_campaign||'');
  if(!isTech)return;

  function persist(){
    try{
      var prior={};
      try{prior=JSON.parse(sessionStorage.getItem('coveragefit_entry_context')||'{}')||{};}catch(e){}
      var merged=Object.assign({},prior,params,{captured_at:new Date().toISOString(),source:'TECH-PVX-1.0'});
      sessionStorage.setItem('coveragefit_entry_context',JSON.stringify(merged));
      if(params.professional_role)sessionStorage.setItem('professional_role',params.professional_role);
    }catch(e){}
  }

  function addHiddenFields(){
    document.querySelectorAll('form').forEach(function(form){
      Object.keys(params).forEach(function(key){
        var field=form.querySelector('[name="'+key+'"]');
        if(!field){field=document.createElement('input');field.type='hidden';field.name=key;form.appendChild(field);}
        field.value=params[key];
      });
    });
  }

  function contactUrl(summary){
    var base='https://408farmers.com/contact/';
    var url=CONTRACT.buildContinuationUrl(base,location.href,Object.assign({intent:'tech_renter_review'},summary||{}));
    return url.href;
  }

  function textUrl(summary){
    var role=params.professional_role_label||CONTRACT.roleLabel(params.professional_role)||'technology professional';
    var focus=(summary&&summary.review_focus_label)||'auto and renters coverage';
    var body='Hi Dylan — I came through the tech professional review. I work in '+role+' and would like help checking '+focus+'.';
    return 'sms:+14083276377?&body='+encodeURIComponent(body);
  }

  function hideExisting(){
    var main=document.querySelector('main')||document.body;
    Array.prototype.forEach.call(main.children,function(child){
      if(!child.hasAttribute('data-tech-renter-root')){child.hidden=true;child.setAttribute('data-tech-renter-hidden','true');}
    });
    return main;
  }

  function renderRenter(){
    if(params.occupancy!=='renter'&&params.review_track!=='renter_snapshot')return false;
    if(document.querySelector('[data-tech-renter-root]'))return true;
    var main=hideExisting();
    var root=document.createElement('section');
    root.className='tech-renter-shell';root.setAttribute('data-tech-renter-root','1.0');
    main.appendChild(root);
    var state={step:0,answers:{}};
    var questions=[
      {key:'review_focus',title:'What would you like to review?',options:[['auto_renters','Auto + renters together'],['auto','Auto coverage'],['renters','Renters coverage'],['unsure','Not sure — help me check both']]},
      {key:'current_setup',title:'What do you currently carry?',options:[['both','Auto and renters insurance'],['auto_only','Auto only'],['renters_only','Renters only'],['neither_unsure','Neither or I’m not sure']]},
      {key:'priority',title:'What would make this useful?',options:[['coverage_fit','Check whether my coverage fits'],['bundle','Explore a home/renters + auto bundle'],['professional_program','Check my professional context'],['move_change','I’m moving or something recently changed']]}
    ];
    var labels={
      auto_renters:'auto and renters coverage',auto:'auto coverage',renters:'renters coverage',unsure:'auto and renters coverage',
      both:'auto and renters insurance',auto_only:'auto insurance only',renters_only:'renters insurance only',neither_unsure:'no confirmed current setup',
      coverage_fit:'coverage fit',bundle:'bundle opportunities',professional_program:'professional-program verification',move_change:'a recent move or change'
    };

    function saveSummary(summary){
      try{sessionStorage.setItem('tech_renter_snapshot',JSON.stringify(summary));}catch(e){}
    }

    function snapshot(){
      var role=params.professional_role_label||CONTRACT.roleLabel(params.professional_role)||'Technology professional';
      var focus=labels[state.answers.review_focus]||'auto and renters coverage';
      var setup=labels[state.answers.current_setup]||'current coverage';
      var priority=labels[state.answers.priority]||'coverage fit';
      var opportunities=[];
      if(state.answers.review_focus==='auto_renters'||state.answers.review_focus==='unsure'||state.answers.priority==='bundle')opportunities.push('Review whether keeping auto and renters together is worth comparing.');
      if(state.answers.current_setup==='auto_only')opportunities.push('Check whether your belongings, liability, and loss-of-use needs are currently addressed.');
      if(state.answers.current_setup==='renters_only')opportunities.push('Review transportation and liability needs before deciding whether an auto comparison belongs in the conversation.');
      if(state.answers.priority==='professional_program')opportunities.push('Have Dylan verify whether your customer-supplied professional background fits an available program and what documentation is required.');
      if(state.answers.priority==='move_change')opportunities.push('Update limits and addresses around the change before comparing options.');
      if(!opportunities.length)opportunities.push('Compare your stated priorities against the coverage you already carry before deciding whether a quote is worthwhile.');
      var summary={
        review_focus:state.answers.review_focus,review_focus_label:focus,
        current_setup:state.answers.current_setup,current_setup_label:setup,
        priority:state.answers.priority,priority_label:priority,
        professional_role:params.professional_role||'',professional_role_label:role,
        snapshot_version:'TECH-PVX-1.0'
      };
      saveSummary(summary);
      root.innerHTML='<div class="tech-renter-card"><p class="tech-renter-eyebrow">Your renter CoverageFit Snapshot</p><h1>Here’s what may be worth reviewing.</h1><p class="tech-renter-lede">You received this useful checkpoint before any contact request. It is not a quote, underwriting decision, or confirmation of professional-discount eligibility.</p><div class="tech-renter-summary"><div class="tech-renter-summary-item"><strong>Your selected context</strong>'+escapeHtml(role)+' · '+escapeHtml(focus)+'</div><div class="tech-renter-summary-item"><strong>Current setup to compare</strong>'+escapeHtml(setup)+'</div><div class="tech-renter-summary-item"><strong>Your stated priority</strong>'+escapeHtml(priority)+'</div><div class="tech-renter-summary-item"><strong>Recommended next check</strong>'+opportunities.map(escapeHtml).join(' ')+'</div></div><div class="tech-renter-actions"><a class="tech-renter-button" href="'+escapeAttr(contactUrl(summary))+'">Have Dylan review this</a><a class="tech-renter-button secondary" href="'+escapeAttr(textUrl(summary))+'">Text Dylan instead</a><button class="tech-renter-button secondary" type="button" data-tech-renter-restart>Change my answers</button></div><p class="tech-renter-note">Professional context is based only on what you selected. A licensed producer must verify program availability, documentation, eligibility, discounts, coverage, and pricing.</p></div>';
      root.querySelector('[data-tech-renter-restart]').addEventListener('click',function(){state={step:0,answers:{}};render();});
    }

    function escapeHtml(value){var d=document.createElement('div');d.textContent=String(value||'');return d.innerHTML;}
    function escapeAttr(value){return escapeHtml(value).replace(/"/g,'&quot;');}

    function render(){
      if(state.step>=questions.length){snapshot();return;}
      var q=questions[state.step];
      var role=params.professional_role_label||CONTRACT.roleLabel(params.professional_role)||'your technology role';
      root.innerHTML='<div class="tech-renter-card"><p class="tech-renter-eyebrow">CoverageFit · renter continuity</p><h1>Your tech context stays with you.</h1><p class="tech-renter-lede">Start with a quick auto + renters review for '+escapeHtml(role)+'. You’ll see a personalized checkpoint before we ask you to contact anyone.</p><p class="tech-renter-progress">Question '+(state.step+1)+' of '+questions.length+'</p><h2>'+escapeHtml(q.title)+'</h2><div class="tech-renter-options" role="group" aria-label="'+escapeAttr(q.title)+'">'+q.options.map(function(o){return '<button class="tech-renter-option" type="button" data-value="'+escapeAttr(o[0])+'" aria-pressed="'+(state.answers[q.key]===o[0]?'true':'false')+'">'+escapeHtml(o[1])+'</button>';}).join('')+'</div><p class="tech-renter-live" role="status" aria-live="polite"></p><div class="tech-renter-actions"><button class="tech-renter-button secondary" type="button" data-back '+(state.step===0?'disabled':'')+'>Back</button><button class="tech-renter-button" type="button" data-next '+(state.answers[q.key]?'':'disabled')+'>Continue</button></div><p class="tech-renter-note">No contact information is required to see this Snapshot. Your selections are context only and do not determine eligibility or pricing.</p></div>';
      root.querySelectorAll('[data-value]').forEach(function(button){button.addEventListener('click',function(){state.answers[q.key]=button.getAttribute('data-value');render();});});
      root.querySelector('[data-next]').addEventListener('click',function(){if(!state.answers[q.key])return;state.step++;render();});
      root.querySelector('[data-back]').addEventListener('click',function(){if(state.step>0){state.step--;render();}});
    }
    render();return true;
  }

  persist();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){addHiddenFields();renderRenter();});else{addHiddenFields();renderRenter();}
  var observer=new MutationObserver(function(){addHiddenFields();});
  observer.observe(document.documentElement,{subtree:true,childList:true});
})();
