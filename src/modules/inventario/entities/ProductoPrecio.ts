import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { Producto } from "./Producto";
import { ListaPrecio } from "./ListaPrecio";

@Index("PK__Producto__2450584B1427499B", ["idPrecio"], { unique: true })
@Index(
  "UQ__Producto__76C8A9A0A586141E",
  ["idProducto", "idListaPrecio", "fechaDesde"],
  { unique: true }
)
@Entity("ProductoPrecio", {schema: "INVENTARIO"})
export class ProductoPrecio {
  @PrimaryGeneratedColumn({ type: "int", name: "IdPrecio" })
  idPrecio: number;

  @Column("int", { name: "IdProducto", unique: true })
  idProducto: number;

  @Column("decimal", { name: "Precio", precision: 18, scale: 4 })
  precio: number;

  @Column("date", { name: "FechaDesde", unique: true })
  fechaDesde: Date;

  @Column("date", { name: "FechaHasta", nullable: true })
  fechaHasta: Date | null;

  @Column("smallint", { name: "IdListaPrecio", unique: true })
  idListaPrecio: number;

  @Column("bit", { name: "Eliminado", nullable: true, default: () => "(0)" })
  eliminado: boolean | null;

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

  @Column("int", { name: "EliminadoPor", nullable: true })
  eliminadoPor: number | null;

  @Column("datetime2", { name: "FechaEliminacion", nullable: true })
  fechaEliminacion: Date | null;

  @ManyToOne(() => Producto, (producto) => producto.productoPrecios, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "IdProducto", referencedColumnName: "idProducto" }])
  idProducto2: Producto;

  @ManyToOne(() => ListaPrecio, (listaPrecio) => listaPrecio.productoPrecios)
  @JoinColumn([
    { name: "IdListaPrecio", referencedColumnName: "idListaPrecio" },
  ])
  idListaPrecio2: ListaPrecio;

  @RelationId((productoPrecio: ProductoPrecio) => productoPrecio.idProducto2)
  idProducto3: number;

  @RelationId((productoPrecio: ProductoPrecio) => productoPrecio.idListaPrecio2)
  idListaPrecio3: number;

  constructor(init?: Partial<ProductoPrecio>) {
    Object.assign(this, init);
  }
}
