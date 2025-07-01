import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("PK__TipoMovi__3D71C086BCD113CE", ["idTipoMov"], { unique: true })
@Entity("TipoMovimientoInventario", {schema: "CATALOGOS"})
export class TipoMovimientoInventario {
  @PrimaryGeneratedColumn({ type: "smallint", name: "IdTipoMov" })
  idTipoMov: number;

  @Column("nvarchar", { name: "Descripcion", length: 80 })
  descripcion: string;

  @Column("smallint", { name: "Signo" })
  signo: number;

  @Column("bit", { name: "Eliminado", nullable: true, default: () => "(0)" })
  eliminado: boolean | null;

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

  @Column("int", { name: "EliminadoPor", nullable: true })
  eliminadoPor: number | null;

  @Column("datetime2", { name: "FechaEliminacion", nullable: true })
  fechaEliminacion: Date | null;

  @Column("nvarchar", { name: "Nombre", length: 80 })
  nombre: string;

  constructor(init?: Partial<TipoMovimientoInventario>) {
    Object.assign(this, init);
  }
}
