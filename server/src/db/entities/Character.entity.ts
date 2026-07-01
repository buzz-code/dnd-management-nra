import {
  Column, CreateDateColumn, Entity, Index, ManyToOne, JoinColumn, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { CrudValidationGroups } from '@dataui/crud';
import { IsNotEmpty, MaxLength } from '@shared/utils/validation/class-validator-he';
import { StringType } from '@shared/utils/entity/class-transformer';
import { IsOptional } from 'class-validator';
import { IHasUserId } from '@shared/base-entity/interface';
import { Game } from './Game.entity';

@Entity('characters')
@Index('characters_user_id_idx', ['userId'], {})
@Index('characters_game_id_idx', ['gameId'], {})
export class Character implements IHasUserId {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { name: 'user_id' })
  userId: number;

  @IsNotEmpty({ groups: [CrudValidationGroups.CREATE] })
  @IsOptional({ groups: [CrudValidationGroups.UPDATE] })
  @Column('int')
  gameId: number;

  @ManyToOne(() => Game)
  @JoinColumn({ name: 'gameId' })
  game: Game;

  @IsNotEmpty({ groups: [CrudValidationGroups.CREATE] })
  @IsOptional({ groups: [CrudValidationGroups.UPDATE] })
  @StringType
  @MaxLength(255, { always: true })
  @Column({ length: 255 })
  name: string;

  @IsNotEmpty({ groups: [CrudValidationGroups.CREATE] })
  @IsOptional({ groups: [CrudValidationGroups.UPDATE] })
  @StringType
  @MaxLength(100, { always: true })
  @Column({ length: 100 })
  voiceId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
