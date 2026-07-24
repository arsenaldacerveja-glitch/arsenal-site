/**
 * Aprimoramentos de UI — todos opcionais (o site funciona sem eles):
 *  - header encolhe suavemente no scroll;
 *  - <details data-fechavel> (popover de status, menu mobile) fecham com
 *    Esc e com clique/toque fora — devolvendo o foco ao gatilho;
 *  - menu mobile fecha ao navegar por um link.
 * Tracking NÃO vive aqui (fase própria: track.ts).
 */

function initHeaderCompacto(): void {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;
  let ultimo = false;
  window.addEventListener(
    'scroll',
    () => {
      const compacto = window.scrollY > 12;
      if (compacto !== ultimo) {
        header.toggleAttribute('data-compact', compacto);
        ultimo = compacto;
      }
    },
    { passive: true }
  );
}

function initFechaveis(): void {
  const abertos = () =>
    document.querySelectorAll<HTMLDetailsElement>('details[data-fechavel][open]');

  document.addEventListener('click', (e) => {
    for (const d of abertos()) {
      if (!d.contains(e.target as Node)) d.removeAttribute('open');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    for (const d of abertos()) {
      d.removeAttribute('open');
      d.querySelector<HTMLElement>('summary')?.focus();
    }
  });

  // Navegou por um link dentro do menu/popover → fecha
  document.querySelectorAll<HTMLAnchorElement>('details[data-fechavel] a').forEach((a) => {
    a.addEventListener('click', () => a.closest('details')?.removeAttribute('open'));
  });
}

/** Desktop com mouse: o popover de status também abre/fecha por hover. */
function initPopoverHover(): void {
  const desktopComMouse = window.matchMedia('(min-width: 1024px) and (hover: hover)');
  document.querySelectorAll<HTMLDetailsElement>('.hdr__status').forEach((d) => {
    d.addEventListener('pointerenter', () => {
      if (desktopComMouse.matches) d.setAttribute('open', '');
    });
    d.addEventListener('pointerleave', () => {
      if (desktopComMouse.matches) d.removeAttribute('open');
    });
  });
}

/** Deep-link de FAQ: #id de um <details> abre o accordion (link enviável no WhatsApp). */
function initFaqDeepLink(): void {
  const abrirDoHash = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    const alvo = document.getElementById(id);
    if (alvo instanceof HTMLDetailsElement) {
      alvo.setAttribute('open', '');
      alvo.scrollIntoView({ block: 'center' });
    }
  };
  abrirDoHash();
  window.addEventListener('hashchange', abrirDoHash);
}

/** Setas dos carrosséis — o deslize por toque é scroll nativo, sem JS. */
function initCarrosseis(): void {
  const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll<HTMLElement>('[data-carousel]').forEach((c) => {
    const trilho = c.querySelector<HTMLElement>('[data-carousel-track]');
    if (!trilho) return;
    const passo = () => {
      const slide = trilho.querySelector<HTMLElement>(':scope > *');
      return (slide?.offsetWidth ?? 300) + 16;
    };
    c.querySelector('[data-carousel-prev]')?.addEventListener('click', () =>
      trilho.scrollBy({ left: -passo(), behavior: suave ? 'smooth' : 'auto' })
    );
    c.querySelector('[data-carousel-next]')?.addEventListener('click', () =>
      trilho.scrollBy({ left: passo(), behavior: suave ? 'smooth' : 'auto' })
    );
  });
}

/**
 * Revelação suave no scroll — vocabulário único da direção visual
 * (fade + 12px, 400ms, uma vez, stagger de 60ms em grades).
 * Sem JS nada é escondido; com reduced-motion o CSS neutraliza tudo.
 */
function initReveal(): void {
  const seletor =
    '.sec-head, .ucard, .facts__item, .kits__card, .kits__destaque, .exp__card, ' +
    '.passos__item, .ocasioes__card, .smart, .comp, .horas, .tem__item, ' +
    '[data-carousel], .media, .media-placeholder, .faq';
  const alvos = [...document.querySelectorAll<HTMLElement>(seletor)].filter((el) => {
    if (el.closest('header, footer, .sticky, .hero')) return false;
    if (el.closest('[data-carousel]') && !el.hasAttribute('data-carousel')) return false;
    return true;
  });

  if (alvos.length === 0) return;

  if (!('IntersectionObserver' in window)) {
    alvos.forEach((el) => el.classList.add('revelado'));
    return;
  }

  alvos.forEach((el) => {
    el.setAttribute('data-reveal', '');
    const pai = el.parentElement;
    if (pai) {
      const irmaos = [...pai.children].filter((c) => c.hasAttribute('data-reveal'));
      const i = irmaos.indexOf(el);
      if (i > 0) el.style.setProperty('--reveal-delay', `${Math.min(i * 60, 240)}ms`);
    }
  });

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('revelado');
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -5% 0px' }
  );
  alvos.forEach((el) => io.observe(el));
}

function init(): void {
  initHeaderCompacto();
  initFechaveis();
  initPopoverHover();
  initFaqDeepLink();
  initCarrosseis();
  initReveal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
