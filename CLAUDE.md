# CLAUDE.md — Governança do Projeto "Cronograma Pessoal"

Este arquivo é a fonte de verdade do projeto. Qualquer assistente de IA (ou pessoa)
trabalhando neste repositório deve ler este documento antes de propor código,
arquitetura ou testes.

## 1. Objetivo do projeto

Sistema pessoal de cronograma semanal (não é um calendário com datas fixas — é um
quadro semanal recorrente). O usuário mantém uma **pool** de atividades (ex.:
"Estudar Inglês", "Trabalho", "Almoço") e as posiciona livremente em um grid de
7 dias da semana, com hora de início e duração ajustáveis visualmente.

Projeto de estudo/portfólio — escopo intencionalmente pequeno. Não escalar
funcionalidades além do que está em `docs/requisitos.md` sem antes atualizar
este documento e `docs/requisitos.md`.

## 2. Perfil do desenvolvedor (contexto obrigatório para a IA)

Lucas é **QA Engineer sênior** — forte em BDD/Gherkin, Playwright, Selenium,
testes de API, SQL e CI/CD — e está **começando em desenvolvimento**
(Java, SQL, HTML/CSS básico). Está estudando o método "Anti-Vibe Coding" de
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

- **Backend:** Java 21 + Spring Boot 3, Spring Data JPA, Spring Security (JWT),
  PostgreSQL.
- **Frontend:** Vue 3 (Composition API) + Vite + JavaScript, Pinia para estado.
  Biblioteca de drag-and-drop e abordagem de CSS a decidir no Dia 2.
- **Testes backend:** JUnit 5, Mockito, Testcontainers (Postgres real em testes
  de integração).
- **Testes frontend:** Vitest + Vue Test Utils (unitário/componente),
  Playwright para E2E (ferramenta que o Lucas já domina).
- **Infra local:** Docker Compose. Nesta fase (Dia 1) só o banco de dados e uma
  ferramenta de administração (Adminer) rodam em container — os serviços de
  aplicação (backend/frontend) entram no Dia 2, quando o esqueleto existir.

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
  calendário.

## 6. Estado atual do projeto

- [x] **Dia 1 — Isolamento e Governança:** sandbox Docker (Postgres + Adminer),
      este arquivo, estrutura inicial do repositório, requisitos levantados.
- [ ] Dia 2 — Fundação e Estrutura (arquitetura detalhada, esqueleto
      backend/frontend, Docker Compose completo, variáveis de ambiente)
- [ ] Dia 3 — Muralha de Testes (TDD)
- [ ] Dia 4 — Codificação
- [ ] Dia 5 — Otimização e Refatoração
- [ ] Dia 6 — Interface de Saída
- [ ] Dia 7 — Deploy e Esteira de CD

## 7. Decisões em aberto (a resolver no Dia 2)

- Biblioteca de drag-and-drop no Vue (ex.: `vuedraggable`, ou implementação
  nativa com HTML5 Drag and Drop API).
- Estratégia de responsividade para uso futuro em celular (PWA vs. app nativo
  futuro).
- Regra de exclusão: apagar uma Atividade da pool remove todas as suas
  Alocações? (assumido "sim" em `docs/requisitos.md`, a confirmar).

## 8. Requisitos funcionais

Ver [`docs/requisitos.md`](docs/requisitos.md) para o levantamento completo e
os cenários em Gherkin.
