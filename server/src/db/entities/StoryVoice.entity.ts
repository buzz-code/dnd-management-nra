import {
  Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { CrudValidationGroups } from '@dataui/crud';
import { IsNotEmpty, MaxLength } from '@shared/utils/validation/class-validator-he';
import { StringType } from '@shared/utils/entity/class-transformer';
import { IsOptional } from 'class-validator';
import { IHasUserId } from '@shared/base-entity/interface';

export enum StoryVoiceStatus {
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed',
}

@Entity('story_voices')
@Index('story_voices_user_id_idx', ['userId'], {})
export class StoryVoice implements IHasUserId {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { name: 'user_id' })
  userId: number;

  @IsNotEmpty({ groups: [CrudValidationGroups.CREATE] })
  @IsOptional({ groups: [CrudValidationGroups.UPDATE] })
  @StringType
  @MaxLength(255, { always: true })
  @Column({ length: 255 })
  name: string;

  @IsNotEmpty({ groups: [CrudValidationGroups.CREATE] })
  @IsOptional({ groups: [CrudValidationGroups.UPDATE] })
  @Column('simple-json')
  segments: any;

  @IsNotEmpty({ groups: [CrudValidationGroups.CREATE] })
  @IsOptional({ groups: [CrudValidationGroups.UPDATE] })
  @Column('simple-json')
  characterVoices: any;

  @IsOptional({ always: true })
  @StringType
  @MaxLength(100, { always: true })
  @Column({ length: 100 })
  modelId: string;

  @IsOptional({ always: true })
  @StringType
  @MaxLength(500, { always: true })
  @Column({ length: 500, nullable: true })
  filePath: string;

  @IsOptional({ always: true })
  @StringType
  @MaxLength(20, { always: true })
  @Column({ length: 20, default: StoryVoiceStatus.Pending })
  status: string;

  @IsOptional({ always: true })
  @StringType
  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
