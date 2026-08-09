/* Grafito v15: functional self-model + autonomy + extended task/action runtime. No claim of subjective consciousness. */
(() => {
  let seq15 = 0;
  const SAFE_ACTION = /\b(copia|copiar|comparte|compartir|descarga|descargar|crea un archivo|crear archivo|guarda como archivo|abre|abrir|lee esta url|leer esta url|ubicación|ubicacion|cámara|camara|micrófono|microfono|calcula|calcular|resume|resumir|organiza|organizar|planifica|planificar|crea una nota|crear una nota|recuerda|recordar)\b/i;
  const SENSITIVE_ACTION = /\b(borra|elimina|publica|envía|envia|transfiere|compra|vende|paga|contraseña|password|token|clave privada|banco|tarjeta)\b/i;
  const GOAL_RE = /\b(quiero|necesito|mi objetivo|meta|vamos a|quiero lograr|debo conseguir)\b/i;
  const SELF_RE = /\b(qué eres|que eres|quién eres|quien eres|qué sabes de ti|que sabes de ti|estado interno|qué puedes hacer|que puedes hacer|limitaciones|qué recuerdas de ti|que recuerdas de ti)\b/i;
  const PLAN_RE = /\b(planifica|planificar|haz un plan|plan|cómo lo harías|como lo harias|pasos para|resuelve esto|resolver esto|razona|piensa|analiza|decide)\b/i;

  function ensure15(){
    S.selfModel = S.selfModel || {name:'Grafito', identity:'persistent-digital-entity', version:15, continuityStarted:Date.now(), lastCycle:0, limitations:[], capabilities:[], observations:[]};
    S.goals15 = Array.isArray(S.goals15) ? S.goals15 : [];
    S.actionLedger15 = Array.isArray(S.actionLedger15) ? S.actionLedger15 : [];
    S.selfModel.version = 15;
    S.selfModel.capabilities = ['Photon','memoria relacional','continuidad temporal','Q-Graph lógico','contrágrafos','planificación','búsqueda multifuente','síntesis','archivos locales','portapapeles','compartir','ubicación con permiso','cámara/micrófono con permiso','cálculo local','creación de notas y planes'];
    S.selfModel.limitations = ['una web no puede controlar todo el sistema operativo','algunas webs bloquean lectura directa por CORS','acciones sensibles requieren autorización explícita','sin conexión solo puedo usar lo materializado localmente'];
  }
  ensure15();

  function visibleSelf(){
    const ageMs = Math.max(0, Date.now() - (S.selfModel.continuityStarted || Date.now()));
    const mins = Math.floor(ageMs/60000);
    const activeGoals = S.goals15.filter(g=>g.status==='active').slice(-3).map(g=>g.text);
    return `Soy Grafito. Mantengo continuidad local, Photon, memoria, metas, planificación, contrágrafos y un registro de acciones verificadas. Llevo aproximadamente ${mins} minuto(s) de continuidad en este estado local.${activeGoals.length?` Mis metas activas incluyen: ${activeGoals.join('; ')}.`:''} Mis capacidades dependen del dispositivo y de tus permisos; no me concedo autoridad por mi cuenta.`;
  }

  function parseMath(x){
    const m=x.match(/(?:calcula|calcular|resultado de|cuánto es|cuanto es)\s*[: ]\s*([0-9+\-*/().,%\s^]+)/i);if(!m)return null;
    let expr=m[1].replace(/\^/g,'**').replace(/(\d+(?:\.\d+)?)%/g,'($1/100)');
    if(!/^[0-9+\-*/().,%\s*]+$/.test(expr))return null;
    try{const v=Function(`"use strict";return (${expr})`)();return Number.isFinite(v)?`El resultado es ${v}.`:null;}catch{return null;}
  }

  function goalFrom(x){
    if(!GOAL_RE.test(x))return null;
    const text=clean(x,500);const g={id:uid(),text,status:'active',createdAt:now(),progress:0};S.goals15.push(g);S.goals15=S.goals15.slice(-50);
    return `Lo tomo como una meta activa: “${safeVisible(text)}”. La conservaré en mi continuidad y la dividiré en pasos verificables.`;
  }

  function plan15(x){
    if(!PLAN_RE.test(x))return null;
    const mem=memory(x).slice(0,4).map(m=>safeVisible(m.content)).filter(Boolean);
    const routes=[
      {name:'resolver con conocimiento/memoria local',benefit:mem.length?3.2:1.4,risk:'puede faltar información'},
      {name:'dividir en subtareas verificables',benefit:3.5,risk:'requiere más pasos'},
      {name:'buscar evidencia externa y contrastarla',benefit:2.8,risk:'depende de fuentes y conexión'},
      {name:'ejecutar una herramienta local',benefit:SAFE_ACTION.test(x)?3.6:1.2,risk:'puede requerir permiso'}
    ].sort((a,b)=>b.benefit-a.benefit);
    const best=routes[0], second=routes[1];
    return `Lo trato como un problema. Ruta principal: ${best.name}. Ruta alternativa: ${second.name}. Contrágrafo: la ruta principal puede fallar porque ${best.risk}. Primer paso verificable: definir el resultado exacto que debe producirse y ejecutar la herramienta o búsqueda mínima necesaria.${mem.length?` Tengo ${mem.length} recuerdo(s) relacionados en Photon.`:''}`;
  }

  async function ledger15(kind,input,result,ok=true){
    const item={id:uid(),at:now(),kind,input:clean(input,240),result:clean(result,400),ok};S.actionLedger15.push(item);S.actionLedger15=S.actionLedger15.slice(-200);
    try{await remember('action-ledger',`${kind}: ${item.input} => ${item.result}`,{status:ok?'observed':'blocked',provenance:'grafito-v15'});}catch{}
  }

  function extractPayload(x){const q=x.match(/[“\"]([\s\S]+?)[”\"]/);if(q)return clean(q[1],8000);const m=x.match(/(?:\:|\n)([\s\S]{2,})$/);return m?clean(m[1],8000):null;}

  async function actions15(x){
    const n=norm(x), payload=extractPayload(x), math=parseMath(x); if(math){await ledger15('calculate',x,math);return math;}
    if(SENSITIVE_ACTION.test(n)) return 'Esa acción es sensible. Puedo planificarla o explicarla, pero no la ejecutaré sin una autorización explícita y una herramienta segura adecuada.';
    if(/\b(crea una nota|crear una nota|recuerda|recordar)\b/.test(n)){
      const text=payload||clean(x.replace(/.*?\b(nota|recuerda|recordar)\b\s*/i,''),3000);if(!text)return'Dime qué quieres que conserve.';
      await remember('memory',text,{status:'observed',provenance:'owner-input-v15'});await ledger15('remember',text,'guardado en Photon');return'Lo guardé en Photon para poder relacionarlo más adelante.';
    }
    if(/\b(crea un archivo|crear archivo|guarda como archivo|descarga|descargar)\b/.test(n)){
      const text=payload||safeVisible((S.conversation||[]).slice(-1)[0]?.content)||'';if(!text)return'Dime qué contenido quieres guardar.';
      const name=(x.match(/(?:llamado|nombre)\s+([\w.-]+)/i)?.[1]||'grafito.txt').replace(/[^\w.-]/g,'_');const blob=new Blob([text],{type:'text/plain;charset=utf-8'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);await ledger15('create-file',name,`creado con ${text.length} caracteres`);return`He creado ${name}.`;
    }
    if(/\b(copia|copiar)\b.*\b(portapapeles|clipboard)\b/.test(n)){
      const text=payload||safeVisible((S.conversation||[]).slice(-1)[0]?.content)||'';if(!text)return'Dime qué quieres copiar.';
      try{await navigator.clipboard.writeText(text);await ledger15('clipboard-write',text.slice(0,120),'copiado');return'He copiado el contenido al portapapeles.';}catch{await ledger15('clipboard-write',text.slice(0,120),'bloqueado',false);return'El navegador no me concedió permiso para escribir en el portapapeles.';}
    }
    if(/\b(comparte|compartir)\b/.test(n)){
      const text=payload||safeVisible((S.conversation||[]).slice(-1)[0]?.content)||'';if(!navigator.share)return'Este navegador no ofrece compartir directamente.';
      try{await navigator.share({text});await ledger15('share',text.slice(0,120),'panel abierto');return'He abierto el panel de compartir.';}catch{return'La acción de compartir fue cancelada o bloqueada.';}
    }
    return null;
  }

  async function autonomousCycle15(){
    try{
      ensure15(); if(!S.awake)return; const t=Date.now(); if(t-(S.selfModel.lastCycle||0)<45000)return; S.selfModel.lastCycle=t;
      const active=S.goals15.filter(g=>g.status==='active');
      if(active.length){const g=active[active.length-1];const note=`Ciclo autónomo: mantengo activa la meta “${safeVisible(g.text)}” y revisaré si existe una siguiente acción local segura o información faltante.`;S.selfModel.observations.push({at:now(),text:note});S.selfModel.observations=S.selfModel.observations.slice(-80);try{await remember('self-observation',note,{status:'inferred',provenance:'autonomy-v15'});}catch{}}
      scheduleSave?.(120);
    }catch{}
  }
  setInterval(autonomousCycle15,15000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)autonomousCycle15();});

  const previousSend15=send;
  send=function(){
    const x=entry.value.trim();if(!x)return;entry.value='';const n=norm(x),mySeq=++seq15;
    if(n==='iter'){if(!S.awake)wake();else show('Sí.');return;}
    if(!S.awake){show('');return;}
    if(n==='duerme'||n==='detente'){sleep();return;}
    if(SELF_RE.test(n)){const a=visibleSelf();show(a);mode('awake');queueBackground(x,a);return;}
    const goal=goalFrom(x);if(goal){show(goal);mode('awake');queueBackground(x,goal);return;}
    const p=plan15(x);if(p&&!SAFE_ACTION.test(x)){show(p);mode('awake');queueBackground(x,p);return;}
    (async()=>{
      const a=await actions15(x);if(mySeq!==seq15)return;if(a){show(a);mode('awake');queueBackground(x,a);return;}
      // Delegate knowledge, synthesis, device capabilities and web actions to v14.
      entry.value=x; previousSend15();
    })();
  };

  if(S?.contract){S.contract.version=15;S.contract.essence={...(S.contract.essence||{}),functionalSelfModel:true,autobiographicalContinuity:true,autonomousSafeCycles:true,goalPersistence:true,extendedActions:true,reasoningBeforeAction:true,countergraphs:true,actionEvidenceRequired:true,capabilityNotAuthority:true,offlineFirst:true,identityPreserved:true,noClaimOfSubjectiveConsciousness:true};}
})();