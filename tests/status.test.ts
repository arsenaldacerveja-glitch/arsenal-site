/**
 * Testes do motor de status "aberto agora".
 *
 * Os horários aqui são FIXTURES FIXAS (não o unidades.json publicado): elas
 * preservam para sempre os casos-limite do motor — dias fechados, fechamento
 * às 19h, sábado até 00h — independentemente de mudanças operacionais de
 * horário nas lojas. O JSON publicado é validado por schema (Zod) no build.
 *
 * Datas de referência (São Paulo é UTC-3, sem horário de verão desde 2019):
 *   seg 29/06/2026 · ter 30/06 · qua 01/07 · qui 02/07 · sex 03/07 · sáb 04/07 · dom 05/07
 *
 * O helper sp() cria o instante absoluto (UTC) que corresponde ao horário de
 * parede em São Paulo — os testes passam em qualquer fuso de máquina.
 */
import { describe, it, expect } from 'vitest';
import {
  statusUnidade,
  statusAgregado,
  textoStatus,
  textoAgregado,
  formatHora,
  type Horarios,
  type Override,
} from '../src/scripts/status';

/* ---------------- Fixtures (cobrem os casos-limite do motor) ---------------- */

/** "GS": fecha cedo (19h), fechada seg e ter, sábado até 00h. */
const gsHorarios: Horarios = {
  dom: { abre: '10:00', fecha: '19:00' },
  seg: null,
  ter: null,
  qua: { abre: '10:00', fecha: '19:00' },
  qui: { abre: '10:00', fecha: '19:00' },
  sex: { abre: '10:00', fecha: '23:00' },
  sab: { abre: '10:00', fecha: '24:00' },
};

/** "VG": fechada só na segunda, fecha às 22h, sábado até 00h. */
const vgHorarios: Horarios = {
  dom: { abre: '10:00', fecha: '22:00' },
  seg: null,
  ter: { abre: '10:00', fecha: '22:00' },
  qua: { abre: '10:00', fecha: '22:00' },
  qui: { abre: '10:00', fecha: '22:00' },
  sex: { abre: '10:00', fecha: '23:00' },
  sab: { abre: '10:00', fecha: '24:00' },
};

const semOverride: Override = { ativo: false, mensagem: '' };
const comOverride: Override = {
  ativo: true,
  mensagem: 'Fechado hoje — feriado. Voltamos amanhã às 10h',
};

/** Horário de parede em São Paulo → instante absoluto (SP = UTC-3). */
function sp(ano: number, mes: number, dia: number, hora: number, min = 0): Date {
  return new Date(Date.UTC(ano, mes - 1, dia, hora + 3, min));
}

const ambas = [
  { horarios: gsHorarios, override: semOverride },
  { horarios: vgHorarios, override: semOverride },
];

/* ---------------- Abertura exata ---------------- */

describe('abertura exata', () => {
  it('Galeria Suíça na quarta às 10:00 em ponto está aberta', () => {
    const s = statusUnidade(gsHorarios, semOverride, sp(2026, 7, 1, 10, 0));
    expect(s.estado).toBe('aberto');
    if (s.estado === 'aberto') expect(s.fechaAs).toBe('19:00');
  });

  it('Galeria Suíça na quarta às 09:59 está fechada, abre hoje', () => {
    const s = statusUnidade(gsHorarios, semOverride, sp(2026, 7, 1, 9, 59));
    expect(s.estado).toBe('fechado-abre-hoje');
    if (s.estado === 'fechado-abre-hoje') expect(s.abreAs).toBe('10:00');
  });
});

/* ---------------- Fechamento exato ---------------- */

describe('fechamento exato', () => {
  it('Galeria Suíça na quinta às 19:00 em ponto já está fechada', () => {
    const s = statusUnidade(gsHorarios, semOverride, sp(2026, 7, 2, 19, 0));
    expect(s.estado).toBe('fechado');
    if (s.estado === 'fechado') {
      expect(s.proxima?.dia).toBe('sex');
      expect(s.proxima?.amanha).toBe(true);
      expect(s.proxima?.abreAs).toBe('10:00');
    }
  });

  it('Galeria Suíça na quinta às 18:59 ainda está aberta (fecha em breve)', () => {
    const s = statusUnidade(gsHorarios, semOverride, sp(2026, 7, 2, 18, 59));
    expect(s.estado).toBe('fecha-em-breve');
    if (s.estado === 'fecha-em-breve') expect(s.minutosRestantes).toBe(1);
  });
});

