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
import { ArqueoAperturaDetalle } from "./ArqueoAperturaDetalle";
import { ArqueoCierreDetalle } from "./ArqueoCierreDetalle";
import { Moneda } from "./Moneda";
import { TipoDenominacion } from "./TipoDenominacion";

@Index("PK__Denomina__32C0B914E463DB52", ["idDenominacion"], { unique: true })
@Entity("Denominacion", { schema: "CAJA" })
export class Denominacion {
  @PrimaryGeneratedColumn({ type: "int", name: "IdDenominacion" })
  idDenominacion: number;

  @Column("decimal", { name: "Valor", precision: 18, scale: 4 })
  valor: number;

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

  @OneToMany(
    () => ArqueoAperturaDetalle,
    (arqueoAperturaDetalle) => arqueoAperturaDetalle.idDenominacion
  )
  arqueoAperturaDetalles: ArqueoAperturaDetalle[];

  @OneToMany(
    () => ArqueoCierreDetalle,
    (arqueoCierreDetalle) => arqueoCierreDetalle.idDenominacion
  )
  arqueoCierreDetalles: ArqueoCierreDetalle[];

  @ManyToOne(() => Moneda, (moneda) => moneda.denominacions)
  @JoinColumn([{ name: "CodigoMoneda", referencedColumnName: "codigo" }])
  codigoMoneda: Moneda;

  @ManyToOne(
    () => TipoDenominacion,
    (tipoDenominacion) => tipoDenominacion.denominacions
  )
  @JoinColumn([{ name: "IdTipo", referencedColumnName: "idTipo" }])
  idTipo: TipoDenominacion;

  @RelationId((denominacion: Denominacion) => denominacion.codigoMoneda)
  codigoMoneda2: string;

  @RelationId((denominacion: Denominacion) => denominacion.idTipo)
  idTipo2: number;

  constructor(init?: Partial<Denominacion>) {
    Object.assign(this, init);
  }
}
