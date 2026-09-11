# Requisitos — Cronograma Pessoal

Levantamento funcional a partir da descrição do Lucas (11/09/2026), estruturado
em user stories e cenários Gherkin. Este documento é a base para os testes que
serão escritos no Dia 3 (TDD) — revisar e ajustar os cenários antes de seguir
para a arquitetura (Dia 2).

## Visão geral

- Não é um calendário com datas — é um **quadro semanal recorrente** (dias da
  semana, sem vínculo a uma data específica do ano).
- Uma **pool** lateral guarda as Atividades cadastradas pelo usuário.
- O usuário arrasta uma Atividade da pool para o grid semanal, criando uma
  **Alocação** (clone) com dia, horário e duração próprios.
- Cada usuário autenticado tem seu próprio cronograma (login simples).

## Glossário

Ver seção 5 do `CLAUDE.md`. Resumo: **Atividade** (nome + cor, na pool) vs.
**Alocação** (clone posicionado no grid, com dia/hora/duração próprios).

## Suposições assumidas (a confirmar com o Lucas)

1. Excluir uma Atividade da pool exclui também todas as suas Alocações no
   calendário.
2. A duração mínima de uma Alocação é igual à granularidade escolhida (30 min
   ou 1 h); redimensionar sempre "encaixa" (snap) no grid.
3. Não há limite de quantos clones uma Atividade pode ter.
4. A cor de uma Atividade é escolhida livremente em hexadecimal pelo usuário e
   é independente do tema claro/escuro da plataforma (o tema afeta o "chrome"
   da interface, não a cor das atividades).
5. Duas Atividades podem ter o mesmo nome (não há unicidade obrigatória).

---

## Feature: Gerenciar pool de atividades

```gherkin
Funcionalidade: Gerenciar atividades na pool

  Cenário: Criar uma nova atividade
    Dado que estou autenticado
    Quando eu crio uma atividade com nome "Estudar Inglês" e cor "#3366FF"
    Então a atividade "Estudar Inglês" deve aparecer na pool
    E ela não deve estar alocada em nenhum dia ou horário

  Cenário: Editar nome ou cor propaga para todos os clones
    Dado que a atividade "Estudar Inglês" possui alocações na segunda-feira e na sexta-feira
    Quando eu altero o nome da atividade para "Inglês - Duolingo"
    Então o nome deve ser atualizado na pool
    E o nome deve ser atualizado em todas as alocações existentes dessa atividade

  Cenário: Editar dia, horário ou duração NÃO propaga entre clones
    Dado que a atividade "Estudar Inglês" possui uma alocação na segunda-feira das 19:00 às 20:00
    E possui outra alocação na sexta-feira das 19:00 às 20:00
    Quando eu altero a alocação de sexta-feira para durar até as 21:00
    Então a alocação de segunda-feira deve continuar das 19:00 às 20:00
    E o nome e a cor de ambas as alocações devem continuar iguais

  Cenário: Excluir uma atividade remove seus clones
    Dado que a atividade "Trabalho" possui 3 alocações no calendário
    Quando eu excluo a atividade "Trabalho" da pool
    Então as 3 alocações devem ser removidas do calendário
    E a atividade não deve mais aparecer na pool
```

## Feature: Alocar atividades no calendário