/* ---------------- Fecha em breve (limite de 60 min) ---------------- */

describe('fecha em breve', () => {
  it('exatamente 60 min antes → fecha-em-breve', () => {
    const s = statusUnidade(gsHorarios, semOverride, sp(2026, 7, 2, 18, 0));
    expect(s.estado).toBe('fecha-em-breve');
    if (s.estado === 'fecha-em-breve') expect(s.minutosRestantes).toBe(60);
  });

  it('61 min antes → ainda aberto normal', () => {
    const s = statusUnidade(gsHorarios, semOverride, sp(2026, 7, 2, 17, 59));
    expect(s.estado).toBe('aberto');
  });

  it('texto aprovado: "ainda dá tempo"', () => {
    const s = statusUnidade(vgHorarios, semOverride, sp(2026, 7, 3, 22, 30));
    expect(textoStatus(s)).toBe('Fecha às 23h · ainda dá tempo');
  });
});

/* ---------------- Dias fechados ---------------- */

describe('dias fechados', () => {
  it('segunda: as duas fechadas', () => {
    const agora = sp(2026, 6, 29, 12, 0);
    expect(statusUnidade(gsHorarios, semOverride, agora).estado).toBe('fechado');
    expect(statusUnidade(vgHorarios, semOverride, agora).estado).toBe('fechado');
  });

  it('segunda: Galeria Suíça informa que abre na quarta (não amanhã)', () => {
    const s = statusUnidade(gsHorarios, semOverride, sp(2026, 6, 29, 12, 0));
    if (s.estado === 'fechado') {
      expect(s.proxima?.dia).toBe('qua');
      expect(s.proxima?.amanha).toBe(false);
      expect(textoStatus(s)).toBe('Fechado agora · abre qua às 10h');
    }
  });

  it('segunda: Vila Germânica informa que abre amanhã (terça)', () => {
    const s = statusUnidade(vgHorarios, semOverride, sp(2026, 6, 29, 12, 0));
    if (s.estado === 'fechado') {
      expect(s.proxima?.dia).toBe('ter');
      expect(s.proxima?.amanha).toBe(true);
      expect(textoStatus(s)).toBe('Fechado agora · abre amanhã às 10h');
    }
  });

  it('terça: Galeria Suíça fechada, Vila Germânica aberta', () => {
    const agora = sp(2026, 6, 30, 12, 0);
    expect(statusUnidade(gsHorarios, semOverride, agora).estado).toBe('fechado');
    expect(statusUnidade(vgHorarios, semOverride, agora).estado).toBe('aberto');
  });
});

/* ---------------- Sábado até 00h ---------------- */

describe('sábado até 00h (fecha "24:00")', () => {
  it('sábado 23:30 → aberto, em "fecha em breve", fechando às 00h', () => {
    const s = statusUnidade(gsHorarios, semOverride, sp(2026, 7, 4, 23, 30));
    expect(s.estado).toBe('fecha-em-breve');
    expect(textoStatus(s)).toBe('Fecha às 00h · ainda dá tempo');
  });

  it('sábado 23:59 → ainda aberto', () => {
    const s = statusUnidade(gsHorarios, semOverride, sp(2026, 7, 4, 23, 59));
    expect(s.estado).toBe('fecha-em-breve');
  });

  it('domingo 00:00 → usa a régua de domingo: fechado, abre hoje às 10h', () => {
    const s = statusUnidade(gsHorarios, semOverride, sp(2026, 7, 5, 0, 0));
    expect(s.estado).toBe('fechado-abre-hoje');
    if (s.estado === 'fechado-abre-hoje') expect(s.abreAs).toBe('10:00');
  });

  it('sábado 21:00 → aberto normal (faltam 180 min)', () => {
    const s = statusUnidade(vgHorarios, semOverride, sp(2026, 7, 4, 21, 0));
    expect(s.estado).toBe('aberto');
    expect(textoStatus(s)).toBe('Aberto · fecha às 00h');
  });
});

