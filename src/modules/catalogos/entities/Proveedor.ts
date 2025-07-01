import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("PK__Proveedo__E8B631AF75115FC6", ["idProveedor"], { unique: true })
@Index("UQ__Proveedo__CAF3326B8ADA0C00", ["ruc"], { unique: true })
@Entity("Proveedor", {schema: "CATALOGOS"})
export class Proveedor {
  @PrimaryGeneratedColumn({ type: "int", name: "IdProveedor" })
  idProveedor: number;

  @Column("nvarchar", { name: "RazonSocial", length: 150 })
  razonSocial: string;

  @Column("nvarchar", { name: "RUC", unique: true, length: 30 })
  ruc: string;

  @Column("nvarchar", { name: "Direccion", nullable: true, length: 250 })
  direccion: string | null;

  @Column("varchar", { name: "Telefono", nullable: true, length: 20 })
  telefono: string | null;

  @Column("nvarchar", { name: "Email", nullable: true, length: 100 })
  email: string | null;

  @Column("int", { name: "CreadoPor" })
  creadoPor: number;

  @Column("datetime2", {
    name: "FechaCreacion",
    nullable: true,
    default: () => "sysdatetime()",
  })
  fechaCreacion: Date | null;

  @Column("int", { name: "ModificadoPor", nullable: true })
  modificadoPor: number | null;

  @Column("datetime2", { name: "FechaModificacion", nullable: true })
  fechaModificacion: Date | null;

  @Column("bit", { name: "Eliminado", nullable: true, default: () => "(0)" })
  eliminado: boolean | null;

  @Column("int", { name: "EliminadoPor", nullable: true })
  eliminadoPor: number | null;

  @Column("datetime2", { name: "FechaEliminacion", nullable: true })
  fechaEliminacion: Date | null;

  @Column("nvarchar", { name: "Nombre", length: 100 })
  nombre: string;

  constructor(init?: Partial<Proveedor>) {
    Object.assign(this, init);
  }
}
