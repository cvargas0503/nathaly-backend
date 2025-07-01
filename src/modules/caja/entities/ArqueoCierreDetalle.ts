import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { AperturaCierreCaja } from "./AperturaCierreCaja";
import { Denominacion } from "./Denominacion";

@Index("PK__ArqueoCi__E43646A5E46446B1", ["idDetalle"], { unique: true })
@Entity("ArqueoCierreDetalle", { schema: "CAJA" })
export class ArqueoCierreDetalle {
  @PrimaryGeneratedColumn({ type: "bigint", name: "IdDetalle" })
  idDetalle: string;

  @Column("decimal", { name: "Valor", precision: 18, scale: 4 })
  valor: number;

  @Column("int", { name: "Cantidad" })
  cantidad: number;

  @Column("decimal", { name: "Total", nullable: true, precision: 29, scale: 4 })
  total: number | null;

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

  @ManyToOne(
    () => AperturaCierreCaja,
    (aperturaCierreCaja) => aperturaCierreCaja.arqueoCierreDetalles
  )
  @JoinColumn([{ name: "IdApertura", referencedColumnName: "idApertura" }])
  idApertura: AperturaCierreCaja;

  @ManyToOne(
    () => Denominacion,
    (denominacion) => denominacion.arqueoCierreDetalles
  )
  @JoinColumn([
    { name: "IdDenominacion", referencedColumnName: "idDenominacion" },
  ])
  idDenominacion: Denominacion;

  @RelationId(
    (arqueoCierreDetalle: ArqueoCierreDetalle) => arqueoCierreDetalle.idApertura
  )
  idApertura2: string;

  @RelationId(
    (arqueoCierreDetalle: ArqueoCierreDetalle) =>
      arqueoCierreDetalle.idDenominacion
  )
  idDenominacion2: number;

  constructor(init?: Partial<ArqueoCierreDetalle>) {
    Object.assign(this, init);
  }
}
