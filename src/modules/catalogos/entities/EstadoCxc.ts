import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("PK__EstadoCx__B847F5420D89B1C4", ["idEstadoCxc"], { unique: true })
@Index("UQ__EstadoCx__06370DACF0A8BA3D", ["codigo"], { unique: true })
@Entity("EstadoCxc")
export class EstadoCxc {
  @PrimaryGeneratedColumn({ type: "smallint", name: "IdEstadoCxc" })
  idEstadoCxc: number;

  @Column("varchar", { name: "Codigo", unique: true, length: 15 })
  codigo: string;

  @Column("nvarchar", { name: "Descripcion", length: 80 })
  descripcion: string;

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

  constructor(init?: Partial<EstadoCxc>) {
    Object.assign(this, init);
  }
}
