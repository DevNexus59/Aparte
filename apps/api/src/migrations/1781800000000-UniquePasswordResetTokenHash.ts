import { MigrationInterface, QueryRunner } from "typeorm";

export class UniquePasswordResetTokenHash1781800000000 implements MigrationInterface {
    name = 'UniquePasswordResetTokenHash1781800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_password_resets_token_hash\` ON \`password_resets\` (\`token_hash\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_password_resets_token_hash\` ON \`password_resets\``);
    }
}