/* ---------------- Status agregado ---------------- */

describe('status agregado', () => {
  it('quinta 15:00 → 2 lojas abertas', () => {
    const a = statusAgregado(ambas, sp(2026, 7, 2, 15, 0));
    expect(a.tipo).toBe('2-abertas');
    expect(textoAgregado(a)).toBe('2 lojas abertas');
  });

  it('quinta 20:00 → 1 loja aberta (GS fecha às 19h, VG às 22h)', () => {
    const a = statusAgregado(ambas, sp(2026, 7, 2, 20, 0));
    expect(a.tipo).toBe('1-aberta');
    expect(textoAgregado(a)).toBe('1 loja aberta');
  });

  it('segunda 12:00 → fechado; próxima abertura é a VG na terça', () => {
    const a = statusAgregado(ambas, sp(2026, 6, 29, 12, 0));
    expect(a.tipo).toBe('fechado');
    if (a.tipo === 'fechado') {
      expect(a.proxima?.dia).toBe('ter');
      expect(textoAgregado(a)).toBe('Fechado agora · abre amanhã às 10h');
    }
  });

  it('quinta 08:00 → fechado; abre hoje às 10h', () => {
    const a = statusAgregado(ambas, sp(2026, 7, 2, 8, 0));
    expect(a.tipo).toBe('fechado');
    expect(textoAgregado(a)).toBe('Fechado agora · abre hoje às 10h');
  });
});

/* ---------------- Override (feriado / fechamento excepcional) ---------------- */

describe('override manual', () => {
  it('override ativo substitui o cálculo mesmo em horário de funcionamento', () => {
    const s = statusUnidade(gsHorarios, comOverride, sp(2026, 7, 2, 15, 0));
    expect(s.estado).toBe('override');
    expect(textoStatus(s)).toBe('Fechado hoje — feriado. Voltamos amanhã às 10h');
  });

  it('agregado com 1 override: conta só a outra unidade → 1 loja aberta', () => {
    const a = statusAgregado(
      [
        { horarios: gsHorarios, override: comOverride },
        { horarios: vgHorarios, override: semOverride },
      ],
      sp(2026, 7, 2, 15, 0)
    );
    expect(a.tipo).toBe('1-aberta');
  });

  it('agregado fechado ignora unidade em override na próxima abertura', () => {
    const a = statusAgregado(
      [
        { horarios: gsHorarios, override: comOverride },
        { horarios: vgHorarios, override: semOverride },
      ],
      sp(2026, 6, 29, 12, 0) // segunda
    );
    if (a.tipo === 'fechado') expect(a.proxima?.dia).toBe('ter');
  });
});

/* ---------------- Visitante em outro fuso ---------------- */

describe('independência de fuso do visitante', () => {
  it('instante em que o dia UTC difere do dia em SP usa o dia de SP', () => {
    // 2026-07-05T01:30:00Z = sábado 04/07, 22:30 em São Paulo (UTC já é domingo).
    const instante = new Date(Date.UTC(2026, 6, 5, 1, 30));
    const s = statusUnidade(gsHorarios, semOverride, instante);
    // Se o motor usasse o dia UTC (domingo), o resultado seria "fechado-abre-hoje".
    expect(s.estado).toBe('aberto');
    if (s.estado === 'aberto') expect(s.fechaAs).toBe('24:00');
  });

  it('mesmo instante absoluto → mesmo resultado (meia-noite UTC)', () => {
    // 2026-07-03T00:00:00Z = quinta 02/07, 21:00 em São Paulo → VG aberta até 22h.
    const instante = new Date(Date.UTC(2026, 6, 3, 0, 0));
    const s = statusUnidade(vgHorarios, semOverride, instante);
    expect(s.estado).toBe('fecha-em-breve');
  });
});

/* ---------------- Formatação ---------------- */

describe('formatHora', () => {
  it('formata os padrões aprovados', () => {
    expect(formatHora('10:00')).toBe('10h');
    expect(formatHora('22:30')).toBe('22h30');
    expect(formatHora('24:00')).toBe('00h');
    expect(formatHora('09:00')).toBe('9h');
  });
});
