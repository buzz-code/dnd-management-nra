import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCharactersTable1782934552122 implements MigrationInterface {
    name = 'AddCharactersTable1782934552122'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`characters\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`user_id\` int NOT NULL,
                \`gameId\` int NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`voiceId\` varchar(100) NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX \`characters_user_id_idx\` (\`user_id\`),
                INDEX \`characters_game_id_idx\` (\`gameId\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`characters\``);
    }
}
