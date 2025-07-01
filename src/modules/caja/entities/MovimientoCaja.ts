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
import { AperturaCierreCaja } from "./AperturaCierreCaja";
import { MovimientoCajaDetalle } from "./MovimientoCajaDetalle";

@Index("PK__Movimien__881A6AE076F90590", ["idMovimiento"], { unique: true })
@Entity("MovimientoCaja", { schema: "CAJA" })
export class MovimientoCaja {
  @PrimaryGeneratedColumn({ type: "bigint", name: "IdMovimiento" })
  idMovimiento: string;

  @Column("bigint", { name: "IdVenta", nullable: true })
  idVenta: string | null;

  @Column("bigint", { name: "IdNotaCredito", nullable: true })
  idNotaCredito: string | null;

  @Column("bit", { name: "EsIngreso" })
  esIngreso: boolean;

  @Column("nvarchar", { name: "Concepto", length: 150 })
  concepto: string;

  @Column("nvarchar", { name: "NumeroMovimiento", length: 20 })
  numeroMovimiento: string;

  @Column("datetime2", {
    name: "Fecha",
    nullable: true,
    default: () => "sysdatetime()",
  })
  fecha: Date | null;

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

  @ManyToOne(() => Caja, (caja) => caja.movimientoCajas)
  @JoinColumn([{ name: "IdCaja", referencedColumnName: "idCaja" }])
  idCaja: Caja;

  @ManyToOne(
    () => AperturaCierreCaja,
    (aperturaCierreCaja) => aperturaCierreCaja.movimientoCajas
  )
  @JoinColumn([{ name: "IdAperturaCaja", referencedColumnName: "idApertura" }])
  idAperturaCaja: AperturaCierreCaja;

  @OneToMany(
    () => MovimientoCajaDetalle,
    (movimientoCajaDetalle) => movimientoCajaDetalle.idMovimientoCaja
  )
  movimientoCajaDetalles: MovimientoCajaDetalle[];

  @RelationId((movimientoCaja: MovimientoCaja) => movimientoCaja.idCaja)
  idCaja2: number;

  @RelationId((movimientoCaja: MovimientoCaja) => movimientoCaja.idAperturaCaja)
  idAperturaCaja2: string;

  constructor(init?: Partial<MovimientoCaja>) {
    Object.assign(this, init);
  }
}
