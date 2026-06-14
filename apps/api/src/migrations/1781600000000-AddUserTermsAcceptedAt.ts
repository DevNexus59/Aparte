import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserTermsAcceptedAt1781600000000 implements MigrationInterface {
    name = 'AddUserTermsAcceptedAt1781600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`terms_accepted_at\` timestamp NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`terms_accepted_at\``);
    }

}
