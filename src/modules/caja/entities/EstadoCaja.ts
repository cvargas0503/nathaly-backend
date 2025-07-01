import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("PK__EstadoCa__D80D5A5D4865B61E", ["idEstadoCaja"], { unique: true })
@Index("UQ__EstadoCa__06370DAC4414AED0", ["codigo"], { unique: true })
@Entity("EstadoCaja", { schema: "CATALOGOS" })
export class EstadoCaja {
  @PrimaryGeneratedColumn({ type: "smallint", name: "IdEstadoCaja" })
  idEstadoCaja: number;

  @Column("varchar", { name: "Codigo", unique: true, length: 15 })
  codigo: string;

  @Column("nvarchar", { name: "Descripcion", length: 80 })
  descripcion: string;

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

  constructor(init?: Partial<EstadoCaja>) {
    Object.assign(this, init);
  }
}
