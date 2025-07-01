import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { PedidoDetalle } from "./PedidoDetalle";
import { Venta } from "./Venta";

@Index("PK__Pedido__9D335DC376E870C5", ["idPedido"], { unique: true })
@Index("UQ_Numero_Pedido", ["numeroPedido"], { unique: true })
@Entity("Pedido")
export class Pedido {
  @PrimaryGeneratedColumn({ type: "bigint", name: "IdPedido" })
  idPedido: string;

  @Column("int", { name: "IdCliente" })
  idCliente: number;

  @Column("int", { name: "IdEmpleado" })
  idEmpleado: number;

  @Column("datetime2", {
    name: "FechaPedido",
    nullable: true,
    default: () => "sysdatetime()",
  })
  fechaPedido: Date | null;

  @Column("smallint", { name: "IdEstadoPedido" })
  idEstadoPedido: number;

  @Column("nvarchar", { name: "Observaciones", nullable: true, length: 250 })
  observaciones: string | null;

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

  @Column("smallint", { name: "IdTermino" })
  idTermino: number;

  @Column("nvarchar", { name: "Observacion", nullable: true, length: 50 })
  observacion: string | null;

  @Column("int", { name: "IdBodega" })
  idBodega: number;

  @Column("nvarchar", { name: "NumeroPedido", unique: true, length: 20 })
  numeroPedido: string;

  @OneToMany(() => PedidoDetalle, (pedidoDetalle) => pedidoDetalle.idPedido)
  pedidoDetalles: PedidoDetalle[];

  @OneToMany(() => Venta, (venta) => venta.idPedidoOrigen)
  ventas: Venta[];

  constructor(init?: Partial<Pedido>) {
    Object.assign(this, init);
  }
}