```gherkin
Funcionalidade: Alocar atividades no grid semanal

  Cenário: Arrastar atividade da pool para o calendário
    Dado que a atividade "Trabalho" está na pool
    Quando eu arrasto "Trabalho" para a coluna "Segunda-feira" no horário "09:00"
    Então uma alocação de "Trabalho" deve aparecer nesse dia e horário
    E a atividade "Trabalho" deve continuar disponível na pool para novas alocações

  Cenário: Mover uma alocação entre dias e horários
    Dado que existe uma alocação de "Almoço" na terça-feira às 12:00
    Quando eu arrasto essa alocação para a quarta-feira às 13:00
    Então a alocação deve passar a aparecer na quarta-feira às 13:00
    E deixar de aparecer na terça-feira às 12:00

  Cenário: Redimensionar a duração de uma alocação (granularidade 30 min)
    Dado que a granularidade do calendário está configurada para 30 minutos
    E existe uma alocação de "Sono" das 23:00 às 23:30
    Quando eu arrasto a borda inferior do card para estender até as 00:30
    Então a duração da alocação deve passar a ser das 23:00 às 00:30
    E as demais alocações de "Sono" não devem ser afetadas

  Cenário: Impedir sobreposição de alocações no mesmo dia/horário
    Dado que existe uma alocação de "Trabalho" na segunda-feira das 09:00 às 12:00
    Quando eu tento criar outra alocação na segunda-feira das 10:00 às 11:00
    Então o sistema deve avisar sobre o conflito de horário
```
> Nota: a regra acima ("impedir sobreposição") não foi confirmada pelo Lucas —
> está listada como pergunta em aberto. Pode ser permitida sobreposição
> visual (cards lado a lado) em vez de bloqueio.

## Feature: Clonar atividades

```gherkin
Funcionalidade: Clonar atividades a partir de um card

  Cenário: Clicar em um card no calendário cria um clone
    Dado que existe uma alocação de "Estudar Inglês" na segunda-feira às 19:00 por 1h
    Quando eu clico sobre o card dessa alocação
    Então uma nova alocação da atividade "Estudar Inglês" deve ser criada
    E o clone deve herdar o nome e a cor da atividade original
    E o clone deve poder ser reposicionado em outro dia, horário ou duração
      independentemente do original
```

## Feature: Configurações do calendário

```gherkin
Funcionalidade: Configurar exibição do calendário

  Cenário: Escolher o dia de início da semana
    Quando o usuário seleciona "Domingo" como início da semana
    Então o calendário deve exibir Domingo como primeira coluna e Sábado como última

  Cenário: Escolher granularidade das linhas de horário
    Quando o usuário seleciona granularidade de "1 hora"
    Então as linhas do calendário devem ser exibidas em intervalos de 1 em 1 hora
    E os cards devem se encaixar (snap) nesses intervalos ao mover ou redimensionar

  Cenário: Tema segue o sistema operacional por padrão
    Dado que o usuário não escolheu um tema manualmente
    E o sistema operacional está em modo escuro
    Quando o usuário abre a aplicação
    Então a interface deve ser exibida no tema escuro (preto e branco)

  Cenário: Usuário sobrescreve o tema do sistema
    Dado que o sistema operacional está em modo escuro
    Quando o usuário seleciona manualmente o tema claro
    Então a interface deve permanecer no tema claro até ele mudar novamente
```

## Feature: Autenticação

```gherkin
Funcionalidade: Autenticação de usuário

  Cenário: Cadastro de novo usuário
    Quando eu me cadastro com email e senha válidos
    Então uma conta deve ser criada
    E eu devo conseguir fazer login com essas credenciais

  Cenário: Login com credenciais válidas
    Dado que eu tenho uma conta cadastrada
    Quando eu informo email e senha corretos
    Então eu devo ser autenticado e ver meu próprio cronograma

  Cenário: Isolamento de dados entre usuários
    Dado que existem dois usuários, A e B, cada um com atividades cadastradas
    Quando o usuário A faz login
    Então ele deve ver apenas as atividades e alocações que ele criou
```

---

## Próximos passos

1. Lucas revisa/ajusta estes cenários (especialmente as suposições da seção
   "Suposições assumidas" e o cenário de sobreposição de horários).
2. Dia 2: transformar isso em modelo de dados (entidades `Atividade`,
   `Alocacao`, `Usuario`) e endpoints REST.
3. Dia 3: transformar os cenários acima em testes automatizados
   (JUnit/Testcontainers no backend, Vitest/Playwright no frontend) — antes de
   qualquer código de produção.
