import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailVerificationAndLinkMemberEmail1781400000000 implements MigrationInterface {
    name = 'AddEmailVerificationAndLinkMemberEmail1781400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`email_verified_at\` timestamp NULL`);
        await queryRunner.query(`ALTER TABLE \`links\` ADD \`member_email\` varchar(255) NULL`);
        await queryRunner.query(`CREATE TABLE \`email_verifications\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`token_hash\` varchar(255) NOT NULL, \`used\` tinyint NOT NULL DEFAULT 0, \`expires_at\` timestamp NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_e302cd80ed4ed3ea4ff5d2a6c5\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`email_verifications\` ADD CONSTRAINT \`FK_e302cd80ed4ed3ea4ff5d2a6c5a\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`email_verifications\` DROP FOREIGN KEY \`FK_e302cd80ed4ed3ea4ff5d2a6c5a\``);
        await queryRunner.query(`DROP INDEX \`IDX_e302cd80ed4ed3ea4ff5d2a6c5\` ON \`email_verifications\``);
        await queryRunner.query(`DROP TABLE \`email_verifications\``);
        await queryRunner.query(`ALTER TABLE \`links\` DROP COLUMN \`member_email\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`email_verified_at\``);
    }

}
