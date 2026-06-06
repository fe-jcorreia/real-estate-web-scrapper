# Feature: QuintoAndar Scraper

## Overview

Implementar o parser para o QuintoAndar, primeiro portal integrado ao sistema. Cobre listagens de **aluguel** (~40.446 imóveis) e **venda** (~145.723 imóveis) em São Paulo — totalizando ~186k imóveis.

O QuintoAndar é um SPA Next.js com carregamento dinâmico via botão "Ver mais" (~12 cards por página). Não há paginação tradicional por URL — os dados são carregados via requisições client-side. Isso exige uma abordagem baseada em browser automation (Playwright) em vez de HTTP puro.

## Análise do Site

### Estrutura de URLs

```
Aluguel: /alugar/imovel/sao-paulo-sp-brasil
Venda:   /comprar/imovel/sao-paulo-sp-brasil
Detalhe: /imovel/{propertyId}/alugar/...
         /imovel/{propertyId}/comprar/...
```

### Dados disponíveis por listing card

| Campo               | Disponível | Exemplo                    |
| ------------------- | ---------- | -------------------------- |
| ID do imóvel        | Sim        | `893148728`                |
| Fotos               | Sim        | URLs de imagem responsivas |
| Preço (aluguel/venda) | Sim      | R$ 2.500/mês               |
| Condomínio + IPTU   | Sim (venda)| R$ 850 + R$ 320            |
| Área                | Sim        | 65 m²                     |
| Quartos             | Sim        | 2                          |
| Banheiros           | Sim        | 1                          |
| Vagas               | Sim        | 1                          |
| Endereço/bairro     | Sim        | Vila Mariana, São Paulo    |
| Tipo do imóvel      | Sim        | Apartamento                |
| Tags                | Sim        | Exclusivo, Anúncio novo    |

### Mecanismo de carregamento

- SSR inicial: ~12 cards renderizados no HTML
- Botão "Ver mais" carrega próximo lote via JS (não muda a URL)
- Parâmetros de tracking: `search_id`, `search_rank` com `sortMode` e `searchMode`
- Sem `__NEXT_DATA__` exposto no fetch — dados controlados client-side

### robots.txt

- **Não bloqueia** as páginas de busca (`/alugar/imovel/...`, `/comprar/imovel/...`)
- **Bloqueia** paths com `?filters=true`, `?redirect*`, `?search_id=*`
- **Bloqueia** `/imovel/*` com certos subpaths (mas permite com `?utm_*`)
- **Sem Crawl-delay** definido
- Sitemap: `https://www.quintoandar.com.br/sitemap-v2.xml`

## Estratégia Anti-Bloqueio

### 1. Rate Limiting Inteligente

| Parâmetro          | Valor          | Justificativa                                     |
| ------------------ | -------------- | ------------------------------------------------- |
| `REQUEST_DELAY_MS` | 3000–5000 ms   | Delay aleatório entre requisições simula humano    |
| Jitter             | ±30%           | Randomização evita padrão de timing detectável     |
| Batch pause        | 30–60s a cada 50 páginas | Pausa longa periódica reduz pressão       |
| Session duration   | Máximo ~200 pages/sessão | Reinicia browser context periodicamente |

**Estimativa de tempo (conservador):**
- ~186k imóveis ÷ 12 por página ≈ 15.500 page loads
- A 4s média + pausas ≈ ~20h de scraping total
- Dividido em sessões de ~4h ao longo de vários dias

### 2. Fingerprint & Headers

- **User-Agent rotation**: pool de 10+ UAs reais (Chrome/Firefox/Edge em Windows/Mac/Linux)
- **Viewport randomization**: variações realistas de resolução (1366x768, 1920x1080, etc.)
- **Accept-Language**: `pt-BR,pt;q=0.9,en;q=0.8`
- **Timezone/locale**: configurar Playwright para `America/Sao_Paulo`
- **WebDriver flag**: desabilitar via `--disable-blink-features=AutomationControlled`

### 3. Comportamento Humano Simulado

- **Scroll gradual**: scroll suave antes de clicar "Ver mais" (não ir direto ao botão)
- **Mouse movement**: movimentos aleatórios antes de interações
- **Random wait after load**: esperar 1–3s após carregamento antes de interagir
- **Occasional "idle" periods**: pausas mais longas (10–20s) a cada ~10 interações

### 4. Gestão de Sessão & Browser Context

