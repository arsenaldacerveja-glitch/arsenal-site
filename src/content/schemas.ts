/**
 * Schemas de validação do conteúdo (Zod, via astro/zod).
 * Todo JSON em src/content/data/ é validado no build por src/content/index.ts.
 * Se um dado obrigatório faltar ou tiver formato errado, o build falha — de propósito.
 */
import { z } from 'astro/zod';

/* ---------- Primitivos ---------- */

/** Horário no formato HH:MM. "24:00" é permitido apenas como fechamento (sábado até 00h). */
const hora = z.string().regex(/^([01]\d|2[0-4]):[0-5]\d$/, 'Hora deve ser HH:MM');

/** Um dia: null = fechado; objeto = intervalo de funcionamento. */
const diaSchema = z
  .object({ abre: hora, fecha: hora })
  .nullable();

export const horariosSchema = z.object({
  dom: diaSchema,
  seg: diaSchema,
  ter: diaSchema,
  qua: diaSchema,
  qui: diaSchema,
  sex: diaSchema,
  sab: diaSchema,
});

const linkSchema = z.object({
  label: z.string(),
  href: z.string(),
});

const faqItemSchema = z.object({
  id: z.string(),
  pergunta: z.string(),
  resposta: z.string(),
  link: linkSchema.optional(),
  /** true = resposta aguarda confirmação operacional; não publicar o item. */
  pendente: z.boolean().default(false),
});

/* ---------- site.json ---------- */

export const siteSchema = z.object({
  nome: z.string(),
  dominio: z.string().url(),
  headline: z.string(),
  subtituloHero: z.string(),
  descricaoSEO: z.string().max(160),
  fundacao: z.number().int(),
  instagram: z.string(),
  ga4Id: z.string(),
  fraseFooter: z.string(),
  linhaSEOFooter: z.string(),
  avisoLegal: z.string(),
});

/* ---------- unidades.json ---------- */

export const unidadeSchema = z.object({
  id: z.enum(['galeria-suica', 'vila-germanica']),
  nome: z.string(),
  nomeCompleto: z.string(),
  endereco: z.string(),
  referencia: z.string(),
  mapsUrl: z.string(),
  geo: z.object({ lat: z.number().nullable(), lng: z.number().nullable() }),
  perfil: z.string(),
  perfilCurto: z.string(),
  horarios: horariosSchema,
  override: z.object({
    ativo: z.boolean(),
    mensagem: z.string(),
  }),
  oQueTem: z.array(
    z.object({
      titulo: z.string(),
      texto: z.string(),
      href: z.string().optional(),
    })
  ),
  faq: z.array(faqItemSchema),
});

export const unidadesSchema = z.array(unidadeSchema).length(2);

/* ---------- whatsapp.json ---------- */

export const whatsappSchema = z.object({
  /** Interruptor geral: false = nenhum botão/link de WhatsApp aparece no site. */
  ativo: z.boolean(),
  /** Número no formato internacional sem símbolos, ex.: 5535999999999 */
  numero: z.string(),
  numeroPendente: z.boolean(),
  mensagens: z.object({
    geral: z.string(),
    degustacao: z.string(),
    kitArsenal: z.string(),
    produto: z.string(),
    galeriaSuica: z.string(),
    vilaGermanica: z.string(),
    faq: z.string(),
  }),
});

/* ---------- degustacao.json ---------- */

export const degustacaoSchema = z.object({
  fatos: z.array(z.object({ icone: z.string(), texto: z.string() })).min(5),
  notaRegua: z.string(),
  passos: z.array(z.object({ titulo: z.string(), texto: z.string() })).length(4),
  preco: z.string(),
  atendimentoConsultivo: z.object({ titulo: z.string(), texto: z.string() }),
  smartTap: z.object({ titulo: z.string(), texto: z.string() }),
  faq: z.array(faqItemSchema),
});

/* ---------- kits.json ---------- */

export const kitsSchema = z.object({
  kitArsenal: z.object({
    titulo: z.string(),
    texto: z.string(),
    fatos: z.array(z.string()),
  }),
  aviso: z.string(),
  cardsHome: z.array(z.object({ titulo: z.string(), texto: z.string() })).length(4),
  ocasioes: z.array(z.object({ titulo: z.string(), texto: z.string() })),
  microcopyOcasiao: z.string(),
  chopps: z.object({ titulo: z.string(), texto: z.string() }),
  mineiras: z.object({ titulo: z.string(), texto: z.string() }),
  estilos: z.array(z.object({ nome: z.string(), texto: z.string() })),
  microcopyEstilos: z.string(),
});

/* ---------- faq.json ---------- */

export const faqSchema = z.array(
  z.object({
    grupo: z.string(),
    id: z.string(),
    perguntas: z.array(faqItemSchema).min(1),
  })
);

/* ---------- midias.json ---------- */

export const midiaSchema = z.object({
  id: z.string(),
  arquivo: z.string(),
  tipo: z.enum(['foto', 'video', 'mapa', 'logo', 'og']),
  proporcao: z.enum(['16:9', '4:5', '3:2', '1:1', '4:3', '21:9', '9:16', 'livre']),
  descricao: z.string(),
  alt: z.string(),
  usos: z.array(z.string()),
  /** false = renderizar placeholder elegante; true = arquivo real em src/assets/ */
  existe: z.boolean(),
});

export const midiasSchema = z.array(midiaSchema);

/* ---------- galerias.json (carrosséis) ---------- */

const fotoGaleriaSchema = z.object({
  arquivo: z.string(),
  alt: z.string(),
});

export const galeriasSchema = z.object({
  degustacao: z.array(fotoGaleriaSchema),
  'galeria-suica': z.array(fotoGaleriaSchema),
  'vila-germanica': z.array(fotoGaleriaSchema),
});

/* ---------- Tipos exportados ---------- */

export type Site = z.infer<typeof siteSchema>;
export type Unidade = z.infer<typeof unidadeSchema>;
export type Horarios = z.infer<typeof horariosSchema>;
export type Whatsapp = z.infer<typeof whatsappSchema>;
export type Degustacao = z.infer<typeof degustacaoSchema>;
export type Kits = z.infer<typeof kitsSchema>;
export type FaqGrupos = z.infer<typeof faqSchema>;
export type Midia = z.infer<typeof midiaSchema>;
