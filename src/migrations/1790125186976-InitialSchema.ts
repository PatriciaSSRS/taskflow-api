import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1790125186976 implements MigrationInterface {
    name = 'InitialSchema1790125186976'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."tasks_status_enum" AS ENUM('a_fazer', 'em_andamento', 'concluida')`);
        await queryRunner.query(`CREATE TYPE "public"."tasks_priority_enum" AS ENUM('baixa', 'media', 'alta')`);
        await queryRunner.query(`CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" character varying, "status" "public"."tasks_status_enum" NOT NULL DEFAULT 'a_fazer', "priority" "public"."tasks_priority_enum" NOT NULL DEFAULT 'media', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "tasks"`);
        await queryRunner.query(`DROP TYPE "public"."tasks_priority_enum"`);
        await queryRunner.query(`DROP TYPE "public"."tasks_status_enum"`);
    }

}
