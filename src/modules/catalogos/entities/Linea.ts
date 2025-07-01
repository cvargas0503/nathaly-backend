import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("PK__Linea__3D1A3EAE66C4A585", ["idLinea"], { unique: true })
@Index("UQ_Linea_Nombre", ["nombre"], { unique: true })
@Entity("Linea", {schema: "CATALOGOS"})
export class Linea {
  @PrimaryGeneratedColumn({ type: "int", name: "IdLinea" })
  idLinea: number;

  @Column("nvarchar", { name: "Nombre", unique: true, length: 50 })
  nombre: string;

  @Column("bit", { name: "Eliminado", nullable: true, default: () => "(0)" })
  eliminado: boolean | null;

  @Column("int", { name: "CreadoPor", nullable: true })
  creadoPor: number | null;

  @Column("datetime2", {
    name: "FechaCreacion",
    nullable: true,
    default: () => "sysdatetime()",
  })
  fechaCreacion: Date | null;

  @Column("int", { name: "EliminadoPor", nullable: true })
  eliminadoPor: number | null;

  @Column("datetime2", { name: "FechaEliminacion", nullable: true })
  fechaEliminacion: Date | null;

  @Column("int", { name: "ModificadoPor", nullable: true })
  modificadoPor: number | null;

  @Column("datetime2", { name: "FechaModificacion", nullable: true })
  fechaModificacion: Date | null;

  constructor(init?: Partial<Linea>) {
    Object.assign(this, init);
  }
}
