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

@Index("PK__Producto__B42D8F2A802D1AE5", ["idImagen"], { unique: true })
@Entity("ProductoImagen", {schema: "INVENTARIO"})
export class ProductoImagen {
  @PrimaryGeneratedColumn({ type: "int", name: "IdImagen" })
  idImagen: number;

  @Column("nvarchar", { name: "UrlArchivo", length: 300 })
  urlArchivo: string;

  @Column("tinyint", { name: "Orden", default: () => "(1)" })
  orden: number;

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

  @ManyToOne(() => Producto, (producto) => producto.productoImagens, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "IdProducto", referencedColumnName: "idProducto" }])
  idProducto: Producto;

  @RelationId((productoImagen: ProductoImagen) => productoImagen.idProducto)
  idProducto2: number;

  constructor(init?: Partial<ProductoImagen>) {
    Object.assign(this, init);
  }
}
