import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { Bodega } from "./Bodega";
import { AjusteDetalle } from "./AjusteDetalle";

@Index("PK__Ajuste__138C2758946A89ED", ["idAjuste"], { unique: true })
@Entity("Ajuste")
export class Ajuste {
  @PrimaryGeneratedColumn({ type: "bigint", name: "IdAjuste" })
  idAjuste: string;

  @Column("datetime2", {
    name: "Fecha",
    nullable: true,
    default: () => "sysdatetime()",
  })
  fecha: Date | null;

  @Column("nvarchar", { name: "Observacion", nullable: true, length: 250 })
  observacion: string | null;

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

  @ManyToOne(() => Bodega, (bodega) => bodega.ajustes)
  @JoinColumn([{ name: "IdBodega", referencedColumnName: "idBodega" }])
  idBodega: Bodega;

  @OneToMany(() => AjusteDetalle, (ajusteDetalle) => ajusteDetalle.idAjuste)
  ajusteDetalles: AjusteDetalle[];

  @RelationId((ajuste: Ajuste) => ajuste.idBodega)
  idBodega2: number;

  constructor(init?: Partial<Ajuste>) {
    Object.assign(this, init);
  }
}
