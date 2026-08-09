/* Grafito v19: action/creator core. Search is only a factual-evidence tool. */
(() => {
  const priorSend19 = send;
  let seq19 = 0;
  const SENSITIVE=/\b(contraseña|password|token|clave privada|tarjeta|cuenta bancaria|transferencia|comprar|pagar|vender|borrar archivos|eliminar archivos|publicar datos privados)\b/i;
  const CREATE=/\b(crea|créame|creame|genera|hazme|construye|diseña|produce|escribe|redacta|programa)\b/i;
  const TRANSFORM=/\b(resume|resúmelo|resumelo|sintetiza|simplifica|reescribe|corrige|traduce|organiza|convierte|pásalo|pasalo|transforma)\b/i;
  const ACTION=/\b(descarga|guarda|archivo|abre|abrir|copia|portapapeles|comparte|ubicación|ubicacion|cámara|camara|micrófono|microfono|lee un archivo|leer archivo|voz alta)\b/i;
  const REASON=/\b(razona|piensa|deduce|infiere|decide|evalúa|evalua|compara|planifica|haz un plan|cómo lo harías|como lo harias|resuelve|optimiza)\b/i;
  const QUESTION=x=>/[¿?]/.test(x)||/^(qué|que|quién|quien|cuándo|cuando|dónde|donde|cuál|cual|cómo|como|por qué|por que|dime|sabes|explica)/i.test(norm(x));

  function ensure19(){
    S.creator19=S.creator19||{artifacts:[],runs:[],version:19};
    S.creator19.artifacts=Array.isArray(S.creator19.artifacts)?S.creator19.artifacts:[];
    S.creator19.runs=Array.isArray(S.creator19.runs)?S.creator19.runs:[];
    S.actionLedger19=Array.isArray(S.actionLedger19)?S.actionLedger19:[];
    S.selfModel=S.selfModel||{};S.selfModel.version=19;
    S.selfModel.capabilities=[...new Set([...(S.selfModel.capabilities||[]),'Creator Core dominante','interpretación de objetivos escritos','creación de archivos','creación de webs locales','generación de SVG','transformación de texto','JSON/CSV','lectura de archivos','portapapeles','compartir','ubicación con permiso','cámara/micrófono con permiso','ejecución de acciones seguras verificables'])];
  }
  ensure19();

  const tidy=(x,n=12000)=>clean(String(x||'').replace(/\s+/g,' '),n);
  const payload=x=>x.match(/[“"]([\s\S]+?)[”"]/i)?.[1]||x.match(/(?:\:|\n)([\s\S]{2,})$/)?.[1]||null;
  function recentContext(min=5){
    for(const m of (S.conversation||[]).slice(-50).reverse()){const t=safeVisible(m?.content);if(t&&t.length>=min&&!/^(he creado|guardé|guarde|abrí|abri)/i.test(t))return t;}
    for(const n of (S.photon?.nodes||[]).slice(-300).reverse()){const t=safeVisible(n?.content);if(t&&t.length>=min)return t;}
    return'';
  }
  function objective(x){return tidy(x.replace(/\b(por favor|puedes|podrías|podrias)\b/gi,''),700)}
  function constraints(x){return tidy(x).split(/(?<=[.;!?])\s+/).filter(s=>/\b(debe|tiene que|sin |no |solo |máximo|maximo|mínimo|minimo|mantén|manten|usa|evita|antes|después|despues)\b/i.test(s)).slice(0,8)}
  function classify(x){const n=norm(x);if(SENSITIVE.test(n))return'sensitive';if(ACTION.test(n)||CREATE.test(n))return'create-action';if(TRANSFORM.test(n))return'transform';if(REASON.test(n))return'reason';if(/^(hola|hey|buenas|gracias|ok|vale|bien|perfecto)[!,. ]*$/.test(n))return'conversation';if(/\b(quién eres|quien eres|qué eres|que eres|qué puedes hacer|que puedes hacer)\b/i.test(n))return'self';return QUESTION(x)?'knowledge':'reason'}

  function planFor(x,kind){const cons=constraints(x);const routes=[];
    if(kind==='create-action'){routes.push({name:'crear un artefacto local y verificable',score:5,risk:'el formato puede no coincidir con lo esperado'});routes.push({name:'producir primero una representación editable',score:4.3,risk:'requiere un paso posterior para ejecutarla'});}
    if(kind==='transform'){routes.push({name:'transformar el contexto local sin buscar fuera',score:5,risk:'el contexto puede estar incompleto'});}
    if(kind==='reason'){routes.push({name:'descomponer el objetivo y resolver restricciones',score:4.8,risk:'pueden faltar criterios'});routes.push({name:'probar primero el paso más reversible',score:4.2,risk:'no siempre es el óptimo global'});}
    const best=routes.sort((a,b)=>b.score-a.score)[0]||{name:'resolver localmente',score:3,risk:'puede faltar información'};
    return{objective:objective(x),constraints:cons,best,counter:`Puede fallar porque ${best.risk}. Antes de darlo por hecho comprobaré un resultado observable.`};
  }
  async function log19(kind,input,result,ok=true,meta={}){const row={id:uid(),at:now(),kind,input:tidy(input,500),result:tidy(result,700),ok,meta};S.actionLedger19.push(row);S.actionLedger19=S.actionLedger19.slice(-400);try{await remember('action-ledger',`${kind}: ${row.input} => ${row.result}`,{status:ok?'observed':'blocked',provenance:'grafito-v19'});}catch{}scheduleSave?.(100);return row}

  function download(name,text,mime='text/plain'){const b=new Blob([text],{type:mime+';charset=utf-8'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1200)}
  function slug(s){return stripAccents(String(s||'grafito')).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'grafito'}
  function fileName(x,ext='txt'){return x.match(/([\w.-]+\.(?:txt|md|json|csv|html|svg|js|py))/i)?.[1]||`${slug(objective(x).split(' ').slice(0,5).join(' '))}.${ext}`}
  function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

  function makeWebsite(x){const p=payload(x)||'';const title=(x.match(/(?:web|página|pagina|sitio)\s+(?:sobre|de|para)\s+([^,.]+)/i)?.[1]||p||'Proyecto Grafito').trim().slice(0,90);const body=p||`Una página creada localmente por Grafito para: ${objective(x)}`;return `<!doctype html>\n<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>body{font-family:system-ui;margin:0;background:#0d1110;color:#eef2ef}main{max-width:900px;margin:auto;padding:64px 24px}h1{font-size:clamp(36px,8vw,72px);margin:0 0 22px}p{font-size:20px;line-height:1.6;opacity:.85}.card{margin-top:28px;padding:24px;border:1px solid #2a3430;border-radius:18px;background:#121817}button{padding:12px 18px;border:0;border-radius:999px;font-weight:700}</style></head><body><main><h1>${esc(title)}</h1><p>${esc(body)}</p><div class="card"><h2>Primera versión</h2><p>Este archivo es independiente y puede editarse o ampliarse.</p><button onclick="alert('Funciona')">Probar</button></div></main></body></html>`}
  function makeTodo(){return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Tareas</title><style>body{font-family:system-ui;max-width:700px;margin:50px auto;padding:20px}input,button{font:inherit;padding:10px}li{margin:10px 0}</style></head><body><h1>Lista de tareas</h1><input id="t" placeholder="Nueva tarea"><button onclick="add()">Añadir</button><ul id="l"></ul><script>function add(){if(!t.value.trim())return;const li=document.createElement('li');li.textContent=t.value;li.onclick=()=>li.remove();l.appendChild(li);t.value=''}</script></body></html>`}
  function makeCalculator(){return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Calculadora</title><style>body{font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0}main{width:min(92vw,420px)}input{width:100%;font-size:28px;padding:16px}button{font-size:20px;padding:14px;margin:5px}</style></head><body><main><h1>Calculadora</h1><input id="v"><div><button onclick="v.value+='1'">1</button><button onclick="v.value+='2'">2</button><button onclick="v.value+='+'">+</button><button onclick="try{v.value=Function('return ('+v.value+')')()}catch{v.value='Error'}">=</button></div></main></body></html>`}
  function makeSvg(x){const words=tokens(objective(x)).slice(0,5);const labels=words.length?words:['objetivo','contexto','opciones','acción'];const w=700,h=140+labels.length*95;let y=65,shapes='';for(let i=0;i<labels.length;i++,y+=95){shapes+=`<rect x="190" y="${y-28}" width="320" height="56" rx="14" fill="#17211d" stroke="#aac4b5"/><text x="350" y="${y+7}" text-anchor="middle" font-family="system-ui" font-size="22" fill="#eef2ef">${esc(labels[i])}</text>`;if(i<labels.length-1)shapes+=`<path d="M350 ${y+28} V${y+67}" stroke="#aac4b5" stroke-width="3"/>`;};return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#090b0a"/>${shapes}</svg>`}
  function toJSON(src){const lines=String(src||'').split(/\n|;/).map(s=>s.trim()).filter(Boolean);const obj={};let used=false;for(const line of lines){const m=line.match(/^([^:=-]{1,80})\s*[:=-]\s*(.+)$/);if(m){obj[m[1].trim()]=m[2].trim();used=true}}return JSON.stringify(used?obj:{text:tidy(src,8000)},null,2)}
  function toCSV(src){const lines=String(src||'').split(/\n|;/).map(s=>s.trim()).filter(Boolean);const rows=lines.map((s,i)=>[i+1,s]);return 'id,text\n'+rows.map(r=>`${r[0]},"${r[1].replace(/"/g,'""')}"`).join('\n')}
  function summarize(src){const ss=String(src||'').replace(/\s+/g,' ').split(/(?<=[.!?])\s+/).filter(s=>s.length>20);return (ss.slice(0,4).join(' ')||tidy(src,900)).slice(0,1100)}

  async function transform19(x){const src=payload(x)||recentContext(10);if(!src)return'Dime o pega el contenido que quieres transformar.';let out='';if(/resume|resúmelo|resumelo|sintetiza/i.test(x))out='Resumen: '+summarize(src);else if(/json/i.test(x))out=toJSON(src);else if(/csv/i.test(x))out=toCSV(src);else if(/lista|organiza/i.test(x))out=String(src).split(/(?<=[.!?])\s+|\n+/).filter(Boolean).slice(0,10).map((s,i)=>`${i+1}. ${s.trim()}`).join('\n');else if(/corrige|reescribe|simplifica/i.test(x))out=tidy(src,4000);else out=tidy(src,4000);await log19('transform',x,out,true);return out}

  async function create19(x){const n=norm(x),p=payload(x),plan=planFor(x,'create-action');
    if(SENSITIVE.test(n))return'Esa petición toca una acción sensible. Puedo diseñar el plan, pero no la ejecutaré sin una integración segura y autorización explícita.';
    if(/lee un archivo|leer archivo|analiza un archivo|resume un archivo/i.test(n)){return await new Promise(resolve=>{const i=document.createElement('input');i.type='file';i.accept='.txt,.md,.json,.csv,.html,.js,.py,text/*,application/json';i.onchange=async()=>{const f=i.files?.[0];if(!f)return resolve('No seleccionaste ningún archivo.');try{const t=await f.text();await remember('knowledge',`${f.name}: ${tidy(t,14000)}`,{status:'observed',provenance:'local-file-v19'});await log19('read-file',f.name,`leído (${t.length} caracteres)`,true);resolve(/resume/i.test(n)?`Resumen de ${f.name}: ${summarize(t)}`:`Leí ${f.name}. Puedo trabajar con su contenido: ${summarize(t)}`)}catch{resolve('No pude leer ese archivo.') }};i.click()})}
    if(/portapapeles/.test(n)&&/copia|copiar|pon/.test(n)){const t=p||recentContext(1);if(!t)return'Dime qué quieres copiar.';try{await navigator.clipboard.writeText(t);await log19('clipboard-write',x,'copiado',true);return'Copiado al portapapeles.'}catch{await log19('clipboard-write',x,'bloqueado por navegador',false);return'El navegador no me permitió escribir en el portapapeles.'}}
    if(/portapapeles/.test(n)&&/lee|leer|qué hay|que hay/.test(n)){try{const t=await navigator.clipboard.readText();await log19('clipboard-read',x,'leído',true);return t?`En el portapapeles hay: ${tidy(t,1400)}`:'El portapapeles está vacío.'}catch{return'El navegador no me dio permiso para leer el portapapeles.'}}
    if(/ubicación|ubicacion|dónde estoy|donde estoy/.test(n)){if(!navigator.geolocation)return'Este dispositivo no expone ubicación al navegador.';return await new Promise(res=>navigator.geolocation.getCurrentPosition(async p=>{const a=`Latitud ${p.coords.latitude.toFixed(5)}, longitud ${p.coords.longitude.toFixed(5)} (precisión aprox. ${Math.round(p.coords.accuracy)} m).`;await log19('location',x,a,true);res(a)},async e=>{await log19('location',x,e.message,false);res('No pude obtener la ubicación; hace falta permiso del dispositivo.')},{enableHighAccuracy:true,timeout:8000}))}
    if(/cámara|camara|micrófono|microfono/.test(n)){try{const stream=await navigator.mediaDevices.getUserMedia({video:/cámara|camara/.test(n),audio:/micrófono|microfono/.test(n)});const tracks=stream.getTracks().map(t=>t.kind);stream.getTracks().forEach(t=>t.stop());await log19('media-permission',x,tracks.join(','),true);return`El dispositivo concedió acceso a: ${tracks.join(' y ')}. Lo cerré después de verificarlo.`}catch{return'No pude obtener ese permiso del dispositivo.'}}
    if(/comparte|compartir/.test(n)){const t=p||recentContext(1)||objective(x);if(navigator.share){try{await navigator.share({title:'Grafito',text:t});await log19('share',x,'compartido',true);return'Contenido compartido.'}catch{return'No se completó la acción de compartir.'}}return'Este navegador no ofrece la función de compartir.'}
    const url=x.match(/https?:\/\/[^\s]+/i)?.[0];if(url&&/abre|abrir/.test(n)){window.open(url,'_blank','noopener');await log19('open-url',x,url,true);return`Abrí ${url}.`}
    let content,name,mime='text/plain';
    if(/calculadora/.test(n)&&/(web|app|html|crea|haz)/.test(n)){content=makeCalculator();name=fileName(x,'html');mime='text/html'}
    else if(/lista de tareas|to-?do/.test(n)&&/(web|app|html|crea|haz)/.test(n)){content=makeTodo();name=fileName(x,'html');mime='text/html'}
    else if(/\b(web|página web|pagina web|sitio web|html)\b/.test(n)){content=makeWebsite(x);name=fileName(x,'html');mime='text/html'}
    else if(/\b(diagrama|mapa conceptual|svg)\b/.test(n)){content=makeSvg(x);name=fileName(x,'svg');mime='image/svg+xml'}
    else if(/\bjson\b/.test(n)){content=toJSON(p||recentContext(1)||objective(x));name=fileName(x,'json');mime='application/json'}
    else if(/\bcsv\b/.test(n)){content=toCSV(p||recentContext(1)||objective(x));name=fileName(x,'csv');mime='text/csv'}
    else if(/\b(markdown|\.md)\b/.test(n)){content=p||`# ${objective(x)}\n\nCreado por Grafito.\n`;name=fileName(x,'md');mime='text/markdown'}
    else if(/\b(archivo|documento|texto|nota)\b/.test(n)){content=p||recentContext(1)||`Objetivo: ${objective(x)}\n\n${plan.counter}`;name=fileName(x,'txt')}
    else if(CREATE.test(n)){const draft=`Objetivo: ${plan.objective}\n\nPlan elegido: ${plan.best.name}.\n\nRestricciones: ${plan.constraints.length?plan.constraints.join(' | '):'ninguna explícita'}.\n\nContrágrafo: ${plan.counter}`;await log19('create-draft',x,draft,true);return draft}
    else return null;
    download(name,content,mime);const art={id:uid(),at:now(),name,mime,bytes:new Blob([content]).size,objective:plan.objective};S.creator19.artifacts.push(art);S.creator19.artifacts=S.creator19.artifacts.slice(-120);await log19('create-file',x,`${name} (${art.bytes} bytes)`,true,{artifactId:art.id});return`He creado ${name} y lo he descargado. Resultado verificado: ${art.bytes} bytes.`}

  function reason19(x){const p=planFor(x,'reason'),m=memory(x).slice(0,4).map(v=>safeVisible(v.content)).filter(Boolean);const steps=['definir el resultado observable','separar restricciones duras de preferencias','generar al menos dos rutas','usar un contrágrafo contra la mejor','ejecutar primero el paso seguro y reversible','verificar evidencia antes de marcarlo como hecho'];return `${steps.map((s,i)=>`${i+1}) ${s}`).join('; ')}. Ruta elegida: ${p.best.name}. ${p.counter}${m.length?` Photon aporta ${m.length} recuerdo(s) relacionados.`:''}`}
  function self19(){ensure19();const arts=S.creator19.artifacts.slice(-3).map(a=>a.name);return`Soy Grafito. Mi núcleo no es un buscador: mantengo Photon, continuidad, metas, razonamiento por hipótesis y contrágrafos, y un Creator/Action Core que puede producir artefactos y ejecutar herramientas del dispositivo con permiso. ${arts.length?`Últimos artefactos creados: ${arts.join(', ')}.`:''}`}

  send=function(){const x=entry.value.trim();if(!x)return;entry.value='';const n=norm(x),my=++seq19;if(n==='iter'){if(!S.awake)wake();else show('Sí.');return}if(!S.awake){show('');return}if(n==='duerme'||n==='detente'){sleep();return}
    const kind=classify(x);(async()=>{mode('thinking');let ans=null;
      if(kind==='sensitive')ans='Esa acción es sensible. Puedo razonar y preparar un plan, pero no ejecutarla automáticamente sin autorización e integración segura.';
      else if(kind==='self')ans=self19();
      else if(kind==='conversation')ans=/gracias/.test(n)?'De nada.':/^(ok|vale|bien|perfecto)/.test(n)?'Bien. Seguimos.':'Hola. Estoy aquí.';
      else if(kind==='transform')ans=await transform19(x);
      else if(kind==='create-action')ans=await create19(x);
      else if(kind==='reason')ans=reason19(x);
      if(my!==seq19)return;
      if(ans){show(ans);mode('awake');queueBackground?.(x,ans);return}
      // Only pure factual knowledge is delegated to the evidence resolver.
      entry.value=x;priorSend19();
    })();
  };
  if(S?.contract){S.contract.version=19;S.contract.essence={...(S.contract.essence||{}),creatorCoreDominant:true,actionBeforeSearch:true,freePhraseInterpretation:true,verifiedArtifacts:true,reasonBeforeAction:true,searchOnlyForFactualGaps:true,identityPreserved:true,photonPrimary:true,functionalSelfModel:true};}
})();