import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGamesTable1782748006890 implements MigrationInterface {
    name = 'AddGamesTable1782748006890'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`games\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`user_id\` int NOT NULL,
                \`title\` varchar(255) NOT NULL,
                \`isActive\` tinyint NOT NULL DEFAULT 0,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX \`games_user_id_idx\` (\`user_id\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`ALTER TABLE \`segments\` ADD \`gameId\` int NULL`);
        await queryRunner.query(`CREATE INDEX \`segments_game_id_idx\` ON \`segments\` (\`gameId\`)`);
        await queryRunner.query(`ALTER TABLE \`nodes\` ADD \`gameId\` int NULL`);
        await queryRunner.query(`CREATE INDEX \`nodes_game_id_idx\` ON \`nodes\` (\`gameId\`)`);
        await queryRunner.query(`ALTER TABLE \`choices\` ADD \`gameId\` int NULL`);
        await queryRunner.query(`CREATE INDEX \`choices_game_id_idx\` ON \`choices\` (\`gameId\`)`);
        await queryRunner.query(`ALTER TABLE \`routing_rules\` ADD \`gameId\` int NULL`);
        await queryRunner.query(`CREATE INDEX \`routing_rules_game_id_idx\` ON \`routing_rules\` (\`gameId\`)`);
        await queryRunner.query(`
            INSERT INTO \`texts\` (\`user_id\`, \`name\`, \`description\`, \`value\`)
            VALUES (0, 'DND.NO_ACTIVE_GAME', 'DnD - אין משחק פעיל', 'אין משחק פעיל כרגע, אנא פנה למנהל')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM \`texts\` WHERE \`user_id\` = 0 AND \`name\` = 'DND.NO_ACTIVE_GAME'`);
        await queryRunner.query(`DROP INDEX \`routing_rules_game_id_idx\` ON \`routing_rules\``);
        await queryRunner.query(`ALTER TABLE \`routing_rules\` DROP COLUMN \`gameId\``);
        await queryRunner.query(`DROP INDEX \`choices_game_id_idx\` ON \`choices\``);
        await queryRunner.query(`ALTER TABLE \`choices\` DROP COLUMN \`gameId\``);
        await queryRunner.query(`DROP INDEX \`nodes_game_id_idx\` ON \`nodes\``);
        await queryRunner.query(`ALTER TABLE \`nodes\` DROP COLUMN \`gameId\``);
        await queryRunner.query(`DROP INDEX \`segments_game_id_idx\` ON \`segments\``);
        await queryRunner.query(`ALTER TABLE \`segments\` DROP COLUMN \`gameId\``);
        await queryRunner.query(`DROP TABLE \`games\``);
    }
}
