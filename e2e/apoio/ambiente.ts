import path from 'node:path';

// Endereços do ambiente descartável definido em docker-compose.e2e.yml —
// portas diferentes das do ambiente de desenvolvimento (1002/1003), para os
// dois rodarem ao mesmo tempo.
export const URL_FRONTEND = 'http://localhost:2003';
export const URL_BACKEND = 'http://localhost:2002';

const ARQUIVO_COMPOSE = path.resolve(__dirname, '../../docker-compose.e2e.yml');

// Aspas no caminho: a pasta do projeto pode ter espaços no nome.
export const COMANDO_COMPOSE = `docker compose -f "${ARQUIVO_COMPOSE}"`;
