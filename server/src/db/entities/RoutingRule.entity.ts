import {
  Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, Index, JoinColumn,
} from 'typeorm';
import { IsOptional } from 'class-validator';
import { MaxLength } from '@shared/utils/validation/class-validator-he';
import { StringType } from '@shared/utils/entity/class-transformer';
import { IHasUserId } from '@shared/base-entity/interface';
import { GameNode } from './GameNode.entity';
import { Choice } from './Choice.entity';

@Entity('routing_rules')
@Index('routing_rules_user_id_idx', ['userId'], {})
@Index('routing_rules_source_node_id_idx', ['sourceNodeId'], {})
export class RoutingRule implements IHasUserId {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { name: 'user_id' })
  userId: number;

  @Column('int')
  sourceNodeId: number;

  @Column('int', { nullable: true })
  choiceId: number;

  @IsOptional({ always: true })
  @StringType
  @MaxLength(255, { always: true })
  @Column({ length: 255, nullable: true })
  diceOptions: string;

  @Column('int')
  targetNodeId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => GameNode, (node) => node.outgoingRules, { nullable: false })
  @JoinColumn({ name: 'sourceNodeId' })
  sourceNode: GameNode;

  @ManyToOne(() => GameNode, { nullable: false })
  @JoinColumn({ name: 'targetNodeId' })
  targetNode: GameNode;

  @ManyToOne(() => Choice, { nullable: true })
  @JoinColumn({ name: 'choiceId' })
  choice: Choice;
}
