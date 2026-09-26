# Agenda Pessoal

Projeto de estudo (portfólio) desenvolvido seguindo o método "Anti-Vibe Coding"
de Fábio Akita — engenharia de software disciplinada assistida por IA, em vez
de código gerado sem controle.

Sistema de agenda semanal recorrente: o usuário mantém uma **pool** de
atividades (ex.: "Estudar Inglês", "Trabalho", "Almoço") e as posiciona
livremente em um grid de 7 dias, com horário e duração ajustáveis
visualmente por drag-and-drop.

## Stack

- **Backend:** Node.js + NestJS + TypeScript + TypeORM + PostgreSQL + JWT
- **Frontend:** React 18 + TypeScript + Vite + Redux Toolkit (ainda não
  conectado) + FullCalendar (grid semanal)

## Status

🚧 **Dia 4 de 7 — Codificação** concluído: autenticação (JWT) e pool de
atividades funcionando ponta a ponta (API + componentes React), com a
muralha de testes do backend verde (16 testes e2e). O calendário semanal
usa o **FullCalendar** (arrastar da pool, mover, redimensionar, seletor de
granularidade e de dia de início da semana, tudo verificado num navegador
real) — os testes automatizados do grid ficaram de fora desta rodada, a
pedido do Lucas, e serão retomados depois. Veja o roteiro completo e as
regras do projeto em [`CLAUDE.md`](CLAUDE.md) e os requisitos funcionais em
[`docs/requisitos.md`](docs/requisitos.md).

## Como rodar o ambiente completo

```bash
cp .env.example .env
docker compose up -d --build
```

Todas as portas de acesso são configuráveis via `.env`
(`POSTGRES_PORT`, `ADMINER_PORT`, `BACKEND_PORT`, `FRONTEND_PORT`) — os
valores abaixo são os deste ambiente local (o `.env.example` traz os
valores originais do template, `5432`/`8081`/`3000`/`5173`; ajuste
livremente em caso de conflito de porta na sua máquina):

- Postgres disponível em `localhost:1000` (credenciais em `.env`)
- Adminer (interface web do banco) em [http://localhost:1001](http://localhost:1001)
- Backend (NestJS) em [http://localhost:1002](http://localhost:1002)
- Frontend (React) em [http://localhost:1003](http://localhost:1003)

> **Trocando `BACKEND_PORT`:** o `docker-compose.yml` mapeia
> `${BACKEND_PORT}:${BACKEND_PORT}` (host e container usam a mesma
> variável) porque o NestJS também lê `BACKEND_PORT` para decidir em que
> porta escutar dentro do container (`backend/src/main.ts`). Se só o lado
> host do mapeamento fosse trocado, o container continuaria escutando em
> `3000` por padrão e a porta customizada ficaria inacessível — por isso
> as duas pontas do mapeamento precisam usar a mesma variável.

Backend e frontend rodam com hot-reload (o código local é montado dentro do
container), então editar arquivos em `backend/src` ou `frontend/src` reflete
sem precisar reconstruir a imagem.

> Se for instalar dependências manualmente com `npm install` dentro de
> `backend/` ou `frontend/` (fora do Docker), use
> `npm install --legacy-peer-deps` — veja a nota técnica na seção 7.2 do
> `CLAUDE.md`.

> **Erro `Failed to resolve import "@algum-pacote"` mesmo depois de
> `--build`?** O `docker-compose.yml` usa um volume anônimo pra
> `frontend/node_modules` (pra não perder o hot-reload nem sobrescrever o
> `node_modules` do container com o bind mount do código-fonte) — e esse
> volume **sobrevive** a `docker compose down`/`up -d --build`, então uma
> dependência nova pode continuar faltando mesmo com a imagem já
> reconstruída. Resolve com:
> ```bash
> docker compose rm -f -v frontend   # remove o container E o volume anônimo dele
> docker compose up -d --build frontend
> ```
> Isso não afeta o Postgres (`postgres_data` é um volume nomeado, nunca
> removido por engano por esse comando).
