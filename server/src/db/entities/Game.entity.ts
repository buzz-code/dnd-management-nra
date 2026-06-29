import {
  Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { CrudValidationGroups } from '@dataui/crud';
import { IsNotEmpty, MaxLength } from '@shared/utils/validation/class-validator-he';
import { StringType } from '@shared/utils/entity/class-transformer';
import { IsOptional } from 'class-validator';
import { IHasUserId } from '@shared/base-entity/interface';

@Entity('games')
@Index('games_user_id_idx', ['userId'], {})
export class Game implements IHasUserId {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { name: 'user_id' })
  userId: number;

  @IsNotEmpty({ groups: [CrudValidationGroups.CREATE] })
  @IsOptional({ groups: [CrudValidationGroups.UPDATE] })
  @StringType
  @MaxLength(255, { always: true })
  @Column({ length: 255 })
  title: string;

  @IsOptional({ always: true })
  @Column({ default: false })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
