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
import { NotaCreditoDetalle } from "./NotaCreditoDetalle";
import { Venta } from "./Venta";

@Index("PK__VentaDet__2787211D81A8C74F", ["idVentaDetalle"], { unique: true })
@Entity("VentaDetalle", { schema: "VENTAS" })
export class VentaDetalle {
  @PrimaryGeneratedColumn({ type: "bigint", name: "IdVentaDetalle" })
  idVentaDetalle: string;

  @Column("int", { name: "IdProducto" })
  idProducto: number;

  @Column("decimal", { name: "Cantidad", precision: 18, scale: 2 })
  cantidad: number;

  @Column("decimal", { name: "PrecioUnitario", precision: 18, scale: 4 })
  precioUnitario: number;

  @Column("decimal", {
    name: "Descuento",
    precision: 18,
    scale: 4,
    default: () => "(0)",
  })
  descuento: number;

  @Column("decimal", {
    name: "Subtotal",
    nullable: true,
    precision: 38,
    scale: 6,
  })
  subtotal: number | null;

  @Column("int", { name: "ModificadoPor", nullable: true })
  modificadoPor: number | null;

  @Column("datetime2", {
    name: "FechaModificacion",
    nullable: true,
    default: () => "sysdatetime()",
  })
  fechaModificacion: Date | null;

  @Column("bit", { name: "Eliminado", nullable: true, default: () => "(0)" })
  eliminado: boolean | null;

  @Column("int", { name: "EliminadoPor", nullable: true })
  eliminadoPor: number | null;

  @Column("datetime2", { name: "FechaEliminacion", nullable: true })
  fechaEliminacion: Date | null;

  @Column("int", { name: "CreadoPor" })
  creadoPor: number;

  @Column("datetime2", {
    name: "FechaCreacion",
    nullable: true,
    default: () => "sysdatetime()",
  })
  fechaCreacion: Date | null;

  @OneToMany(
    () => NotaCreditoDetalle,
    (notaCreditoDetalle) => notaCreditoDetalle.idVentaDetalle
  )
  notaCreditoDetalles: NotaCreditoDetalle[];

  @ManyToOne(() => Venta, (venta) => venta.ventaDetalles, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "IdVenta", referencedColumnName: "idVenta" }])
  idVenta: Venta;

  @RelationId((ventaDetalle: VentaDetalle) => ventaDetalle.idVenta)
  idVenta2: string;

  constructor(init?: Partial<VentaDetalle>) {
    Object.assign(this, init);
  }
}
