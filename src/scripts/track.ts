/**
 * Tracking GA4 — sem GTM (decisão de stack aprovada).
 *
 * Regras:
 *  - Só ativa se existir <meta name="ga4-id"> no head — o Base.astro só emite
 *    essa meta quando site.json tem um ID válido (formato G-XXXX, não PENDENTE).
 *    Sem ID configurado, este módulo retorna imediatamente: zero rede, zero custo.
 *  - gtag.js carrega ADIADO: na primeira interação (toque/tecla/scroll) ou após
 *    3s de idle — nunca pesa no LCP. Eventos anteriores ficam no dataLayer.
 *
 * Eventos (nomenclatura aprovada na arquitetura):
 *  - clique em [data-track] → evento com {origem, unidade} dos data-attributes
 *    (click_whatsapp, click_maps, click_instagram, click_degustacao,
 *     click_unidades, click_unidade_*, click_kits)
 *  - abertura de accordion de FAQ → click_faq {pergunta}
 *  - seções [data-observe] visíveis 1x → view_regua / scroll_faq {pagina}
 */

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

function init(): void {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="ga4-id"]');
  const id = meta?.content?.trim();
  if (!id) return; // GA4 não configurado → não faz nada

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', id);

  /* ---- carregamento adiado do gtag.js ---- */
  let carregado = false;
  const carregar = () => {
    if (carregado) return;
    carregado = true;
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(s);
  };
  (['pointerdown', 'keydown', 'scroll'] as const).forEach((ev) =>
    window.addEventListener(ev, carregar, { once: true, passive: true })
  );
  window.setTimeout(carregar, 3000);

  /* ---- cliques em elementos rastreados ---- */
  document.addEventListener('click', (e) => {
    const alvo = (e.target as Element | null)?.closest<HTMLElement>('[data-track]');
    const nome = alvo?.dataset.track;
    if (!alvo || !nome) return;
    window.gtag('event', nome, {
      origem: alvo.dataset.trackOrigem ?? '',
      unidade: alvo.dataset.trackUnidade ?? '',
    });
  });

  /* ---- abertura de perguntas do FAQ ---- */
  document.addEventListener(
    'toggle',
    (e) => {
      const d = e.target;
      if (d instanceof HTMLDetailsElement && d.open && d.closest('.faq')) {
        window.gtag('event', 'click_faq', { pergunta: d.id || '', pagina: location.pathname });
      }
    },
    true // toggle não borbulha — captura
  );

  /* ---- seções observadas (view_regua, scroll_faq), disparo único ---- */
  const observados = document.querySelectorAll<HTMLElement>('[data-observe]');
  if (observados.length > 0 && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          if (el.dataset.observe) {
            window.gtag('event', el.dataset.observe, { pagina: location.pathname });
          }
          io.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );
    observados.forEach((el) => io.observe(el));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
