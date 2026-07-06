/**
 * Motor de status "aberto agora" — Arsenal da Cerveja.
 *
 * Código PURO: sem DOM, sem imports de conteúdo, com data injetável.
 * O cálculo é sempre no fuso America/Sao_Paulo, independentemente do fuso
 * do visitante — a mesma Date (instante absoluto) produz o mesmo resultado
 * em qualquer máquina.
 *
 * A hidratação no DOM (badges, popover) entra na Fase C via status-dom.ts.
 *
 * Regras (arquitetura seção 10):
 * - aberto                  → dentro do intervalo do dia
 * - fecha-em-breve          → aberto, faltando ≤ 60 min para fechar
 * - fechado-abre-hoje       → antes da abertura em dia com funcionamento
 * - fechado                 → após fechar ou dia fechado; informa a próxima abertura
 * - override                → feriado/fechamento excepcional; substitui o cálculo
 * - "24:00" como fechamento → sábado até 00h (o intervalo termina à meia-noite)
 */

/* ============================== Tipos ============================== */

export type DiaSemana = 'dom' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab';

export interface Intervalo {
  /** "HH:MM" */
  abre: string;
  /** "HH:MM" — "24:00" permitido (meia-noite do mesmo dia) */
  fecha: string;
}

export type Horarios = Record<DiaSemana, Intervalo | null>;

export interface Override {
  ativo: boolean;
  mensagem: string;
}

export interface ProximaAbertura {
  /** Chave do dia da próxima abertura, ex.: "qua" */
  dia: DiaSemana;
  /** "HH:MM" */
  abreAs: string;
  hoje: boolean;
  amanha: boolean;
  /** Minutos entre o agora e a próxima abertura (para comparar unidades) */
  emMinutos: number;
}

export type StatusUnidade =
  | { estado: 'aberto'; fechaAs: string }
  | { estado: 'fecha-em-breve'; fechaAs: string; minutosRestantes: number }
  | { estado: 'fechado-abre-hoje'; abreAs: string }
  | { estado: 'fechado'; proxima: ProximaAbertura | null }
  | { estado: 'override'; mensagem: string };

export type StatusAgregado =
  | { tipo: '2-abertas' }
  | { tipo: '1-aberta' }
  | { tipo: 'fechado'; proxima: ProximaAbertura | null };

/* ========================= Fuso de São Paulo ========================= */

