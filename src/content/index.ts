/**
 * Ponto único de acesso ao conteúdo do site.
 * Importa os JSONs de data/, valida contra os schemas e exporta dados tipados.
 * Um erro de validação derruba o build com mensagem clara — nunca publica dado inválido.
 */
import {
  siteSchema,
  unidadesSchema,
  whatsappSchema,
  degustacaoSchema,
  kitsSchema,
  faqSchema,
  midiasSchema,
} from './schemas';

import siteJson from './data/site.json';
import unidadesJson from './data/unidades.json';
import whatsappJson from './data/whatsapp.json';
import degustacaoJson from './data/degustacao.json';
import kitsJson from './data/kits.json';
import faqJson from './data/faq.json';
import midiasJson from './data/midias.json';

export const site = siteSchema.parse(siteJson);
export const unidades = unidadesSchema.parse(unidadesJson);
export const whatsapp = whatsappSchema.parse(whatsappJson);
export const degustacao = degustacaoSchema.parse(degustacaoJson);
export const kits = kitsSchema.parse(kitsJson);
export const faqGrupos = faqSchema.parse(faqJson);
export const midias = midiasSchema.parse(midiasJson);

/** Busca uma unidade pelo id, com erro claro se o id não existir. */
export function getUnidade(id: 'galeria-suica' | 'vila-germanica') {
  const u = unidades.find((u) => u.id === id);
  if (!u) throw new Error(`Unidade não encontrada: ${id}`);
  return u;
}

/** Busca uma mídia pelo id (para o componente Media, Fase C). */
export function getMidia(id: string) {
  const m = midias.find((m) => m.id === id);
  if (!m) throw new Error(`Mídia não encontrada em midias.json: ${id}`);
  return m;
}

/** Monta link wa.me com mensagem pré-preenchida por contexto. */
export function waLink(contexto: keyof typeof whatsapp.mensagens) {
  const msg = encodeURIComponent(whatsapp.mensagens[contexto]);
  return `https://wa.me/${whatsapp.numero}?text=${msg}`;
}

/**
 * Link do Google Maps da unidade.
 * Usa o link oficial (mapsUrl) quando existir; enquanto estiver PENDENTE,
 * cai num link real de busca pelo endereço — o botão nunca fica morto.
 */
export function mapsHref(unidade: { mapsUrl: string; nome: string; endereco: string }) {
  if (unidade.mapsUrl.startsWith('http')) return unidade.mapsUrl;
  const consulta = encodeURIComponent(
    `Arsenal da Cerveja ${unidade.nome} ${unidade.endereco} Monte Verde MG`
  );
  return `https://www.google.com/maps/search/?api=1&query=${consulta}`;
}
