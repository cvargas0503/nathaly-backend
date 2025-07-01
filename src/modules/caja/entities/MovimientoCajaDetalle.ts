import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { MovimientoCaja } from "./MovimientoCaja";
import { Moneda } from "./Moneda";

@Index("PK__Movimien__917707028B184E7E", ["idMovimientoDetalle"], {
  unique: true,
})
@Index("UQ__Movimien__1EE916A0754B977B", ["numeroReferencia"], { unique: true })
@Entity("MovimientoCajaDetalle", { schema: "CAJA" })
export class MovimientoCajaDetalle {
  @PrimaryGeneratedColumn({ type: "bigint", name: "IdMovimientoDetalle" })
  idMovimientoDetalle: string;

  @Column("smallint", { name: "IdFormaPago" })
  idFormaPago: number;

  @Column("decimal", { name: "Monto", precision: 18, scale: 4 })
  monto: number;

  @Column("datetime2", {
    name: "FechaRegistro",
    nullable: true,
    default: () => "sysutcdatetime()",
  })
  fechaRegistro: Date | null;

  @Column("nvarchar", {
    name: "NumeroReferencia",
    nullable: true,
    unique: true,
    length: 15,
  })
  numeroReferencia: string | null;

  @ManyToOne(
    () => MovimientoCaja,
    (movimientoCaja) => movimientoCaja.movimientoCajaDetalles
  )
  @JoinColumn([
    { name: "IdMovimientoCaja", referencedColumnName: "idMovimiento" },
  ])
  idMovimientoCaja: MovimientoCaja;

  @Column("char", { name: "CodigoMoneda", length: 3 })
  codigoMonedaStr: string;

  @ManyToOne(() => Moneda, (moneda) => moneda.movimientoCajaDetalles)
  @JoinColumn([{ name: "CodigoMoneda", referencedColumnName: "codigo" }])
  codigoMoneda: Moneda;

  @RelationId(
    (movimientoCajaDetalle: MovimientoCajaDetalle) =>
      movimientoCajaDetalle.idMovimientoCaja
  )
  idMovimientoCaja2: string;

  @RelationId(
    (movimientoCajaDetalle: MovimientoCajaDetalle) =>
      movimientoCajaDetalle.codigoMoneda
  )
  codigoMoneda2: string;

  constructor(init?: Partial<MovimientoCajaDetalle>) {
    Object.assign(this, init);
  }
}
