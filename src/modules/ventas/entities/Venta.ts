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
import { Cambio } from "./Cambio";
import { NotaCredito } from "./NotaCredito";
import { Pedido } from "./Pedido";
import { VentaDetalle } from "./VentaDetalle";

@Index("PK__Venta__BC1240BD5832B65B", ["idVenta"], { unique: true })
@Index("UQ__Venta__EBD2D7F1302D53CE", ["numeroVenta"], { unique: true })
@Entity("Venta", { schema: "VENTAS" })
export class Venta {
  @PrimaryGeneratedColumn({ type: "bigint", name: "IdVenta" })
  idVenta: string;

  @Column("nvarchar", { name: "NumeroVenta", unique: true, length: 25 })
  numeroVenta: string;

  @Column("int", { name: "IdCliente" })
  idCliente: number;

  @Column("int", { name: "IdEmpleado" })
  idEmpleado: number;

  @Column("int", { name: "IdBodega" })
  idBodega: number;

  @Column("smallint", { name: "IdEstado" })
  idEstado: number;

  @Column("datetime2", { name: "Fecha" })
  fecha: Date;

  @Column("decimal", { name: "Subtotal", precision: 18, scale: 4 })
  subtotal: number;

  @Column("decimal", {
    name: "Descuento",
    precision: 18,
    scale: 4,
    default: () => "(0)",
  })
  descuento: number;

  @Column("decimal", {
    name: "Impuestos",
    precision: 18,
    scale: 4,
    default: () => "(0)",
  })
  impuestos: number;

  @Column("decimal", { name: "Total", nullable: true, precision: 20, scale: 4 })
  total: number | null;

  @Column("smallint", { name: "IdTermino" })
  idTermino: number;

  @Column("smallint", { name: "IdEstadoCxc", default: () => "(1)" })
  idEstadoCxc: number;

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

  @Column("nvarchar", { name: "Observacion", nullable: true, length: 50 })
  observacion: string | null;

  @OneToMany(() => Cambio, (cambio) => cambio.idVentaNueva)
  cambios: Cambio[];

  @OneToMany(() => NotaCredito, (notaCredito) => notaCredito.idVenta)
  notaCreditos: NotaCredito[];

  @ManyToOne(() => Pedido, (pedido) => pedido.ventas)
  @JoinColumn([{ name: "IdPedidoOrigen", referencedColumnName: "idPedido" }])
  idPedidoOrigen: Pedido;

  @OneToMany(() => VentaDetalle, (ventaDetalle) => ventaDetalle.idVenta)
  ventaDetalles: VentaDetalle[];

  @RelationId((venta: Venta) => venta.idPedidoOrigen)
  idPedidoOrigen2: string | null;

  constructor(init?: Partial<Venta>) {
    Object.assign(this, init);
  }
}
