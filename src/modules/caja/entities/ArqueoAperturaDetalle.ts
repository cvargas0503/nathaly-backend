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

@Index("PK__ArqueoAp__E43646A57E8078FA", ["idDetalle"], { unique: true })
@Entity("ArqueoAperturaDetalle", { schema: "CAJA" })
export class ArqueoAperturaDetalle {
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
    (aperturaCierreCaja) => aperturaCierreCaja.arqueoAperturaDetalles
  )
  @JoinColumn([{ name: "IdApertura", referencedColumnName: "idApertura" }])
  idApertura: AperturaCierreCaja;

  @ManyToOne(
    () => Denominacion,
    (denominacion) => denominacion.arqueoAperturaDetalles
  )
  @JoinColumn([
    { name: "IdDenominacion", referencedColumnName: "idDenominacion" },
  ])
  idDenominacion: Denominacion;

  @RelationId(
    (arqueoAperturaDetalle: ArqueoAperturaDetalle) =>
      arqueoAperturaDetalle.idApertura
  )
  idApertura2: string;

  @RelationId(
    (arqueoAperturaDetalle: ArqueoAperturaDetalle) =>
      arqueoAperturaDetalle.idDenominacion
  )
  idDenominacion2: number;

  constructor(init?: Partial<ArqueoAperturaDetalle>) {
    Object.assign(this, init);
  }
}
