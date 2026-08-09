/* Grafito v13: resilient knowledge resolver + permissioned capability broker. Core identity/Photon remain authoritative. */
(() => {
  let seq13=0;
  const SENSITIVE=/\b(contraseña|password|clave privada|token|secreto|tarjeta|cuenta bancaria|transferencia bancaria)\b/i;
  const TASK=/\b(resume|resumir|resumen|resúmelo|resumelo|sintetiza|explica|explicar|simplifica|reescribe|corrige|organiza|compara|analiza|lista|ordena|traduce)\b/i;
  const CONVO=/^(hola|hey|buenas|gracias|ok|vale|bien|perfecto|listo)[!,. ]*$/i;
  const QUESTION=x=>/[?¿]/.test(x)||/^(qué|que|cómo|como|por qué|por que|quién|quien|dónde|donde|cuándo|cuando|cuál|cual|dime|sabes|explica|háblame|hablame)/i.test(norm(x));
  const KNOWLEDGE_HINT=/\b(historia|quién|quien|qué|que|cuál|cual|cuando|cuándo|donde|dónde|primero|primera|inventó|invento|descubrió|descubrio|capital|país|pais|persona|científico|cientifico|fecha|año|revolución|revolucion|computadora|ordenador|planeta|guerra|teoría|teoria|significa|define)\b/i;

  const cleanQ=x=>stripAccents(norm(x)).replace(/[¿?¡!.,;:()\[\]{}]/g,' ').replace(/\b(cual|cuál|que|qué|quien|quién|como|cómo|cuando|cuándo|donde|dónde|dime|sabes|explica|por favor)\b/g,' ').replace(/\s+/g,' ').trim().slice(0,180);
  const variants=x=>[cleanQ(x),clean(x,180),cleanQ(x)+' historia',cleanQ(x)+' definición'].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).slice(0,4);
  const noise=t=>clean(String(t||'').replace(/\[(?:cita requerida|citation needed|editar|nota \d+|\d+)\]/gi,' ').replace(/\s+/g,' '),6000);
  const sentences=t=>noise(t).split(/(?<=[.!?])\s+/).map(s=>s.trim()).filter(s=>s.length>28&&s.length<460);

  function scoreSentence(x,s,idx){const q=tokens(x),st=tokens(s);let z=idx===0?1.2:0;for(const w of q)if(st.includes(w))z+=2.25;if(/\b(1[0-9]{3}|20[0-9]{2})\b/.test(s))z+=.5;if(/\b(es|fue|nació|nacio|creó|creo|inventó|invento|descubrió|descubrio|comenzó|comenzo)\b/i.test(s))z+=.5;if(/cita requerida|puede referirse|este artículo/i.test(s))z-=4;return z-s.length/1000;}
  function synth(x,docs){const cand=[];for(const d of docs.slice(0,8))sentences(d.text).slice(0,12).forEach((s,i)=>cand.push({s,score:scoreSentence(x,s,i),title:d.title}));cand.sort((a,b)=>b.score-a.score);const out=[];for(const c of cand){if(c.score<.4)continue;const ct=new Set(tokens(c.s));let dup=false;for(const o of out){const ot=tokens(o.s);let n=0;for(const w of ot)if(ct.has(w))n++;if(n>=Math.min(5,Math.ceil(ot.length*.6))){dup=true;break;}}if(!dup)out.push(c);if(out.length===3)break;}if(!out.length)return null;let r=out.map(v=>v.s).join(' ');if(r.length>760)r=r.slice(0,760).replace(/\s+\S*$/,'').replace(/[,;:]$/,'')+'.';return noise(r);}

  async function fetchJson(url,ms=6500){const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),ms);try{const r=await fetch(url,{cache:'no-store',signal:ctl.signal});if(!r.ok)return null;return await r.json();}catch{return null}finally{clearTimeout(t)}}
  async function wikiDocs(lang,q){const base=`https://${lang}.wikipedia.org/w/api.php`;const sj=await fetchJson(`${base}?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=5&format=json&origin=*`);const titles=(sj?.query?.search||[]).map(v=>v.title).filter(Boolean).slice(0,5);if(!titles.length)return[];const ej=await fetchJson(`${base}?action=query&prop=extracts&exintro=1&explaintext=1&redirects=1&format=json&origin=*&titles=${encodeURIComponent(titles.join('|'))}`);return Object.values(ej?.query?.pages||{}).map(p=>({title:p.title,text:noise(p.extract||''),source:`wikipedia-${lang}`})).filter(d=>d.text.length>70);}
  async function wikidataDocs(q){const j=await fetchJson(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(q)}&language=es&uselang=es&limit=6&format=json&origin=*`);return (j?.search||[]).map(v=>({title:v.label||'',text:noise([v.label,v.description].filter(Boolean).join(': ')),source:'wikidata'})).filter(d=>d.text.length>20);}
  async function resolvePublic(x){if(SENSITIVE.test(x))return null;const docs=[];for(const q of variants(x)){const settled=await Promise.allSettled([wikiDocs('es',q),wikiDocs('en',q),wikidataDocs(q)]);for(const r of settled)if(r.status==='fulfilled')for(const d of r.value)if(!docs.some(z=>z.title===d.title&&z.source===d.source))docs.push(d);if(docs.length>=7)break;}const answer=synth(x,docs);return answer?{answer,docs}:null;}

  function learned13(x){const ws=tokens(x);if(!ws.length)return null;let best=null,score=0;for(const n of (S?.photon?.nodes||[]).slice(-1200)){if(!['answer-synthesis','knowledge'].includes(n.kind))continue;const t=safeVisible(n.content);if(!t)continue;const nw=tokens(t);let s=n.kind==='answer-synthesis'?.9:.2;for(const w of ws)if(nw.includes(w))s++;if(s>score){score=s;best=t;}}return score>=1.7?best:null;}

  async function capability(x){const n=norm(x);
    if(/\b(dónde estoy|donde estoy|mi ubicación|mi ubicacion|ubicación actual|ubicacion actual)\b/.test(n)){
      if(!navigator.geolocation)return'Este navegador no expone ubicación.';
      return await new Promise(res=>navigator.geolocation.getCurrentPosition(p=>res(`Tu dispositivo sitúa la ubicación aproximadamente en ${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)} (precisión aproximada ${Math.round(p.coords.accuracy)} m).`),e=>res('No pude acceder a la ubicación: el sistema la bloqueó o no concediste permiso.'),{enableHighAccuracy:false,timeout:7000,maximumAge:60000}));
    }
    if(/\b(leer|lee|pega|pegar).*\b(portapapeles|clipboard)\b/.test(n)){
      try{const t=await navigator.clipboard.readText();return t?`En el portapapeles hay: ${clean(t,1200)}`:'El portapapeles está vacío.';}catch{return'No pude leer el portapapeles; el navegador requiere permiso o una acción compatible.';}
    }
    if(/\b(cámara|camara)\b/.test(n)&&/\b(usar|usa|probar|prueba|acceder|accede|activar|activa)\b/.test(n)){
      try{const s=await navigator.mediaDevices.getUserMedia({video:true,audio:false});s.getTracks().forEach(t=>t.stop());return'La cámara está disponible y el permiso fue concedido para esta comprobación.';}catch{return'No pude acceder a la cámara; el sistema la bloqueó o no concediste permiso.';}
    }
    if(/\b(micrófono|microfono)\b/.test(n)&&/\b(usar|usa|probar|prueba|acceder|accede|activar|activa)\b/.test(n)){
      try{const s=await navigator.mediaDevices.getUserMedia({video:false,audio:true});s.getTracks().forEach(t=>t.stop());return'El micrófono está disponible y el permiso fue concedido para esta comprobación.';}catch{return'No pude acceder al micrófono; el sistema lo bloqueó o no concediste permiso.';}
    }
    return null;
  }

  async function answer13(x,mySeq){
    const cap=await capability(x);if(cap){if(mySeq===seq13){show(cap);mode('awake');queueBackground(x,cap);}return;}
    const known=learned13(x);if(known){if(mySeq===seq13){show(known);mode('awake');queueBackground(x,known);}return;}
    const r=await resolvePublic(x);if(mySeq!==seq13)return;
    if(r){await remember('answer-synthesis',r.answer,{status:'inferred',provenance:'multi-public-evidence-v13'});for(const d of r.docs.slice(0,4))await remember('knowledge',`${d.title}: ${d.text}`,{status:'observed',provenance:d.source});show(r.answer);mode('awake');S.conversation.push({id:uid(),at:now(),role:'assistant',content:r.answer,engine:'resolver-v13'});S.conversation=S.conversation.slice(-100);scheduleSave(80);return;}
    const mem=memory(x).slice(0,3).map(m=>safeVisible(m.content)).filter(Boolean);
    const a=mem.length?`Con lo que ya tengo en Photon: ${mem.join(' ').slice(0,700)}`:'No encontré evidencia suficiente con las capacidades disponibles. Lo mantengo como desconocido en vez de inventarlo.';show(a);mode('awake');queueBackground(x,a);
  }

  const previousSend=send;
  send=function(){const x=entry.value.trim();if(!x)return;entry.value='';const n=norm(x),mySeq=++seq13;
    if(n==='iter'){if(!S.awake)wake();else show('Sí.');return;}
    if(!S.awake){show('');return;}
    if(n==='duerme'||n==='detente'){sleep();return;}
    const local=typeof local12==='function'?local12(x):null;
    if(local){show(local);mode('awake');queueBackground(x,local);return;}
    if(CONVO.test(n)&&typeof commonReply==='function'){const c=commonReply(x);if(c){show(c);mode('awake');queueBackground(x,c);return;}}
    if(TASK.test(x)&&typeof localTask12==='function'){const t=localTask12(x);if(t){show(t);mode('awake');queueBackground(x,t);return;}}
    const shouldResolve=QUESTION(x)||KNOWLEDGE_HINT.test(x)||x.trim().split(/\s+/).length>=3;
    if(shouldResolve&&!SENSITIVE.test(x)){mode('thinking');answer13(x,mySeq);return;}
    const m=memory(x)[0]?.content;const a=m?safeVisible(m):'Te escucho. Dime qué quieres saber, crear o resolver.';show(a);mode('awake');queueBackground(x,a);
  };
  if(S?.contract){S.contract.version=13;S.contract.essence={...(S.contract.essence||{}),resilientPublicResolver:true,networkHintNotAuthority:true,permissionedCapabilities:true,capabilityNotAuthority:true,photonFirst:true,offlineFirst:true,identityPreserved:true};}
})();