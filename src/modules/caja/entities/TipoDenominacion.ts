import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Denominacion } from "./Denominacion";

@Index("PK__TipoDeno__9E3A29A5EFCDE110", ["idTipo"], { unique: true })
@Index("UQ__TipoDeno__75E3EFCFF2AEF292", ["nombre"], { unique: true })
@Entity("TipoDenominacion", { schema: "CAJA" })
export class TipoDenominacion {
  @PrimaryGeneratedColumn({ type: "int", name: "IdTipo" })
  idTipo: number;

  @Column("nvarchar", { name: "Nombre", unique: true, length: 20 })
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

  @Column("int", { name: "ModificadoPor", nullable: true })
  modificadoPor: number | null;

  @Column("datetime2", { name: "FechaModificacion", nullable: true })
  fechaModificacion: Date | null;

  @Column("int", { name: "EliminadoPor", nullable: true })
  eliminadoPor: number | null;

  @Column("datetime2", { name: "FechaEliminacion", nullable: true })
  fechaEliminacion: Date | null;

  @OneToMany(() => Denominacion, (denominacion) => denominacion.idTipo)
  denominacions: Denominacion[];

  constructor(init?: Partial<TipoDenominacion>) {
    Object.assign(this, init);
  }
}