- **Novo context a cada sessão**: limpa cookies/cache periodicamente
- **Persistent cookies dentro da sessão**: aceitar cookies do site normalmente
- **Rotação de context**: novo browser context a cada ~200 páginas
- **Não fazer login**: scraping anônimo reduz fingerprint

### 5. Resiliência & Retry

| Cenário                        | Estratégia                                          |
| ------------------------------ | --------------------------------------------------- |
| Timeout de página              | Retry com backoff exponencial (3 tentativas)        |
| Captcha/challenge detectado    | Log + skip, não tentar resolver. Pausa longa (5min) |
| HTTP 429 (rate limit)          | Pausa de 5–10min, reduzir velocidade                |
| HTTP 403 (bloqueio)            | Trocar context + UA, pausa de 10min                 |
| Página sem listings            | Log como warning, continuar                         |
| "Ver mais" não encontrado      | Considerar fim da paginação                         |

### 6. Estratégia de Paginação por Subdivisão Geográfica

Para contornar a limitação do "Ver mais" e o volume de ~186k imóveis:

**Abordagem**: dividir por bairros de São Paulo em vez de paginar sequencialmente.

```
/alugar/imovel/sao-paulo-sp-brasil/bairro-vila-mariana
/alugar/imovel/sao-paulo-sp-brasil/bairro-pinheiros
/comprar/imovel/sao-paulo-sp-brasil/bairro-moema
...
```

**Vantagens:**
- Cada bairro tem volume gerenciável (centenas a poucos milhares)
- Menos cliques em "Ver mais" por sessão
- Paralelizável no futuro
- Mais resiliente (um bairro falha, outros continuam)

**Implementação:**
1. Usar sitemap do QuintoAndar para extrair lista de bairros
2. Fallback: lista hardcoded dos ~96 distritos de São Paulo
3. Cada bairro é uma "task" independente no ScrapeJob

### 7. Conformidade com robots.txt

- Respeitar todos os `Disallow` paths
- Não usar parâmetros `?filters=true`, `?search_id=*`, `?redirect*`
- URLs limpas sem tracking params nas requisições

## Prerequisites

- [x] Monorepo configurado com Turborepo
- [x] Prisma schema com ListingEntity, ScrapeJobEntity, RawPageEntity
- [x] BrowserClient com Playwright
- [x] SiteParser interface definida
- [x] Env schema com configs de delay e concurrency

## Acceptance Criteria

- [ ] Parser extrai todos os campos disponíveis dos cards do QuintoAndar
- [ ] Suporta modo `alugar` e `comprar` via `transactionType`
- [ ] Paginação via "Ver mais" funciona até esgotar resultados
- [ ] Delay aleatório entre requisições (jitter ±30%)
- [ ] Rotação de User-Agent entre requisições
- [ ] Retry com backoff exponencial em falhas transientes
- [ ] Pausa automática ao detectar bloqueio (429/403/captcha)
- [ ] Raw HTML salvo antes do parsing
- [ ] ScrapeJob rastreia progresso com contadores
- [ ] Deduplicação por `(source, sourceId)` via upsert
- [ ] Logs estruturados em todas as etapas

## Technical Design

### Files to Create

| File                                                        | Purpose                                          |
| ----------------------------------------------------------- | ------------------------------------------------ |
| `apps/crawler/src/parsers/quintoandar.parser.ts`            | Parser específico para cards do QuintoAndar      |
| `apps/crawler/src/data/browser/stealth.config.ts`           | Configurações anti-detecção (UAs, viewports)     |
| `apps/crawler/src/data/browser/human-behavior.ts`           | Simulação de comportamento humano (scroll, mouse) |
| `apps/crawler/src/domain/scrape/retry.strategy.ts`          | Lógica de retry com backoff exponencial          |
| `apps/crawler/src/domain/scrape/rate-limiter.ts`            | Rate limiting com jitter e batch pause           |
| `apps/crawler/src/domain/scrape/pagination.strategy.ts`     | Lógica de paginação via "Ver mais" + subdivisão  |
| `apps/crawler/src/domain/model/neighborhood.model.ts`       | Lista de bairros de SP para subdivisão geográfica |

### Files to Modify

