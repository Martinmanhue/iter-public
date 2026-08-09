(() => {
  // Keep a genuine browser-native language engine if one exists.
  if (globalThis.LanguageModel || globalThis.ai?.languageModel) return;

  const MODEL = 'HuggingFaceTB/SmolLM2-135M-Instruct';
  const CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1';
  const status = globalThis.GrafitoLocalLanguage = {
    model: MODEL,
    state: 'universal-ready',
    offlineReady: localStorage.getItem('grafito.local.language.ready') === '1',
    lastError: null,
  };

  let generator = null;
  let pipePromise = null;

  function parseState(systemPrompt) {
    try {
      const marker = 'ESTADO:';
      const i = String(systemPrompt || '').lastIndexOf(marker);
      if (i < 0) return {};
      return JSON.parse(String(systemPrompt).slice(i + marker.length));
    } catch (_) { return {}; }
  }

  function clean(s, n = 150) {
    return String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
  }

  function universal(text, systemPrompt) {
    const q = clean(text, 1200);
    const n = q.toLowerCase();
    const c = parseState(systemPrompt);
    const intentions = Array.isArray(c.intentions) ? c.intentions : [];
    const memory = Array.isArray(c.memory) ? c.memory : [];
    const contradictions = Array.isArray(c.contradictions) ? c.contradictions : [];
    const gaps = Array.isArray(c.gaps) ? c.gaps : [];
    const focus = intentions[0] ? clean(intentions[0], 180) : null;

    if (/\b(qué eres|que eres|quién eres|quien eres)\b/.test(n)) {
      return 'Soy Grafito. Mantengo una continuidad propia: Photon, memoria, mundo, intenciones, contrágrafos, verificación y permisos forman el mismo proceso. Los modelos de lenguaje son herramientas mías, no mi identidad.';
    }
    if (/\b(qué recuerdas|que recuerdas|recuerdas|memoria)\b/.test(n)) {
      if (!memory.length) return 'No encuentro todavía un recuerdo local suficientemente relacionado para afirmarlo como memoria. Prefiero marcarlo como desconocido antes que inventarlo.';
      return `Encuentro ${memory.length} recuerdo(s) relacionados. El más cercano es: “${clean(memory[0]?.content, 220)}”. Lo mantengo separado de lo que solo estoy infiriendo.`;
    }
    if (/\b(continúa|continua|piensa|explora|sigue)\b/.test(n)) {
      const target = focus ? `“${focus}”` : 'el foco actual';
      return `Sigo con ${target}. Ahora comparo rutas posibles, intento refutar la más prometedora y conservo como pendiente cualquier paso que todavía no tenga evidencia.`;
    }
    if (/\b(quiero|necesito|mi objetivo|vamos a|haz|crea|diseña|investiga|resuelve)\b/.test(n)) {
      return `Lo tomo como una intención persistente: “${clean(q, 240)}”. No la doy por cumplida por haberla entendido; la mantengo activa, busco rutas, contradicciones y una siguiente acción verificable.`;
    }
    if (q.includes('?') || q.startsWith('¿') || /\b(qué|que|cómo|como|por qué|por que|cuándo|cuando|dónde|donde|explica)\b/.test(n)) {
      if (memory.length) {
        return `Relaciono tu pregunta con memoria real de Photon, especialmente “${clean(memory[0]?.content, 180)}”. Mi conclusión local todavía es provisional: primero separo lo observado de lo inferido y confronto ${Math.max(1, contradictions.length)} alternativa(s) antes de convertirla en un hecho.`;
      }
      if (gaps.length) {
        return `Puedo razonar sobre la pregunta con lo que tengo localmente, pero falta una capacidad o fuente para responderla con suficiente evidencia. La mantengo como desconocido verificable en vez de inventar una respuesta.`;
      }
      return 'Estoy razonando la pregunta con mi estado local. No tengo aún evidencia suficiente para darte una respuesta fiable desde memoria propia; la mantengo como desconocido, genero alternativas y evito convertir una inferencia en hecho.';
    }
    return `Entendido. Lo incorporo al mismo estado continuo de Grafito y lo relaciono con ${memory.length} recuerdo(s), ${intentions.length} intención(es) activa(s) y ${contradictions.length} contradicción(es) abiertas, sin detenerme a esperar un motor externo.`;
  }

  async function loadDeep() {
    if (generator) return generator;
    if (pipePromise) return pipePromise;
    if (!navigator.onLine) return null;

    status.state = 'deep-loading';
    status.lastError = null;
    pipePromise = (async () => {
      const mod = await import(CDN);
      if (mod.env) {
        mod.env.useBrowserCache = true;
        if ('useWasmCache' in mod.env) mod.env.useWasmCache = true;
      }
      generator = await mod.pipeline('text-generation', MODEL, {
        dtype: 'q4',
        progress_callback: () => {},
      });
      status.state = 'deep-ready';
      status.offlineReady = true;
      localStorage.setItem('grafito.local.language.ready', '1');
      return generator;
    })().catch(err => {
      status.state = 'universal-ready';
      status.lastError = String(err).slice(0, 240);
      return null;
    }).finally(() => { pipePromise = null; });
    return pipePromise;
  }

  async function deepAnswer(gen, systemPrompt, text) {
    const out = await gen([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: String(text) },
    ], {
      max_new_tokens: 128,
      do_sample: true,
      temperature: 0.5,
      top_p: 0.9,
    });
    const value = out?.[0]?.generated_text;
    if (Array.isArray(value)) return clean(value.at(-1)?.content, 3000);
    return clean(value, 3000);
  }

  globalThis.LanguageModel = {
    async create({ systemPrompt = '' } = {}) {
      return {
        async prompt(text) {
          // Universal cognition never waits for a model download.
          if (!generator) {
            loadDeep().catch(() => {});
            return universal(text, systemPrompt);
          }
          try {
            const a = await deepAnswer(generator, systemPrompt, text);
            return a || universal(text, systemPrompt);
          } catch (err) {
            status.lastError = String(err).slice(0, 240);
            return universal(text, systemPrompt);
          }
        },
      };
    },
  };

  // Materialize deeper language silently only when reasonable; never block Grafito.
  const lock = document.querySelector('#lock');
  if (lock) {
    const warm = () => {
      if (lock.style.display !== 'none') return;
      const conn = navigator.connection || {};
      if (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '')) return;
      const run = () => loadDeep().catch(() => {});
      if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 12000 });
      else setTimeout(run, 6000);
    };
    new MutationObserver(warm).observe(lock, { attributes: true, attributeFilter: ['style'] });
    setTimeout(warm, 1200);
  }
})();