const DIAS: DiaSemana[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const fmtSP = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Sao_Paulo',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** Converte um instante absoluto para o relógio de parede de São Paulo. */
export function relogioSaoPaulo(agora: Date): { diaIdx: number; minutos: number } {
  const parts = fmtSP.formatToParts(agora);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const diaIdx = WEEKDAY_MAP[get('weekday')];
  if (diaIdx === undefined) throw new Error(`Dia da semana inesperado: ${get('weekday')}`);
  const minutos = Number(get('hour')) * 60 + Number(get('minute'));
  return { diaIdx, minutos };
}

/* ============================ Utilitários ============================ */

/** "HH:MM" → minutos desde a meia-noite. "24:00" → 1440. */
export function paraMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** "10:00" → "10h" · "22:30" → "22h30" · "24:00" → "00h" */
export function formatHora(hhmm: string): string {
  const [h, m] = hhmm.split(':');
  const hora = h === '24' ? '00' : String(Number(h));
  return m === '00' ? `${hora}h` : `${hora}h${m}`;
}

/**
 * Encontra a próxima abertura a partir de (diaIdx, minutos).
 * Varre até 7 dias; retorna null se a semana inteira for fechada.
 */
export function proximaAbertura(
  horarios: Horarios,
  diaIdx: number,
  minutos: number
): ProximaAbertura | null {
  for (let offset = 0; offset <= 7; offset++) {
    const dia = DIAS[(diaIdx + offset) % 7];
    const intervalo = horarios[dia];
    if (!intervalo) continue;
    const abre = paraMinutos(intervalo.abre);
    if (offset === 0 && minutos >= abre) continue; // já passou da abertura de hoje
    return {
      dia,
      abreAs: intervalo.abre,
      hoje: offset === 0,
      amanha: offset === 1,
      emMinutos: offset * 1440 + abre - minutos,
    };
  }
  return null;
}

/* ========================== Status por unidade ========================== */

const LIMITE_FECHA_EM_BREVE = 60; // minutos

export function statusUnidade(
  horarios: Horarios,
  override: Override,
  agora: Date
): StatusUnidade {
  if (override.ativo) {
    return { estado: 'override', mensagem: override.mensagem };
  }

  const { diaIdx, minutos } = relogioSaoPaulo(agora);
  const intervalo = horarios[DIAS[diaIdx]];

  if (intervalo) {
    const abre = paraMinutos(intervalo.abre);
    const fecha = paraMinutos(intervalo.fecha);

    if (minutos >= abre && minutos < fecha) {
      const restantes = fecha - minutos;
      if (restantes <= LIMITE_FECHA_EM_BREVE) {
        return {
          estado: 'fecha-em-breve',
          fechaAs: intervalo.fecha,
          minutosRestantes: restantes,
        };
      }
      return { estado: 'aberto', fechaAs: intervalo.fecha };
    }

    if (minutos < abre) {
      return { estado: 'fechado-abre-hoje', abreAs: intervalo.abre };
    }
  }

  return { estado: 'fechado', proxima: proximaAbertura(horarios, diaIdx, minutos) };
}

/* ============================ Status agregado ============================ */

export interface UnidadeParaAgregado {
  horarios: Horarios;
  override: Override;
}

export function statusAgregado(
  unidades: UnidadeParaAgregado[],
  agora: Date
): StatusAgregado {
  const status = unidades.map((u) => statusUnidade(u.horarios, u.override, agora));
  const abertas = status.filter(
    (s) => s.estado === 'aberto' || s.estado === 'fecha-em-breve'
  ).length;

  if (abertas >= 2) return { tipo: '2-abertas' };
  if (abertas === 1) return { tipo: '1-aberta' };

  // Nenhuma aberta: próxima abertura mais cedo entre as unidades sem override.
  const { diaIdx, minutos } = relogioSaoPaulo(agora);
  let melhor: ProximaAbertura | null = null;
  for (const u of unidades) {
    if (u.override.ativo) continue;
    const p = proximaAbertura(u.horarios, diaIdx, minutos);
    if (p && (!melhor || p.emMinutos < melhor.emMinutos)) melhor = p;
  }
  return { tipo: 'fechado', proxima: melhor };
}

/* ======================== Textos aprovados (copy) ======================== */

/** Microcopy aprovada nos textos finais — fonte única para todos os badges. */
export function textoStatus(s: StatusUnidade): string {
  switch (s.estado) {
    case 'aberto':
      return `Aberto · fecha às ${formatHora(s.fechaAs)}`;
    case 'fecha-em-breve':
      return `Fecha às ${formatHora(s.fechaAs)} · ainda dá tempo`;
    case 'fechado-abre-hoje':
      return `Fechado · abre hoje às ${formatHora(s.abreAs)}`;
    case 'fechado':
      if (!s.proxima) return 'Fechado';
      if (s.proxima.amanha) return `Fechado agora · abre amanhã às ${formatHora(s.proxima.abreAs)}`;
      return `Fechado agora · abre ${s.proxima.dia} às ${formatHora(s.proxima.abreAs)}`;
    case 'override':
      return s.mensagem;
  }
}

export function textoAgregado(a: StatusAgregado): string {
  switch (a.tipo) {
    case '2-abertas':
      return '2 lojas abertas';
    case '1-aberta':
      return '1 loja aberta';
    case 'fechado': {
      if (!a.proxima) return 'Fechado agora';
      const hora = formatHora(a.proxima.abreAs);
      if (a.proxima.hoje) return `Fechado agora · abre hoje às ${hora}`;
      if (a.proxima.amanha) return `Fechado agora · abre amanhã às ${hora}`;
      return `Fechado agora · abre ${a.proxima.dia} às ${hora}`;
    }
  }
}
