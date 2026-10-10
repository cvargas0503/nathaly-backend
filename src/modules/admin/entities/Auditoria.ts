import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("Auditoria", { schema: "ADMIN" })
export class Auditoria {
  @PrimaryGeneratedColumn({ type: "bigint", name: "IdAuditoria" })
  idAuditoria: string;

  @Column("nvarchar", { name: "Entidad", length: 50 })
  entidad: string;

  @Column("nvarchar", { name: "Accion", length: 20 })
  accion: string;

  @Column("bigint", { name: "EntidadId", nullable: true })
  entidadId: string | null;

  @Column("nvarchar", { name: "Descripcion", nullable: true, length: 500 })
  descripcion: string | null;

  @Column("nvarchar", { name: "DatosAnterior", nullable: true, length: "MAX" })
  datosAnterior: string | null;

  @Column("nvarchar", { name: "DatosNuevo", nullable: true, length: "MAX" })
  datosNuevo: string | null;

  @Column("int", { name: "UsuarioId" })
  usuarioId: number;

  @Column("nvarchar", { name: "UsuarioLogin", nullable: true, length: 50 })
  usuarioLogin: string | null;

  @Column("datetime2", {
    name: "Fecha",
    nullable: true,
    default: () => "sysdatetime()",
  })
  fecha: Date | null;

  @Column("nvarchar", { name: "IpAddress", nullable: true, length: 45 })
  ipAddress: string | null;

  constructor(init?: Partial<Auditoria>) {
    Object.assign(this, init);
  }
}
