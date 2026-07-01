import { Injectable } from '@nestjs/common';
import { BaseYemotHandlerService } from '../shared/utils/yemot/v2/yemot-router.service';
// import { Game } from './db/entities/Game.entity';
// import { GameNode } from './db/entities/GameNode.entity';

@Injectable()
export class YemotHandlerService extends BaseYemotHandlerService {
  override async processCall(): Promise<void> {
    this.logger.log(`Processing call with ID: ${this.call.callId}`);
    await this.getUserByDidPhone();
    if (!this.user) return;

    await this.sendMessage('ברוכים הבאים למשחק ההרפתקה. הקש אחת להרפתקה, הקש שתיים לקרב');

    const choice = await this.askForInput('בחר אפשרות', {
      min_digits: 1,
      max_digits: 1,
      digits_allowed: ['1', '2'],
    });

    if (choice === '1') {
      await this.hangupWithMessage('יצאת להרפתקה. תודה שיחקת, להתראות');
    } else if (choice === '2') {
      await this.hangupWithMessage('יצאת לקרב. תודה שיחקת, להתראות');
    } else {
      await this.hangupWithMessage('בחירה לא תקינה, שיחה מסתיימת');
    }
  }

  // ── Original game-tree-driven flow (disabled - see production incident) ──
  //
  // override async processCall(): Promise<void> {
  //   await this.getUserByDidPhone();
  //   if (!this.user) return;
  //
  //   const activeGame = await this.dataSource
  //     .getRepository(Game)
  //     .findOne({ where: { userId: this.user.id, isActive: true } });
  //   if (!activeGame) {
  //     await this.hangupWithMessageByKey('DND.NO_ACTIVE_GAME');
  //     return;
  //   }
  //
  //   this.logger.log(`DnD game started. Call: ${this.call.callId}, User: ${this.user.id}, Game: ${activeGame.id}`);
  //
  //   let currentNode = await this.loadNode({ nodeType: 'start' }, activeGame.id);
  //
  //   if (!currentNode) {
  //     await this.hangupWithMessageByKey('DND.GAME_NOT_FOUND');
  //     return;
  //   }
  //
  //   while (currentNode) {
  //     if (currentNode.nodeType === 'system') {
  //       const next = await this.evaluateNextRoute(currentNode, null);
  //       if (!next) {
  //         await this.hangupWithMessageByKey('DND.BROKEN_TREE');
  //         return;
  //       }
  //       currentNode = await this.loadNode({ id: next.id }, activeGame.id);
  //       continue;
  //     }
  //
  //     if (currentNode.choices.length > 0) {
  //       const maxInputLen = Math.max(...currentNode.choices.map((c) => c.inputKey.toString().length));
  //       let selectedChoice: (typeof currentNode.choices)[number] | undefined;
  //
  //       while (!selectedChoice) {
  //         const userInput = await this.askForInputFromContent(currentNode.segment, {
  //           min_digits: 1,
  //           max_digits: maxInputLen,
  //         });
  //         selectedChoice = currentNode.choices.find((c) => c.inputKey.toString() === userInput);
  //         if (!selectedChoice) {
  //           await this.sendMessageByKey('DND.INVALID_CHOICE');
  //         }
  //       }
  //
  //       const next = await this.evaluateNextRoute(currentNode, selectedChoice.id);
  //       if (!next) {
  //         await this.hangupWithMessageByKey('DND.BROKEN_TREE');
  //         return;
  //       }
  //       currentNode = await this.loadNode({ id: next.id }, activeGame.id);
  //     } else {
  //       if (currentNode.nodeType === 'end') {
  //         await this.hangupWithMessageFromContent(currentNode.segment);
  //         return;
  //       }
  //
  //       await this.sendMessageFromContent(currentNode.segment);
  //
  //       const next = await this.evaluateNextRoute(currentNode, null);
  //       if (!next) {
  //         await this.hangupWithMessageByKey('DND.BROKEN_TREE');
  //         return;
  //       }
  //       currentNode = await this.loadNode({ id: next.id }, activeGame.id);
  //     }
  //   }
  //
  //   await this.hangupWithMessageByKey('DND.GAME_ENDED');
  // }
  //
  // private async evaluateNextRoute(node: GameNode, choiceId: number | null): Promise<GameNode | null> {
  //   const rules = node.outgoingRules.filter((r) => (choiceId === null ? r.choiceId == null : r.choiceId === choiceId));
  //
  //   if (!rules.length) {
  //     this.logger.error(`Broken game tree: no routing rule from node ${node.id} (choice: ${choiceId})`);
  //     return null;
  //   }
  //
  //   const diceRules = rules.filter((r) => r.diceOptions?.trim());
  //
  //   if (diceRules.length) {
  //     const roll = Math.floor(Math.random() * 6) + 1;
  //     await this.sendMessageByKey('DND.DICE_RESULT', { roll });
  //     const matched = diceRules.find((r) => r.diceOptions!.split(',').includes(roll.toString()));
  //     return matched?.targetNode ?? diceRules[0].targetNode;
  //   }
  //
  //   return rules[0].targetNode;
  // }
  //
  // private loadNode(where: { id?: number; nodeType?: string }, gameId: number): Promise<GameNode | null> {
  //   return this.dataSource.getRepository(GameNode).findOne({
  //     where: { ...where, userId: this.user.id, gameId },
  //     relations: [
  //       'segment',
  //       'choices',
  //       'outgoingRules',
  //       'outgoingRules.targetNode',
  //       'outgoingRules.targetNode.segment',
  //     ],
  //   });
  // }
}
