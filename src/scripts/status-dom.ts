/**
 * Hidratação dos badges de status no DOM.
 *
 * Lê os dados embutidos pelo Base.astro (<script type="application/json"
 * id="dados-status">), calcula com o motor puro (status.ts) e preenche:
 *
 *  - [data-status="unidade"][data-unidade]  → texto + data-estado, remove hidden
 *  - [data-status="agregado"]               → "2 lojas abertas" etc.
 *  - [data-status-hoje][data-unidade]       → "Hoje: 10h às 19h" / "Hoje: fechado"
 *
 * Sem JS nada disso roda — os badges permanecem ocultos e as tabelas
 * estáticas respondem pelo conteúdo (regra: nunca exibir badge errado).
 * Atualiza a cada 60s para virar o estado sem recarregar a página.
 */
import {
  statusUnidade,
  statusAgregado,
  textoStatus,
  textoAgregado,
  formatHora,
  relogioSaoPaulo,
  type Horarios,
  type Override,
  type StatusUnidade,
  type StatusAgregado,
  type DiaSemana,
} from './status';

interface DadosUnidade {
  id: string;
  nome: string;
  horarios: Horarios;
  override: Override;
}

const DIAS: DiaSemana[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

function classeEstado(s: StatusUnidade): string {
  if (s.estado === 'aberto') return 'aberto';
  if (s.estado === 'fecha-em-breve') return 'breve';
  if (s.estado === 'override') return 'override'; // feriado/exceção: tom dourado/neutro
  return 'fechado'; // fechado e fechado-abre-hoje
}

function classeAgregado(a: StatusAgregado): string {
  return a.tipo === 'fechado' ? 'fechado' : 'aberto';
}

function atualizar(dados: DadosUnidade[]): void {
  const agora = new Date();
  const porId = new Map(dados.map((d) => [d.id, d]));

  document.querySelectorAll<HTMLElement>('[data-status="unidade"]').forEach((el) => {
    const d = porId.get(el.dataset.unidade ?? '');
    if (!d) return;
    const s = statusUnidade(d.horarios, d.override, agora);
    el.dataset.estado = classeEstado(s);
    const alvo = el.querySelector('[data-status-texto]');
    if (alvo) alvo.textContent = textoStatus(s);
    el.hidden = false;
  });

  const agregado = statusAgregado(dados, agora);
  document.querySelectorAll<HTMLElement>('[data-status="agregado"]').forEach((el) => {
    el.dataset.estado = classeAgregado(agregado);
    const alvo = el.querySelector('[data-status-texto]');
    if (alvo) alvo.textContent = textoAgregado(agregado);
    el.hidden = false;
  });

  const { diaIdx } = relogioSaoPaulo(agora);
  const hoje = DIAS[diaIdx];

  // Destaca a linha do dia atual nas tabelas de horário (HoursTable)
  document.querySelectorAll<HTMLElement>('[data-hours-table] [data-dia]').forEach((tr) => {
    tr.toggleAttribute('data-hoje', tr.dataset.dia === hoje);
  });

  document.querySelectorAll<HTMLElement>('[data-status-hoje]').forEach((el) => {
    const d = porId.get(el.dataset.unidade ?? '');
    if (!d) return;
    const i = d.horarios[hoje];
    el.textContent = i
      ? `Hoje: ${formatHora(i.abre)} às ${formatHora(i.fecha)}`
      : 'Hoje: fechado';
    el.hidden = false;
  });
}

function init(): void {
  const fonte = document.getElementById('dados-status');
  if (!fonte?.textContent) return;

  let dados: DadosUnidade[];
  try {
    dados = JSON.parse(fonte.textContent);
  } catch {
    return; // dados corrompidos → badges permanecem ocultos (nunca errados)
  }

  if (!Array.isArray(dados)) return; // formato inesperado → badges permanecem ocultos

  atualizar(dados);
  setInterval(() => atualizar(dados), 60_000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
