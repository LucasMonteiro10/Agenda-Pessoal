# Cronograma Pessoal

Projeto de estudo (portfólio) desenvolvido seguindo o método "Anti-Vibe Coding"
de Fábio Akita — engenharia de software disciplinada assistida por IA, em vez
de código gerado sem controle.

Sistema de cronograma semanal recorrente: o usuário mantém uma **pool** de
atividades (ex.: "Estudar Inglês", "Trabalho", "Almoço") e as posiciona
livremente em um grid de 7 dias, com horário e duração ajustáveis
visualmente por drag-and-drop.

## Stack

- **Backend:** Java 21 + Spring Boot 3 + PostgreSQL + Spring Security (JWT)
- **Frontend:** Vue 3 + Vite

## Status

🚧 **Dia 1 de 7 — Isolamento e Governança** concluído. Veja o roteiro completo
e as regras do projeto em [`CLAUDE.md`](CLAUDE.md) e os requisitos funcionais
em [`docs/requisitos.md`](docs/requisitos.md).

## Como rodar o ambiente de dados (Dia 1)

```bash
cp .env.example .env
docker compose up -d
```

- Postgres disponível em `localhost:5432` (credenciais em `.env`)
- Adminer (interface web do banco) em [http://localhost:8081](http://localhost:8081)

Os projetos de backend e frontend ainda não existem — entram no Dia 2.
