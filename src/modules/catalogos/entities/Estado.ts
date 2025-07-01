import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("PK__Estado__FBB0EDC14DB6BECB", ["idEstado"], { unique: true })
@Index("UQ__Estado__06370DAC16BDE299", ["codigo"], { unique: true })
@Entity("Estado", { schema: "CATALOGOS" })
export class Estado {
  @PrimaryGeneratedColumn({ type: "smallint", name: "IdEstado" })
  idEstado: number;

  @Column("varchar", { name: "Codigo", unique: true, length: 40 })
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

  constructor(init?: Partial<Estado>) {
    Object.assign(this, init);
  }
}
