# CLAUDE.md — Governança do Projeto "Cronograma Pessoal"

Este arquivo é a fonte de verdade do projeto. Qualquer assistente de IA (ou pessoa)
trabalhando neste repositório deve ler este documento antes de propor código,
arquitetura ou testes.

## 1. Objetivo do projeto

Sistema pessoal de cronograma semanal (não é um calendário com datas fixas — é um
quadro semanal recorrente). O usuário mantém uma **pool** de atividades (ex.:
"Estudar Inglês", "Trabalho", "Almoço") e as posiciona livremente em um grid de
7 dias da semana, com hora de início e duração ajustáveis visualmente.

Projeto de estudo/portfólio (React + NestJS), usado também para estudar
desenvolvimento web moderno — escopo intencionalmente pequeno. Não escalar
funcionalidades além do que está em `docs/requisitos.md` sem antes atualizar
este documento e `docs/requisitos.md`.

## 2. Perfil do desenvolvedor (contexto obrigatório para a IA)

Lucas é **QA Engineer sênior** — forte em BDD/Gherkin, Playwright, Selenium,
testes de API, SQL e CI/CD — e está **começando em desenvolvimento**
em desenvolvimento web (React JS, Nest JS). Está estudando o método "Anti-Vibe Coding" de
Fábio Akita: disciplina de engenharia de software em vez de "prompt e reza".

Diretrizes para qualquer IA atuando aqui:

- Explicar decisões técnicas de forma didática antes (ou junto) de implementar —
  não assumir conhecimento prévio de conceitos de backend/frontend.
- **Nunca pular etapas de planejamento e testes** para "ir mais rápido".
- Aproveitar a experiência de QA do Lucas: sempre que fizer sentido, pedir para
  ele revisar/ajustar os cenários Gherkin antes de implementar a funcionalidade
  correspondente.
- Nenhuma decisão de escopo, arquitetura ou stack é tomada sem confirmação
  explícita do desenvolvedor.

## 3. Stack tecnológica (decidida)

- **Backend:** Node.js + NestJS + TypeScript, TypeORM, PostgreSQL, autenticação
  com JWT (`@nestjs/jwt` + Passport).
- **Frontend:** React 18 + TypeScript + Vite, Redux Toolkit para estado
  global (ainda não conectado — sem slices reais até existir estado de
  verdade a gerenciar, ver seção 7.4), `FullCalendar` (`@fullcalendar/react`
  + `timegrid` + `interaction`, todos fixados em `6.1.21`) para o grid
  semanal. CSS puro (arquivos `.css`, sem CSS-in-JS nem framework de UI) —
  **exceção pontual:** `water.css` só na tela de login/cadastro, ver seção 7.10.
- **Testes backend:** Vitest (padrão do NestJS a partir da v12) + Supertest
  para testes de integração de endpoints, Testcontainers (Postgres real em
  testes de integração).
- **Testes frontend:** Vitest + React Testing Library (unitário/componente),
  Playwright para E2E (ferramenta que o Lucas já domina).
- **Infra local:** Docker Compose com 4 serviços — `postgres`, `adminer`,
  `backend` e `frontend` (backend e frontend rodam com hot-reload via bind
  mount, desde o Dia 2).

## 4. Regras de engenharia (não negociáveis)

1. **TDD obrigatório.** Nenhuma funcionalidade é implementada sem um teste que
   falhe antes. Se a IA sugerir código de produção sem teste correspondente,
   isso deve ser recusado/refeito.
2. Commits pequenos e atômicos, seguindo Conventional Commits
   (`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`).
3. Toda decisão arquitetural relevante é registrada neste arquivo (seção 6/7).
4. Requisitos e regras de negócio vivem em `docs/requisitos.md`, em formato
   Gherkin sempre que possível — é a linguagem que o Lucas já domina.
5. Nada de infraestrutura ou dependência "por precaução" — só o que os
   requisitos atuais pedem.

## 5. Glossário de domínio

- **Atividade:** item cadastrado na pool (nome + cor). É o "template"/mestre.
- **Alocação:** posicionamento de uma Atividade no calendário (dia da semana +
  horário de início + duração). Uma Atividade pode ter várias Alocações
  (clones).
- **Clone:** sinônimo de Alocação criada a partir de uma Atividade existente.
  Todos os clones de uma Atividade compartilham **nome e cor**. Dia, horário e
  duração são independentes por clone.
