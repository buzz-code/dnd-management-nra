import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1782719482626 implements MigrationInterface {
    name = 'InitialSchema1782719482626'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`texts\` (
                \`id\` int UNSIGNED NOT NULL AUTO_INCREMENT,
                \`user_id\` int NOT NULL,
                \`name\` varchar(100) NOT NULL,
                \`description\` varchar(500) NOT NULL,
                \`value\` varchar(10000) NOT NULL,
                \`filepath\` varchar(255) NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX \`texts_user_id_name_idx\` (\`user_id\`, \`name\`),
                INDEX \`texts_name_idx\` (\`name\`),
                INDEX \`texts_users_idx\` (\`user_id\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`users\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`name\` varchar(500) NOT NULL,
                \`email\` varchar(500) NULL,
                \`password\` varchar(500) NULL,
                \`phone_number\` varchar(11) NULL,
                \`active\` tinyint NULL,
                \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`effective_id\` int NULL,
                \`permissions\` text NULL,
                \`additionalData\` text NULL,
                \`userInfo\` text NULL,
                \`isPaid\` tinyint NOT NULL DEFAULT 0,
                \`paymentMethod\` varchar(255) NULL,
                \`mailAddressAlias\` varchar(255) NULL,
                \`mailAddressTitle\` varchar(255) NULL,
                \`paymentTrackId\` int NULL,
                \`bccAddress\` varchar(255) NULL,
                INDEX \`user_phone_number_idx\` (\`phone_number\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`audit_log\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`userId\` int NOT NULL,
                \`entityId\` int NOT NULL,
                \`entityName\` varchar(255) NOT NULL,
                \`operation\` varchar(255) NOT NULL,
                \`entityData\` text NOT NULL,
                \`isReverted\` tinyint NOT NULL DEFAULT 0,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`mail_address\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`userId\` int NOT NULL,
                \`alias\` varchar(255) NOT NULL,
                \`entity\` varchar(255) NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_10d2242b0e45f6add0b4269cbf\` (\`userId\`, \`entity\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`yemot_call\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`userId\` int NOT NULL,
                \`apiCallId\` varchar(255) NOT NULL,
                \`phone\` varchar(255) NOT NULL,
                \`history\` mediumtext NOT NULL,
                \`currentStep\` varchar(255) NOT NULL,
                \`data\` text NULL,
                \`isOpen\` tinyint NOT NULL,
                \`hasError\` tinyint NOT NULL DEFAULT 0,
                \`errorMessage\` varchar(255) NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX \`yemot_call_api_call_id_idx\` (\`apiCallId\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`phone_templates\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`user_id\` int NOT NULL,
                \`name\` varchar(100) NOT NULL,
                \`description\` varchar(500) NULL,
                \`yemot_template_id\` varchar(255) NULL,
                \`message_type\` varchar(50) NOT NULL DEFAULT 'text',
                \`message_text\` text NOT NULL,
                \`is_active\` tinyint NOT NULL DEFAULT 1,
                \`caller_id\` varchar(20) NULL,
                \`settings\` text NULL,
                \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX \`phone_template_user_id_idx\` (\`user_id\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`phone_campaigns\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`user_id\` int NOT NULL,
                \`phone_template_id\` int NOT NULL,
                \`yemot_campaign_id\` varchar(255) NULL,
                \`status\` varchar(50) NOT NULL DEFAULT 'pending',
                \`total_phones\` int NOT NULL DEFAULT '0',
                \`successful_calls\` int NOT NULL DEFAULT '0',
                \`failed_calls\` int NOT NULL DEFAULT '0',
                \`phone_numbers\` text NOT NULL,
                \`error_message\` text NULL,
                \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`completed_at\` datetime NULL,
                INDEX \`phone_campaign_user_id_idx\` (\`user_id\`),
                INDEX \`phone_campaign_template_id_idx\` (\`phone_template_id\`),
                INDEX \`phone_campaign_status_idx\` (\`status\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`payment_track\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`name\` varchar(255) NOT NULL,
                \`description\` longtext NOT NULL,
                \`monthlyPrice\` int NOT NULL,
                \`annualPrice\` int NOT NULL,
                \`studentNumberLimit\` int NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`import_file\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`userId\` int NOT NULL,
                \`fileName\` varchar(255) NOT NULL,
                \`fileSource\` varchar(255) NOT NULL,
                \`entityIds\` text NOT NULL,
                \`entityName\` varchar(255) NOT NULL,
                \`fullSuccess\` tinyint NULL,
                \`response\` varchar(255) NOT NULL,
                \`metadata\` text NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                INDEX \`import_file_user_id_idx\` (\`userId\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`layers\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`user_id\` int NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`layerType\` varchar(255) NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX \`layers_user_id_idx\` (\`user_id\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`segments\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`user_id\` int NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`title\` varchar(255) NULL,
                \`value\` text NULL,
                \`filepath\` varchar(500) NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX \`segments_user_id_idx\` (\`user_id\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`nodes\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`user_id\` int NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`layerId\` int NULL,
                \`segmentId\` int NULL,
                \`nodeType\` varchar(255) NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX \`nodes_layer_id_idx\` (\`layerId\`),
                INDEX \`nodes_user_id_idx\` (\`user_id\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`choices\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`user_id\` int NOT NULL,
                \`nodeId\` int NOT NULL,
                \`inputKey\` int NOT NULL,
                \`description\` varchar(500) NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX \`choices_node_id_idx\` (\`nodeId\`),
                INDEX \`choices_user_id_idx\` (\`user_id\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`image\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`userId\` int NOT NULL,
                \`imageTarget\` varchar(255) NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`fileDataSrc\` mediumtext NULL,
                \`fileDataTitle\` text NULL,
                UNIQUE INDEX \`IDX_35596848f8bb8f7b5ec5fcf9e0\` (\`userId\`, \`imageTarget\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`page\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`description\` varchar(255) NOT NULL,
                \`value\` longtext NOT NULL,
                \`order\` int NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`routing_rules\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`user_id\` int NOT NULL,
                \`sourceNodeId\` int NOT NULL,
                \`choiceId\` int NULL,
                \`diceOptions\` varchar(255) NULL,
                \`targetNodeId\` int NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX \`routing_rules_source_node_id_idx\` (\`sourceNodeId\`),
                INDEX \`routing_rules_user_id_idx\` (\`user_id\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`uploaded_files\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`user_id\` int NOT NULL,
                \`title\` varchar(255) NOT NULL,
                \`description\` varchar(255) NULL,
                \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`fileDataSrc\` mediumtext NULL,
                \`fileDataTitle\` text NULL,
                INDEX \`uploaded_files_user_id_idx\` (\`user_id\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`recieved_mail\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`userId\` int NOT NULL,
                \`mailData\` text NOT NULL,
                \`from\` varchar(255) NOT NULL,
                \`to\` varchar(255) NOT NULL,
                \`subject\` text NULL,
                \`body\` text NULL,
                \`entityName\` varchar(255) NOT NULL,
                \`importFileIds\` text NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            ALTER TABLE \`yemot_call\`
            ADD CONSTRAINT \`FK_2f2c39a9491ac1a6e2d7827bb53\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`nodes\`
            ADD CONSTRAINT \`FK_243a8531ef972d50b20fa5cb3cc\` FOREIGN KEY (\`layerId\`) REFERENCES \`layers\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`nodes\`
            ADD CONSTRAINT \`FK_c72980426a867d9405f6dd9d838\` FOREIGN KEY (\`segmentId\`) REFERENCES \`segments\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`choices\`
            ADD CONSTRAINT \`FK_64d0d61b9bfdd15d3f78edb5ab4\` FOREIGN KEY (\`nodeId\`) REFERENCES \`nodes\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`routing_rules\`
            ADD CONSTRAINT \`FK_04d408ed4d0f642481a2a3abd64\` FOREIGN KEY (\`sourceNodeId\`) REFERENCES \`nodes\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`routing_rules\`
            ADD CONSTRAINT \`FK_6b0ee1110067cdb131b598f0b8b\` FOREIGN KEY (\`targetNodeId\`) REFERENCES \`nodes\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`routing_rules\`
            ADD CONSTRAINT \`FK_9b721b09cdee0aee83a1495a214\` FOREIGN KEY (\`choiceId\`) REFERENCES \`choices\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            CREATE VIEW \`text_by_user\` AS
            SELECT \`t_base\`.\`name\` AS \`name\`,
                \`t_base\`.\`description\` AS \`description\`,
                \`users\`.\`id\` AS \`userId\`,
                \`t_user\`.\`id\` AS \`overrideTextId\`,
                CONCAT(\`users\`.\`id\`, "_", \`t_base\`.\`id\`) AS \`id\`,
                COALESCE(\`t_user\`.\`value\`, \`t_base\`.\`value\`) AS \`value\`,
                COALESCE(\`t_user\`.\`filepath\`, \`t_base\`.\`filepath\`) AS \`filepath\`
            FROM \`texts\` \`t_base\`
                LEFT JOIN \`users\` \`users\` ON \`users\`.\`effective_id\` is null
                LEFT JOIN \`texts\` \`t_user\` ON \`t_user\`.\`name\` = \`t_base\`.\`name\`
                AND \`t_user\`.\`user_id\` = \`users\`.\`id\`
            WHERE \`t_base\`.\`user_id\` = 0
            ORDER BY \`users\`.\`id\` ASC,
                \`t_base\`.\`id\` ASC
        `);
        await queryRunner.query(`
            INSERT INTO \`dnd_management_nra\`.\`typeorm_metadata\`(
                    \`database\`,
                    \`schema\`,
                    \`table\`,
                    \`type\`,
                    \`name\`,
                    \`value\`
                )
            VALUES (DEFAULT, ?, DEFAULT, ?, ?, ?)
        `, ["dnd_management_nra","VIEW","text_by_user","SELECT `t_base`.`name` AS `name`, `t_base`.`description` AS `description`, `users`.`id` AS `userId`, `t_user`.`id` AS `overrideTextId`, CONCAT(`users`.`id`, \"_\", `t_base`.`id`) AS `id`, COALESCE(`t_user`.`value`, `t_base`.`value`) AS `value`, COALESCE(`t_user`.`filepath`, `t_base`.`filepath`) AS `filepath` FROM `texts` `t_base` LEFT JOIN `users` `users` ON `users`.`effective_id` is null  LEFT JOIN `texts` `t_user` ON `t_user`.`name` = `t_base`.`name` AND `t_user`.`user_id` = `users`.`id` WHERE `t_base`.`user_id` = 0 ORDER BY `users`.`id` ASC, `t_base`.`id` ASC"]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM \`dnd_management_nra\`.\`typeorm_metadata\`
            WHERE \`type\` = ?
                AND \`name\` = ?
                AND \`schema\` = ?
        `, ["VIEW","text_by_user","dnd_management_nra"]);
        await queryRunner.query(`
            DROP VIEW \`text_by_user\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`routing_rules\` DROP FOREIGN KEY \`FK_9b721b09cdee0aee83a1495a214\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`routing_rules\` DROP FOREIGN KEY \`FK_6b0ee1110067cdb131b598f0b8b\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`routing_rules\` DROP FOREIGN KEY \`FK_04d408ed4d0f642481a2a3abd64\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`choices\` DROP FOREIGN KEY \`FK_64d0d61b9bfdd15d3f78edb5ab4\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`nodes\` DROP FOREIGN KEY \`FK_c72980426a867d9405f6dd9d838\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`nodes\` DROP FOREIGN KEY \`FK_243a8531ef972d50b20fa5cb3cc\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`yemot_call\` DROP FOREIGN KEY \`FK_2f2c39a9491ac1a6e2d7827bb53\`
        `);
        await queryRunner.query(`
            DROP TABLE \`recieved_mail\`
        `);
        await queryRunner.query(`
            DROP INDEX \`uploaded_files_user_id_idx\` ON \`uploaded_files\`
        `);
        await queryRunner.query(`
            DROP TABLE \`uploaded_files\`
        `);
        await queryRunner.query(`
            DROP INDEX \`routing_rules_user_id_idx\` ON \`routing_rules\`
        `);
        await queryRunner.query(`
            DROP INDEX \`routing_rules_source_node_id_idx\` ON \`routing_rules\`
        `);
        await queryRunner.query(`
            DROP TABLE \`routing_rules\`
        `);
        await queryRunner.query(`
            DROP TABLE \`page\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_35596848f8bb8f7b5ec5fcf9e0\` ON \`image\`
        `);
        await queryRunner.query(`
            DROP TABLE \`image\`
        `);
        await queryRunner.query(`
            DROP INDEX \`choices_user_id_idx\` ON \`choices\`
        `);
        await queryRunner.query(`
            DROP INDEX \`choices_node_id_idx\` ON \`choices\`
        `);
        await queryRunner.query(`
            DROP TABLE \`choices\`
        `);
        await queryRunner.query(`
            DROP INDEX \`nodes_user_id_idx\` ON \`nodes\`
        `);
        await queryRunner.query(`
            DROP INDEX \`nodes_layer_id_idx\` ON \`nodes\`
        `);
        await queryRunner.query(`
            DROP TABLE \`nodes\`
        `);
        await queryRunner.query(`
            DROP INDEX \`segments_user_id_idx\` ON \`segments\`
        `);
        await queryRunner.query(`
            DROP TABLE \`segments\`
        `);
        await queryRunner.query(`
            DROP INDEX \`layers_user_id_idx\` ON \`layers\`
        `);
        await queryRunner.query(`
            DROP TABLE \`layers\`
        `);
        await queryRunner.query(`
            DROP INDEX \`import_file_user_id_idx\` ON \`import_file\`
        `);
        await queryRunner.query(`
            DROP TABLE \`import_file\`
        `);
        await queryRunner.query(`
            DROP TABLE \`payment_track\`
        `);
        await queryRunner.query(`
            DROP INDEX \`phone_campaign_status_idx\` ON \`phone_campaigns\`
        `);
        await queryRunner.query(`
            DROP INDEX \`phone_campaign_template_id_idx\` ON \`phone_campaigns\`
        `);
        await queryRunner.query(`
            DROP INDEX \`phone_campaign_user_id_idx\` ON \`phone_campaigns\`
        `);
        await queryRunner.query(`
            DROP TABLE \`phone_campaigns\`
        `);
        await queryRunner.query(`
            DROP INDEX \`phone_template_user_id_idx\` ON \`phone_templates\`
        `);
        await queryRunner.query(`
            DROP TABLE \`phone_templates\`
        `);
        await queryRunner.query(`
            DROP INDEX \`yemot_call_api_call_id_idx\` ON \`yemot_call\`
        `);
        await queryRunner.query(`
            DROP TABLE \`yemot_call\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_10d2242b0e45f6add0b4269cbf\` ON \`mail_address\`
        `);
        await queryRunner.query(`
            DROP TABLE \`mail_address\`
        `);
        await queryRunner.query(`
            DROP TABLE \`audit_log\`
        `);
        await queryRunner.query(`
            DROP INDEX \`user_phone_number_idx\` ON \`users\`
        `);
        await queryRunner.query(`
            DROP TABLE \`users\`
        `);
        await queryRunner.query(`
            DROP INDEX \`texts_users_idx\` ON \`texts\`
        `);
        await queryRunner.query(`
            DROP INDEX \`texts_name_idx\` ON \`texts\`
        `);
        await queryRunner.query(`
            DROP INDEX \`texts_user_id_name_idx\` ON \`texts\`
        `);
        await queryRunner.query(`
            DROP TABLE \`texts\`
        `);
    }

}
