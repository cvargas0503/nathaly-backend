import { Entity, Column } from 'typeorm';
@Entity('NotificacionLectura', { schema: 'ADMIN' })
export class NotificacionLectura {
  @Column('bigint', { primary: true, name: 'IdNotificacion' }) idNotificacion: string;
  @Column('int', { primary: true, name: 'UsuarioId' }) usuarioId: number;
  @Column('datetime2', { name: 'FechaLectura' }) fechaLectura: Date;
}