| File                                                            | Change                                              |
| --------------------------------------------------------------- | --------------------------------------------------- |
| `apps/crawler/src/data/browser/browser.client.ts`              | Adicionar stealth config, context rotation, viewport |
| `apps/crawler/src/env/env-schema.ts`                            | Novas env vars (UA_POOL, BATCH_PAUSE, etc.)          |
| `apps/crawler/src/domain/scrape/scrape.use-case.ts`            | Integrar retry, rate-limiter, paginação              |
| `apps/crawler/src/index.ts`                                     | Registrar QuintoAndar parser, configurar execução    |
| `apps/crawler/src/crawler.config.ts`                            | Setup do stealth e rate limiter                      |

### Data Model Changes

Nenhuma alteração no Prisma schema necessária. Os campos existentes cobrem todos os dados do QuintoAndar:
- `source`: `"quintoandar"`
- `sourceId`: ID do imóvel (ex: `893148728`)
- `transactionType`: `"rent"` ou `"sale"`
- Demais campos mapeiam diretamente

## Implementation Steps

1. **Stealth & anti-detecção** — `stealth.config.ts` com pool de UAs e viewports, flags anti-detecção no Playwright
2. **Comportamento humano** — `human-behavior.ts` com scroll gradual, mouse movement, idle periods
3. **Rate limiter** — `rate-limiter.ts` com delay aleatório (jitter), batch pause, session rotation
4. **Retry strategy** — `retry.strategy.ts` com backoff exponencial, detecção de bloqueio
5. **Atualizar BrowserClient** — integrar stealth config, context rotation, viewport randomization
6. **Lista de bairros** — `neighborhood.model.ts` com distritos de SP (extrair do sitemap ou hardcoded)
7. **Paginação** — `pagination.strategy.ts` com lógica de "Ver mais" + subdivisão por bairro
8. **Parser QuintoAndar** — `quintoandar.parser.ts` extraindo dados dos cards HTML
9. **Integrar no use-case** — conectar parser, paginação, retry e rate-limiter no fluxo de scraping
10. **Atualizar index.ts** — registrar parser e orquestrar execução por bairro/tipo

## Testing Plan

- [ ] Unit tests para `quintoandar.parser.ts` com HTML fixtures (cards reais salvos)
- [ ] Unit tests para `rate-limiter.ts` (verificar jitter, batch pause)
- [ ] Unit tests para `retry.strategy.ts` (backoff, max retries)
- [ ] Integration test: scrape 1 bairro pequeno, verificar dados no banco
- [ ] Manual: rodar scrape de 1 bairro, verificar logs e raw HTML salvos
- [ ] Manual: verificar que dados no banco estão corretos e completos

## Edge Cases

- **Bairro sem imóveis**: log info e skip, não tratar como erro
- **Listing card com dados incompletos**: extrair o que tem, campos opcionais ficam null
- **Preço em formato inesperado**: regex flexível, log warning se não parsear
- **"Ver mais" desaparece antes do esperado**: aceitar como fim da lista, log total encontrado
- **Captcha/challenge**: pausar execução, log error com URL, continuar com próximo bairro
- **Site fora do ar**: retry com backoff, abort sessão após 3 falhas consecutivas
- **Mudança no HTML do site**: parser falha, logs claros indicando seletores quebrados
- **Duplicatas entre bairros**: upsert por `(source, sourceId)` garante idempotência

## Estimativas

| Métrica              | Aluguel   | Venda      | Total     |
| -------------------- | --------- | ---------- | --------- |
| Imóveis              | ~40.446   | ~145.723   | ~186.169  |
| Page loads (~12/pág) | ~3.371    | ~12.144    | ~15.515   |
| Tempo (4s/req + pausas) | ~5h    | ~16h       | ~21h      |
| Sessões (~4h cada)   | 2         | 4–5        | 6–7       |
| Dias (1 sessão/dia)  | 1–2       | 4–5        | ~7        |

## Riscos

| Risco                                   | Probabilidade | Impacto | Mitigação                                     |
| --------------------------------------- | ------------- | ------- | --------------------------------------------- |
| Bloqueio por IP                         | Média         | Alto    | Rate limiting conservador, pausas longas       |
| Mudança no HTML do site                 | Baixa         | Alto    | Seletores resilientes, raw HTML salvo          |
| "Ver mais" usa API protegida            | Média         | Médio   | Fallback: interceptar network requests         |
| Volume total mudou significativamente   | Baixa         | Baixo   | Adaptar batch sizes dinamicamente              |
| Captcha agressivo em certas páginas     | Média         | Médio   | Skip + retry posterior, subdivisão por bairro  |
