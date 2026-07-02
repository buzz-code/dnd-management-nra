import { YemotScenarioBuilder, YemotScenarioRunner, useFakeDateOnly } from '@shared/utils/yemot/testing';
import { YemotHandlerService } from './yemot-handler.service';

describe('YemotHandlerService — dnd-management-nra', () => {
  const runner = new YemotScenarioRunner(YemotHandlerService as any);

  beforeEach(() => useFakeDateOnly());
  afterEach(() => jest.useRealTimers());

  // ---- Base data ----

  const baseUser = { id: 1, phoneNumber: '099999999', name: 'Test User', effective_id: null };

  const dndTexts = [
    { userId: 0, name: 'DND.NO_ACTIVE_GAME', description: '', value: 'No active game' },
    { userId: 0, name: 'DND.GAME_NOT_FOUND', description: '', value: 'Game not found' },
    { userId: 0, name: 'DND.BROKEN_TREE', description: '', value: 'Broken tree' },
    { userId: 0, name: 'DND.INVALID_CHOICE', description: '', value: 'Invalid choice' },
    { userId: 0, name: 'DND.GAME_ENDED', description: '', value: 'Game ended' },
    { userId: 0, name: 'DND.DICE_RESULT', description: '', value: 'Dice: {roll}' },
  ];

  // ---- Test helpers ----

  async function ok(scenario: any) {
    const result = await runner.run(scenario);
    expect(result.passed).toBe(true);
    expect(result.hungup).toBe(true);
  }

  /** User + Text seeded, no game */
  function baseBuilder(name: string): YemotScenarioBuilder {
    return new YemotScenarioBuilder(name).seed('User', [baseUser]).seed('Text', dndTexts);
  }

  /** User + Text + a single active Game (id 1) */
  function withActiveGame(name: string): YemotScenarioBuilder {
    return baseBuilder(name).seed('Game', [{ id: 1, userId: 1, name: 'Test Adventure', isActive: true }]);
  }

  // ---- Game topology helpers ----

  /** start -> choice(north/south) -> end */
  function northSouthGame(b: YemotScenarioBuilder): YemotScenarioBuilder {
    return b
      .seed('Segment', [
        { id: 1, userId: 1, gameId: 1, name: 'start', title: 'Intro', value: 'Welcome to DnD' },
        { id: 2, userId: 1, gameId: 1, name: 'choice', title: 'Direction', value: 'Go north(1) or south(2)?' },
        { id: 3, userId: 1, gameId: 1, name: 'north', title: 'North', value: 'You found treasure!' },
        { id: 4, userId: 1, gameId: 1, name: 'south', title: 'South', value: 'You fell in a pit!' },
      ])
      .seed('GameNode', [
        { id: 1, userId: 1, gameId: 1, name: 'start', segmentId: 1, nodeType: 'start' },
        { id: 2, userId: 1, gameId: 1, name: 'choice', segmentId: 2, nodeType: null },
        { id: 3, userId: 1, gameId: 1, name: 'north', segmentId: 3, nodeType: 'end' },
        { id: 4, userId: 1, gameId: 1, name: 'south', segmentId: 4, nodeType: 'end' },
      ])
      .seed('Choice', [
        { id: 1, userId: 1, gameId: 1, nodeId: 2, inputKey: 1, description: 'North' },
        { id: 2, userId: 1, gameId: 1, nodeId: 2, inputKey: 2, description: 'South' },
      ])
      .seed('RoutingRule', [
        { id: 1, userId: 1, gameId: 1, sourceNodeId: 1, choiceId: null, targetNodeId: 2 },
        { id: 2, userId: 1, gameId: 1, sourceNodeId: 2, choiceId: 1, targetNodeId: 3 },
        { id: 3, userId: 1, gameId: 1, sourceNodeId: 2, choiceId: 2, targetNodeId: 4 },
      ]);
  }

  /** start -> plain message node -> system node (silent) -> end */
  function chainGame(b: YemotScenarioBuilder): YemotScenarioBuilder {
    return b
      .seed('Segment', [
        { id: 10, userId: 1, gameId: 1, name: 'start', title: 'Intro', value: 'Chapter begins' },
        { id: 11, userId: 1, gameId: 1, name: 'narration', title: 'Narration', value: 'A storm is brewing' },
        { id: 12, userId: 1, gameId: 1, name: 'hidden', title: 'Hidden', value: 'Should never be sent' },
        { id: 13, userId: 1, gameId: 1, name: 'end', title: 'End', value: 'The story concludes' },
      ])
      .seed('GameNode', [
        { id: 10, userId: 1, gameId: 1, name: 'start', segmentId: 10, nodeType: 'start' },
        { id: 11, userId: 1, gameId: 1, name: 'narration', segmentId: 11, nodeType: null },
        { id: 12, userId: 1, gameId: 1, name: 'hidden', segmentId: 12, nodeType: 'system' },
        { id: 13, userId: 1, gameId: 1, name: 'end', segmentId: 13, nodeType: 'end' },
      ])
      .seed('RoutingRule', [
        { id: 10, userId: 1, gameId: 1, sourceNodeId: 10, choiceId: null, targetNodeId: 11 },
        { id: 11, userId: 1, gameId: 1, sourceNodeId: 11, choiceId: null, targetNodeId: 12 },
        { id: 12, userId: 1, gameId: 1, sourceNodeId: 12, choiceId: null, targetNodeId: 13 },
      ]);
  }

  /** start -> end, routed entirely by a dice roll */
  function diceGame(b: YemotScenarioBuilder): YemotScenarioBuilder {
    return b
      .seed('Segment', [
        { id: 20, userId: 1, gameId: 1, name: 'start', value: 'Roll the dice' },
        { id: 21, userId: 1, gameId: 1, name: 'end', value: 'The dice decided your fate' },
      ])
      .seed('GameNode', [
        { id: 20, userId: 1, gameId: 1, name: 'start', segmentId: 20, nodeType: 'start' },
        { id: 21, userId: 1, gameId: 1, name: 'end', segmentId: 21, nodeType: 'end' },
      ])
      .seed('RoutingRule', [
        { id: 20, userId: 1, gameId: 1, sourceNodeId: 20, choiceId: null, diceOptions: '1,2,3,4,5,6', targetNodeId: 21 },
      ]);
  }

  /** start with a message but no outgoing rule at all */
  function brokenTreeMessageGame(b: YemotScenarioBuilder): YemotScenarioBuilder {
    return b
      .seed('Segment', [{ id: 30, userId: 1, gameId: 1, name: 'start', value: 'Enter dungeon' }])
      .seed('GameNode', [{ id: 30, userId: 1, gameId: 1, name: 'start', segmentId: 30, nodeType: 'start' }]);
  }

  /** start -> choice node whose choice has no matching routing rule */
  function brokenTreeChoiceGame(b: YemotScenarioBuilder): YemotScenarioBuilder {
    return b
      .seed('Segment', [
        { id: 40, userId: 1, gameId: 1, name: 'start', value: 'Welcome' },
        { id: 41, userId: 1, gameId: 1, name: 'choice', value: 'Pick a door: 1 or 2' },
      ])
      .seed('GameNode', [
        { id: 40, userId: 1, gameId: 1, name: 'start', segmentId: 40, nodeType: 'start' },
        { id: 41, userId: 1, gameId: 1, name: 'choice', segmentId: 41, nodeType: null },
      ])
      .seed('Choice', [{ id: 40, userId: 1, gameId: 1, nodeId: 41, inputKey: 1, description: 'Door 1' }])
      .seed('RoutingRule', [{ id: 40, userId: 1, gameId: 1, sourceNodeId: 40, choiceId: null, targetNodeId: 41 }]);
  }

  // ========================================================================
  // Tests
  // ========================================================================

  describe('User and game lookup', () => {
    it('unknown phone — no user found, hangup', async () => {
      const scenario = baseBuilder('Unknown phone').systemHangsUp().build();
      await ok(scenario);
    });

    it('user exists, no active game — hangup with NO_ACTIVE_GAME', async () => {
      const scenario = baseBuilder('No active game').systemHangsUp('No active game').build();
      await ok(scenario);
    });

    it('active game, no start node — hangup with GAME_NOT_FOUND', async () => {
      const scenario = withActiveGame('No start node').systemHangsUp('Game not found').build();
      await ok(scenario);
    });
  });

  describe('Branching game', () => {
    it('north path — welcome, choose north, treasure ending', async () => {
      const scenario = northSouthGame(withActiveGame('North path'))
        .systemSends('Welcome to DnD')
        .systemAsks('Go north(1) or south(2)?')
        .userResponds('1')
        .systemHangsUp('You found treasure!')
        .build();
      await ok(scenario);
    });

    it('south path — welcome, choose south, pit ending', async () => {
      const scenario = northSouthGame(withActiveGame('South path'))
        .systemSends('Welcome to DnD')
        .systemAsks('Go north(1) or south(2)?')
        .userResponds('2')
        .systemHangsUp('You fell in a pit!')
        .build();
      await ok(scenario);
    });

    it('invalid choice — error message then retry with valid choice', async () => {
      const scenario = northSouthGame(withActiveGame('Invalid choice retry'))
        .systemSends('Welcome to DnD')
        .systemAsks('Go north(1) or south(2)?')
        .userResponds('9')
        .systemSends('Invalid choice')
        .systemAsks('Go north(1) or south(2)?')
        .userResponds('1')
        .systemHangsUp('You found treasure!')
        .build();
      await ok(scenario);
    });
  });

  describe('Node types', () => {
    it('system node — silent passthrough, its segment is never sent', async () => {
      const scenario = chainGame(withActiveGame('System passthrough'))
        .systemSends('Chapter begins')
        .systemSends('A storm is brewing')
        .systemHangsUp('The story concludes')
        .build();
      await ok(scenario);
    });

    it('dice roll — routes via dice options and announces the result', async () => {
      const scenario = diceGame(withActiveGame('Dice roll'))
        .systemSends('Roll the dice')
        .systemSends(/Dice: \d/)
        .systemHangsUp('The dice decided your fate')
        .build();
      await ok(scenario);
    });
  });

  describe('Broken tree', () => {
    it('message node with no outgoing rule — hangup with BROKEN_TREE', async () => {
      const scenario = brokenTreeMessageGame(withActiveGame('Broken tree message node'))
        .systemSends('Enter dungeon')
        .systemHangsUp('Broken tree')
        .build();
      await ok(scenario);
    });

    it('choice selected but no routing rule — hangup with BROKEN_TREE', async () => {
      const scenario = brokenTreeChoiceGame(withActiveGame('Broken tree choice node'))
        .systemSends('Welcome')
        .systemAsks('Pick a door: 1 or 2')
        .userResponds('1')
        .systemHangsUp('Broken tree')
        .build();
      await ok(scenario);
    });
  });
});
