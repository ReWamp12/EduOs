import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'subjects' })
export class Subject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  code: string;

  @Column({ type: 'text', name: 'icon_name', default: 'book-open' })
  iconName: string;

  @Column({ type: 'text', default: '#3B82F6' })
  color: string;
}
