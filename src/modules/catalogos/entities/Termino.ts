import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("PK__Termino__4C003F3CA57DB17B", ["idTermino"], { unique: true })
@Index("UQ__Termino__06370DAC1F916204", ["codigo"], { unique: true })
@Entity("Termino", {schema: "CATALOGOS"})
export class Termino {
  @PrimaryGeneratedColumn({ type: "smallint", name: "IdTermino" })
  idTermino: number;

  @Column("varchar", { name: "Codigo", unique: true, length: 15 })
  codigo: string;

  @Column("smallint", { name: "DiasPlazo" })
  diasPlazo: number;

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

  constructor(init?: Partial<Termino>) {
    Object.assign(this, init);
  }
}
