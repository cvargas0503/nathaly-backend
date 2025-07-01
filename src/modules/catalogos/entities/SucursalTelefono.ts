import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { Sucursal } from "./Sucursal";

@Index("PK__Sucursal__9B8AC7533A66359E", ["idTelefono"], { unique: true })
@Entity("SucursalTelefono", {schema: "CATALOGOS"})
export class SucursalTelefono {
  @PrimaryGeneratedColumn({ type: "int", name: "IdTelefono" })
  idTelefono: number;

  @Column("varchar", { name: "Numero", length: 20 })
  numero: string;

  @Column("nvarchar", { name: "Operadora", nullable: true, length: 50 })
  operadora: string | null;

  @Column("char", { name: "CodigoOperadora", nullable: true, length: 2 })
  codigoOperadora: string | null;

  @Column("bit", { name: "EsPrincipal", nullable: true, default: () => "(0)" })
  esPrincipal: boolean | null;

  @Column("nvarchar", { name: "Comentario", nullable: true, length: 100 })
  comentario: string | null;

  @Column("bit", { name: "Activo", nullable: true, default: () => "(1)" })
  activo: boolean | null;

  @Column("bit", { name: "Eliminado", nullable: true, default: () => "(0)" })
  eliminado: boolean | null;

  @Column("datetime2", {
    name: "FechaCreacion",
    nullable: true,
    default: () => "sysdatetime()",
  })
  fechaCreacion: Date | null;

  @Column("int", { name: "CreadoPor", nullable: true })
  creadoPor: number | null;

  @Column("int", { name: "ModificadoPor", nullable: true })
  modificadoPor: number | null;

  @Column("datetime2", { name: "FechaModificacion", nullable: true })
  fechaModificacion: Date | null;

  @Column("int", { name: "EliminadoPor", nullable: true })
  eliminadoPor: number | null;

  @Column("datetime2", { name: "FechaEliminacion", nullable: true })
  fechaEliminacion: Date | null;

  @ManyToOne(() => Sucursal, (sucursal) => sucursal.sucursalTelefonos, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "IdSucursal", referencedColumnName: "idSucursal" }])
  idSucursal: Sucursal;

  @RelationId(
    (sucursalTelefono: SucursalTelefono) => sucursalTelefono.idSucursal
  )
  idSucursal2: number;

  constructor(init?: Partial<SucursalTelefono>) {
    Object.assign(this, init);
  }
}
