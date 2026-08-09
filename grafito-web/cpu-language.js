(() => {
  // Do not replace a genuine browser-native language model if one exists.
  if (globalThis.LanguageModel || globalThis.ai?.languageModel) return;

  let pipePromise = null;
  let generator = null;
  const MODEL = 'onnx-community/Qwen2.5-0.5B-Instruct';

  async function getGenerator() {
    if (generator) return generator;
    if (!pipePromise) {
      pipePromise = (async () => {
        const mod = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1');
        const r = document.querySelector('#reply');
        if (r) r.textContent = 'Preparando motor local por CPU…';

        // Transformers.js runs on CPU/WASM by default in the browser when no
        // WebGPU device is requested. q4 lowers memory/bandwidth requirements.
        generator = await mod.pipeline('text-generation', MODEL, {
          dtype: 'q4',
          progress_callback: (p) => {
            const el = document.querySelector('#reply');
            const raw = Number(p?.progress);
            if (!el) return;
            if (Number.isFinite(raw)) {
              const pct = raw <= 1 ? raw * 100 : raw;
              el.textContent = `Preparando motor local por CPU… ${Math.max(0, Math.min(100, Math.round(pct)))}%`;
            } else {
              el.textContent = 'Preparando motor local por CPU…';
            }
          },
        });
        return generator;
      })().finally(() => { pipePromise = null; });
    }
    return pipePromise;
  }

  // This deliberately presents the same tiny interface expected by Grafito's
  // subordinate language adapter. The cognitive state remains owned by Grafito.
  globalThis.LanguageModel = {
    async create({ systemPrompt = '' } = {}) {
      return {
        async prompt(text) {
          const gen = await getGenerator();
          const out = await gen([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: String(text) },
          ], {
            max_new_tokens: 320,
            do_sample: true,
            temperature: 0.55,
            top_p: 0.9,
          });
          const value = out?.[0]?.generated_text;
          if (Array.isArray(value)) return String(value.at(-1)?.content || '').trim();
          return String(value || '').trim();
        },
      };
    },
  };
})();
