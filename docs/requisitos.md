# Requisitos — Cronograma Pessoal

Levantamento funcional a partir da descrição do Lucas (11/09/2026), estruturado
em user stories e cenários Gherkin. Cenários revisados e ajustados por Lucas em
16/09/2026. Este documento é a base para os testes que serão escritos no
Dia 3 (TDD).

## Visão geral

- Não é um calendário com datas — é um **quadro semanal recorrente** (dias da
  semana, sem vínculo a uma data específica do ano).
- Uma **pool** lateral guarda as Atividades cadastradas pelo usuário — na UI,
  aparece como uma **barra de atividades** com o título "Suas atividades".
- O usuário arrasta uma Atividade da pool para o grid semanal, criando uma
  **Alocação** (clone) com dia, horário e duração próprios.
- Cada usuário autenticado tem seu próprio cronograma (login simples).

## Glossário

Ver seção 5 do `CLAUDE.md`. Resumo: **Atividade** (nome + cor, na pool) vs.
**Alocação** (clone posicionado no grid, com dia/hora/duração próprios).

## Suposições e decisões de negócio (confirmadas por Lucas em 16/09/2026)

1. **Confirmado.** Excluir uma Atividade da pool exclui também todas as suas
   Alocações no calendário. A UI deve pedir confirmação antes de excluir
   (ação destrutiva em cascata). Excluir uma Alocação (clone) individual,
   por outro lado, NÃO afeta os demais clones nem a Atividade mestre na pool.
2. **Corrigido.** A granularidade escolhida (15 min / 30 min / 1 h) é
   **apenas visual** — define o espaçamento das linhas do grid. Ela não
   limita a duração mínima de uma Alocação nem força snap: o usuário pode
   posicionar e redimensionar alocações com qualquer horário/duração,
   inclusive valores menores ou maiores que a granularidade exibida.
3. **Confirmado.** Não há limite de quantos clones uma Atividade pode ter.
4. **Confirmado.** A cor de uma Atividade é escolhida livremente em
   hexadecimal pelo usuário e é independente do tema claro/escuro da
   plataforma (o tema afeta o "chrome" da interface, não a cor das
   atividades).
5. **Corrigido.** Cada Atividade deve ter um **nome único** (não é permitido
   cadastrar duas Atividades com o mesmo nome).
6. **Confirmado.** Alocações podem se sobrepor no mesmo dia/horário (não há
   bloqueio de conflito). A exibição de alocações sobrepostas usa o layout
   padrão do FullCalendar (colunas lado a lado, proporcional ao número de
   alocações sobrepostas) — ver CLAUDE.md, seção 7.6.
7. **Novo.** Clicar em um card de Alocação não cria mais um clone
   automaticamente — abre um menu de opções: "Duplicar" (cria um clone logo
   abaixo do card original), "Excluir" (remove só aquela Alocação) e
   "Excluir atividade" (remove a Atividade da pool e todas as suas Alocações,
   com confirmação).
8. **Novo.** Responsividade para celular (PWA ou app nativo) fica fora de
   escopo por enquanto.

---

## Feature: Gerenciar pool de atividades

