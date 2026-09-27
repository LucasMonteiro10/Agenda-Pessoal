import { MigrationExecutor, type DataSource } from 'typeorm';
import { CriarTabelasIniciais1790477456233 } from '../migrations/1790477456233-CriarTabelasIniciais.js';

// Lista explícita (e não um glob tipo 'dist/migrations/*.js'): na Vercel o
// backend vira uma função empacotada, e só entra no pacote o que é importado
// a partir do src/main.ts. Migration nova = importar e adicionar aqui.
export const MIGRACOES = [CriarTabelasIniciais1790477456233];

// Número arbitrário que identifica a trava das migrations no Postgres.
const TRAVA_DAS_MIGRACOES = 20_260_926;

// Executa as migrations pendentes com uma trava: na Vercel, várias
// instâncias da função podem subir ao mesmo tempo, e sem isso duas delas
// tentariam criar as mesmas tabelas. Tudo acontece numa única transação,
// na mesma conexão — `pg_advisory_xact_lock` segura as outras instâncias
// até o commit (quando elas conferem de novo e não encontram nada
// pendente). Numa transação só, funciona também através do pooler de
// conexões do Neon, que não mantém travas de sessão.
export async function executarMigracoes(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    await queryRunner.query('SELECT pg_advisory_xact_lock($1)', [TRAVA_DAS_MIGRACOES]);

    const executor = new MigrationExecutor(dataSource, queryRunner);
    // 'all' com a transação já aberta: o executor usa a nossa, sem abrir outra.
    executor.transaction = 'all';
    await executor.executePendingMigrations();

    await queryRunner.commitTransaction();
  } catch (erro) {
    await queryRunner.rollbackTransaction();
    throw erro;
  } finally {
    await queryRunner.release();
  }
}
