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
import { Caja } from "./Caja";
import { ArqueoAperturaDetalle } from "./ArqueoAperturaDetalle";
import { ArqueoCierreDetalle } from "./ArqueoCierreDetalle";
import { EstadoCaja } from "../../catalogos/entities/EstadoCaja";
import { MovimientoCaja } from "./MovimientoCaja";

@Index("PK__Apertura__11116E2EED6E5CE4", ["idApertura"], { unique: true })
@Entity("AperturaCierreCaja", { schema: "CAJA" })
export class AperturaCierreCaja {
  @PrimaryGeneratedColumn({ type: "bigint", name: "IdApertura" })
  idApertura: string;

  @Column("int", { name: "IdEmpleado" })
  idEmpleado: number;

  @Column("datetime2", {
    name: "FechaApertura",
    nullable: true,
    default: () => "sysdatetime()",
  })
  fechaApertura: Date | null;

  @Column("decimal", {
    name: "TasaCambio",
    nullable: true,
    precision: 18,
    scale: 4,
  })
  tasaCambio: number | null;

  @Column("datetime2", { name: "FechaCierre", nullable: true })
  fechaCierre: Date | null;

  @Column("smallint", { name: "IdEstadoCaja" })
  idEstadoCaja: number;

  @Column("nvarchar", { name: "Observaciones", nullable: true, length: 250 })
  observaciones: string | null;

  @Column("int", { name: "Responsable" })
  responsable: number;

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

  @Column("int", { name: "IdSucursal" })
  idSucursal: number;

  @ManyToOne(() => Caja, (caja) => caja.aperturaCierreCajas)
  @JoinColumn([{ name: "IdCaja", referencedColumnName: "idCaja" }])
  idCaja: Caja;

  @OneToMany(
    () => ArqueoAperturaDetalle,
    (arqueoAperturaDetalle) => arqueoAperturaDetalle.idApertura
  )
  arqueoAperturaDetalles: ArqueoAperturaDetalle[];

  @OneToMany(
    () => ArqueoCierreDetalle,
    (arqueoCierreDetalle) => arqueoCierreDetalle.idApertura
  )
  arqueoCierreDetalles: ArqueoCierreDetalle[];
  @ManyToOne(() => EstadoCaja)
  @JoinColumn([{ name: "IdEstadoCaja", referencedColumnName: "idEstadoCaja" }])
  estadoCaja: EstadoCaja;
  @RelationId(
    (aperturaCierreCaja: AperturaCierreCaja) => aperturaCierreCaja.idCaja
  )
  idCaja2: number;
  @OneToMany(
    () => MovimientoCaja,
    (movimientoCaja) => movimientoCaja.idAperturaCaja
  )
  movimientoCajas: MovimientoCaja[];
  constructor(init?: Partial<AperturaCierreCaja>) {
    Object.assign(this, init);
  }
}