# Deploy — Cloudflare Pages

## Comandos do projeto

```bash
npm install       # instala dependências (Node 20+, ver .nvmrc)
npm run dev       # desenvolvimento em http://localhost:4321
npm run build     # gera o site estático em dist/ (valida todo o conteúdo)
npm run preview   # serve o build de produção localmente
npm test          # testes do motor de status (Vitest)
```

## Publicar na Cloudflare Pages

1. Suba o projeto para um repositório Git (GitHub/GitLab).
2. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Selecione o repositório e configure:

| Campo | Valor |
|---|---|
| Framework preset | **Astro** |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `arsenal-site` (se o repo contiver a pasta) |
| Variável de ambiente | `NODE_VERSION` = `20` |

4. Deploy. Cada `git push` na branch principal publica automaticamente.
5. **Custom domain:** Pages → Custom domains → adicionar o domínio definitivo
   (SSL automático).

## Configurações que vivem no código (não são variáveis de ambiente)

Por decisão de stack (site estático, conteúdo fixo), toda configuração fica em
arquivos versionados — editar + push = publicar:

| O quê | Onde |
|---|---|
| **Domínio definitivo** | `astro.config.mjs` (`site:`), `src/content/data/site.json` (`dominio`) e `public/robots.txt` (linha do sitemap) |
| **ID do GA4** | `site.json` → `ga4Id`. Enquanto for `G-PENDENTE`, **nenhum tracking é carregado** |
| **Número do WhatsApp** | `whatsapp.json` → `numero` (formato `5535XXXXXXXXX`) e `numeroPendente: false` |
| **Links do Google Maps** | `unidades.json` → `mapsUrl` (enquanto PENDENTE, os botões usam busca por endereço) |
| **Instagram** | `site.json` → `instagram` (URL completa; enquanto PENDENTE, o link não aparece) |
| **Horários / feriados** | `unidades.json` → `horarios` e `override` (`{"ativo": true, "mensagem": "..."}`) |
| **Fotos reais** | arquivos em `public/midia/` + `midias.json` → `"existe": true` |

O build **falha de propósito** se um JSON ficar inválido (schemas Zod) — um erro
de digitação nunca chega ao ar.

## Checklist de lançamento (pendências reais)

- [ ] Número de WhatsApp real em `whatsapp.json`
- [ ] Domínio definitivo nos 3 pontos acima
- [ ] GA4 criado e `ga4Id` preenchido
- [ ] Links oficiais do Google Maps (e Google Business Profile de cada unidade apontando para a página da unidade)
- [ ] Instagram em `site.json`
- [ ] Respostas operacionais (estacionamento, pet, acessibilidade) → mudar `pendente: false` nos JSONs
- [ ] Fotos da lista de prioridade mínima (ou decisão consciente de lançar com placeholders)
- [ ] OG images (1200×630) em `public/og/`
- [ ] Lighthouse mobile ≥ 95 no preview da Cloudflare antes de apontar o domínio
