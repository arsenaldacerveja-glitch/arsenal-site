# Site Arsenal da Cerveja

Site estático do Arsenal da Cerveja — cervejas especiais, degustação e presentes em Monte Verde, MG.

Stack: **Astro 5 · CSS nativo com tokens · TypeScript vanilla · Cloudflare Pages**.

## Rodar localmente

Pré-requisito: Node.js 18.17+ (recomendado: 20+).

```bash
cd arsenal-site
npm install
npm run dev      # abre em http://localhost:4321
```

Outros comandos:

```bash
npm run build    # gera o site estático em dist/ (valida todo o conteúdo)
npm run preview  # serve o build de produção localmente
```

## Estrutura

```
src/
  styles/tokens.css      → design tokens (cores, tipografia, espaçamentos)
  styles/global.css      → reset, base, utilitários, placeholder de mídia
  content/schemas.ts     → schemas Zod — o build falha se um JSON estiver inválido
  content/index.ts       → carrega e valida os JSONs; exporta dados tipados
  content/data/*.json    → TODO o conteúdo editável do site (ver abaixo)
  layouts/Base.astro     → head, SEO, OG, JSON-LD, fontes
  pages/                 → páginas (index.astro é temporária — Fase A)
public/                  → favicon, robots.txt, og/
```

## Editar conteúdo

Todo o conteúdo vive em `src/content/data/`:

| Arquivo | O que editar aqui |
|---|---|
| `site.json` | Nome, domínio, headline, Instagram, ID do GA4, aviso legal |
| `unidades.json` | Endereços, **horários**, override de feriado, FAQ das unidades |
| `whatsapp.json` | **Número do WhatsApp** e mensagens pré-preenchidas |
| `degustacao.json` | Fatos e regras da régua, passos, FAQ da degustação |
| `kits.json` | Kit Arsenal, kits por ocasião, guia de estilos |
| `faq.json` | FAQ completo (22 perguntas em 6 grupos) |
| `midias.json` | Fotos/vídeos: quando uma foto real chegar, marcar `"existe": true` |

Campos marcados `PENDENTE` (WhatsApp, Maps, GA4, pet/estacionamento/acessibilidade)
bloqueiam apenas a publicação, não o desenvolvimento. Itens de FAQ com
`"pendente": true` não são renderizados.

**Feriado:** em `unidades.json`, mudar `override` para
`{ "ativo": true, "mensagem": "Fechado hoje — feriado. Voltamos amanhã às 10h" }`.

## Fases de desenvolvimento

- [x] **Fase A — Fundação** (esta): configs, tokens, base, schemas, conteúdo
- [ ] Fase B — Motor de status "aberto agora" + testes (Vitest em `tests/`)
- [ ] Fase C — Componentes globais (Header, Footer, StickyBar, StatusBadge...)
- [ ] Fase D — Home completa
- [ ] Fase E — Páginas internas
- [ ] Fase F — Qualidade (performance, acessibilidade, fallbacks)
- [ ] Fase G — Deploy Cloudflare Pages

Sem 3D no MVP (fase 2 do produto). Sem CMS, banco, backend, SSR ou e-commerce.