```gherkin
Funcionalidade: Gerenciar atividades na pool

  Cenário: Criar uma nova atividade
    Dado que estou autenticado
    Quando eu crio uma atividade com nome "Estudar Inglês" e cor "#3366FF"
    Então a atividade "Estudar Inglês" deve aparecer na pool
    E ela não deve estar alocada em nenhum dia ou horário

  Cenário: Editar nome e cor propaga para todos os clones
    Dado que a atividade "Estudar Inglês" possui alocações na segunda-feira e na sexta-feira
    E possui cor "#3366FF"
    Quando eu altero o nome da atividade para "Inglês - Duolingo"
    E altero a cor da atividade para "#33FF81"
    Então o nome e a cor devem ser atualizados na pool
    E o nome e a cor devem ser atualizados em todas as alocações existentes dessa atividade

  Cenário: Editar dia, horário ou duração NÃO propaga entre clones
    Dado que a atividade "Estudar Inglês" possui uma alocação na segunda-feira das 19:00 às 20:00
    E possui outra alocação na sexta-feira das 19:00 às 20:00
    Quando eu altero a alocação de sexta-feira para durar até as 21:00
    Então a alocação de segunda-feira deve continuar das 19:00 às 20:00
    E o nome e a cor de ambas as alocações devem continuar iguais

  Cenário: Excluir uma atividade pede confirmação e remove seus clones
    Dado que a atividade "Trabalho" possui 3 alocações no calendário
    Quando eu clico para excluir a atividade "Trabalho" da pool
    Então o sistema deve exibir uma mensagem de confirmação
    Quando eu confirmo a exclusão
    Então as 3 alocações devem ser removidas do calendário
    E a atividade não deve mais aparecer na pool

  Cenário: Impedir duas atividades com o mesmo nome
    Dado que já existe uma atividade "Trabalho" na minha pool
    Quando eu tento criar outra atividade com nome "Trabalho"
    Então o sistema deve rejeitar a criação
    E avisar que já existe uma atividade com esse nome
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

  Cenário: Redimensionar a duração de uma alocação com valor livre
    Dado que a granularidade do calendário está configurada para 30 minutos
    E existe uma alocação de "Sono" das 23:00 às 23:30
    Quando eu arrasto a borda inferior do card para estender até as 00:17
    Então a duração da alocação deve passar a ser das 23:00 às 00:17
    E as demais alocações de "Sono" não devem ser afetadas

  Cenário: Permitir sobreposição de alocações no mesmo dia/horário
    Dado que existe uma alocação de "Trabalho" na segunda-feira das 09:00 às 12:00
    Quando eu crio outra alocação de "Reunião" na segunda-feira das 10:00 às 11:00
    Então ambas as alocações devem coexistir no mesmo dia e horário
    E ambos os cards devem ser exibidos lado a lado, sem bloquear a criação
```
> Nota: a exibição de alocações sobrepostas segue o layout padrão do
> FullCalendar (colunas lado a lado) — ver item 6 de "Suposições e decisões
> de negócio" e CLAUDE.md, seção 7.6.
>
> Nota: a granularidade é só uma referência visual das linhas do grid — não
> força snap nem duração mínima. Ver item 2 de "Suposições e decisões de
> negócio".

## Feature: Interagir com um card de alocação

```gherkin
Funcionalidade: Opções de um card de alocação no calendário

  Cenário: Clicar em um card abre o menu de opções
    Dado que existe uma alocação de "Estudar Inglês" na segunda-feira às 19:00 por 1h
    Quando eu clico sobre o card dessa alocação
    Então o sistema deve exibir as opções "Duplicar", "Excluir" e "Excluir atividade"

  Cenário: Duplicar cria um clone logo abaixo do card original
    Dado que existe uma alocação de "Estudar Inglês" na segunda-feira às 19:00 por 1h
    Quando eu clico em "Duplicar" nas opções do card
    Então uma nova alocação da atividade "Estudar Inglês" deve ser criada logo abaixo da original
    E o clone deve herdar o nome e a cor da atividade original
    E o clone deve poder ser reposicionado em outro dia, horário ou duração
      independentemente do original

  Cenário: Excluir remove só aquele card
    Dado que a atividade "Estudar Inglês" possui alocações na segunda-feira e na sexta-feira
    Quando eu clico em "Excluir" nas opções do card da alocação de segunda-feira
    Então apenas a alocação de segunda-feira deve ser removida do calendário
    E a alocação de sexta-feira deve continuar existindo
    E a atividade "Estudar Inglês" deve continuar na pool

  Cenário: Excluir atividade a partir do card remove a atividade e todos os clones
    Dado que a atividade "Estudar Inglês" possui alocações na segunda-feira e na sexta-feira
    Quando eu clico em "Excluir atividade" nas opções do card da alocação de segunda-feira
    Então o sistema deve exibir uma mensagem de confirmação
    Quando eu confirmo a exclusão
    Então a atividade "Estudar Inglês" não deve mais aparecer na pool
    E nenhuma alocação de "Estudar Inglês" deve continuar no calendário

  Cenário: Clicar em Cancelar impede a exclusão da atividade do card
    Dado que a atividade "Estudar Inglês" possui alocações na segunda-feira e na sexta-feira
    Quando eu clico em "Excluir atividade" nas opções do card da alocação de segunda-feira
    Então o sistema deve exibir uma mensagem de confirmação
    Quando eu clico em cancelar a exclusão
    Então a atividade "Estudar Inglês" deve permanecer na pool
    E nenhuma alocação de "Estudar Inglês" deve ser removida do calendário
```

## Feature: Configurações do calendário

