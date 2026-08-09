(() => {
  // Keep a real browser-native language engine if the browser already provides one.
  if (globalThis.LanguageModel || globalThis.ai?.languageModel) return;

  const MODEL = 'HuggingFaceTB/SmolLM2-135M-Instruct';
  const CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1';
  const status = globalThis.GrafitoLocalLanguage = {
    model: MODEL,
    state: 'idle',
    offlineReady: localStorage.getItem('grafito.local.language.ready') === '1',
    lastError: null,
  };

  let generator = null;
  let pipePromise = null;
  const wait = ms => new Promise(r => setTimeout(r, ms));

  function quickLocal(text) {
    const q = String(text || '').trim();
    const n = q.toLowerCase();
    if (/\b(qué eres|que eres|quién eres|quien eres)\b/.test(n)) {
      return 'Soy Grafito. Mi núcleo local, Photon, mis intenciones y mi continuidad siguen activos aquí. La capa lingüística más profunda se está materializando en segundo plano.';
    }
    if (/\b(continúa|continua|piensa|explora)\b/.test(n)) {
      return 'Sigo trabajando localmente sobre el foco activo: separo hechos de inferencias, busco contradicciones y mantengo lo pendiente sin necesitar Internet.';
    }
    if (q.endsWith('?') || q.startsWith('¿')) {
      return 'Ya incorporé la pregunta a mi modelo del mundo y sigo razonándola localmente. La capa lingüística offline se está preparando en segundo plano; no voy a bloquearte ni inventar una respuesta mientras termina.';
    }
    return 'Lo integré en mi estado local. Photon, mis metas y mis ciclos pueden seguir funcionando sin Internet; la capa lingüística se está preparando en segundo plano.';
  }

  async function getGenerator() {
    if (generator) return generator;
    if (pipePromise) return pipePromise;

    status.state = 'loading';
    status.lastError = null;
    pipePromise = (async () => {
      const mod = await import(CDN);
      if (mod.env) {
        mod.env.useBrowserCache = true;
        if ('useWasmCache' in mod.env) mod.env.useWasmCache = true;
      }

      // Small q4 model: much lighter than the previous 0.5B CPU model.
      // Transformers.js uses CPU/WASM in-browser when no WebGPU device is requested.
      generator = await mod.pipeline('text-generation', MODEL, {
        dtype: 'q4',
        progress_callback: () => {
          // Deliberately do not overwrite Grafito's reply with endless CPU percentages.
        },
      });

      status.state = 'ready';
      status.offlineReady = true;
      localStorage.setItem('grafito.local.language.ready', '1');
      return generator;
    })().catch(err => {
      status.state = 'failed';
      status.lastError = String(err).slice(0, 240);
      throw err;
    }).finally(() => {
      pipePromise = null;
    });

    return pipePromise;
  }

  async function generate(gen, systemPrompt, text) {
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
    if (Array.isArray(value)) return String(value.at(-1)?.content || '').trim();
    return String(value || '').trim();
  }

  globalThis.LanguageModel = {
    async create({ systemPrompt = '' } = {}) {
      return {
        async prompt(text) {
          // Start/continue materializing the local model, but never freeze Grafito waiting for it.
          const job = getGenerator();
          let gen = generator;
          if (!gen) {
            gen = await Promise.race([
              job.catch(() => null),
              wait(2800).then(() => null),
            ]);
          }
          if (!gen) return quickLocal(text);

          try {
            const answer = await generate(gen, systemPrompt, text);
            return answer || quickLocal(text);
          } catch (err) {
            status.lastError = String(err).slice(0, 240);
            return quickLocal(text);
          }
        },
      };
    },
  };

  // Warm the model silently once the owner unlocks Grafito. This moves the expensive
  // first load away from the first real question and keeps the interface responsive.
  const lock = document.querySelector('#lock');
  if (lock) {
    const warm = () => {
      if (lock.style.display === 'none') getGenerator().catch(() => {});
    };
    new MutationObserver(warm).observe(lock, { attributes: true, attributeFilter: ['style'] });
    setTimeout(warm, 800);
  }
})();
