import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("PK__MotivoDe__69F27F3DC55560C6", ["idMotivo"], { unique: true })
@Index("UQ__MotivoDe__06370DAC839C03F1", ["codigo"], { unique: true })
@Entity("MotivoDevolucion",   { schema: "CAJA" })
export class MotivoDevolucion {
  @PrimaryGeneratedColumn({ type: "smallint", name: "IdMotivo" })
  idMotivo: number;

  @Column("varchar", { name: "Codigo", unique: true, length: 15 })
  codigo: string;

  @Column("nvarchar", { name: "Descripcion", length: 120 })
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

  constructor(init?: Partial<MotivoDevolucion>) {
    Object.assign(this, init);
  }
}
