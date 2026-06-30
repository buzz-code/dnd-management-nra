import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStoryVoiceTable1782816463804 implements MigrationInterface {
    name = 'AddStoryVoiceTable1782816463804'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`story_voices\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`user_id\` int NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`segments\` text NOT NULL,
                \`characterVoices\` text NOT NULL,
                \`modelId\` varchar(100) NOT NULL,
                \`filePath\` varchar(500) NULL,
                \`status\` varchar(20) NOT NULL DEFAULT 'pending',
                \`errorMessage\` text NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX \`story_voices_user_id_idx\` (\`user_id\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE \`story_voices\`
        `);
    }

}
