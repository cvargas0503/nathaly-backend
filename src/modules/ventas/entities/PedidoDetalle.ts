import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { Pedido } from "./Pedido";

@Index("PK__PedidoDe__968E515BBD314E95", ["idPedidoDetalle"], { unique: true })
@Entity("PedidoDetalle")
export class PedidoDetalle {
  @PrimaryGeneratedColumn({ type: "bigint", name: "IdPedidoDetalle" })
  idPedidoDetalle: string;

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

  @ManyToOne(() => Pedido, (pedido) => pedido.pedidoDetalles, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "IdPedido", referencedColumnName: "idPedido" }])
  idPedido: Pedido;

  @RelationId((pedidoDetalle: PedidoDetalle) => pedidoDetalle.idPedido)
  idPedido2: string;

  constructor(init?: Partial<PedidoDetalle>) {
    Object.assign(this, init);
  }
}
