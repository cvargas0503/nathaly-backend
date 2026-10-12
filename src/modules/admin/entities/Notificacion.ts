import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("Notificacion", { schema: "ADMIN" })
export class Notificacion {
  @PrimaryGeneratedColumn({ type: "bigint", name: "IdNotificacion" })
  idNotificacion: string;

  @Column("nvarchar", { name: "Tipo", length: 30 })
  tipo: string;

  @Column("nvarchar", { name: "Titulo", length: 150 })
  titulo: string;

  @Column("nvarchar", { name: "Descripcion", nullable: true, length: 500 })
  descripcion: string | null;

  @Column("nvarchar", { name: "Entidad", nullable: true, length: 50 })
  entidad: string | null;

  @Column("bigint", { name: "EntidadId", nullable: true })
  entidadId: string | null;

  @Column("int", { name: "UsuarioId", nullable: true })
  usuarioId: number | null;

  @Column("bit", { name: "Leida", nullable: true, default: () => "(0)" })
  leida: boolean | null;

  @Column("datetime2", {
    name: "Fecha",
    nullable: true,
    default: () => "sysdatetime()",
  })
  fecha: Date | null;

  @Column('nvarchar', { name: 'ClaveCondicion', length: 150, nullable: true })
  claveCondicion: string | null;
  @Column('bit', { name: 'Activa', default: () => '(1)' })
  activa: boolean;
  @Column('datetime2', { name: 'FechaCierre', nullable: true })
  fechaCierre: Date | null;

  constructor(init?: Partial<Notificacion>) {
    Object.assign(this, init);
  }
}
