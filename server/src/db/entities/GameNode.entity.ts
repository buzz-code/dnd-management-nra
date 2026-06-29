import {
  Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, Index, JoinColumn,
} from 'typeorm';
import { CrudValidationGroups } from '@dataui/crud';
import { IsNotEmpty, MaxLength } from '@shared/utils/validation/class-validator-he';
import { StringType } from '@shared/utils/entity/class-transformer';
import { IsOptional } from 'class-validator';
import { IHasUserId } from '@shared/base-entity/interface';
import { Game } from './Game.entity';
import { Layer } from './Layer.entity';
import { Segment } from './Segment.entity';
import { Choice } from './Choice.entity';
import { RoutingRule } from './RoutingRule.entity';

// Named GameNode to avoid collision with the global DOM/Node.js `Node` type
@Entity('nodes')
@Index('nodes_user_id_idx', ['userId'], {})
@Index('nodes_layer_id_idx', ['layerId'], {})
@Index('nodes_game_id_idx', ['gameId'], {})
export class GameNode implements IHasUserId {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { name: 'user_id' })
  userId: number;

  @IsOptional({ always: true })
  @Column('int', { nullable: true })
  gameId: number;

  @ManyToOne(() => Game, { nullable: true })
  @JoinColumn({ name: 'gameId' })
  game: Game;

  @IsNotEmpty({ groups: [CrudValidationGroups.CREATE] })
  @IsOptional({ groups: [CrudValidationGroups.UPDATE] })
  @StringType
  @MaxLength(255, { always: true })
  @Column({ length: 255 })
  name: string;

  @Column('int', { nullable: true })
  layerId: number;

  @Column('int', { nullable: true })
  segmentId: number;

  @IsOptional({ always: true })
  @StringType
  @MaxLength(255, { always: true })
  @Column({ length: 255, nullable: true })
  nodeType: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Layer, { nullable: true })
  @JoinColumn({ name: 'layerId' })
  layer: Layer;

  @ManyToOne(() => Segment, { nullable: true })
  @JoinColumn({ name: 'segmentId' })
  segment: Segment;

  @OneToMany(() => Choice, (choice) => choice.node)
  choices: Choice[];

  @OneToMany(() => RoutingRule, (rule) => rule.sourceNode)
  outgoingRules: RoutingRule[];
}
