import { Entity } from 'typeorm';
import { User as BaseUser } from '@shared/entities/User.entity';

@Entity('users')
export class User extends BaseUser {}
