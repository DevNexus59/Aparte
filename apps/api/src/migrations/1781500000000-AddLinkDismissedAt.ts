import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLinkDismissedAt1781500000000 implements MigrationInterface {
    name = 'AddLinkDismissedAt1781500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`links\` ADD \`dismissed_at\` timestamp NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`links\` DROP COLUMN \`dismissed_at\``);
    }

}
