import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("PK__Categori__A3C02A10F83C9F63", ["idCategoria"], { unique: true })
@Entity("Categoria", {schema: 'CATALOGOS'})
export class Categoria {
  @PrimaryGeneratedColumn({ type: "int", name: "IdCategoria" })
  idCategoria: number;

  @Column("nvarchar", { name: "Nombre", length: 50 })
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

  constructor(init?: Partial<Categoria>) {
    Object.assign(this, init);
  }
}
