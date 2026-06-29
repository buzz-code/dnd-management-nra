import { MigrationInterface, QueryRunner } from 'typeorm';

export class DndTexts1782721670735 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO \`texts\` (\`user_id\`, \`name\`, \`description\`, \`value\`) VALUES
        (0, 'DND.GAME_NOT_FOUND', 'DnD - משחק לא נמצא', 'המערכת בפיתוח, אנא נסה שוב מאוחר יותר'),
        (0, 'DND.INVALID_CHOICE', 'DnD - בחירה לא תקינה', 'הבחירה לא תקינה, אנא הקש שוב'),
        (0, 'DND.DICE_RESULT',    'DnD - תוצאת קובייה',  'הקובייה הראתה {roll}'),
        (0, 'DND.GAME_ENDED',    'DnD - סיום משחק',     'תודה שיחקת, להתראות'),
        (0, 'DND.BROKEN_TREE',   'DnD - שגיאה במבנה',   'אירעה שגיאה במבנה המשחק, שיחה מסתיימת')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM \`texts\`
      WHERE \`user_id\` = 0
        AND \`name\` IN ('DND.GAME_NOT_FOUND', 'DND.INVALID_CHOICE', 'DND.DICE_RESULT', 'DND.GAME_ENDED', 'DND.BROKEN_TREE')
    `);
  }
}
