import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("PK__EstadoNo__41C71EE4D826D7E3", ["idEstadoNota"], { unique: true })
@Index("UQ__EstadoNo__06370DAC88175D2C", ["codigo"], { unique: true })
@Entity("EstadoNota")
export class EstadoNota {
  @PrimaryGeneratedColumn({ type: "smallint", name: "IdEstadoNota" })
  idEstadoNota: number;

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

  constructor(init?: Partial<EstadoNota>) {
    Object.assign(this, init);
  }
}
