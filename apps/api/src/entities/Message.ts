import {
  Entity, PrimaryGeneratedColumn, Column, Index,
  CreateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from './User';

// conversationKey = paire d'ids triée "<minId>:<maxId>", calculée à l'écriture
// — permet de paginer une conversation via un seul index composite.
export function conversationKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

@Entity({ name: 'messages' })
@Index(['conversationKey', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  senderId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender!: User;

  @Column({ type: 'uuid' })
  recipientId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipient_id' })
  recipient!: User;

  @Column({ type: 'varchar', length: 73 })
  conversationKey!: string;

  // Contenu chiffré au repos (AES-256-GCM) — voir src/lib/encryption.ts.
  @Column({ type: 'text' })
  ciphertext!: string;

  @Column({ type: 'varchar', length: 32 })
  iv!: string;

  @Column({ type: 'varchar', length: 32 })
  authTag!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
