import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("PK__EstadoPe__86B983713FC161A0", ["idEstadoPedido"], { unique: true })
@Index("UQ__EstadoPe__06370DAC9477DFD9", ["codigo"], { unique: true })
@Entity("EstadoPedido")
export class EstadoPedido {
  @PrimaryGeneratedColumn({ type: "smallint", name: "IdEstadoPedido" })
  idEstadoPedido: number;

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

  constructor(init?: Partial<EstadoPedido>) {
    Object.assign(this, init);
  }
}
