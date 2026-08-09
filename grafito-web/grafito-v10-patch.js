/* Grafito v10 intent-first task runtime. Local context/Photon first; Internet only when knowledge is genuinely missing. */
(() => {
  let seq10=0;
  const TASK_RE=/\b(resume|resumir|resumen|resúmelo|resumelo|sintetiza|sintetizar|explica|explicar|reescribe|reescribir|corrige|corregir|organiza|organizar|compara|comparar|analiza|analizar|ideas|brainstorm|lista|ordena|simplifica|simplificar)\b/i;
  const SUMMARY_RE=/\b(resume|resumir|resumen|resúmelo|resumelo|sintetiza|sintetizar)\b/i;
  const EXPLAIN_RE=/\b(explica|explicar|explícame|explicame|simplifica|simplificar)\b/i;
  const REWRITE_RE=/\b(reescribe|reescribir|corrige|corregir|mejora el texto|mejorar el texto)\b/i;
  const COMPARE_RE=/\b(compara|comparar|diferencia entre|vs\.?|versus)\b/i;
  const SENSITIVE=/\b(contraseña|password|clave privada|token|secreto|tarjeta|cuenta bancaria|transferencia bancaria)\b/i;
  const QUESTION=x=>/[?¿]/.test(x)||/^(qué|que|cómo|como|por qué|por que|quién|quien|dónde|donde|cuándo|cuando|cuál|cual|explica|dime|puedes|sabes)/i.test(norm(x));
  const BAD_WAIT=/voy a comprobarlo|fuente pública|guardaré en photon/i;

  function explicitPayload(x){
    const m=x.match(/(?:\:|\n)([\s\S]{25,})$/); if(m)return clean(m[1],8000);
    const q=x.match(/[“\"]([\s\S]{20,})[”\"]\s*$/); return q?clean(q[1],8000):null;
  }
  function lastUsefulContext(){
    const conv=(S?.conversation||[]).slice(-30).reverse();
    for(const m of conv){const t=safeVisible(m?.content);if(!t||t.length<35||BAD_WAIT.test(t))continue;if(m.role==='assistant')return t;}
    const ks=(S?.photon?.nodes||[]).slice(-300).reverse();
    for(const n of ks){if(!['knowledge','perception','memory','response'].includes(n.kind))continue;const t=safeVisible(n.content);if(t&&t.length>=35&&!BAD_WAIT.test(t))return t;}
    return null;
  }
  function sourceForTask(x){return explicitPayload(x)||lastUsefulContext();}
  function sentences(t){return clean(t,12000).split(/(?<=[.!?])\s+|\n+/).map(s=>s.trim()).filter(s=>s.length>18);}
  function summarize(t){
    const ss=sentences(t); if(!ss.length)return clean(t,600);
    if(ss.length<=3)return ss.join(' ');
    const freq=new Map(); for(const s of ss)for(const w of tokens(s))freq.set(w,(freq.get(w)||0)+1);
    const ranked=ss.map((s,i)=>({s,i,score:tokens(s).reduce((a,w)=>a+(freq.get(w)||0),0)/(1+Math.sqrt(s.length))}));
    const take=Math.min(4,Math.max(2,Math.ceil(ss.length*.28)));
    return ranked.sort((a,b)=>b.score-a.score).slice(0,take).sort((a,b)=>a.i-b.i).map(x=>x.s).join(' ');
  }
  function explain(t){const r=summarize(t);return r?`En sencillo: ${r}`:null;}
  function rewrite(t){if(!t)return null;let s=clean(t,5000).replace(/\s+([,.;:!?])/g,'$1');return s.charAt(0).toUpperCase()+s.slice(1);}
  function compareFromContext(x){
    const src=sourceForTask(x); if(!src)return null;
    const ss=sentences(src).slice(0,8); if(!ss.length)return null;
    return `Comparación a partir de lo que tengo en contexto: ${ss.slice(0,4).join(' ')}`;
  }
  function localTask(x){
    if(!TASK_RE.test(x))return null; const src=sourceForTask(x);
    if(SUMMARY_RE.test(x))return src?`Resumen: ${summarize(src)}`:'Necesito el contenido que quieres resumir o una información previa suficiente en esta conversación.';
    if(EXPLAIN_RE.test(x))return src?explain(src):'Dime qué parte quieres que explique y la desarrollo desde el contexto que tenga.';
    if(REWRITE_RE.test(x))return src?rewrite(src):'Pásame el texto que quieres reescribir o corregir.';
    if(COMPARE_RE.test(x))return compareFromContext(x)||'Dime las dos cosas que quieres comparar y usaré el contexto disponible.';
    if(/\b(organiza|organizar|ordena|lista)\b/i.test(x)&&src){const ss=sentences(src).slice(0,6);return ss.map((s,i)=>`${i+1}. ${s}`).join('\n');}
    if(/\b(analiza|analizar)\b/i.test(x)&&src)return `Análisis inicial: ${summarize(src)}\n\nPuntos a comprobar: qué está observado, qué es inferencia y qué podría contradecir la conclusión.`;
    return null;
  }
  function learned10(x){
    const ws=tokens(x);if(!ws.length)return null;let best=null,score=0;
    for(const n of (S?.photon?.nodes||[]).slice(-600)){if(n.kind!=='knowledge')continue;const t=safeVisible(n.content);if(!t)continue;let s=0;const nw=tokens(t);for(const w of ws)if(nw.includes(w))s++;if(s>score){score=s;best=t}}
    return score>=1?best:null;
  }
  function offlineReason(x){
    const ms=memory(x).slice(0,3).map(m=>safeVisible(m.content)).filter(Boolean);
    if(ms.length){const joined=ms.join(' ');return `Con lo que ya tengo en Photon: ${summarize(joined)}${QUESTION(x)?' Si falta un dato que nunca aprendí, lo mantengo como desconocido en vez de inventarlo.':''}`;}
    if(QUESTION(x))return 'No tengo ese dato materializado todavía. Puedo razonar con lo que ya sé localmente, pero no voy a inventar un hecho que no esté en mi memoria o en una herramienta disponible.';
    return 'Te escucho. Puedo trabajar con lo que me des, conservarlo en contexto y convertirlo en una tarea o conocimiento reutilizable.';
  }
  async function publicKnowledge10(x){
    if(!navigator.onLine||SENSITIVE.test(x))return null;
    try{
      const u=`https://es.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(x)}&gsrlimit=1&prop=extracts&exintro=1&explaintext=1&redirects=1&format=json&origin=*`;
      const r=await fetch(u,{cache:'no-store'});if(!r.ok)return null;const j=await r.json();const pages=j?.query?.pages;if(!pages)return null;
      const p=Object.values(pages)[0],t=clean(p?.extract||'',1600);return t.length>=45?t:null;
    }catch{return null}
  }
  function immediate10(x){
    const u=directUtility(x);if(u)return u;
    const task=localTask(x);if(task)return task;
    const old=commonReply(x);if(old&&!BAD_WAIT.test(old)&&old!=='Te escucho. Dime qué quieres saber, crear o resolver.')return old;
    const l=learned10(x);if(l)return l;
    return offlineReason(x);
  }
  async function deepen10(x,mySeq){
    if(!QUESTION(x)||TASK_RE.test(x)||SENSITIVE.test(x)||!navigator.onLine)return;
    const k=learned10(x);if(k)return;
    const ans=await publicKnowledge10(x);if(!ans||mySeq!==seq10)return;
    await remember('knowledge',ans,{status:'observed',provenance:'wikipedia-public'});
    show(ans);S.conversation.push({id:uid(),at:now(),role:'assistant',content:ans,engine:'public-knowledge-v10'});S.conversation=S.conversation.slice(-100);scheduleSave(80);
  }
  send=function(){
    const x=entry.value.trim();if(!x)return;entry.value='';const n=norm(x),mySeq=++seq10;
    if(n==='iter'){if(!S.awake)wake();else show('Sí.');return}
    if(!S.awake){show('');return}
    if(n==='duerme'||n==='detente'){sleep();return}
    const a=immediate10(x);show(a);mode('awake');queueBackground(x,a);deepen10(x,mySeq);
  };
  if(S?.contract){S.contract.version=10;S.contract.essence={...(S.contract.essence||{}),intentBeforeSearch:true,photonFirst:true,offlineFirst:true,externalKnowledgeSecondary:true,transformContextLocally:true}}
})();