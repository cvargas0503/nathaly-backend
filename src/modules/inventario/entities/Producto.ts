import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { AjusteDetalle } from "./AjusteDetalle";
import { Existencia } from "./Existencia";
import { Kardex } from "./Kardex";
import { ProductoImagen } from "./ProductoImagen";
import { ProductoPrecio } from "./ProductoPrecio";
import { TrasladoDetalle } from "./TrasladoDetalle";

@Index("PK__Producto__098892105E00D6D4", ["idProducto"], { unique: true })
@Index("UQ__Producto__06370DACE827E9A9", ["codigo"], { unique: true })
@Entity("Producto", {schema: "INVENTARIO"})
export class Producto {
  @PrimaryGeneratedColumn({ type: "int", name: "IdProducto" })
  idProducto: number;

  @Column("nvarchar", { name: "Codigo", unique: true, length: 30 })
  codigo: string;

  @Column("nvarchar", { name: "Descripcion", length: 150 })
  descripcion: string;

  @Column("decimal", { name: "Costo", precision: 18, scale: 4 })
  costo: number;

  @Column("decimal", {
    name: "ExistenciaMin",
    precision: 18,
    scale: 2,
    default: () => "(0)",
  })
  existenciaMin: number;

  @Column("decimal", {
    name: "ExistenciaMax",
    precision: 18,
    scale: 2,
    default: () => "(0)",
  })
  existenciaMax: number;

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

  @Column("int", { name: "IdLinea" })
  idLinea: number;

  @Column("int", { name: "IdMarca" })
  idMarca: number;

  @Column("int", { name: "IdCategoria" })
  idCategoria: number;

  @Column("int", { name: "IdProveedor" })
  idProveedor: number;

  @Column("nvarchar", { name: "Referencia", length: 50 })
  referencia: string;

  @OneToMany(() => AjusteDetalle, (ajusteDetalle) => ajusteDetalle.idProducto)
  ajusteDetalles: AjusteDetalle[];

  @OneToMany(() => Existencia, (existencia) => existencia.idProducto2)
  existencias: Existencia[];

  @OneToMany(() => Kardex, (kardex) => kardex.idProducto)
  kardexes: Kardex[];

  @OneToMany(
    () => ProductoImagen,
    (productoImagen) => productoImagen.idProducto
  )
  productoImagens: ProductoImagen[];

  @OneToMany(
    () => ProductoPrecio,
    (productoPrecio) => productoPrecio.idProducto2
  )
  productoPrecios: ProductoPrecio[];

  @OneToMany(
    () => TrasladoDetalle,
    (trasladoDetalle) => trasladoDetalle.idProducto
  )
  trasladoDetalles: TrasladoDetalle[];

  constructor(init?: Partial<Producto>) {
    Object.assign(this, init);
  }
}
