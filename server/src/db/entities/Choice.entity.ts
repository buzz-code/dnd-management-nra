import {
  Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, Index, JoinColumn,
} from 'typeorm';
import { CrudValidationGroups } from '@dataui/crud';
import { IsNotEmpty, MaxLength, IsNumber } from '@shared/utils/validation/class-validator-he';
import { StringType, NumberType } from '@shared/utils/entity/class-transformer';
import { IsOptional } from 'class-validator';
import { IHasUserId } from '@shared/base-entity/interface';
import { GameNode } from './GameNode.entity';

@Entity('choices')
@Index('choices_user_id_idx', ['userId'], {})
@Index('choices_node_id_idx', ['nodeId'], {})
export class Choice implements IHasUserId {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { name: 'user_id' })
  userId: number;

  @Column('int')
  nodeId: number;

  @IsNotEmpty({ groups: [CrudValidationGroups.CREATE] })
  @IsOptional({ groups: [CrudValidationGroups.UPDATE] })
  @NumberType
  @IsNumber({}, { always: true })
  @Column('int')
  inputKey: number;

  @IsOptional({ always: true })
  @StringType
  @MaxLength(500, { always: true })
  @Column({ length: 500, nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => GameNode, (node) => node.choices, { nullable: false })
  @JoinColumn({ name: 'nodeId' })
  node: GameNode;
}
