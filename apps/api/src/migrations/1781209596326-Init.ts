import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1781209596326 implements MigrationInterface {
    name = 'Init1781209596326'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`auth_refresh_tokens\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`token_hash\` varchar(255) NOT NULL, \`device_info\` varchar(255) NULL, \`revoked\` tinyint NOT NULL DEFAULT 0, \`expires_at\` timestamp NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_f795ad14f31838e3ddc663ee15\` (\`user_id\`), INDEX \`IDX_95e0bce05491b0dee2f28ffd11\` (\`token_hash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`nudges\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`link_id\` varchar(255) NOT NULL, \`type\` enum ('call', 'coffee', 'voice', 'checkin') NOT NULL, \`source\` enum ('weekly', 'inactivity', 'manual') NOT NULL DEFAULT 'weekly', \`status\` enum ('suggested', 'acted', 'dismissed') NOT NULL DEFAULT 'suggested', \`suggested_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_128a838a426cbf926b3520dba8\` (\`user_id\`, \`status\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`links\` (\`id\` varchar(36) NOT NULL, \`owner_user_id\` varchar(255) NOT NULL, \`member_user_id\` varchar(255) NULL, \`contact_name\` varchar(80) NOT NULL, \`contact_phone\` varchar(30) NULL, \`status\` enum ('active', 'pending', 'removed') NOT NULL DEFAULT 'active', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_94f8fbe887d34aa07c83c2e689\` (\`member_user_id\`), INDEX \`IDX_b63b3ba97b9520a49b80cee8ae\` (\`owner_user_id\`, \`status\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`weekly_prompts\` (\`id\` int NOT NULL AUTO_INCREMENT, \`text\` varchar(255) NOT NULL, \`category\` varchar(50) NOT NULL DEFAULT 'general', \`active\` tinyint NOT NULL DEFAULT 1, INDEX \`IDX_8886a33c540e98adbf168bbd4c\` (\`active\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`journal_entries\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`link_id\` varchar(255) NULL, \`prompt_id\` int NULL, \`type\` enum ('gratitude', 'memory', 'reflection') NOT NULL DEFAULT 'reflection', \`content\` text NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, INDEX \`IDX_35f85c9771db3e57777480cfa3\` (\`link_id\`), INDEX \`IDX_f576fd42e5155bd546131bd641\` (\`user_id\`, \`created_at\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`emotional_states\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`state\` enum ('need_to_talk', 'socially_tired', 'available', 'want_to_see') NOT NULL, \`set_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`expires_at\` timestamp NOT NULL, INDEX \`IDX_a6d98196fc25730c52bca07a55\` (\`user_id\`, \`expires_at\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`email\` varchar(255) NOT NULL, \`password_hash\` varchar(255) NOT NULL, \`display_name\` varchar(80) NOT NULL, \`photo_url\` varchar(512) NULL, \`birthdate\` date NOT NULL, \`onboarding_intent\` enum ('maintain', 'meet') NOT NULL DEFAULT 'maintain', \`role\` enum ('user', 'moderator', 'admin') NOT NULL DEFAULT 'user', \`status\` enum ('active', 'suspended', 'banned') NOT NULL DEFAULT 'active', \`failed_login_attempts\` int NOT NULL DEFAULT '0', \`locked_until\` timestamp NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), INDEX \`IDX_3676155292d72c67cd4e090514\` (\`status\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`password_resets\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`token_hash\` varchar(255) NOT NULL, \`used\` tinyint NOT NULL DEFAULT 0, \`expires_at\` timestamp NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_f7a4c3bc48f24df007936d217b\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`reports\` (\`id\` varchar(36) NOT NULL, \`reporter_user_id\` varchar(255) NULL, \`reported_user_id\` varchar(255) NULL, \`reason\` enum ('sexual', 'discriminatory', 'harassment', 'other') NOT NULL, \`content_type\` varchar(40) NOT NULL, \`content_id\` varchar(255) NULL, \`description\` text NULL, \`status\` enum ('open', 'reviewing', 'resolved', 'dismissed') NOT NULL DEFAULT 'open', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`resolved_at\` timestamp NULL, INDEX \`IDX_a9197bd0a7e06bb92648d9efed\` (\`reported_user_id\`), INDEX \`IDX_dab4d78b3be05c1ca4a626f57f\` (\`status\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`moderation_actions\` (\`id\` varchar(36) NOT NULL, \`target_user_id\` varchar(255) NOT NULL, \`report_id\` varchar(255) NULL, \`moderator_id\` varchar(255) NULL, \`action\` enum ('warning', 'suspension', 'ban') NOT NULL, \`automated\` tinyint NOT NULL DEFAULT 0, \`reason\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`expires_at\` timestamp NULL, INDEX \`IDX_ec1b714932f39d60319688b877\` (\`target_user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`moderation_flags\` (\`id\` varchar(36) NOT NULL, \`target_user_id\` varchar(255) NOT NULL, \`content_type\` varchar(40) NOT NULL, \`content_id\` varchar(255) NULL, \`classifier\` varchar(60) NOT NULL, \`score\` decimal(4,3) NOT NULL, \`auto_actioned\` tinyint NOT NULL DEFAULT 0, \`flagged_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_b78e48cf561184d0ac56ccc70e\` (\`target_user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`audit_log\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(255) NULL, \`action\` varchar(80) NOT NULL, \`entity\` varchar(60) NULL, \`entity_id\` varchar(255) NULL, \`ip\` varchar(45) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_cb11bd5b662431ea0ac455a27d\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`push_devices\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`token\` varchar(255) NOT NULL, \`platform\` enum ('ios', 'android', 'web') NOT NULL, \`device_info\` varchar(255) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`last_seen_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_80fd9275e4f18bf43e5b7008a1\` (\`user_id\`), UNIQUE INDEX \`IDX_f847e055cb2f1c758694dd9b48\` (\`token\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`cron_locks\` (\`job_name\` varchar(80) NOT NULL, \`acquired_at\` timestamp NOT NULL, \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`job_name\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`messages\` (\`id\` varchar(36) NOT NULL, \`sender_id\` varchar(255) NOT NULL, \`recipient_id\` varchar(255) NOT NULL, \`conversation_key\` varchar(73) NOT NULL, \`ciphertext\` text NOT NULL, \`iv\` varchar(32) NOT NULL, \`auth_tag\` varchar(32) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, INDEX \`IDX_79f62fc88b4a5efb315bd20286\` (\`conversation_key\`, \`created_at\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`auth_refresh_tokens\` ADD CONSTRAINT \`FK_f795ad14f31838e3ddc663ee150\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`nudges\` ADD CONSTRAINT \`FK_6e7f71d5a4c957d9d30f07b64a7\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`nudges\` ADD CONSTRAINT \`FK_5f3f92c02725bb740e32d29f56b\` FOREIGN KEY (\`link_id\`) REFERENCES \`links\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`links\` ADD CONSTRAINT \`FK_9b567e1ad8446920db8d7de818a\` FOREIGN KEY (\`owner_user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`links\` ADD CONSTRAINT \`FK_94f8fbe887d34aa07c83c2e6898\` FOREIGN KEY (\`member_user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`journal_entries\` ADD CONSTRAINT \`FK_17b75f0f14fb4d037575c03174a\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`journal_entries\` ADD CONSTRAINT \`FK_35f85c9771db3e57777480cfa30\` FOREIGN KEY (\`link_id\`) REFERENCES \`links\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`journal_entries\` ADD CONSTRAINT \`FK_bcfd607626cd51d22f1ec1353d0\` FOREIGN KEY (\`prompt_id\`) REFERENCES \`weekly_prompts\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`emotional_states\` ADD CONSTRAINT \`FK_acb4866be875c04ea9238f487ed\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`password_resets\` ADD CONSTRAINT \`FK_f7a4c3bc48f24df007936d217be\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`reports\` ADD CONSTRAINT \`FK_76e1f2905a90423e477b38516e7\` FOREIGN KEY (\`reporter_user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`reports\` ADD CONSTRAINT \`FK_a9197bd0a7e06bb92648d9efed2\` FOREIGN KEY (\`reported_user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`moderation_actions\` ADD CONSTRAINT \`FK_ec1b714932f39d60319688b8774\` FOREIGN KEY (\`target_user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`moderation_actions\` ADD CONSTRAINT \`FK_8dd6d136a903e4f003d61123c76\` FOREIGN KEY (\`report_id\`) REFERENCES \`reports\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`moderation_actions\` ADD CONSTRAINT \`FK_d891b13e150f7bf62e48f349d82\` FOREIGN KEY (\`moderator_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`moderation_flags\` ADD CONSTRAINT \`FK_b78e48cf561184d0ac56ccc70ee\` FOREIGN KEY (\`target_user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`audit_log\` ADD CONSTRAINT \`FK_cb11bd5b662431ea0ac455a27d7\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`push_devices\` ADD CONSTRAINT \`FK_80fd9275e4f18bf43e5b7008a19\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`messages\` ADD CONSTRAINT \`FK_22133395bd13b970ccd0c34ab22\` FOREIGN KEY (\`sender_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`messages\` ADD CONSTRAINT \`FK_566c3d68184e83d4307b86f85ab\` FOREIGN KEY (\`recipient_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`messages\` DROP FOREIGN KEY \`FK_566c3d68184e83d4307b86f85ab\``);
        await queryRunner.query(`ALTER TABLE \`messages\` DROP FOREIGN KEY \`FK_22133395bd13b970ccd0c34ab22\``);
        await queryRunner.query(`ALTER TABLE \`push_devices\` DROP FOREIGN KEY \`FK_80fd9275e4f18bf43e5b7008a19\``);
        await queryRunner.query(`ALTER TABLE \`audit_log\` DROP FOREIGN KEY \`FK_cb11bd5b662431ea0ac455a27d7\``);
        await queryRunner.query(`ALTER TABLE \`moderation_flags\` DROP FOREIGN KEY \`FK_b78e48cf561184d0ac56ccc70ee\``);
        await queryRunner.query(`ALTER TABLE \`moderation_actions\` DROP FOREIGN KEY \`FK_d891b13e150f7bf62e48f349d82\``);
        await queryRunner.query(`ALTER TABLE \`moderation_actions\` DROP FOREIGN KEY \`FK_8dd6d136a903e4f003d61123c76\``);
        await queryRunner.query(`ALTER TABLE \`moderation_actions\` DROP FOREIGN KEY \`FK_ec1b714932f39d60319688b8774\``);
        await queryRunner.query(`ALTER TABLE \`reports\` DROP FOREIGN KEY \`FK_a9197bd0a7e06bb92648d9efed2\``);
        await queryRunner.query(`ALTER TABLE \`reports\` DROP FOREIGN KEY \`FK_76e1f2905a90423e477b38516e7\``);
        await queryRunner.query(`ALTER TABLE \`password_resets\` DROP FOREIGN KEY \`FK_f7a4c3bc48f24df007936d217be\``);
        await queryRunner.query(`ALTER TABLE \`emotional_states\` DROP FOREIGN KEY \`FK_acb4866be875c04ea9238f487ed\``);
        await queryRunner.query(`ALTER TABLE \`journal_entries\` DROP FOREIGN KEY \`FK_bcfd607626cd51d22f1ec1353d0\``);
        await queryRunner.query(`ALTER TABLE \`journal_entries\` DROP FOREIGN KEY \`FK_35f85c9771db3e57777480cfa30\``);
        await queryRunner.query(`ALTER TABLE \`journal_entries\` DROP FOREIGN KEY \`FK_17b75f0f14fb4d037575c03174a\``);
        await queryRunner.query(`ALTER TABLE \`links\` DROP FOREIGN KEY \`FK_94f8fbe887d34aa07c83c2e6898\``);
        await queryRunner.query(`ALTER TABLE \`links\` DROP FOREIGN KEY \`FK_9b567e1ad8446920db8d7de818a\``);
        await queryRunner.query(`ALTER TABLE \`nudges\` DROP FOREIGN KEY \`FK_5f3f92c02725bb740e32d29f56b\``);
        await queryRunner.query(`ALTER TABLE \`nudges\` DROP FOREIGN KEY \`FK_6e7f71d5a4c957d9d30f07b64a7\``);
        await queryRunner.query(`ALTER TABLE \`auth_refresh_tokens\` DROP FOREIGN KEY \`FK_f795ad14f31838e3ddc663ee150\``);
        await queryRunner.query(`DROP INDEX \`IDX_79f62fc88b4a5efb315bd20286\` ON \`messages\``);
        await queryRunner.query(`DROP TABLE \`messages\``);
        await queryRunner.query(`DROP TABLE \`cron_locks\``);
        await queryRunner.query(`DROP INDEX \`IDX_f847e055cb2f1c758694dd9b48\` ON \`push_devices\``);
        await queryRunner.query(`DROP INDEX \`IDX_80fd9275e4f18bf43e5b7008a1\` ON \`push_devices\``);
        await queryRunner.query(`DROP TABLE \`push_devices\``);
        await queryRunner.query(`DROP INDEX \`IDX_cb11bd5b662431ea0ac455a27d\` ON \`audit_log\``);
        await queryRunner.query(`DROP TABLE \`audit_log\``);
        await queryRunner.query(`DROP INDEX \`IDX_b78e48cf561184d0ac56ccc70e\` ON \`moderation_flags\``);
        await queryRunner.query(`DROP TABLE \`moderation_flags\``);
        await queryRunner.query(`DROP INDEX \`IDX_ec1b714932f39d60319688b877\` ON \`moderation_actions\``);
        await queryRunner.query(`DROP TABLE \`moderation_actions\``);
        await queryRunner.query(`DROP INDEX \`IDX_dab4d78b3be05c1ca4a626f57f\` ON \`reports\``);
        await queryRunner.query(`DROP INDEX \`IDX_a9197bd0a7e06bb92648d9efed\` ON \`reports\``);
        await queryRunner.query(`DROP TABLE \`reports\``);
        await queryRunner.query(`DROP INDEX \`IDX_f7a4c3bc48f24df007936d217b\` ON \`password_resets\``);
        await queryRunner.query(`DROP TABLE \`password_resets\``);
        await queryRunner.query(`DROP INDEX \`IDX_3676155292d72c67cd4e090514\` ON \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_a6d98196fc25730c52bca07a55\` ON \`emotional_states\``);
        await queryRunner.query(`DROP TABLE \`emotional_states\``);
        await queryRunner.query(`DROP INDEX \`IDX_f576fd42e5155bd546131bd641\` ON \`journal_entries\``);
        await queryRunner.query(`DROP INDEX \`IDX_35f85c9771db3e57777480cfa3\` ON \`journal_entries\``);
        await queryRunner.query(`DROP TABLE \`journal_entries\``);
        await queryRunner.query(`DROP INDEX \`IDX_8886a33c540e98adbf168bbd4c\` ON \`weekly_prompts\``);
        await queryRunner.query(`DROP TABLE \`weekly_prompts\``);
        await queryRunner.query(`DROP INDEX \`IDX_b63b3ba97b9520a49b80cee8ae\` ON \`links\``);
        await queryRunner.query(`DROP INDEX \`IDX_94f8fbe887d34aa07c83c2e689\` ON \`links\``);
        await queryRunner.query(`DROP TABLE \`links\``);
        await queryRunner.query(`DROP INDEX \`IDX_128a838a426cbf926b3520dba8\` ON \`nudges\``);
        await queryRunner.query(`DROP TABLE \`nudges\``);
        await queryRunner.query(`DROP INDEX \`IDX_95e0bce05491b0dee2f28ffd11\` ON \`auth_refresh_tokens\``);
        await queryRunner.query(`DROP INDEX \`IDX_f795ad14f31838e3ddc663ee15\` ON \`auth_refresh_tokens\``);
        await queryRunner.query(`DROP TABLE \`auth_refresh_tokens\``);
    }

}