- **Pool:** lista lateral de Atividades disponíveis para arrastar ao
  calendário. É o termo de domínio usado no código (`PoolLateral.tsx`,
  classes `.pool-lateral*`, cenários Gherkin "Gerenciar pool de
  atividades") — a UI a exibe como uma **barra de atividades**, com o
  título "Suas atividades" (ver `docs/requisitos.md`, "Visão geral").

## 6. Estado atual do projeto

- [x] **Dia 1 — Isolamento e Governança:** sandbox Docker (Postgres + Adminer),
      este arquivo, estrutura inicial do repositório, requisitos levantados.
- [x] **Dia 2 — Fundação e Estrutura:** esqueleto `backend/` (NestJS +
      TypeScript, módulos vazios `AuthModule`/`AtividadesModule`/
      `AlocacoesModule`, TypeORM conectado ao Postgres) e `frontend/` (React +
      TypeScript + Vite, Redux Toolkit com store vazia); Docker Compose
      completo com os 4 serviços; variáveis de ambiente centralizadas em
      `.env`/`.env.example`. Nenhuma entidade, endpoint ou tela de negócio foi
      implementada ainda — isso é o Dia 4, depois da Muralha de Testes.
- [x] **Dia 3 — Muralha de Testes (TDD):** todos os cenários Gherkin de
      `docs/requisitos.md` viraram testes que falham — 17 testes e2e no
      backend (Vitest + Supertest + Testcontainers, 5 arquivos por Feature) e
      7 arquivos de componente no frontend (Vitest + React Testing Library).
      Todos falham hoje por falta de implementação (404 no backend, módulo
      inexistente no frontend) — isso é esperado e intencional. Cenários de
      arrastar/redimensionar via drag-and-drop não têm teste de UI ainda
      (biblioteca em aberto, seção 7) — só o efeito no backend foi testado.
      Contrato que emergiu dos testes: ver seção 7.3.
- [x] **Dia 4 — Codificação:** toda a muralha do Dia 3 está verde — 16/16
      testes e2e no backend, 28/28 testes de componente no frontend, build
      limpo (`tsc`/`nest build`/`vite build`) e validação manual via
      `docker compose up` (registrar → login → criar atividade → criar
      alocação → listar, tudo funcionando ponta a ponta). Detalhes e
      armadilhas encontradas: ver seção 7.4.
- [x] **Grid semanal com FullCalendar, fora da numeração dos dias
      (17/09/2026):** pool numa lateral direita com cards, linhas do
      time-grid visíveis, redimensionar funcionando de verdade, seletores de
      granularidade e início da semana — tudo via `FullCalendar`
      (`@fullcalendar/react` + `timegrid` + `interaction`). Verificado
      manualmente num navegador real: criar (arrastar da pool), mover,
      redimensionar, menu de opções (Duplicar/Excluir/Excluir atividade) com
      confirmação. Detalhes e armadilhas: ver seção 7.6.
      **Testes automatizados do grid ficaram de fora desta rodada** (pedido
      explícito do Lucas); os testes dos demais componentes
      (`AtividadeItem`, `ConfirmDialog`, `LimparCalendarioButton`,
      `useTema`, `TelaAutenticada`) continuam passando (15/15).
- [ ] Dia 5 — Otimização e Refatoração
- [ ] Dia 6 — Interface de Saída
- [ ] Dia 7 — Deploy e Esteira de CD

## 7. Decisões em aberto

- Nenhuma no momento. A última pendente (abordagem de CSS) foi resolvida em
  17/09/2026 — CSS puro (arquivos `.css`), ver seção 7.6.

### 7.0. Decisões resolvidas por Lucas (16/09/2026)

- **Biblioteca de drag-and-drop e grid semanal:** `FullCalendar`
  (`@fullcalendar/react` + `timegrid` + `interaction`). Ver seção 7.6 para os
  detalhes técnicos.
- **Responsividade mobile:** fora de escopo por enquanto — nem PWA nem app
  nativo nesta fase do projeto.
- **Exclusão de Atividade:** confirmado — remove todas as suas Alocações
  (clones). A interface deve exibir uma mensagem de confirmação antes de
  excluir, por ser uma ação destrutiva em cascata.
- **Exclusão de um clone (Alocação) individual:** não afeta os demais clones
  nem a Atividade mestre na pool — é uma exclusão isolada.
- **Nova feature — "Limpar calendário":** botão que remove todas as Alocações
  (clones) de uma vez, preservando as Atividades na pool. Segue o mesmo
  padrão de confirmação das demais ações destrutivas em cascata.
- Detalhamento comportamental dessas regras (e outras decisões de domínio,
  como nomes únicos de Atividade, granularidade meramente visual e
  sobreposição de alocações permitida) está nos cenários Gherkin de
  `docs/requisitos.md`.

### 7.2. Notas técnicas do Dia 2

- O template atual do NestJS (v12) gera o projeto em ESM (`"type": "module"`
  no `package.json`), com imports relativos terminados em `.js` mesmo em
  arquivos `.ts` — é o padrão do template, não uma escolha manual.
- `npm install` no `backend/` pode falhar com o erro
  `Cannot read properties of null (reading 'edgesOut')` — é um bug conhecido
  do resolvedor de dependências do npm 10.x com peer deps opcionais do
  Vitest/NestJS mais recentes. Solução: usar `npm install --legacy-peer-deps`
  neste projeto (inclusive nos `Dockerfile.dev`).
- `synchronize: true` no TypeORM (`backend/src/config/database.config.ts`) é
  temporário, só para Dia 2/3 sem migrations. Deve virar `false` a partir do
  Dia 4, quando entram migrations versionadas.
- `npm install` no `frontend/` também pode precisar de `--testing-library/dom`
  como dependência explícita (peer do React Testing Library que o npm às
  vezes não resolve sozinho) e do mesmo `--legacy-peer-deps` do backend.
- **Volume anônimo de `node_modules` sobrevive a `docker compose up -d
  --build`.** O `docker-compose.yml` monta `frontend/node_modules` (e o
  equivalente do backend) como volume anônimo, pra não perder o hot-reload
  nem deixar o bind mount do código-fonte apagar o `node_modules` instalado
  na imagem. Só que o Compose **preserva esse volume entre recriações de
  container** — rebuildar a imagem (`--build`) sozinho não reseta o que já
  está montado, então uma dependência nova (ex.: `@fullcalendar/*`,
  `water.css`) pode continuar dando `Failed to resolve import` mesmo depois
  do rebuild. Aconteceu 3 vezes neste projeto (seções 7.9/7.10). Fix
  correto: `docker compose rm -f -v <serviço>` (remove o container **e**
  seu volume anônimo) antes de subir de novo com `--build` — não `docker
  compose down -v`, que também apagaria o `postgres_data` (volume nomeado,
  com dados de verdade). Ver nota equivalente no `README.md`.

### 7.3. Contrato proposto pela Muralha de Testes (Dia 3)

Escrever os testes antes do código exigiu decidir a "forma" da API e dos
componentes. São decisões de implementação, não de arquitetura — mas como
nasceram sem uma rodada de confirmação prévia, ficam registradas aqui para
revisão antes do Dia 4. Qualquer uma pode ser renomeada/ajustada sem custo,
já que nada foi implementado ainda.

**API REST (backend), todas as rotas de Atividade/Alocação exigem
`Authorization: Bearer <token>`:**

| Rota | Efeito |
| --- | --- |
| `POST /auth/registrar` | Cria usuário `{ email, senha }` |
| `POST /auth/login` | Retorna `{ accessToken }` |
| `POST /atividades` | Cria `{ nome, cor }` — 409 se nome duplicado |
| `GET /atividades` | Lista as atividades do usuário autenticado |
| `PATCH /atividades/:id` | Edita `{ nome?, cor? }` |
| `DELETE /atividades/:id` | Remove a atividade e cascade nas suas alocações |
| `POST /alocacoes` | Cria `{ atividadeId, diaSemana, horaInicio, duracaoMinutos }` — também é como o frontend implementa "Duplicar" (repete os campos do card original) |
| `GET /alocacoes` | Lista as alocações do usuário, cada uma com `atividade: { id, nome, cor }` embutido |
| `PATCH /alocacoes/:id` | Move/redimensiona `{ diaSemana?, horaInicio?, duracaoMinutos? }` |
| `DELETE /alocacoes/:id` | Remove só aquele clone |
| `DELETE /alocacoes` (sem id) | "Limpar calendário" — remove todas as alocações do usuário |

Decisão de modelagem central: **Alocação não duplica nome/cor** — ela só
guarda `atividadeId` e seus próprios `diaSemana`/`horaInicio`/`duracaoMinutos`;
nome e cor sempre vêm de um join com Atividade. É isso que faz "editar
propaga" e "editar NÃO propaga" (Suposições, item 1) saírem de graça da
modelagem, sem lógica extra de sincronização.

Sem validação de conflito de horário: duas alocações podem se sobrepor
livremente (Suposições, item 6) — a resolução visual da sobreposição é
inteiramente do frontend.

**Componentes propostos (frontend, ainda não implementados):**

- `ConfirmDialog` — diálogo de confirmação reutilizável (usado por
  `AtividadeItem`, `CardAlocacao` e `LimparCalendarioButton`).
- `AtividadeItem` — item da pool com botão excluir + confirmação.
- `CardAlocacao` — card do grid; clicar abre menu com Duplicar/Excluir/Excluir
  atividade; marca sobreposição via atributo `data-sobreposicao` com valores
  `"reduzido"`, `"metade-esquerda"` ou `"metade-direita"`.
- `GradeSemanal` — recebe `diaInicioSemana`, `granularidadeMinutos` e
  `alocacoes` como props; é só apresentação (não sabe nada de API).
- `useTema` — hook com `matchMedia('(prefers-color-scheme: dark)')` como
  padrão e `localStorage` para a escolha manual do usuário.
- `TelaAutenticada` — alterna entre children e tela de login via uma flag
  `autenticado`, sem depender de biblioteca de rotas (ainda não decidida).

### 7.4. Notas técnicas do Dia 4

- **`PassportModule` precisa ser registrado em todo módulo que usa
  `JwtAuthGuard`**, não só no `AuthModule` — descoberta ao implementar
  `AtividadesModule`/`AlocacoesModule`. Cada módulo Nest tem seu próprio
  container de DI; `AuthGuard('jwt')` depende de um provider
  (`AuthModuleOptions`) que só existe onde `PassportModule.register(...)`
  (não a versão sem argumentos) foi importado.
- **`ConfigModule` com `envFilePath: ['.env', '../.env']`**: o backend lê
  `JWT_SECRET` e as credenciais do Postgres do `.env` da raiz do repo. Dentro
  do Docker Compose isso nem é usado (as variáveis já vêm do `environment:`
  do serviço); rodando localmente de dentro de `backend/` (ex.:
  `npm run test:e2e`), o `'../.env'` reaproveita o mesmo arquivo em vez de
  duplicar segredos. O Testcontainers ainda funciona porque `dotenv` nunca
  sobrescreve uma variável que o processo já tinha definido.
- **Modelagem sem duplicação, na prática**: `Alocacao` guarda só
  `atividadeId`; toda resposta da API busca `nome`/`cor` via join com
  `Atividade` (`AlocacoesService.paraResposta`). Isso confirmou a hipótese da
  seção 7.3 — "editar propaga"/"editar não propaga" não precisaram de nenhuma
  lógica extra de sincronização.
- **`usuarioId` não deve vazar nas respostas**: a primeira versão de
  `AtividadesService` devolvia a entidade `Atividade` inteira (incluindo
  `usuarioId`) direto do TypeORM. Corrigido com um mapeador `paraResposta`
  que só expõe `{ id, nome, cor }`, igual ao que `AlocacoesService` já fazia.
- **Removido o boilerplate do Nest CLI** (`AppController`, `AppService`,
  `app.controller.spec.ts`, `test/app.e2e-spec.ts`) — era o "Hello World"
  gerado no Dia 2, não testava nada do domínio e falhava fora do Docker por
  tentar resolver o host `postgres` (só existe na rede do Compose).
- **Frontend: `tsc -b` não conhecia os globais do Vitest** (`describe`,
  `it`, `expect`, `vi`) porque `tsconfig.app.json` (usado no build de
  produção) incluía os arquivos `*.test.tsx` sem os tipos certos. Solução:
  `tsconfig.app.json` agora exclui `*.test.ts(x)`, e um novo
  `tsconfig.vitest.json` (com `types: ["vitest/globals", ...]`) cobre só os
  testes — referenciado em `tsconfig.json` para o `tsc -b` continuar
  validando os dois.
- `npm install` no `frontend/` também precisou de `@testing-library/dom`
  como dependência explícita (peer do React Testing Library).
- **Redux Toolkit sem slices ainda dispara erro em runtime.**
  `configureStore({ reducer: {} })` (um reducer vazio) é rejeitado em tempo
  de execução pelo Redux Toolkit ("Store does not have a valid reducer").
  Como nenhuma slice existe ainda (o app usa `useState` local), a correção
  foi remover o `<Provider>`/`store.ts`/`hooks.ts` até existir pelo menos uma
  slice de verdade pra colocar nele — criar um store vazio "por precaução"
  é o tipo de infra prematura que a regra 5 (seção 4) pede pra evitar. Redux
  Toolkit continua sendo a escolha de estado global (seção 3); só a criação
  do store fica pra quando houver estado de fato pra gerenciar.

### 7.6. FullCalendar: decisões e notas técnicas

**Lib escolhida:** `FullCalendar` (`@fullcalendar/react` +
`@fullcalendar/timegrid` + `@fullcalendar/interaction`), depois de uma
pesquisa comparando com `react-big-calendar`, `Schedule-X`, `Toast UI
Calendar`, `react-calendar-timeline` e `MUI X Scheduler`. Nenhuma delas foi
feita para um quadro semanal recorrente sem datas reais, mas o FullCalendar
resolve o essencial de graça, na versão MIT (não precisou de nada Premium):
`timeGridWeek` (linhas de horário), `slotDuration` (granularidade),
`firstDay` (dia de início), `eventResize`/`eventDrop` (mover/redimensionar) e
`Draggable` externo (arrastar da pool).

**⚠️ Pin de versão importante:** `@fullcalendar/core` e `@fullcalendar/react`
têm `latest` em `7.1.0`, mas `timegrid`/`daygrid`/`interaction` nunca saíram
de release candidate na v7 (`7.0.0-rc.0`) — o `latest` deles ainda é
`6.1.21`. Misturar as duas séries quebra (o core v7 nem exporta mais
`@fullcalendar/core/internal`, que os plugins v6 exigem). **Todos os pacotes
FullCalendar devem ficar fixados em `6.1.21`** — não usar `^` ou `latest` até
os plugins alcançarem a v7 estável.

**Modelagem sem data real:** o componente ancora tudo numa semana falsa fixa
(`ANCORA_DOMINGO`, uma segunda-feira/domingo arbitrário de 2024) com
`validRange` travando a navegação nela e `dayHeaderContent` escondendo o
número da data (mostra só o nome do dia via `NOME_EXIBICAO_DIA_SEMANA`). Uma
`Alocacao` vira um evento com `start`/`end` calculados a partir dessa âncora
+ `diaSemana` + `horaInicio`; ao mover/redimensionar, o dia da semana e o
horário são extraídos de volta do `Date` resultante e a data em si é
descartada — é só "papel" para o FullCalendar calcular posições.

**Sobreposição de alocações:** usa o layout padrão do FullCalendar (colunas
lado a lado, proporcional ao número de alocações sobrepostas) — decisão
confirmada com Lucas (ver `docs/requisitos.md`, item 6 das Suposições e os
cenários de "Sobreposição..." na Feature "Alocar atividades no calendário").

**Menu de opções do card (Duplicar/Excluir/Excluir atividade):** não existe
como recurso pronto do FullCalendar — implementado por cima via `eventClick`
(abre um menu posicionado nas coordenadas do clique) em vez de um botão
dentro do evento, mais simples que brigar com o `eventContent` para um menu
interativo.

**Armadilhas encontradas verificando no navegador** (mesma limitação de
sempre: nada disso é testável de forma confiável em jsdom/RTL, que não tem
layout real):
- O motor de arrastar do FullCalendar (`@fullcalendar/interaction`) é
  baseado em **`MouseEvent`/`TouchEvent` legados, não em `PointerEvent`**.
  Um script de diagnóstico via `PointerEvent` sintético (com
  `isPrimary: true`) não tinha efeito nenhum — precisou usar `MouseEvent`
  sintético em vez disso.
- A alça de redimensionar (`.fc-event-resizer`) só fica visível/clicável via
  **`:hover` real do CSS** — e `:hover` só é alterado por movimento de
  ponteiro genuíno reconhecido pelo motor de renderização do navegador,
  nunca por um `element.dispatchEvent(new MouseEvent(...))` feito via
  JavaScript de página. Só a ferramenta de automação de verdade (`hover` +
  `left_click_drag`, que usam entrada de baixo nível via CDP) conseguiu
  revelar e arrastar a alça.
- Ao calcular a posição de um alvo de drop, cuidado com o **scroll interno
  do time-grid** (`scrollTime` deixa o topo da coluna, à meia-noite,
  posicionado fora da viewport — `getBoundingClientRect().top` de uma coluna
  inteira pode vir negativo). Usar a posição de uma célula de horário
  específica e visível (`.fc-timegrid-slot[data-time="09:00:00"]`), não o
  topo da coluna inteira.
- Disparar uma sequência longa de `mousemove` sintéticos (30 eventos num
  loop apertado) enquanto o alvo estava fora da viewport (coordenada Y
  negativa) travou a aba por 45s. Preferir poucos passos, sempre com
  coordenadas dentro da viewport visível.

### 7.7. Correções pós-FullCalendar (17/09/2026)

Lucas encontrou 4 defeitos usando o calendário de verdade, todos corrigidos
e reverificados manualmente no navegador:

1. **Nomes dos dias errados ao trocar o início da semana.** Causa raiz: o
   FullCalendar calcula "a semana atual" como "os 7 dias a partir de
   `firstDay`, contendo a data de referência atual". A data de referência
   estava fixa numa âncora absoluta (um domingo); ao mudar `firstDay` para
   segunda, "a semana de 7 dias começando numa segunda que contém aquele
   domingo" é uma janela de datas *diferente* da fixada — dessincronizando
   cabeçalho e eventos. Corrigido calculando a data de referência (e a data
   de cada evento) sempre em função do `diaInicioSemana` atual
   (`dataDeReferencia` em `CalendarioSemanal.tsx`), e navegando o calendário
   explicitamente via `calendarApi.gotoDate(...)` num `useEffect` — porque
   `initialDate` só é lido na primeira montagem (é uma prop "inicial", o
   FullCalendar não reage a mudanças nela depois).
   **Correção 2 (18/09/2026):** a primeira versão de `dataDeReferencia`
   deslocava a partir de uma âncora fixa numa segunda-feira usando a fórmula
   errada — só "dava certo" quando `diaInicioSemana` era exatamente
   "segunda-feira" (coincidência, porque a âncora já era uma segunda), e
   para qualquer outra combinação calculava uma data com o dia da semana
   errado. Sintoma: trocar o início da semana fazia os cards já existentes
   mudarem de dia. Corrigido calculando primeiro o início da semana exibida
   a partir de uma âncora sempre-correta (`dataAbsolutaDoDia`, um domingo
   fixo + deslocamento em dias), e só depois deslocando a partir *dele* — a
   prova de correção: `dataDeReferencia(dia, calquerInicio).getDay()` tem
   que ser sempre exatamente `paraNumeroDiaSemana(dia)`, para qualquer
   combinação, o que a primeira versão não garantia e a segunda garante.
   Reverificado manualmente: criar cards em 4 dias diferentes, trocar o
   início da semana pra frente e pra trás, e confirmar que cada card
   continua na mesma coluna visual o tempo todo.
2. **Scroll resetava ao mover/criar/redimensionar um card.** A opção
   `scrollTimeReset` (default `true`) faz o FullCalendar voltar o scroll pro
   horário de `scrollTime` sempre que considera as datas exibidas "novas".
   Corrigido com `scrollTimeReset={false}`.
3. **Modal de confirmação atrás do calendário.** `position: fixed` normalmente
   escapa pra viewport, mas isso quebra se algum ancestral cria um novo
   "containing block" (transform/filter/contain/etc.) — não valia a pena
   caçar qual elemento exatamente causava isso. Corrigido de forma definitiva
   renderizando `ConfirmDialog` (e o menu de opções do card) via
   `createPortal(..., document.body)`, prática padrão pra esse tipo de
   overlay em React.
4. **Não dava pra criar atividade nova com cor.** Não era um bug — a feature
   nunca tinha sido construída (só existiam as 3 atividades semeadas no
   `App.tsx`). Criado `NovaAtividadeForm.tsx` (nome + `<input type="color">`)
   dentro da `PoolLateral`, reaproveitando a mesma checagem de nome único já
   usada no backend (Suposições, item 5).

### 7.8. Mudança de comportamento: "Excluir alocações" no menu do card (19/09/2026)

Lucas pediu pra separar dois comportamentos que antes eram o mesmo texto
("Excluir atividade") em lugares diferentes da UI:

- **Menu do card no calendário → "Excluir alocações":** remove todos os
  clones daquela Atividade no calendário, mas a Atividade **continua na
  pool**, disponível pra novas alocações.
- **Botão "Excluir" na pool ("Suas atividades"):** continua cascateando —
  remove a Atividade e todas as suas Alocações. Esse comportamento não
  mudou.

Implementado como uma extensão do endpoint de "Limpar calendário"
(`DELETE /alocacoes`), que já existia: um novo parâmetro opcional
`?atividadeId=` escopa a remoção só às alocações daquela atividade, em vez
de todas as alocações do usuário. Preferido a criar uma rota nova porque a
semântica é idêntica ("apagar alocações, preservando atividades") — só muda
o filtro. Ver `AlocacoesService.removerTodas` e cenário Gherkin em
`docs/requisitos.md`, Feature "Interagir com um card de alocação".

### 7.9. Telas de Login/Cadastro implementadas (19/09/2026)

Até aqui só existia a integração de Autenticação no backend (Dia 3/4); a UI
era um placeholder (`<h1>Login</h1>` sem formulário, e nem estava conectada
em `App.tsx`). Implementado agora:

- **Campo novo: `nomeCompleto`.** Cadastro passou a exigir nome completo,
  email e senha (antes só email/senha). `Usuario.nomeCompleto` é `NOT NULL`
  — quebrou o `synchronize` do TypeORM contra o Postgres local (que já
  tinha usuários de teste sem esse campo, do Dia 4); resolvido recriando o
  volume local (`docker compose down -v`), com autorização do Lucas, já que
  são só dados de teste descartáveis. Fica registrado como lembrete: sem
  migrations (seção 7.2), qualquer coluna `NOT NULL` nova em cima de dados
  existentes é um risco parecido — outro motivo para migrations versionadas
  virarem prioridade (ver "Próximos passos" em `docs/requisitos.md`).
- **`TelaAutenticada`** ganhou os formulários de verdade: alterna entre
  "Login" (email + senha) e "Criar conta" (nome completo + email + senha)
  via um botão de alternância. Cadastro chama `POST /auth/registrar` e, em
  seguida, `POST /auth/login` automaticamente com as mesmas credenciais
  (cadastro não devolve token) — assim quem cria conta já cai direto no
  cronograma, sem precisar logar de novo à mão.
- **`authApi.ts`** (novo): cliente fininho sobre `fetch`, usando
  `VITE_API_URL` (já provisionado desde o Dia 2, seção 3/4). Erros do
  backend (400 de validação, 401 de credenciais) são extraídos do corpo
  `{ message }` do NestJS e exibidos como `role="alert"` no formulário.
  Nenhuma lib nova (`axios` etc.) — `fetch` nativo já resolve.
  - **`App.tsx`** agora guarda o `accessToken` em `localStorage` (chave
  `accessToken`) e envolve toda a composição existente com
  `<TelaAutenticada>`. Só a autenticação fala com o backend por enquanto —
  Atividades/Alocações continuam em estado local mockado (`useState`), como
  já era; conectar essa parte ao backend é um passo separado, ainda não
  feito.
- **Defeito encontrado e corrigido nesta rodada:** deslogar logo depois de
  um cadastro deixava a tela presa em "Criar conta" em vez de voltar para
  "Login" — o estado interno (`modo`) do formulário não era resetado.
  Corrigido em `handleDeslogar` (zera `modo`/campos/erro antes de chamar
  `onDeslogar`). Reproduzido manualmente no navegador e coberto por teste
  (`TelaAutenticada.test.tsx`).
- **Achado à parte, sem relação com este trabalho:** o `node_modules` do
  container `frontend` (volume anônimo) estava sem os pacotes
  `@fullcalendar/*` — faltou reinstalar depois de alguma mudança de
  dependência anterior. Corrigido rodando
  `docker compose exec frontend npm install --legacy-peer-deps` e reiniciando
  o serviço.

### 7.10. `water.css` só na tela de login/cadastro (19/09/2026)

Lucas pediu pra melhorar a aparência do login/cadastro. Foram comparadas 4
bibliotecas CSS "classless" (Pico, Water.css, Simple.css, MVP.css) num
Artifact à parte, lado a lado com o visual atual — Lucas escolheu
**Water.css**.

Isso é uma exceção pontual à regra "CSS puro, sem framework de UI" (seção
3) — water.css é só CSS (sem CSS-in-JS, sem mudar nenhum componente), mas
ainda é um framework de estilo de terceiros. Reaberto e decidido
explicitamente por Lucas, não uma escolha unilateral da IA.

**Por que só na tela de login:** water.css é *classless* — estiliza
`<body>`, `<input>`, `<button>`, `<table>` etc. direto pela tag, documento
inteiro. Um `import 'water.css'` estático em `main.tsx` ficaria sempre
ativo e recolocaria o cronograma inteiro também (botões da pool, da grade
semanal etc.), muito além do que foi pedido. Em vez disso,
`TelaAutenticada.tsx` injeta/remove um `<link rel="stylesheet">` via
`useEffect` amarrado à prop `autenticado`: o CSS só existe no `<head>`
enquanto a tela de login está visível, e some assim que autentica — o
resto do app continua com o `index.css`/`App.css` de sempre. Ver
`useWaterCssEnquantoDeslogado` em `TelaAutenticada.tsx`.

O caminho do arquivo CSS vem de `import waterCssHref from 'water.css?url'`
(sintaxe nativa do Vite para pegar a URL de um asset em vez de injetá-lo
como `<link>` automático) — só assim dava pra controlar manualmente
quando o `<link>` entra e sai do documento.

Reproduzido manualmente no navegador: tela de login com o visual do
Water.css (inclusive dark mode automático pelo tema do sistema);
autenticado → cronograma com o visual de sempre; deslogar → volta o
Water.css. Confirmado via DevTools que o `<link>` é removido do `<head>`
ao autenticar (não é só uma questão de especificidade CSS escondendo o
efeito).

### 7.11. Correção no mapeamento de `BACKEND_PORT` no Docker Compose (21/09/2026)

O `docker-compose.yml` mapeava `"${BACKEND_PORT:-3000}:3000"` — só o lado
host do mapeamento de porta era configurável via `.env`; o lado do
container ficava sempre fixo em `3000`. Isso é um bug: `backend/src/main.ts`
faz `app.listen(process.env.BACKEND_PORT ?? 3000)`, ou seja, o NestJS
*dentro* do container já escutava na porta customizada — então trocar
`BACKEND_PORT` no `.env` sem trocar as duas pontas do mapeamento deixava a
porta host apontando para o lugar errado (container continuava exposto só
em `3000`, não na porta nova). Corrigido para
`"${BACKEND_PORT:-3000}:${BACKEND_PORT:-3000}"`, as duas pontas usando a
mesma variável. Ver README para as portas em uso neste ambiente local
(diferentes dos defaults do `.env.example`, usadas aqui para não conflitar
com outros serviços já rodando na máquina).

### 7.12. Criar atividade a partir de um clique no calendário (21/09/2026)

Nova feature: clicar num espaço vazio do grid (não num card existente) abre
um formulário pedindo nome e cor — ao confirmar, cria a Atividade **e** já
aloca no dia/horário clicado, numa única ação. Cenários Gherkin em
`docs/requisitos.md`, Feature "Criar atividade a partir de um espaço vazio
do calendário".

- **`dateClick` (do `@fullcalendar/interaction`, já importado antes) só
  dispara num espaço vazio** — clicar num card dispara `eventClick` em vez
  disso, sem também disparar `dateClick`. Não precisou de nenhuma lógica pra
  diferenciar "clique no card" de "clique no vazio": a lib já resolve isso.
  Guarda `if (arg.allDay) return` por precaução (`allDaySlot={false}` já
  devia impedir isso, mas evita abrir o formulário sem horário de verdade se
  a lib um dia passar a disparar a partir de outra região clicável).
- **Regra de nome único extraída pra `validarNomeAtividade.ts`**
  (`features/atividades/`), compartilhada entre `NovaAtividadeForm` (pool) e
  o novo `NovaAtividadeDialog` (calendário) — evita a regra divergir entre
  os dois formulários de criação de Atividade que passaram a existir.
- **Duração padrão da alocação criada: 60 minutos**, igual à alocação criada
  ao arrastar da pool (`App.tsx`) — mesma convenção, sem novo conceito.
- **`NovaAtividadeDialog`** segue o mesmo padrão de portal pro `<body>` do
  `ConfirmDialog` (nasce dentro da árvore do FullCalendar, sujeito ao
  contexto de empilhamento interno da lib) e reaproveita as mesmas classes
  CSS do `ConfirmDialog`/`NovaAtividadeForm` — sem CSS novo.
- Testado manualmente no navegador: clique em espaço vazio abre o
  formulário com foco no campo nome; confirmar cria a atividade na pool E
  a alocação no dia/hora clicado; clicar num card existente continua
  abrindo o menu de opções (Duplicar/Excluir/Excluir alocações), sem abrir
  o formulário por engano.

## 8. Requisitos funcionais

Ver [`docs/requisitos.md`](docs/requisitos.md) para o levantamento completo e
os cenários em Gherkin.
