import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Ciudad } from "./Ciudad";

@Index("PK__Pais__FC850A7B1C57D956", ["idPais"], { unique: true })
@Index("UQ__Pais__75E3EFCF0BC353FE", ["nombre"], { unique: true })
@Entity("Pais", {schema: "CATALOGOS"})
export class Pais {
  @PrimaryGeneratedColumn({ type: "int", name: "IdPais" })
  idPais: number;

  @Column("nvarchar", { name: "Nombre", unique: true, length: 100 })
  nombre: string;

  @Column("bit", { name: "Activo", nullable: true, default: () => "(1)" })
  activo: boolean | null;

  @Column("bit", { name: "Eliminado", nullable: true, default: () => "(0)" })
  eliminado: boolean | null;

  @Column("datetime2", {
    name: "FechaCreacion",
    nullable: true,
    default: () => "sysdatetime()",
  })
  fechaCreacion: Date | null;

  @Column("int", { name: "CreadoPor", nullable: true })
  creadoPor: number | null;

  @Column("int", { name: "ModificadoPor", nullable: true })
  modificadoPor: number | null;

  @Column("datetime2", { name: "FechaModificacion", nullable: true })
  fechaModificacion: Date | null;

  @Column("int", { name: "EliminadoPor", nullable: true })
  eliminadoPor: number | null;

  @Column("datetime2", { name: "FechaEliminacion", nullable: true })
  fechaEliminacion: Date | null;

  @OneToMany(() => Ciudad, (ciudad) => ciudad.idPais2)
  ciudads: Ciudad[];

  constructor(init?: Partial<Pais>) {
    Object.assign(this, init);
  }
}
