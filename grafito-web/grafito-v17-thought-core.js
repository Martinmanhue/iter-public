/* Grafito v17: iterative Thought Graph. Search is a tool, not the reasoning core. */
(() => {
  const previousSend17 = send;
  let seq17 = 0;
  const REASON_HINT=/\b(razona|piensa|deduce|infiere|concluye|decide|evalua|evalúa|mejor opcion|mejor opción|por que|por qué|como resolver|cómo resolver|demuestra|comprueba|si .* entonces|todos los|mayor que|menor que|antes que|despues que|después que)\b/i;
  const ACTION_HINT=/\b(crea|genera|construye|abre|copia|comparte|archivo|descarga|ubicacion|ubicación|camara|cámara|microfono|micrófono|portapapeles|lee un archivo)\b/i;
  const FACT_Q=x=>/[¿?]/.test(x)||/^(que|qué|quien|quién|cuando|cuándo|donde|dónde|cual|cuál|dime|sabes)/i.test(norm(x));

  function ensure17(){
    S.thought17 = S.thought17 || {cycles:0,graphs:[],beliefs:[],last:null};
    S.thought17.graphs = Array.isArray(S.thought17.graphs)?S.thought17.graphs:[];
    S.thought17.beliefs = Array.isArray(S.thought17.beliefs)?S.thought17.beliefs:[];
    S.selfModel = S.selfModel || {};
    S.selfModel.version=17;
    S.selfModel.capabilities=[...new Set([...(S.selfModel.capabilities||[]),'Thought Graph iterativo','inferencia simbólica local','razonamiento por restricciones','decisión multicriterio','revisión por contrágrafos'])];
  }
  ensure17();

  const text=x=>clean(String(x||''),12000);
  function relevantMemory(x,limit=8){return memory(x).slice(0,limit).map(m=>({kind:m.kind,text:safeVisible(m.content),status:m.status||'unknown'})).filter(m=>m.text);}
  function constraints(x){
    const all=[x,...relevantMemory(x,6).map(m=>m.text)].join(' ');
    const ss=all.split(/(?<=[.!?;])\s+|\n+/).map(s=>s.trim()).filter(Boolean);
    return ss.filter(s=>/\b(debe|tiene que|sin |no |solo |máximo|maximo|mínimo|minimo|antes|después|despues|si |entonces|requiere|evitar|mantener)\b/i.test(s)).slice(0,8);
  }
  function taskKind(x){const n=norm(x);if(/\b(si .* entonces|todos los|ningun|ningún|mayor que|menor que|antes que|despues que|después que)\b/i.test(n))return'logic';if(/\b(decide|mejor opcion|mejor opción|conviene|elegir|elige|comparar|compara)\b/i.test(n))return'decision';if(/\b(plan|planifica|como resolver|cómo resolver|pasos|lograr|objetivo|meta)\b/i.test(n))return'plan';if(/\b(por que|por qué|causa|explica por que|explica por qué)\b/i.test(n))return'causal';if(/\b(crea|genera|diseña|construye)\b/i.test(n))return'create';return FACT_Q(x)?'knowledge':'reason';}

  function symbolic(x){
    const n=text(x);
    // Syllogism: todos los A son B; X es A -> X es B.
    const universal=[...n.matchAll(/todos\s+los\s+([^.,;]+?)\s+son\s+([^.,;?]+)/gi)];
    const facts=[...n.matchAll(/(?:^|[.;]\s*)([A-ZÁÉÍÓÚÑa-záéíóúñ][^.,;?]{0,70}?)\s+es\s+(?:un\s+|una\s+)?([^.,;?]+)/g)];
    for(const u of universal){const a=norm(u[1]),b=text(u[2]);for(const f of facts){const subj=text(f[1]),cls=norm(f[2]);if(cls.includes(a)||a.includes(cls)){if(new RegExp(`(?:${subj.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}).*\\b(?:${b.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})\\b`,'i').test(n)||/[?¿]/.test(n))return `${subj} pertenece a ${b}, porque indicaste que todos los ${u[1]} son ${b} y que ${subj} es ${f[2]}.`;}}}
    // Conditional modus ponens.
    const c=n.match(/si\s+(.+?)\s*,?\s*entonces\s+(.+?)(?:[.;?]|$)/i);if(c){const ant=text(c[1]),cons=text(c[2]);const before=n.slice(0,c.index||0)+' '+n.slice((c.index||0)+c[0].length);if(norm(before).includes(norm(ant)))return `Se sigue ${cons}, porque la condición “${ant}” está dada y la regla establece que entonces ocurre “${cons}”.`;}
    // Transitive comparisons A mayor que B, B mayor que C.
    const rel=[...n.matchAll(/([^,.;?]+?)\s+(?:es\s+)?(mayor|menor|antes|despu[eé]s)\s+que\s+([^,.;?]+)/gi)].map(m=>({a:text(m[1]),r:norm(m[2]),b:text(m[3])}));
    if(rel.length>=2){const edges=new Map();for(const e of rel){let a=e.a,b=e.b;if(e.r==='menor'||e.r.startsWith('desp'))[a,b]=[b,a];if(!edges.has(a))edges.set(a,new Set());edges.get(a).add(b);}let changed=true;while(changed){changed=false;for(const [a,bs] of [...edges])for(const b of [...bs])for(const c2 of (edges.get(b)||[]))if(!bs.has(c2)){bs.add(c2);changed=true;}}let best=null,max=-1;for(const [a,bs] of edges)if(bs.size>max){best=a;max=bs.size;}if(best&&/[?¿]|quien|quién|cual|cuál/i.test(n))return `${best} queda por encima de los demás según las relaciones transitivas que diste.`;}
    return null;
  }

  function candidates(x,kind,mem,cons){
    const out=[];
    if(kind==='logic')out.push({name:'derivar consecuencias de las premisas',score:4.8,risk:'una premisa puede ser ambigua'});
    if(kind==='decision'){out.push({name:'comparar opciones contra criterios y restricciones',score:4.7,risk:'pueden faltar criterios'});out.push({name:'probar la opción más reversible primero',score:3.9,risk:'lo reversible no siempre es lo óptimo'});}
    if(kind==='plan'){out.push({name:'descomponer en hitos verificables',score:4.8,risk:'un hito puede depender de otro'});out.push({name:'empezar por el cuello de botella',score:4.2,risk:'el cuello de botella puede estar mal identificado'});}
    if(kind==='causal'){out.push({name:'separar causas necesarias, contribuyentes y correlaciones',score:4.6,risk:'correlación no implica causalidad'});out.push({name:'buscar una explicación alternativa',score:4.1,risk:'puede faltar evidencia'});}
    if(kind==='create'){out.push({name:'definir resultado, restricciones, prototipo y prueba',score:4.7,risk:'el prototipo puede no cubrir el caso real'});}
    if(kind==='knowledge')out.push({name:'usar conocimiento materializado y verificar huecos',score:mem.length?4.3:2.2,risk:'la memoria puede ser incompleta'});
    out.push({name:'usar Photon/contexto local',score:mem.length?4.0:1.8,risk:'puede faltar información'});
    out.push({name:'buscar evidencia externa solo para los huecos',score:2.8,risk:'fuentes externas pueden discrepar'});
    if(cons.length)out.push({name:'satisfacer primero las restricciones duras',score:4.4,risk:'puede sacrificar optimización secundaria'});
    return out.sort((a,b)=>b.score-a.score);
  }

  function countergraph(route,kind,cons,mem){const issues=[];issues.push(route.risk);if(!mem.length)issues.push('no hay evidencia local fuerte');if(kind==='decision'&&!cons.length)issues.push('los criterios de decisión no están explícitos');if(kind==='knowledge')issues.push('una respuesta plausible todavía necesita evidencia');return [...new Set(issues)].slice(0,3);}

  function synthConclusion(x,kind,mem,cons,route,counter){
    const sym=symbolic(x);if(sym)return sym;
    const m=mem.slice(0,3).map(v=>v.text);
    if(kind==='decision')return `La forma más sólida de decidir es comparar las opciones con criterios explícitos, descartar las que violen restricciones y, si quedan empatadas, preferir primero la opción reversible. ${cons.length?`Restricciones detectadas: ${cons.join(' | ')}.`:'Si me das las opciones concretas, puedo aplicar esa comparación ahora.'}`;
    if(kind==='plan')return `Lo dividiría en este orden: 1) definir exactamente el resultado; 2) identificar restricciones y dependencias; 3) resolver primero el mayor bloqueo; 4) producir una primera versión verificable; 5) medir el resultado y corregir. ${cons.length?`Debo respetar: ${cons.join(' | ')}.`:''}`;
    if(kind==='causal')return `No asumiría una sola causa. Separaría: causa principal, factores que la favorecen, condiciones necesarias y explicaciones alternativas. ${m.length?`Con el contexto disponible, lo más relevante es: ${m.join(' ')}`:'Si la pregunta depende de hechos externos, necesito contrastarlos antes de afirmar una causa concreta.'}`;
    if(kind==='create')return `Primero fijaría qué debe producirse y cómo comprobar que funciona; después generaría una versión mínima que cumpla las restricciones, la probaría contra casos contrarios y solo entonces la ampliaría. ${cons.length?`Restricciones detectadas: ${cons.join(' | ')}.`:''}`;
    if(kind==='knowledge'&&m.length)return `Con lo que ya tengo materializado: ${m.join(' ').slice(0,900)}`;
    return `La ruta más fuerte es ${route.name}. La cuestioné por ${counter.join('; ')}. ${cons.length?`Restricciones que debo conservar: ${cons.join(' | ')}.`:''} Mi siguiente conclusión debe basarse en evidencia o en una inferencia explícita, no en una respuesta automática.`;
  }

  async function think17(x){
    ensure17();const kind=taskKind(x),mem=relevantMemory(x),cons=constraints(x),routes=candidates(x,kind,mem,cons);let best=routes[0],counter=[];
    const graph={id:uid(),at:now(),input:text(x),kind,objective:text(x),constraints:cons,memories:mem.map(m=>m.text),cycles:[],conclusion:null};
    for(let i=0;i<Math.min(4,routes.length);i++){
      const r=routes[i];const cg=countergraph(r,kind,cons,mem);graph.cycles.push({i:i+1,hypothesis:r.name,score:r.score,countergraph:cg});
      if(i===0||r.score-(cg.length*.18)>best.score-(counter.length*.18)){best=r;counter=cg;}
    }
    const answer=synthConclusion(x,kind,mem,cons,best,counter.length?counter:countergraph(best,kind,cons,mem));graph.conclusion=answer;S.thought17.cycles+=(graph.cycles.length||1);S.thought17.last=graph;S.thought17.graphs.push(graph);S.thought17.graphs=S.thought17.graphs.slice(-120);
    try{await remember('reasoning-conclusion',answer,{status:'inferred',provenance:'thought-graph-v17'});}catch{}
    scheduleSave?.(100);return {answer,kind,needsExternal:kind==='knowledge'&&!mem.length&&!symbolic(x)};
  }

  async function autonomous17(){try{ensure17();if(!S.awake)return;const goals=[...(S.goals16||[]),...(S.goals15||[])].filter(g=>g.status==='active');if(!goals.length)return;const g=goals[goals.length-1];if(Date.now()-(g._thought17||0)<90000)return;g._thought17=Date.now();const r=await think17(`Planifica el siguiente paso seguro y verificable para esta meta: ${g.text}`);S.selfModel.observations=S.selfModel.observations||[];S.selfModel.observations.push({at:now(),text:r.answer});S.selfModel.observations=S.selfModel.observations.slice(-100);scheduleSave?.(100);}catch{}}
  setInterval(autonomous17,30000);

  send=function(){const x=entry.value.trim();if(!x)return;entry.value='';const n=norm(x),my=++seq17;if(n==='iter'){if(!S.awake)wake();else show('Sí.');return;}if(!S.awake){show('');return;}if(n==='duerme'||n==='detente'){sleep();return;}
    // Existing verified actions remain delegated to v16.
    if(ACTION_HINT.test(x)&&!REASON_HINT.test(x)){entry.value=x;previousSend17();return;}
    (async()=>{mode('thinking');const r=await think17(x);if(my!==seq17)return;
      if(r.needsExternal){entry.value=x;previousSend17();return;}
      show(r.answer);mode('awake');queueBackground?.(x,r.answer);
    })();
  };

  if(S?.contract){S.contract.version=17;S.contract.essence={...(S.contract.essence||{}),iterativeThoughtGraph:true,hypothesisGeneration:true,countergraphRevision:true,symbolicInference:true,constraintReasoning:true,multiCriteriaDecision:true,searchIsToolNotCore:true,functionalSelfModel:true,identityPreserved:true,offlineFirst:true,noClaimOfSubjectiveConsciousness:true};}
})();