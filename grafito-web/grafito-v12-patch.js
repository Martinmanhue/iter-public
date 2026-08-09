/* Grafito v12 synthesis-first responder. Identity/Photon stay primary; external text is evidence, never the visible answer by itself. */
(() => {
  let seq12 = 0;
  const SENSITIVE=/\b(contraseña|password|clave privada|token|secreto|tarjeta|cuenta bancaria|transferencia bancaria)\b/i;
  const TASK=/\b(resume|resumir|resumen|resúmelo|resumelo|sintetiza|explica|explicar|simplifica|reescribe|corrige|organiza|compara|analiza|lista|ordena|traduce)\b/i;
  const QUESTION=x=>/[?¿]/.test(x)||/^(qué|que|cómo|como|por qué|por que|quién|quien|dónde|donde|cuándo|cuando|cuál|cual|dime|sabes|explica)/i.test(norm(x));
  const WAIT=/consulta de conocimiento en curso|voy a comprobarlo|fuente pública|guardaré en photon/i;

  function stripNoise(t){
    return clean(String(t||'')
      .replace(/\[(?:cita requerida|citation needed|editar|nota \d+|\d+)\]/gi,' ')
      .replace(/\([^)]{0,140}pronunciación[^)]*\)/gi,' ')
      .replace(/\s+/g,' '),5000);
  }
  function splitSentences(t){
    return stripNoise(t).split(/(?<=[.!?])\s+/).map(s=>s.trim()).filter(s=>s.length>25&&s.length<420);
  }
  function intentType(x){
    const n=norm(x);
    if(/\b(quién|quien)\b/.test(n))return'person';
    if(/\b(cuándo|cuando|fecha|año)\b/.test(n))return'date';
    if(/\b(dónde|donde)\b/.test(n))return'place';
    if(/\b(por qué|por que|causa|motivo)\b/.test(n))return'cause';
    if(/\b(cómo|como)\b/.test(n))return'how';
    if(/\b(qué es|que es|qué fue|que fue|define|definición)\b/.test(n))return'definition';
    return'fact';
  }
  function sentenceScore(x,s,idx,type){
    const q=tokens(x), st=tokens(s); let score=0;
    for(const w of q)if(st.includes(w))score+=2.2;
    if(idx===0)score+=1.1;
    if(type==='date'&&/\b(1[0-9]{3}|20[0-9]{2})\b/.test(s))score+=2.8;
    if(type==='person'&&/\b(fue|es|nació|nacio|científic|filóso|polític|inventor|escritor|físic|matemátic)/i.test(s))score+=2.1;
    if(type==='cause'&&/\b(debido|porque|caus|provoc|como consecuencia|resultado de)\b/i.test(s))score+=2.3;
    if(type==='definition'&&/\b(es|fue|se denomina|consiste|proceso|movimiento|sistema)\b/i.test(s))score+=1.8;
    if(/\bsegún la historiografía|cita requerida|este artículo|puede referirse\b/i.test(s))score-=3;
    return score-(s.length/900);
  }
  function synthesize(x,docs){
    if(!docs?.length)return null;
    const type=intentType(x), candidates=[];
    docs.slice(0,6).forEach((d,di)=>{
      splitSentences(d.text).slice(0,10).forEach((s,si)=>candidates.push({s,title:d.title,score:sentenceScore(x,s,si,type)-di*.12}));
    });
    candidates.sort((a,b)=>b.score-a.score);
    const chosen=[];
    for(const c of candidates){
      if(c.score<0.5)continue;
      const sig=tokens(c.s).slice(0,8).join('|');
      if(chosen.some(z=>{const a=new Set(tokens(z.s)),b=tokens(c.s);let ov=0;for(const w of b)if(a.has(w))ov++;return ov>=Math.min(5,Math.floor(b.length*.65));}))continue;
      chosen.push(c); if(chosen.length>=3)break;
    }
    if(!chosen.length)return null;
    let body=chosen.map(c=>c.s).join(' ');
    body=stripNoise(body);
    if(body.length>850)body=body.slice(0,850).replace(/\s+\S*$/,'').replace(/[,;:]$/,'')+'.';
    return body;
  }
  function lastContext(){
    const conv=(S?.conversation||[]).slice(-40).reverse();
    for(const m of conv){const t=safeVisible(m?.content);if(!t||t.length<40||WAIT.test(t))continue;if(m.role==='assistant'||m.role==='user')return t;}
    const nodes=(S?.photon?.nodes||[]).slice(-500).reverse();
    for(const n of nodes){const t=safeVisible(n.content);if(t&&t.length>=40&&!WAIT.test(t))return t;}
    return null;
  }
  function summarizeText(t){
    const ss=splitSentences(t);if(!ss.length)return stripNoise(t).slice(0,700);
    if(ss.length<=3)return ss.join(' ');
    const freq=new Map();for(const s of ss)for(const w of tokens(s))freq.set(w,(freq.get(w)||0)+1);
    const ranked=ss.map((s,i)=>({s,i,score:tokens(s).reduce((a,w)=>a+(freq.get(w)||0),0)/(4+Math.sqrt(s.length))}));
    return ranked.sort((a,b)=>b.score-a.score).slice(0,3).sort((a,b)=>a.i-b.i).map(v=>v.s).join(' ');
  }
  function localTask12(x){
    if(!TASK.test(x))return null;
    const src=lastContext();
    if(!src)return'Necesito el contenido o el contexto que quieres transformar.';
    if(/\b(resume|resumir|resumen|resúmelo|resumelo|sintetiza)\b/i.test(x))return'Resumen: '+summarizeText(src);
    if(/\b(explica|simplifica)\b/i.test(x))return'En sencillo: '+summarizeText(src);
    if(/\b(lista|organiza|ordena)\b/i.test(x))return splitSentences(src).slice(0,6).map((s,i)=>`${i+1}. ${s}`).join('\n');
    if(/\b(analiza)\b/i.test(x))return`Análisis: ${summarizeText(src)}\n\nLo trataré como contexto, separando hechos, inferencias y puntos que necesiten verificación.`;
    if(/\b(reescribe|corrige)\b/i.test(x))return stripNoise(src);
    return null;
  }
  function builtins12(x){
    const n=norm(x);
    if(/\b(primera|primer)\b.*\b(computadora|ordenador|computador)\b|\b(computadora|ordenador|computador)\b.*\b(primera|primer)\b/i.test(n))return'Depende de qué signifique “primera”. La Z3 de Konrad Zuse (1941) suele considerarse la primera computadora programable totalmente automática. Colossus fue una de las primeras electrónicas digitales programables y ENIAC suele citarse como la primera electrónica digital de propósito general.';
    return null;
  }
  function learned12(x){
    const ws=tokens(x);if(!ws.length)return null;let best=null,score=0;
    for(const n of (S?.photon?.nodes||[]).slice(-1000)){
      if(!['knowledge','answer-synthesis'].includes(n.kind))continue;
      const t=safeVisible(n.content);if(!t||t.length<25)continue;
      let s=0;const nw=tokens(t);for(const w of ws)if(nw.includes(w))s++;
      if(n.kind==='answer-synthesis')s+=.8;
      if(s>score){score=s;best=t;}
    }
    return score>=1.6?best:null;
  }
  function queryVariants12(x){
    const q=stripAccents(norm(x)).replace(/[¿?¡!.,;:()\[\]{}]/g,' ').replace(/\b(cual|cuál|que|qué|quien|quién|como|cómo|cuando|cuándo|donde|dónde|dime|sabes|explica|por favor)\b/g,' ').replace(/\s+/g,' ').trim();
    const out=[];if(q)out.push(q.slice(0,180));out.push(clean(x,180));
    return[...new Set(out.filter(Boolean))].slice(0,3);
  }
  async function searchDocs12(x){
    if(!navigator.onLine||SENSITIVE.test(x))return[];
    const docs=[];
    for(const q of queryVariants12(x)){
      try{
        const su=`https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=5&format=json&origin=*`;
        const sr=await fetch(su,{cache:'no-store'});if(!sr.ok)continue;const sj=await sr.json();const titles=(sj?.query?.search||[]).map(v=>v.title).filter(Boolean).slice(0,5);if(!titles.length)continue;
        const eu=`https://es.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&redirects=1&format=json&origin=*&titles=${encodeURIComponent(titles.join('|'))}`;
        const er=await fetch(eu,{cache:'no-store'});if(!er.ok)continue;const ej=await er.json();
        for(const p of Object.values(ej?.query?.pages||{})){
          const text=stripNoise(p.extract||'');if(text.length>70&&!docs.some(d=>d.title===p.title))docs.push({title:p.title,text});
        }
        if(docs.length>=5)break;
      }catch{}
    }
    return docs;
  }
  async function answerExternal12(x,mySeq){
    const docs=await searchDocs12(x);if(mySeq!==seq12)return;
    const answer=synthesize(x,docs);
    if(!answer){
      const local=learned12(x)||memory(x)[0]?.content;
      show(local?safeVisible(local):'No tengo suficiente información fiable para responder eso todavía.');mode('awake');return;
    }
    await remember('answer-synthesis',answer,{status:'inferred',provenance:'synthesis-from-public-evidence-v12'});
    for(const d of docs.slice(0,3))await remember('knowledge',`${d.title}: ${d.text}`,{status:'observed',provenance:'wikipedia-public-evidence-v12'});
    show(answer);mode('awake');
    S.conversation.push({id:uid(),at:now(),role:'assistant',content:answer,engine:'synthesis-v12'});S.conversation=S.conversation.slice(-100);scheduleSave(80);
  }
  function local12(x){
    const u=directUtility(x);if(u)return u;
    const task=localTask12(x);if(task)return task;
    const b=builtins12(x);if(b)return b;
    const l=learned12(x);if(l)return l;
    return null;
  }
  send=function(){
    const x=entry.value.trim();if(!x)return;entry.value='';const n=norm(x),mySeq=++seq12;
    if(n==='iter'){if(!S.awake)wake();else show('Sí.');return;}
    if(!S.awake){show('');return;}
    if(n==='duerme'||n==='detente'){sleep();return;}
    const local=local12(x);
    if(local){show(local);mode('awake');queueBackground(x,local);return;}
    if(QUESTION(x)&&navigator.onLine&&!SENSITIVE.test(x)){
      mode('thinking');answerExternal12(x,mySeq);return;
    }
    const m=memory(x)[0]?.content;
    const a=m?safeVisible(m):'No tengo ese dato materializado todavía. Puedo seguir con lo que ya tengo en Photon sin inventar información.';
    show(a);mode('awake');queueBackground(x,a);
  };
  if(S?.contract){S.contract.version=12;S.contract.essence={...(S.contract.essence||{}),synthesisBeforeVisible:true,rawEvidenceNeverVisibleByDefault:true,photonFirst:true,offlineFirst:true,identityPreserved:true};}
})();