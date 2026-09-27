import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { Alocacao } from '../src/alocacoes/entities/alocacao.entity.js';
import { Atividade } from '../src/atividades/entities/atividade.entity.js';
import { Usuario } from '../src/auth/entities/usuario.entity.js';
import { executarMigracoes, MIGRACOES } from '../src/config/migracoes.js';

// Motivação: CLAUDE.md, seção 7.26 — sem `synchronize`, o schema do banco
// passa a vir só das migrations, executadas na inicialização do backend. Na
// Vercel, várias instâncias da função podem subir ao mesmo tempo.
describe('Migrations do banco', () => {
  let container: StartedPostgreSqlContainer;
  const abertas: DataSource[] = [];

  async function novaConexao(): Promise<DataSource> {
    const dataSource = new DataSource({
      type: 'postgres',
      url: container.getConnectionUri(),
      entities: [Usuario, Atividade, Alocacao],
      migrations: MIGRACOES,
      synchronize: false,
    });
    await dataSource.initialize();
    abertas.push(dataSource);
    return dataSource;
  }

  async function migracoesRegistradas(dataSource: DataSource): Promise<number> {
    const [{ total }] = await dataSource.query('SELECT count(*)::int AS total FROM migrations');
    return total;
  }

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
  });

  afterAll(async () => {
    await Promise.all(abertas.map((dataSource) => dataSource.destroy()));
    await container.stop();
  });

  it('duas instâncias subindo ao mesmo tempo criam o schema do zero, sem conflito', async () => {
    const [instanciaA, instanciaB] = await Promise.all([novaConexao(), novaConexao()]);

    await Promise.all([executarMigracoes(instanciaA), executarMigracoes(instanciaB)]);

    const tabelas: { table_name: string }[] = await instanciaA.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name",
    );
    expect(tabelas.map((t) => t.table_name)).toEqual(['alocacoes', 'atividades', 'migrations', 'usuarios']);
    expect(await migracoesRegistradas(instanciaA)).toBe(MIGRACOES.length);
  });

  it('rodar de novo não faz nada (idempotente)', async () => {
    const dataSource = await novaConexao();

    await executarMigracoes(dataSource);

    expect(await migracoesRegistradas(dataSource)).toBe(MIGRACOES.length);
  });

  // Rede de segurança: mudou uma entidade e esqueceu a migration? Este teste
  // falha e mostra o SQL que falta (o mesmo que o TypeORM geraria).
  it('o schema criado pelas migrations bate exatamente com as entidades', async () => {
    const dataSource = await novaConexao();

    const { upQueries } = await dataSource.driver.createSchemaBuilder().log();

    expect(upQueries.map((q) => q.query)).toEqual([]);
  });
});
