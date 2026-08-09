(() => {
  if (globalThis.LanguageModel || globalThis.ai?.languageModel) return;

  let pipePromise = null;
  let generator = null;
  const MODEL = 'onnx-community/Qwen2.5-0.5B-Instruct';

  async function getGenerator() {
    if (generator) return generator;
    if (!pipePromise) {
      pipePromise = (async () => {
        const mod = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1');
        generator = await mod.pipeline('text-generation', MODEL, {
          dtype: 'q8',
          progress_callback: (p) => {
            const r = document.querySelector('#reply');
            const v = Number(p?.progress);
            if (r) r.textContent = Number.isFinite(v)
              ? `Preparando motor local por CPU… ${Math.round(v * 100)}%`
              : 'Preparando motor local por CPU…';
          },
        });
        return generator;
      })().finally(() => { pipePromise = null; });
    }
    return pipePromise;
  }

  globalThis.LanguageModel = {
    async create({ systemPrompt = '' } = {}) {
      try {
        if (navigator.gpu) {
          const adapter = await navigator.gpu.requestAdapter();
          if (adapter) throw new Error('__GRAFITO_PREFER_WEBGPU__');
        }
      } catch (e) {
        if (String(e).includes('__GRAFITO_PREFER_WEBGPU__')) throw e;
      }

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
