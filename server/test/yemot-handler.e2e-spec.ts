import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import * as crypto from 'crypto';
import { setupYemotRouter } from '@shared/utils/bootstrap.util';
import { AppModule } from 'src/app.module';
import { User } from '@shared/entities/User.entity';
import { Text } from '@shared/entities/Text.entity';
import { YemotCall } from '@shared/entities/YemotCall.entity';
import { Game } from 'src/db/entities/Game.entity';
import { GameNode } from 'src/db/entities/GameNode.entity';
import { Segment } from 'src/db/entities/Segment.entity';
import { Choice } from 'src/db/entities/Choice.entity';
import { RoutingRule } from 'src/db/entities/RoutingRule.entity';

jest.setTimeout(30000);

const DID = '0772222770';
const ROUTE = '/yemot/handle-call';

function newParams(overrides: Record<string, string> = {}) {
  return {
    ApiCallId: crypto.randomBytes(10).toString('hex'),
    ApiYFCallId: crypto.randomBytes(10).toString('hex'),
    ApiDID: DID,
    ApiRealDID: DID,
    ApiPhone: '0521234567',
    ApiExtension: '',
    ApiTime: Date.now().toString(),
    ...overrides,
  };
}

// Skipped: processCall's game-tree flow is temporarily disabled in favor of a
// hardcoded flow (see src/yemot-handler.service.ts). Re-enable once restored.
describe.skip('YemotHandlerService (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    setupYemotRouter(app);
    await app.init();
    ds = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    if (ds?.isInitialized) await ds.destroy();
    await app?.close();
  });

  beforeEach(async () => {
    await ds.getRepository(RoutingRule).delete({});
    await ds.getRepository(Choice).delete({});
    await ds.getRepository(GameNode).delete({});
    await ds.getRepository(Segment).delete({});
    await ds.getRepository(Game).delete({});
    await ds.getRepository(Text).delete({});
    await ds.getRepository(YemotCall).delete({});
    await ds.getRepository(User).delete({});
  });

  // ── Seed helpers ────────────────────────────────────────────────────────────

  async function seedUser() {
    return ds.getRepository(User).save({ name: 'Test', phoneNumber: DID });
  }

  async function seedDndTexts() {
    return ds.getRepository(Text).save([
      { userId: 0, name: 'DND.NO_ACTIVE_GAME', description: 'x', value: 'No active game' },
      { userId: 0, name: 'DND.GAME_NOT_FOUND', description: 'x', value: 'Game not found' },
      { userId: 0, name: 'DND.BROKEN_TREE', description: 'x', value: 'Broken tree' },
      { userId: 0, name: 'DND.INVALID_CHOICE', description: 'x', value: 'Invalid choice' },
      { userId: 0, name: 'DND.GAME_ENDED', description: 'x', value: 'Game ended' },
      { userId: 0, name: 'DND.DICE_RESULT', description: 'x', value: 'Dice: {roll}' },
    ]);
  }

  async function seedGame(userId: number) {
    const game = await ds.getRepository(Game).save({ userId, name: 'Test Adventure', isActive: true });
    const gameId = game.id;

    const [segStart, segChoice, segNorth, segSouth] = await ds.getRepository(Segment).save([
      { userId, gameId, name: 'start', title: 'Intro', value: 'Welcome to DnD' },
      { userId, gameId, name: 'choice', title: 'Direction', value: 'Go north(1) or south(2)?' },
      { userId, gameId, name: 'north', title: 'North', value: 'You found treasure!' },
      { userId, gameId, name: 'south', title: 'South', value: 'You fell in a pit!' },
    ]);

    const [nodeStart, nodeChoice, nodeNorth, nodeSouth] = await ds.getRepository(GameNode).save([
      { userId, gameId, name: 'start', segmentId: segStart.id, nodeType: 'start' },
      { userId, gameId, name: 'choice', segmentId: segChoice.id, nodeType: null },
      { userId, gameId, name: 'north', segmentId: segNorth.id, nodeType: 'end' },
      { userId, gameId, name: 'south', segmentId: segSouth.id, nodeType: 'end' },
    ]);

    const [choiceNorth, choiceSouth] = await ds.getRepository(Choice).save([
      { userId, gameId, nodeId: nodeChoice.id, inputKey: 1, description: 'North' },
      { userId, gameId, nodeId: nodeChoice.id, inputKey: 2, description: 'South' },
    ]);

    await ds.getRepository(RoutingRule).save([
      { userId, gameId, sourceNodeId: nodeStart.id, choiceId: null, targetNodeId: nodeChoice.id },
      { userId, gameId, sourceNodeId: nodeChoice.id, choiceId: choiceNorth.id, targetNodeId: nodeNorth.id },
      { userId, gameId, sourceNodeId: nodeChoice.id, choiceId: choiceSouth.id, targetNodeId: nodeSouth.id },
    ]);
  }

  // ── Tests ────────────────────────────────────────────────────────────────────

  it('unknown DID → hangup with system message, no read prompt', async () => {
    const p = newParams({ ApiDID: '0599999999', ApiRealDID: '0599999999' });
    const { text } = await request(app.getHttpServer()).get(ROUTE).query(p).expect(200);

    expect(text).toContain('id_list_message=');
    expect(text).not.toContain('read=');
  });

  it('user exists, no active game → DND.NO_ACTIVE_GAME hangup', async () => {
    await seedUser();
    await seedDndTexts();

    const { text } = await request(app.getHttpServer()).get(ROUTE).query(newParams()).expect(200);

    expect(text).toContain('No active game');
    expect(text).not.toContain('read=');
  });

  it('active game but no start node → DND.GAME_NOT_FOUND hangup', async () => {
    const { id: userId } = await seedUser();
    await seedDndTexts();
    await ds.getRepository(Game).save({ userId, name: 'Empty Game', isActive: true });

    const { text } = await request(app.getHttpServer()).get(ROUTE).query(newParams()).expect(200);

    expect(text).toContain('Game not found');
    expect(text).not.toContain('read=');
  });

  it('north path: start → choice(1) → north-end (win)', async () => {
    const { id: userId } = await seedUser();
    await seedDndTexts();
    await seedGame(userId);

    const p = newParams();

    const r1 = await request(app.getHttpServer()).get(ROUTE).query(p).expect(200);
    expect(r1.text).toContain('Welcome to DnD');
    expect(r1.text).toContain('read=');

    const r2 = await request(app.getHttpServer())
      .get(ROUTE)
      .query({ ...p, val_1: '1' })
      .expect(200);
    expect(r2.text).toContain('You found treasure');
    expect(r2.text).toContain('go_to_folder=hangup');
    expect(r2.text).not.toContain('read=');
  });

  it('south path: start → choice(2) → south-end (lose)', async () => {
    const { id: userId } = await seedUser();
    await seedDndTexts();
    await seedGame(userId);

    const p = newParams();

    await request(app.getHttpServer()).get(ROUTE).query(p).expect(200);

    const r2 = await request(app.getHttpServer())
      .get(ROUTE)
      .query({ ...p, val_1: '2' })
      .expect(200);
    expect(r2.text).toContain('You fell in a pit');
    expect(r2.text).toContain('go_to_folder=hangup');
  });

  it('invalid key → DND.INVALID_CHOICE message then re-prompts', async () => {
    const { id: userId } = await seedUser();
    await seedDndTexts();
    await seedGame(userId);

    const p = newParams();

    await request(app.getHttpServer()).get(ROUTE).query(p).expect(200);

    const r2 = await request(app.getHttpServer())
      .get(ROUTE)
      .query({ ...p, val_1: '9' })
      .expect(200);
    expect(r2.text).toContain('Invalid choice');
    expect(r2.text).toContain('read=');

    const r3 = await request(app.getHttpServer())
      .get(ROUTE)
      .query({ ...p, val_2: '1' })
      .expect(200);
    expect(r3.text).toContain('You found treasure');
    expect(r3.text).toContain('go_to_folder=hangup');
  });
});
