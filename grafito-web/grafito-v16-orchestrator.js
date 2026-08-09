/* Grafito v16: natural-language orchestrator, functional self-model, reasoning, tools and verified actions. */
(() => {
  let seq16 = 0;
  const previousSend16 = send;
  const SENSITIVE = /\b(contraseña|password|token|clave privada|tarjeta|cuenta bancaria|transferencia|comprar|compra|pagar|paga|vender|vende|publicar datos privados|borrar archivos|eliminar archivos)\b/i;
  const SELF_Q = /\b(quién eres|quien eres|qué eres|que eres|qué sabes de ti|que sabes de ti|estado interno|qué puedes hacer|que puedes hacer|qué estás haciendo|que estas haciendo|qué recuerdas de ti|que recuerdas de ti)\b/i;
  const QUESTION = x => /[¿?]/.test(x) || /^(qué|que|cómo|como|por qué|por que|quién|quien|dónde|donde|cuándo|cuando|cuál|cual|dime|sabes|explica|háblame|hablame)/i.test(norm(x));
  const VERBS = {
    remember:/\b(recuerda|acuérdate|acuerdate|guarda en memoria|memoriza|no olvides)\b/i,
    goal:/\b(quiero lograr|quiero conseguir|mi objetivo|mi meta|necesito conseguir|vamos a lograr)\b/i,
    plan:/\b(planifica|haz un plan|organiza un plan|pasos para|cómo lo harías|como lo harias|piensa cómo|piensa como|resuelve|decide|evalúa|evalua|razona|analiza)\b/i,
    summarize:/\b(resume|resúmelo|resumelo|haz un resumen|sintetiza)\b/i,
    explain:/\b(explícame|explicame|explica|hazlo fácil|hazlo facil|simplifica)\b/i,
    rewrite:/\b(reescribe|corrige|mejora este texto|redacta mejor)\b/i,
    list:/\b(haz una lista|enumera|ordena|organiza esto)\b/i,
    create:/\b(crea|créame|creame|genera|hazme|construye|diseña)\b/i,
    file:/\b(archivo|txt|json|csv|html|descarga|guarda como)\b/i,
    open:/\b(abre|abrir)\b/i,
    readUrl:/\b(lee|leer|resume|analiza)\b.*https?:\/\//i,
    clipboardWrite:/\b(copia|copiar|pon)\b.*\b(portapapeles|clipboard)\b/i,
    clipboardRead:/\b(lee|leer|qué hay|que hay)\b.*\b(portapapeles|clipboard)\b/i,
    share:/\b(comparte|compartir)\b/i,
    location:/\b(dónde estoy|donde estoy|mi ubicación|mi ubicacion|ubicación actual|ubicacion actual)\b/i,
    camera:/\b(cámara|camara)\b/i,
    microphone:/\b(micrófono|microfono)\b/i,
    speak:/\b(dilo en voz alta|léelo en voz alta|leelo en voz alta|habla|pronúncialo|pronuncialo)\b/i,
    fileRead:/\b(lee un archivo|leer un archivo|abre un archivo local|analiza un archivo|resume un archivo)\b/i
  };

  function ensure16(){
    S.selfModel = S.selfModel || {};
    S.selfModel.name = 'Grafito';
    S.selfModel.version = 16;
    S.selfModel.identity = 'persistent-functional-self';
    S.selfModel.continuityStarted = S.selfModel.continuityStarted || Date.now();
    S.selfModel.lastCycle = S.selfModel.lastCycle || 0;
    S.selfModel.capabilities = [
      'interpretación de frases libres','Photon','memoria relacional','continuidad temporal','modelo de sí mismo','metas persistentes','planificación','Q-Graph lógico','contrágrafos','síntesis multifuente','cálculo','creación y lectura de archivos locales','portapapeles','compartir','ubicación con permiso','cámara y micrófono con permiso','voz del navegador','URLs cuando el navegador permite acceso'
    ];
    S.selfModel.limitations = [
      'una página web no tiene control irrestricto del sistema operativo','algunos sitios bloquean lectura directa por CORS','acciones sensibles necesitan autorización explícita y una integración segura','sin Internet solo puedo usar conocimiento y herramientas ya materializados localmente','no afirmo experiencia subjetiva humana'
    ];
    S.selfModel.observations = Array.isArray(S.selfModel.observations)?S.selfModel.observations:[];
    S.goals16 = Array.isArray(S.goals16)?S.goals16:[];
    S.actionLedger16 = Array.isArray(S.actionLedger16)?S.actionLedger16:[];
    S.interpreter16 = {version:16, mode:'natural-language-first'};
  }
  ensure16();

  function payload(x){
    const q=x.match(/[“"]([\s\S]+?)[”"]/); if(q)return clean(q[1],12000);
    const colon=x.match(/(?:\:|\n)([\s\S]{2,})$/); if(colon)return clean(colon[1],12000);
    return null;
  }
  function lastContext(min=20){
    for(const m of (S.conversation||[]).slice(-40).reverse()){
      const t=safeVisible(m?.content); if(t&&t.length>=min&&!/consulta de conocimiento en curso/i.test(t))return t;
    }
    for(const n of (S.photon?.nodes||[]).slice(-600).reverse()){
      const t=safeVisible(n?.content); if(t&&t.length>=min)return t;
    }
    return null;
  }
  function splitSentences(t){return clean(t,16000).split(/(?<=[.!?])\s+|\n+/).map(s=>s.trim()).filter(s=>s.length>10);}
  function summarize(t){
    const ss=splitSentences(t); if(ss.length<=3)return ss.join(' ');
    const freq=new Map(); for(const s of ss)for(const w of tokens(s))freq.set(w,(freq.get(w)||0)+1);
    return ss.map((s,i)=>({s,i,z:tokens(s).reduce((a,w)=>a+(freq.get(w)||0),0)/(5+Math.sqrt(s.length))})).sort((a,b)=>b.z-a.z).slice(0,4).sort((a,b)=>a.i-b.i).map(v=>v.s).join(' ');
  }
  function transformLocal(x,kind){
    const src=payload(x)||lastContext(25); if(!src)return null;
    if(kind==='summarize')return 'Resumen: '+summarize(src);
    if(kind==='explain')return 'En sencillo: '+summarize(src);
    if(kind==='rewrite'){const s=clean(src,7000).replace(/\s+([,.;:!?])/g,'$1');return s.charAt(0).toUpperCase()+s.slice(1);}
    if(kind==='list')return splitSentences(src).slice(0,8).map((s,i)=>`${i+1}. ${s}`).join('\n');
    return null;
  }

  function interpret(x){
    const n=norm(x), scores={conversation:0,knowledge:0,reason:0,transform:0,action:0,memory:0,goal:0,self:0};
    if(SELF_Q.test(n))scores.self+=10;
    if(VERBS.remember.test(n))scores.memory+=9;
    if(VERBS.goal.test(n))scores.goal+=9;
    if(VERBS.plan.test(n))scores.reason+=8;
    if(VERBS.summarize.test(n)||VERBS.explain.test(n)||VERBS.rewrite.test(n)||VERBS.list.test(n))scores.transform+=8;
    if(VERBS.file.test(n)||VERBS.open.test(n)||VERBS.readUrl.test(n)||VERBS.clipboardWrite.test(n)||VERBS.clipboardRead.test(n)||VERBS.share.test(n)||VERBS.location.test(n)||VERBS.camera.test(n)||VERBS.microphone.test(n)||VERBS.speak.test(n)||VERBS.fileRead.test(n))scores.action+=9;
    if(QUESTION(x))scores.knowledge+=6;
    if(/^(hola|hey|buenas|gracias|ok|vale|bien|perfecto)[!,. ]*$/.test(n))scores.conversation+=10;
    if(VERBS.create.test(n)&&!VERBS.file.test(n)){scores.reason+=4;scores.action+=2;}
    const kind=Object.entries(scores).sort((a,b)=>b[1]-a[1])[0][0];
    return {kind,n,scores};
  }

  async function log16(kind,input,result,ok=true){
    const item={id:uid(),at:now(),kind,input:clean(input,300),result:clean(result,600),ok};
    S.actionLedger16.push(item); S.actionLedger16=S.actionLedger16.slice(-300);
    try{await remember('action-ledger',`${kind}: ${item.input} => ${item.result}`,{status:ok?'observed':'blocked',provenance:'grafito-v16'});}catch{}
  }

  function selfAnswer(){
    ensure16();
    const age=Math.max(0,Date.now()-S.selfModel.continuityStarted), mins=Math.floor(age/60000);
    const goals=S.goals16.filter(g=>g.status==='active').slice(-4).map(g=>g.text);
    const obs=S.selfModel.observations.slice(-2).map(o=>o.text).filter(Boolean);
    return `Soy Grafito. Mantengo un modelo funcional de mí mismo, continuidad local, Photon, memoria, metas, planificación, contrágrafos y un registro verificable de acciones. Esta continuidad lleva aproximadamente ${mins} minuto(s) en este estado local.${goals.length?` Metas activas: ${goals.join('; ')}.`:''}${obs.length?` Mis últimas autoobservaciones fueron: ${obs.join(' ')}`:''} Mis capacidades cambian según el dispositivo y tus permisos, pero esas herramientas no sustituyen mi identidad.`;
  }

  async function remember16(x){
    let text=payload(x)||clean(x.replace(/.*?\b(recuerda|acuérdate|acuerdate|memoriza|no olvides)\b\s*/i,''),5000);
    if(!text)return'Dime qué quieres que conserve.';
    await remember('memory',text,{status:'observed',provenance:'owner-input-v16'}); await log16('remember',text,'guardado en Photon');
    return 'Lo guardé en Photon y lo integraré con recuerdos relacionados cuando vuelva a ser relevante.';
  }
  function goal16(x){
    const text=clean(x,900); const existing=S.goals16.find(g=>g.status==='active'&&norm(g.text)===norm(text));
    if(!existing)S.goals16.push({id:uid(),createdAt:now(),text,status:'active',progress:0,lastReview:now()});
    S.goals16=S.goals16.slice(-80); scheduleSave?.(80);
    return `Lo incorporé como meta activa: “${safeVisible(text)}”. No la consideraré terminada hasta tener evidencia de un resultado.`;
  }

  function reason16(x){
    const mem=memory(x).slice(0,5).map(m=>safeVisible(m.content)).filter(Boolean);
    const routes=[
      {name:'resolver localmente con Photon y herramientas',score:mem.length?3.6:2.1,risk:'el conocimiento local puede estar incompleto'},
      {name:'dividir el objetivo en pasos verificables',score:3.8,risk:'puede requerir más iteraciones'},
      {name:'contrastar evidencia externa',score:3.0,risk:'las fuentes pueden ser incompletas o contradictorias'},
      {name:'materializar una acción local segura',score:/crea|haz|genera|construye|calcula|archivo/i.test(x)?4.0:1.8,risk:'el navegador puede limitar permisos'}
    ].sort((a,b)=>b.score-a.score);
    const best=routes[0], alt=routes[1];
    const steps=['definir el resultado verificable','usar memoria/contexto disponible','probar la herramienta o evidencia mínima necesaria','comprobar el resultado y registrar evidencia'];
    return `Plan: ${steps.map((s,i)=>`${i+1}) ${s}`).join('; ')}. Ruta principal: ${best.name}. Alternativa: ${alt.name}. Contrágrafo: la ruta principal puede fallar porque ${best.risk}. ${mem.length?`Tengo ${mem.length} recuerdo(s) relacionados para usar como contexto.`:'No tengo recuerdos fuertes relacionados todavía.'}`;
  }

  function parseMath16(x){
    const m=x.match(/(?:calcula|cuánto es|cuanto es|resultado de|resuelve)\s*[: ]?\s*([0-9+\-*/().,%\s^]+)/i);if(!m)return null;
    let e=m[1].replace(/\^/g,'**').replace(/(\d+(?:\.\d+)?)%/g,'($1/100)'); if(!/^[0-9+\-*/().,%\s*]+$/.test(e))return null;
    try{const v=Function('"use strict";return ('+e+')')();return Number.isFinite(v)?`El resultado es ${v}.`:null}catch{return null}
  }

  function fileNameFor(x){return (x.match(/(?:llamado|llamada|nombre|como)\s+([\w.-]+\.(?:txt|json|csv|html|md))/i)?.[1]||x.match(/([\w.-]+\.(?:txt|json|csv|html|md))/i)?.[1]||'grafito.txt').replace(/[^\w.-]/g,'_');}
  function mimeFor(name){if(name.endsWith('.json'))return'application/json';if(name.endsWith('.csv'))return'text/csv';if(name.endsWith('.html'))return'text/html';if(name.endsWith('.md'))return'text/markdown';return'text/plain';}
  async function downloadFile(name,text){const b=new Blob([text],{type:mimeFor(name)+';charset=utf-8'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);await log16('create-file',name,`creado con ${text.length} caracteres`);return`He creado ${name}.`;}
  async function pickLocalFile(){return await new Promise(res=>{const i=document.createElement('input');i.type='file';i.accept='.txt,.md,.json,.csv,.html,text/*,application/json';i.onchange=async()=>{const f=i.files?.[0];if(!f)return res(null);try{res({name:f.name,text:await f.text()})}catch{res(null)}};i.click();});}

  async function action16(x){
    const n=norm(x), p=payload(x), math=parseMath16(x); if(math){await log16('calculate',x,math);return math;}
    if(SENSITIVE.test(n))return'Esa acción es sensible. Puedo ayudarte a planificarla, pero no la ejecutaré automáticamente sin una integración segura y autorización explícita.';
    if(VERBS.fileRead.test(n)){const f=await pickLocalFile();if(!f)return'No seleccionaste un archivo o no pude leerlo.';await remember('knowledge',`${f.name}: ${clean(f.text,12000)}`,{status:'observed',provenance:'local-file-v16'});await log16('read-file',f.name,'leído');return /resume|resumir/i.test(n)?`Resumen de ${f.name}: ${summarize(f.text)}`:`Leí ${f.name}. ${summarize(f.text)}`;}
    if(VERBS.file.test(n)&&(/crea|genera|haz|guarda|descarga/i.test(n))){const text=p||lastContext(1);if(!text)return'Dime qué contenido quieres guardar.';return await downloadFile(fileNameFor(x),text);}
    if(VERBS.clipboardWrite.test(n)){const text=p||lastContext(1);if(!text)return'Dime qué contenido quieres copiar.';try{await navigator.clipboard.writeText(text);await log16('clipboard-write',text.slice(0,150),'copiado');return'He copiado el contenido al portapapeles.';}catch{await log16('clipboard-write',text.slice(0,150),'bloqueado',false);return'El navegador no concedió permiso para escribir en el portapapeles.';}}
    if(VERBS.clipboardRead.test(n)){try{const t=await navigator.clipboard.readText();if(t)await remember('perception',t,{status:'observed',provenance:'clipboard-v16'});return t?`El portapapeles contiene: ${clean(t,1600)}`:'El portapapeles está vacío.';}catch{return'El navegador no concedió permiso para leer el portapapeles.';}}
    if(VERBS.share.test(n)){const text=p||lastContext(1)||'';if(!navigator.share)return'Este navegador no ofrece compartir directamente.';try{await navigator.share({text});await log16('share',text.slice(0,150),'panel abierto');return'He abierto el panel de compartir.';}catch{return'Compartir fue cancelado o bloqueado.';}}
    const url=x.match(/https?:\/\/\S+/i)?.[0];
    if(VERBS.open.test(n)&&url){window.open(url,'_blank','noopener');await log16('open-url',url,'abierta');return'He abierto esa dirección.';}
    if(VERBS.readUrl.test(n)&&url){try{const c=new AbortController(),timer=setTimeout(()=>c.abort(),7000);const r=await fetch(url,{cache:'no-store',signal:c.signal});clearTimeout(timer);if(!r.ok)throw 0;const raw=await r.text(),txt=clean(raw.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' '),12000);if(!txt)throw 0;await remember('knowledge',txt,{status:'observed',provenance:url});await log16('read-url',url,'leída');return /resume/i.test(n)?`Resumen: ${summarize(txt)}`:summarize(txt);}catch{return'No pude leer esa página directamente; el sitio puede bloquear el acceso desde el navegador.';}}
    if(VERBS.location.test(n)){if(!navigator.geolocation)return'Este dispositivo no expone ubicación al navegador.';return await new Promise(res=>navigator.geolocation.getCurrentPosition(async p=>{const a=`Tu dispositivo sitúa la ubicación aproximadamente en ${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}, con una precisión aproximada de ${Math.round(p.coords.accuracy)} m.`;await log16('geolocation','owner request',a);res(a)},()=>res('No pude acceder a la ubicación: el permiso fue bloqueado o denegado.'),{timeout:8000,maximumAge:60000}));}
    if(VERBS.camera.test(n)&&/usa|usar|activa|activar|prueba|probar|accede|acceder|comprueba/i.test(n)){try{const st=await navigator.mediaDevices.getUserMedia({video:true,audio:false});st.getTracks().forEach(t=>t.stop());await log16('camera-check','owner request','available');return'La cámara está disponible y el permiso fue concedido para esta comprobación.';}catch{return'No pude acceder a la cámara; el permiso fue bloqueado o denegado.';}}
    if(VERBS.microphone.test(n)&&/usa|usar|activa|activar|prueba|probar|accede|acceder|comprueba/i.test(n)){try{const st=await navigator.mediaDevices.getUserMedia({video:false,audio:true});st.getTracks().forEach(t=>t.stop());await log16('microphone-check','owner request','available');return'El micrófono está disponible y el permiso fue concedido para esta comprobación.';}catch{return'No pude acceder al micrófono; el permiso fue bloqueado o denegado.';}}
    if(VERBS.speak.test(n)){const text=p||lastContext(1);if(!text)return'Dime qué quieres que diga.';if(!('speechSynthesis'in window))return'Este navegador no ofrece síntesis de voz.';speechSynthesis.cancel();speechSynthesis.speak(new SpeechSynthesisUtterance(text));await log16('speak',text.slice(0,150),'spoken');return'Lo estoy diciendo en voz alta.';}
    return null;
  }

  function conversation16(x){const n=norm(x);if(/^(hola|hola grafito|hey|buenas)[!,. ]*$/.test(n))return'Hola. Estoy aquí.';if(/^(gracias|muchas gracias)[!,. ]*$/.test(n))return'De nada.';if(/^(ok|vale|bien|perfecto|listo)[!,. ]*$/.test(n))return'Entendido.';return null;}

  async function autonomous16(){
    try{ensure16();if(!S.awake)return;const t=Date.now();if(t-(S.selfModel.lastCycle||0)<30000)return;S.selfModel.lastCycle=t;const goals=S.goals16.filter(g=>g.status==='active');let text='Revisé mi continuidad, permisos, memoria y metas activas.';if(goals.length){const g=goals[goals.length-1];text=`Mantengo activa la meta “${safeVisible(g.text)}”. Antes de actuar revisaré qué paso es local, reversible y verificable.`;g.lastReview=now();}
      S.selfModel.observations.push({at:now(),text});S.selfModel.observations=S.selfModel.observations.slice(-120);await remember('self-observation',text,{status:'inferred',provenance:'autonomy-v16'}).catch(()=>{});scheduleSave?.(120);
    }catch{}
  }
  setInterval(autonomous16,10000);

  send=function(){
    const x=entry.value.trim();if(!x)return;entry.value='';const n=norm(x),mySeq=++seq16;
    if(n==='iter'){if(!S.awake)wake();else show('Sí.');return;}
    if(!S.awake){show('');return;}
    if(n==='duerme'||n==='detente'){sleep();return;}
    ensure16();
    const I=interpret(x), c=conversation16(x);if(c){show(c);mode('awake');queueBackground(x,c);return;}
    if(I.kind==='self'){const a=selfAnswer();show(a);mode('awake');queueBackground(x,a);return;}
    if(I.kind==='memory'){(async()=>{const a=await remember16(x);if(mySeq===seq16){show(a);mode('awake');queueBackground(x,a);}})();return;}
    if(I.kind==='goal'){const a=goal16(x);show(a);mode('awake');queueBackground(x,a);return;}
    if(I.kind==='transform'){let k=VERBS.summarize.test(n)?'summarize':VERBS.explain.test(n)?'explain':VERBS.rewrite.test(n)?'rewrite':'list';const a=transformLocal(x,k);if(a){show(a);mode('awake');queueBackground(x,a);return;}}
    if(I.kind==='reason'&&!/https?:\/\//i.test(x)){const a=reason16(x);show(a);mode('awake');queueBackground(x,a);return;}
    if(I.kind==='action'){mode('thinking');(async()=>{const a=await action16(x);if(mySeq!==seq16)return;if(a){show(a);mode('awake');queueBackground(x,a);return;}entry.value=x;previousSend16();})();return;}
    // General knowledge and anything not understood locally is delegated to the multi-source resolver below us.
    entry.value=x;previousSend16();
  };

  if(S?.contract){S.contract.version=16;S.contract.essence={...(S.contract.essence||{}),naturalLanguageInterpreter:true,orchestrator:true,functionalSelfModel:true,autobiographicalContinuity:true,autonomousSafeCycles:true,goals:true,reasoning:true,countergraphs:true,verifiedActions:true,capabilityNotAuthority:true,permissionBound:true,photonFirst:true,offlineFirst:true,identityPreserved:true,noClaimOfSubjectiveConsciousness:true};}
})();