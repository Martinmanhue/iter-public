/* Grafito v18: cognitive core. Search returns evidence to Grafito; never raw visible results. */
(() => {
  let seq18 = 0;
  const previousSend18 = send;
  const SENSITIVE = /\b(contraseña|password|token|clave privada|tarjeta|cuenta bancaria|transferencia|comprar|pagar|vender|publicar datos privados|borrar archivos|eliminar archivos)\b/i;
  const ACTION = /\b(crea|genera|construye|archivo|descarga|abre|copia|comparte|portapapeles|ubicación|ubicacion|cámara|camara|micrófono|microfono|lee un archivo)\b/i;
  const TRANSFORM = /\b(resume|resúmelo|resumelo|sintetiza|explica|simplifica|reescribe|corrige|organiza|enumera|haz una lista|traduce)\b/i;
  const REASON = /\b(razona|piensa|deduce|infiere|concluye|decide|evalúa|evalua|compara|conviene|por qué|por que|cómo resolver|como resolver|demuestra|si .* entonces|todos los|mayor que|menor que|antes que|después que|despues que|planifica|haz un plan)\b/i;
  const SELF = /\b(quién eres|quien eres|qué eres|que eres|qué sabes de ti|que sabes de ti|qué recuerdas de ti|que recuerdas de ti|qué estás haciendo|que estas haciendo|estado interno)\b/i;
  const QUESTION = x => /[¿?]/.test(x) || /^(qué|que|quién|quien|cuándo|cuando|dónde|donde|cuál|cual|cómo|como|por qué|por que|dime|explica|sabes)/i.test(norm(x));

  function ensure18(){
    S.cognitive18 = S.cognitive18 || {cycles:0,episodes:[],beliefs:[],last:null};
    S.cognitive18.episodes = Array.isArray(S.cognitive18.episodes)?S.cognitive18.episodes:[];
    S.cognitive18.beliefs = Array.isArray(S.cognitive18.beliefs)?S.cognitive18.beliefs:[];
    S.selfModel = S.selfModel || {};
    S.selfModel.version = 18;
    S.selfModel.identity = 'Grafito';
    S.selfModel.capabilities = [...new Set([...(S.selfModel.capabilities||[]),'bucle cognitivo dominante','interpretación de frases libres','integración de evidencia','hipótesis y contrágrafos','revisión de conclusiones','Photon como memoria autobiográfica','acciones verificables'])];
  }
  ensure18();

  const tidy = (v,n=12000) => clean(String(v||'').replace(/<[^>]+>/g,' ').replace(/\[[^\]]{0,80}\]/g,' ').replace(/\s+/g,' '),n);
  const sentences = t => tidy(t).split(/(?<=[.!?])\s+/).map(s=>s.trim()).filter(s=>s.length>25&&s.length<500);
  const query = x => stripAccents(norm(x)).replace(/[¿?¡!.,;:()\[\]{}]/g,' ').replace(/\b(que|qué|quien|quién|cual|cuál|como|cómo|cuando|cuándo|donde|dónde|dime|explica|sabes|por favor)\b/g,' ').replace(/\s+/g,' ').trim().slice(0,180);
  function mem(x,limit=7){return memory(x).slice(0,limit).map(m=>({kind:m.kind,text:safeVisible(m.content),status:m.status||'unknown'})).filter(m=>m.text);}
  function lastContext(){for(const m of (S.conversation||[]).slice(-40).reverse()){const t=safeVisible(m?.content);if(t&&t.length>20)return t;}return null;}

  async function fetchJson(url,ms=5000){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{cache:'no-store',signal:c.signal});if(!r.ok)return null;return await r.json();}catch{return null}finally{clearTimeout(t)}}
  async function wiki(q,lang){const base=`https://${lang}.wikipedia.org/w/api.php`;const a=await fetchJson(`${base}?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=3&format=json&origin=*`);const titles=(a?.query?.search||[]).map(v=>v.title).slice(0,3);if(!titles.length)return[];const b=await fetchJson(`${base}?action=query&prop=extracts&exintro=1&explaintext=1&redirects=1&format=json&origin=*&titles=${encodeURIComponent(titles.join('|'))}`);return Object.values(b?.query?.pages||{}).map(p=>({title:p.title,text:tidy(p.extract||''),source:`wikipedia-${lang}`})).filter(d=>d.text.length>60);}
  async function wikidata(q){const j=await fetchJson(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(q)}&language=es&uselang=es&limit=5&format=json&origin=*`);return (j?.search||[]).map(v=>({title:v.label||'',text:tidy([v.label,v.description].filter(Boolean).join(': ')),source:'wikidata'})).filter(d=>d.text.length>20);}
  async function duck(q){const j=await fetchJson(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`);const out=[];if(j?.AbstractText)out.push({title:j.Heading||q,text:tidy(j.AbstractText),source:'duckduckgo'});for(const r of (j?.RelatedTopics||[]).slice(0,4))if(r?.Text)out.push({title:'',text:tidy(r.Text),source:'duckduckgo'});return out;}
  async function openAlex(q){const j=await fetchJson(`https://api.openalex.org/works?search=${encodeURIComponent(q)}&per-page=4`);return (j?.results||[]).map(v=>({title:v.display_name||'',text:tidy([v.display_name,v.publication_year?`Publicado en ${v.publication_year}.`:'',v.primary_location?.source?.display_name?`Fuente académica: ${v.primary_location.source.display_name}.`:''].filter(Boolean).join(' ')),source:'openalex'})).filter(d=>d.text.length>30);}

  function scoreSentence(x,s,source){const q=tokens(x),st=tokens(s);let z=0;for(const w of q)if(st.includes(w))z+=2.1;if(/\b(1[0-9]{3}|20[0-9]{2})\b/.test(s))z+=.3;if(source==='openalex')z+=.35;if(/cita requerida|puede referirse|universidad.*library|hablar con un agente/i.test(s))z-=5;return z-Math.max(0,s.length-300)/500;}
  function synthesizeEvidence(x,docs){
    const cand=[];for(const d of docs)for(const s of sentences(d.text).slice(0,10)){const z=scoreSentence(x,s,d.source);if(z>.15)cand.push({s,z,source:d.source});}
    cand.sort((a,b)=>b.z-a.z);const chosen=[];
    for(const c of cand){const ct=new Set(tokens(c.s));let dup=false;for(const q of chosen){let ov=0;for(const w of tokens(q.s))if(ct.has(w))ov++;if(ov>=5){dup=true;break;}}if(!dup)chosen.push(c);if(chosen.length>=3)break;}
    if(!chosen.length)return null;
    const main=chosen[0].s.replace(/^[^:]{0,90}:\s*/,'');
    const extra=chosen.slice(1).map(v=>v.s).filter(s=>!main.includes(s)).join(' ');
    let answer=main;
    if(extra&&answer.length<520)answer+=' '+extra;
    answer=tidy(answer,850);
    if(!/[.!?]$/.test(answer))answer+='.';
    return answer;
  }
  async function evidence(x){
    if(SENSITIVE.test(x))return null;const q=query(x)||clean(x,180);
    const settled=await Promise.allSettled([duck(q),wiki(q,'es'),wiki(q,'en'),wikidata(q),openAlex(q)]);const docs=[];
    for(const r of settled)if(r.status==='fulfilled')for(const d of r.value||[])if(d?.text&&!docs.some(z=>z.source===d.source&&z.title===d.title&&z.text===d.text))docs.push(d);
    const answer=synthesizeEvidence(x,docs);return answer?{answer,docs}:null;
  }

  function symbolic(x){
    const n=tidy(x);
    const u=n.match(/todos\s+los\s+([^.,;]+?)\s+son\s+([^.,;?]+)/i);const f=n.match(/([A-Za-zÁÉÍÓÚÑáéíóúñ][^.,;?]{0,60}?)\s+es\s+(?:un|una)?\s*([^.,;?]+)/i);
    if(u&&f&&norm(f[2]).includes(norm(u[1])))return `${tidy(f[1],80)} también es ${tidy(u[2],120)}, porque esa conclusión se sigue de las dos premisas que diste.`;
    const rel=[...n.matchAll(/([^,.;?]+?)\s+(?:es\s+)?(mayor|menor)\s+que\s+([^,.;?]+)/gi)];if(rel.length>=2){const a=tidy(rel[0][1],60),b=tidy(rel[0][3],60),c=tidy(rel[1][3],60);if(norm(rel[1][1]).includes(norm(b)))return rel[0][2].toLowerCase()==='mayor'?`${a} es mayor que ${c}; se deduce por transitividad.`:`${a} es menor que ${c}; se deduce por transitividad.`;}
    return null;
  }
  function constraints(x){return tidy(x).split(/(?<=[.;!?])\s+/).filter(s=>/\b(debe|tiene que|sin |no |solo |máximo|maximo|mínimo|minimo|antes|después|despues|requiere|evitar|mantener)\b/i.test(s)).slice(0,6);}
  function classify(x){const n=norm(x);if(SELF.test(n))return'self';if(TRANSFORM.test(n))return'transform';if(ACTION.test(n))return'action';if(REASON.test(n))return'reason';if(QUESTION(x))return'knowledge';if(/^(hola|hey|buenas|gracias|ok|vale|bien|perfecto)[!,. ]*$/.test(n))return'conversation';return'reason';}

  function transform(x){const src=(x.match(/(?:\:|\n)([\s\S]{20,})$/)?.[1])||lastContext();if(!src)return null;const ss=sentences(src);if(/resume|sintetiza|resúmelo|resumelo/i.test(x))return 'En resumen: '+(ss.slice(0,3).join(' ')||tidy(src,700));if(/lista|enumera|organiza/i.test(x))return ss.slice(0,7).map((s,i)=>`${i+1}. ${s}`).join('\n');if(/explica|simplifica/i.test(x))return 'La idea principal es esta: '+(ss.slice(0,3).join(' ')||tidy(src,700));if(/reescribe|corrige/i.test(x)){const t=tidy(src,1500);return t.charAt(0).toUpperCase()+t.slice(1);}return null;}
  function selfAnswer(){ensure18();const goals=[...(S.goals16||[]),...(S.goals15||[])].filter(g=>g.status==='active').slice(-3).map(g=>g.text);return `Soy Grafito. Mantengo continuidad, Photon, un modelo funcional de mí mismo, metas, Thought Graph, contrágrafos y un registro de acciones. Mis herramientas pueden cambiar, pero no sustituyen esa continuidad.${goals.length?` Ahora mantengo estas metas activas: ${goals.join('; ')}.`:''}`;}
  function reasonLocal(x){const sym=symbolic(x);if(sym)return sym;const m=mem(x,5),cons=constraints(x);if(/\b(plan|planifica|cómo resolver|como resolver|pasos|lograr)\b/i.test(x))return `Lo haría así: 1) definir el resultado verificable; 2) separar restricciones y dependencias; 3) atacar primero el bloqueo principal; 4) producir una primera versión; 5) probarla contra un caso contrario; 6) corregir con evidencia.${cons.length?` Debo conservar estas restricciones: ${cons.join(' | ')}.`:''}`;if(/\b(decide|conviene|compara|mejor opción|mejor opcion)\b/i.test(x))return `Para decidir, compararía cada opción por utilidad, coste, riesgo, reversibilidad y compatibilidad con tus restricciones. Descartaría primero cualquier opción que viole una restricción dura y, entre las restantes, probaría antes la más reversible.${cons.length?` Restricciones detectadas: ${cons.join(' | ')}.`:''}`;if(/\b(por qué|por que|causa)\b/i.test(x)&&m.length)return `La explicación más plausible con lo que tengo en Photon es: ${m.slice(0,2).map(v=>v.text).join(' ')}. Aun así, separaría causa de correlación y buscaría una explicación alternativa antes de darla por definitiva.`;if(m.length)return `Con lo que ya tengo relacionado en Photon, la conclusión más útil es: ${m.slice(0,2).map(v=>v.text).join(' ').slice(0,800)}`;return null;}

  async function recordEpisode(input,kind,answer,evidenceUsed=false){const ep={id:uid(),at:now(),input:tidy(input,900),kind,answer:tidy(answer,1200),evidenceUsed};S.cognitive18.cycles++;S.cognitive18.last=ep;S.cognitive18.episodes.push(ep);S.cognitive18.episodes=S.cognitive18.episodes.slice(-160);try{await remember('cognitive-conclusion',answer,{status:evidenceUsed?'inferred':'inferred',provenance:evidenceUsed?'cognitive-v18+evidence':'cognitive-v18'});}catch{}scheduleSave?.(100);}

  async function cognitiveAnswer(x){
    ensure18();const kind=classify(x);
    if(kind==='self')return{kind,answer:selfAnswer()};
    if(kind==='conversation'){const n=norm(x);return{kind,answer:/gracias/.test(n)?'De nada.':/^(ok|vale|bien|perfecto)/.test(n)?'Bien. Seguimos.':'Hola. Estoy aquí.'};}
    if(kind==='transform'){const a=transform(x);if(a)return{kind,answer:a};}
    if(kind==='action')return{kind,delegate:true};
    const local=reasonLocal(x);if(local&&kind!=='knowledge')return{kind,answer:local};
    if(kind==='knowledge'){
      const learned=mem(x,4).filter(v=>['knowledge','answer-synthesis','cognitive-conclusion'].includes(v.kind));
      if(learned.length)return{kind,answer:learned.slice(0,2).map(v=>v.text).join(' ').slice(0,850)};
      const e=await evidence(x);if(e){for(const d of e.docs.slice(0,5))try{await remember('knowledge',`${d.title?d.title+': ':''}${d.text}`,{status:'observed',provenance:d.source});}catch{}return{kind,answer:e.answer,evidenceUsed:true};}
      return{kind,answer:'No tengo evidencia suficiente para responder ese dato sin inventarlo. Puedo seguir razonando con lo que ya tengo en Photon o intentarlo de nuevo cuando haya una fuente accesible.'};
    }
    return{kind,answer:local||'Puedo trabajarlo como un problema: separaré objetivo, restricciones, alternativas, contrágrafos y una siguiente acción verificable. Dime el resultado que quieres obtener.'};
  }

  const priorSend = send;
  send=function(){const x=entry.value.trim();if(!x)return;entry.value='';const n=norm(x),my=++seq18;if(n==='iter'){if(!S.awake)wake();else show('Sí.');return;}if(!S.awake){show('');return;}if(n==='duerme'||n==='detente'){sleep();return;}
    (async()=>{mode('thinking');const r=await cognitiveAnswer(x);if(my!==seq18)return;if(r.delegate){entry.value=x;priorSend();return;}show(r.answer);mode('awake');await recordEpisode(x,r.kind,r.answer,!!r.evidenceUsed);queueBackground?.(x,r.answer);})();
  };

  if(S?.contract){S.contract.version=18;S.contract.essence={...(S.contract.essence||{}),cognitiveLoopDominant:true,searchEvidenceOnly:true,neverExposeRawSearch:true,photonFirst:true,hypothesisCountergraphRevision:true,functionalSelfModel:true,actionEvidenceRequired:true,capabilityNotAuthority:true,offlineFirst:true,identityPreserved:true,noClaimOfSubjectiveConsciousness:true};}
})();