```gherkin
Funcionalidade: Configurar exibição do calendário

  Cenário: Escolher Domingo como o dia de início da semana
    Quando o usuário seleciona "Domingo" como início da semana
    Então o calendário deve exibir Domingo como primeira coluna e Sábado como última

  Cenário: Escolher Segunda-feira como o dia de início da semana
    Quando o usuário seleciona "Segunda-feira" como início da semana
    Então o calendário deve exibir Segunda-feira como primeira coluna e Domingo como última

  Cenário: Escolher granularidade das linhas de horário de 1 hora
    Quando o usuário seleciona granularidade de "1 hora"
    Então as linhas do calendário devem ser exibidas em intervalos de 1 em 1 hora
    E o usuário deve continuar podendo mover/redimensionar cards com
      horários e durações livres, maiores ou menores que 1 hora
    E o horário e a duração das alocações já existentes não devem mudar
      só porque a granularidade de exibição mudou

  Cenário: Escolher granularidade das linhas de horário de 30 minutos
    Quando o usuário seleciona granularidade de "30 minutos"
    Então as linhas do calendário devem ser exibidas em intervalos de 30 em 30 minutos
    E o usuário deve continuar podendo mover/redimensionar cards com
      horários e durações livres, maiores ou menores que 30 minutos
    E o horário e a duração das alocações já existentes não devem mudar
      só porque a granularidade de exibição mudou

  Cenário: Escolher granularidade das linhas de horário de 15 minutos
    Quando o usuário seleciona granularidade de "15 minutos"
    Então as linhas do calendário devem ser exibidas em intervalos de 15 em 15 minutos
    E o usuário deve continuar podendo mover/redimensionar cards com
      horários e durações livres, maiores ou menores que 15 minutos
    E o horário e a duração das alocações já existentes não devem mudar
      só porque a granularidade de exibição mudou

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

## Feature: Limpar calendário

```gherkin
Funcionalidade: Limpar todas as alocações do calendário

  Cenário: Botão "Limpar calendário" pede confirmação
    Dado que existem alocações de várias atividades espalhadas pela semana
    Quando eu clico no botão "Limpar calendário"
    Então o sistema deve exibir uma mensagem de confirmação

  Cenário: Confirmar limpeza remove todos os clones e preserva a pool
    Dado que existem alocações de "Trabalho", "Almoço" e "Estudar Inglês" na semana
    Quando eu clico no botão "Limpar calendário"
    E confirmo a limpeza
    Então nenhuma alocação deve permanecer em nenhum dia do calendário
    E as atividades "Trabalho", "Almoço" e "Estudar Inglês" devem continuar na pool

  Cenário: Cancelar a confirmação não altera o calendário
    Dado que existe uma alocação de "Trabalho" na segunda-feira às 09:00
    Quando eu clico no botão "Limpar calendário"
    E cancelo a confirmação
    Então a alocação de "Trabalho" na segunda-feira às 09:00 deve continuar existindo
```
> Nota: "Limpar calendário" remove só as Alocações (clones); as Atividades
> continuam na pool para serem alocadas novamente. Segue o mesmo padrão de
> confirmação usado em "Excluir atividade" (ver "Suposições e decisões de
> negócio", item 1).

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

  Cenário: Login com credenciais inválidas
    Dado que informo um email ou senha que não correspondem a nenhuma conta cadastrada
    Quando eu tento fazer login
    Então eu devo receber uma mensagem alertando sobre email ou senha incorretos
    E eu não devo ser autenticado

  Cenário: Deslogar um usuário autenticado
    Dado que estou autenticado
    Quando eu clico na opção de deslogar
    Então eu devo voltar para a tela de login

  Cenário: Isolamento de dados entre usuários
    Dado que existem dois usuários, A e B, cada um com atividades cadastradas
    Quando o usuário A faz login
    Então ele deve ver apenas as atividades e alocações que ele criou
```

---

## Próximos passos

1. ~~Lucas revisa/ajusta estes cenários~~ — feito em 16/09/2026 (decisões
   incorporadas nas seções acima).
2. Dia 3: transformar os cenários acima em testes automatizados que falham
   (Vitest + Supertest + Testcontainers no backend, Vitest + React Testing
   Library no frontend) — antes de qualquer código de produção.
3. Dia 4: implementar o modelo de dados (entidades `Atividade`, `Alocacao`,
   `Usuario`), os endpoints REST e as telas que fazem os testes do Dia 3
   passarem.
