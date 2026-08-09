/* Grafito v11 general resolver: answer first, Photon/context first, external evidence only when needed. */
(() => {
  let seq11 = 0;
  const SENSITIVE = /\b(contraseña|password|clave privada|token|secreto|tarjeta|cuenta bancaria|transferencia bancaria)\b/i;
  const TASK = /\b(resume|resumir|resumen|resúmelo|resumelo|sintetiza|explica|explicar|reescribe|corrige|organiza|compara|analiza|lista|ordena|simplifica|traduce)\b/i;
  const QUESTION = x => /[?¿]/.test(x) || /^(qué|que|cómo|como|por qué|por que|quién|quien|dónde|donde|cuándo|cuando|cuál|cual|dime|sabes|explica)/i.test(norm(x));
  const FIRST_COMPUTER = /\b(primera|primer)\b.*\b(computadora|ordenador|computador)\b|\b(computadora|ordenador|computador)\b.*\b(primera|primer)\b/i;

  function builtin11(x){
    const n=norm(x);
    if(FIRST_COMPUTER.test(n)) return "Depende de qué llamemos ‘primera computadora’. La Z3 de Konrad Zuse (1941) suele considerarse la primera computadora programable totalmente automática; Colossus (1943–44) fue una de las primeras electrónicas digitales programables, y ENIAC (1945) suele citarse como la primera computadora electrónica digital de propósito general. Si quieres, te explico la diferencia entre ellas.";
    if(/capital (?:de )?francia/i.test(n)) return "La capital de Francia es París.";
    if(/capital (?:de )?españa/i.test(n)) return "La capital de España es Madrid.";
    if(/capital (?:de )?chile/i.test(n)) return "La capital de Chile es Santiago.";
    if(/velocidad.*luz/i.test(n)) return "La velocidad de la luz en el vacío es 299.792.458 m/s.";
    return null;
  }

  function learned11(x){
    const ws=tokens(x); if(!ws.length) return null;
    let best=null,score=0;
    for(const n of (S?.photon?.nodes||[]).slice(-900)){
      if(!['knowledge','memory','response'].includes(n.kind)) continue;
      const t=safeVisible(n.content); if(!t || t.length<25) continue;
      const nw=tokens(t); let s=0; for(const w of ws) if(nw.includes(w)) s++;
      if(n.kind==='knowledge') s+=0.7;
      if(s>score){score=s;best=t;}
    }
    return score>=1.4 ? best : null;
  }

  function cleanQuery(x){
    return stripAccents(norm(x))
      .replace(/[¿?¡!.,;:()\[\]{}]/g,' ')
      .replace(/\b(cual|cuál|que|qué|quien|quién|como|cómo|cuando|cuándo|donde|dónde|fue|era|es|son|dime|sabes|explica|por favor)\b/g,' ')
      .replace(/\s+/g,' ').trim().slice(0,180);
  }

  function queryVariants(x){
    const q=cleanQuery(x), out=[];
    if(q) out.push(q);
    if(FIRST_COMPUTER.test(x)) out.push('historia de la computación primera computadora Z3 ENIAC Colossus');
    const raw=clean(x,180); if(raw && raw!==q) out.push(raw);
    return [...new Set(out)].slice(0,3);
  }

  async function wikiSearch(q){
    const url=`https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=4&format=json&origin=*`;
    const r=await fetch(url,{cache:'no-store'}); if(!r.ok) return [];
    const j=await r.json(); return (j?.query?.search||[]).map(v=>v.title).filter(Boolean);
  }
  async function wikiExtract(titles){
    if(!titles.length) return [];
    const url=`https://es.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&redirects=1&format=json&origin=*&titles=${encodeURIComponent(titles.slice(0,4).join('|'))}`;
    const r=await fetch(url,{cache:'no-store'}); if(!r.ok) return [];
    const j=await r.json(); return Object.values(j?.query?.pages||{}).map(p=>({title:p.title,text:clean(p.extract||'',1800)})).filter(p=>p.text.length>80);
  }
  function scoreDoc(x,d){
    const ws=tokens(x), ds=tokens(d.title+' '+d.text.slice(0,900));
    let s=0; for(const w of ws) if(ds.includes(w)) s++;
    return s + Math.min(d.text.length/1400,1);
  }
  function answerFromDocs(x,docs){
    if(!docs.length) return null;
    docs.sort((a,b)=>scoreDoc(x,b)-scoreDoc(x,a));
    const d=docs[0];
    const parts=d.text.split(/(?<=[.!?])\s+/).filter(s=>s.length>25);
    const chosen=parts.slice(0,3).join(' ');
    return chosen ? clean(chosen,1100) : clean(d.text,1100);
  }
  async function publicResolve(x){
    if(!navigator.onLine || SENSITIVE.test(x)) return null;
    const all=[];
    for(const q of queryVariants(x)){
      try{
        const titles=await wikiSearch(q); const docs=await wikiExtract(titles);
        for(const d of docs) if(!all.some(z=>z.title===d.title)) all.push(d);
        if(all.length>=4) break;
      }catch{}
    }
    return answerFromDocs(x,all);
  }

  function taskLocal(x){
    if(!TASK.test(x)) return null;
    const conv=(S?.conversation||[]).slice(-30).reverse();
    let src=null;
    for(const m of conv){const t=safeVisible(m?.content); if(t && t.length>40 && m.role==='assistant'){src=t;break;}}
    if(!src){const mm=memory(x)[0]; src=mm?safeVisible(mm.content):null;}
    if(!src) return "Pásame el contenido o dime exactamente qué quieres transformar y lo trabajo aquí mismo.";
    const ss=src.split(/(?<=[.!?])\s+|\n+/).map(s=>s.trim()).filter(s=>s.length>20);
    if(/\b(resume|resumen|resúmelo|resumelo|sintetiza)\b/i.test(x)) return 'Resumen: '+(ss.slice(0,4).join(' ')||clean(src,800));
    if(/\b(explica|simplifica)\b/i.test(x)) return 'En sencillo: '+(ss.slice(0,4).join(' ')||clean(src,800));
    if(/\b(lista|organiza|ordena)\b/i.test(x)) return ss.slice(0,6).map((s,i)=>`${i+1}. ${s}`).join('\n');
    if(/\b(reescribe|corrige)\b/i.test(x)) return clean(src,1400);
    return null;
  }

  function localImmediate(x){
    const u=directUtility(x); if(u) return u;
    const t=taskLocal(x); if(t) return t;
    const b=builtin11(x); if(b) return b;
    const c=(typeof convo==='function'?convo(x):null); if(c) return c;
    const l=learned11(x); if(l) return l;
    return null;
  }

  async function resolveAndShow(x,mySeq){
    const ans=await publicResolve(x);
    if(mySeq!==seq11) return;
    if(ans){
      await remember('knowledge',ans,{status:'observed',provenance:'wikipedia-public-v11'});
      show(ans); mode('awake');
      S.conversation.push({id:uid(),at:now(),role:'assistant',content:ans,engine:'general-resolver-v11'});
      S.conversation=S.conversation.slice(-100); scheduleSave(80); return;
    }
    const mem=learned11(x)||memory(x)[0]?.content;
    show(mem?`Con lo que ya tengo guardado: ${safeVisible(mem)}`:"No encontré una respuesta suficientemente fiable con las fuentes disponibles. Prefiero decirlo antes que inventarla.");
    mode('awake');
  }

  send=function(){
    const x=entry.value.trim(); if(!x) return; entry.value='';
    const n=norm(x), mySeq=++seq11;
    if(n==='iter'){if(!S.awake)wake();else show('Sí.');return;}
    if(!S.awake){show('');return;}
    if(n==='duerme'||n==='detente'){sleep();return;}
    const local=localImmediate(x);
    if(local){show(local);mode('awake');queueBackground(x,local);return;}
    if(QUESTION(x) && navigator.onLine && !SENSITIVE.test(x)){
      mode('thinking');
      queueBackground(x,'consulta de conocimiento en curso');
      resolveAndShow(x,mySeq); return;
    }
    const mem=learned11(x)||memory(x)[0]?.content;
    const a=mem?`Con lo que recuerdo: ${safeVisible(mem)}`:"No tengo ese dato materializado todavía. Sin conexión sigo usando Photon y mis herramientas locales, pero no voy a inventar hechos.";
    show(a);mode('awake');queueBackground(x,a);
  };

  if(S?.contract){S.contract.version=11;S.contract.essence={...(S.contract.essence||{}),generalResolver:true,queryReformulation:true,multiResultEvidence:true,photonFirst:true,offlineFirst:true,identityPreserved:true};}
})();
