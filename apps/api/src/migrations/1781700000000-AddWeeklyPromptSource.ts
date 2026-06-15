import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWeeklyPromptSource1781700000000 implements MigrationInterface {
    name = 'AddWeeklyPromptSource1781700000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`weekly_prompts\` ADD \`source\` enum ('manual', 'ai') NOT NULL DEFAULT 'manual'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`weekly_prompts\` DROP COLUMN \`source\``);
    }

}
