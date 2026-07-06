# Checklist Final de Publicação — Site Arsenal da Cerveja

MVP aprovado (build 8 páginas ✓ · testes 25/25 ✓ · auditoria ✓). Este documento é só operação: subir, configurar, editar e testar.

---

## 1. Subir no GitHub

1. Crie um repositório novo em github.com (privado ou público) — ex.: `arsenal-site`. Não inicialize com README.
2. No terminal, dentro da pasta `arsenal-site`:

```bash
git init
git add .
git commit -m "MVP Arsenal da Cerveja — site estático aprovado"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/arsenal-site.git
git push -u origin main
```

O `.gitignore` já exclui `node_modules/`, `dist/` e `.astro/`.

## 2. Conectar na Cloudflare Pages

1. dash.cloudflare.com → **Workers & Pages** → **Create** → aba **Pages** → **Connect to Git**.
2. Autorize o GitHub e selecione o repositório `arsenal-site`.
3. Preencha as configurações do passo 3 abaixo → **Save and Deploy**.
4. Em ~1 minuto você recebe a URL de preview `https://arsenal-site.pages.dev` — cada `git push` na `main` publica automaticamente.
5. Quando o domínio definitivo existir: **Custom domains** → adicionar → SSL automático.

## 3. Configurações exatas na Cloudflare

| Campo | Valor |
|---|---|
| Framework preset | **Astro** |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | (vazio — ou `arsenal-site` se o repo tiver a pasta dentro) |
| Environment variable | `NODE_VERSION` = `20` |

Nenhuma outra variável de ambiente é necessária — toda configuração vive nos JSONs versionados.

## 4. Editar antes do lançamento oficial

Cada item = editar arquivo → commit → push (deploy automático). O build falha se um JSON ficar inválido — proteção proposital.

| # | O quê | Arquivo | Como |
|---|---|---|---|
| 1 | **WhatsApp** | `src/content/data/whatsapp.json` | `numero` no formato `5535XXXXXXXXX` + `numeroPendente: false` |
| 2 | **Instagram** | `src/content/data/site.json` | `instagram` com a URL completa (enquanto tiver PENDENTE, o link não aparece) |
| 3 | **Google Maps** | `src/content/data/unidades.json` | `mapsUrl` de cada unidade com o link oficial do perfil (hoje os botões usam busca por endereço). Apontar o Google Business Profile de cada loja para `/unidades/<slug>` |
| 4 | **GA4** | `src/content/data/site.json` | `ga4Id` com o ID real `G-XXXXXXXXXX` (enquanto for `G-PENDENTE`, zero tracking) |
| 5 | **Domínio** | 3 pontos: `astro.config.mjs` (`site:`), `site.json` (`dominio`) e `public/robots.txt` (linha do sitemap) | Trocar `arsenaldacerveja.com.br` pelo definitivo, se diferente |
| 6 | **Logo SVG** | `public/midia/logo-horizontal.svg` e `logo-simbolo.svg` + `midias.json` (`existe: true`) | Hoje o header usa wordmark tipográfico; trocar também o `public/favicon.svg` pelo símbolo real |
| 7 | **Fotos reais** | arquivos em `public/midia/` com os nomes exatos de `midias.json` + marcar `existe: true` | Prioridade mínima: hero fallback, régua completa, 2 fachadas, 1 interior por loja, kit presente, OG |
| 8 | **OG images** | `public/og/og-home.jpg` (1200×630) | Headline sobre foto escura, conforme direção visual |
| 9 | **Pet / estacionamento / acessibilidade** | `unidades.json` (FAQ das 2 unidades) e `faq.json` (perguntas 18, 19, 21) | Escrever a resposta oficial e mudar `pendente: false` — só então elas aparecem no site |

## 5. Checklist de teste no celular (na URL de preview)

Teste em aparelho real, de preferência 4G e sob luz do dia:

- [ ] **Home** — H1 e CTAs visíveis sem rolar; sequência preto→verde→preto; 1 CTA dourado por tela; FactStrip legível; mini-FAQ abre/fecha
- [ ] **/degustacao** — 4 passos escaneáveis; "régua em números" com os 6 fatos; Smart Tap visivelmente coadjuvante
- [ ] **/unidades** — tabela comparativa utilizável (scroll horizontal suave); badges das duas lojas na dica
- [ ] **/unidades/galeria-suica** — status grande + "Hoje: …" no topo; Como chegar e WhatsApp acima da dobra; dia atual destacado na tabela de horários
- [ ] **/unidades/vila-germanica** — idem + NoticeBar de venda física; crosslink para a outra unidade com status
- [ ] **/cervejas-e-kits** — aviso âncora antes dos produtos; chips do Kit Arsenal legíveis sobre verde; guia de estilos abre
- [ ] **/perguntas-frequentes** — índice de âncoras rola até o grupo; nenhuma pergunta "PENDENTE" visível
- [ ] **WhatsApp** — qualquer botão abre o app com a mensagem pré-preenchida do contexto certo (teste 2 contextos diferentes)
- [ ] **Maps** — "Como chegar" abre o Google Maps no lugar certo (por enquanto via busca de endereço)
- [ ] **Sticky bar** — sempre visível, item da página ativa em dourado, nada escondido atrás dela no fim da página (safe-area do iPhone)
- [ ] **Badge de status** — header mostra "2 lojas abertas / 1 loja aberta / Fechado agora · abre…" correto para o horário do teste; tocar no badge abre o popover com as duas unidades; badges com cor coerente (verde/âmbar/creme, nunca vermelho)
- [ ] **FAQ deep-link** — abrir `…/perguntas-frequentes#faq-online` direto: o accordion certo já chega aberto e centralizado

Extras recomendados antes do domínio oficial: Lighthouse mobile ≥ 95 (Performance/SEO/Acessibilidade), teste com JavaScript desativado (site navegável, badges ausentes, horários visíveis) e um teste de feriado (`override.ativo: true` → badge dourado com a mensagem).

---

Ordem sugerida: **subir (1) → conectar (2–3) → testar no preview (5) → editar pendências (4) → domínio oficial.**
