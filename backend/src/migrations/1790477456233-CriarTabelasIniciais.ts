import type { MigrationInterface, QueryRunner } from 'typeorm';

// Schema inicial — o mesmo que o `synchronize` do TypeORM criava até a
// seção 7.26 do CLAUDE.md (gerado a partir das entidades, com os mesmos
// nomes de constraints). Um banco local criado pelo `synchronize` já tem
// este schema e só precisa registrar a migration como executada.
export class CriarTabelasIniciais1790477456233 implements MigrationInterface {
  name = 'CriarTabelasIniciais1790477456233';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE "atividades" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nome" character varying NOT NULL, "cor" character varying NOT NULL, "usuarioId" character varying NOT NULL, CONSTRAINT "UQ_bb3eba6736bc4943d1f137b5ef2" UNIQUE ("usuarioId", "nome"), CONSTRAINT "PK_a6aaafbd59aa3ed64c5fa2b196b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."alocacoes_diasemana_enum" AS ENUM('domingo', 'segunda-feira', 'terca-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sabado')`,
    );
    await queryRunner.query(
      `CREATE TABLE "alocacoes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "atividadeId" uuid NOT NULL, "diaSemana" "public"."alocacoes_diasemana_enum" NOT NULL, "horaInicio" character varying NOT NULL, "duracaoMinutos" integer NOT NULL, CONSTRAINT "PK_f8773c16f96cdcceb7a41a30905" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "usuarios" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nomeCompleto" character varying NOT NULL, "email" character varying NOT NULL, "senhaHash" character varying NOT NULL, CONSTRAINT "UQ_446adfc18b35418aac32ae0b7b5" UNIQUE ("email"), CONSTRAINT "PK_d7281c63c176e152e4c531594a8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "alocacoes" ADD CONSTRAINT "FK_5e50b42c936c6bef9e924646792" FOREIGN KEY ("atividadeId") REFERENCES "atividades"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "alocacoes" DROP CONSTRAINT "FK_5e50b42c936c6bef9e924646792"`);
    await queryRunner.query(`DROP TABLE "usuarios"`);
    await queryRunner.query(`DROP TABLE "alocacoes"`);
    await queryRunner.query(`DROP TYPE "public"."alocacoes_diasemana_enum"`);
    await queryRunner.query(`DROP TABLE "atividades"`);
  }
}
