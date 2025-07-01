import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("PK__FormaPag__C777CA682E79C4B8", ["idFormaPago"], { unique: true })
@Index("UQ__FormaPag__06370DAC7D67AEFE", ["codigo"], { unique: true })
@Entity("FormaPago")
export class FormaPago {
  @PrimaryGeneratedColumn({ type: "smallint", name: "IdFormaPago" })
  idFormaPago: number;

  @Column("varchar", { name: "Codigo", unique: true, length: 20 })
  codigo: string;

  @Column("nvarchar", { name: "Descripcion", length: 80 })
  descripcion: string;

  @Column("nvarchar", { name: "Imagen", nullable: true, length: 255 })
  imagen: string | null;

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

  constructor(init?: Partial<FormaPago>) {
    Object.assign(this, init);
  }
}
