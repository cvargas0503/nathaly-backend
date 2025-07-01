import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
} from "typeorm";
import { Bodega } from "./Bodega";
import { Producto } from "./Producto";

@Index("PK__Existenc__522EEE63B1158289", ["idBodega", "idProducto"], {
  unique: true,
})
@Entity("Existencia")
export class Existencia {
  @Column("int", { primary: true, name: "IdBodega" })
  idBodega: number;

  @Column("int", { primary: true, name: "IdProducto" })
  idProducto: number;

  @Column("decimal", {
    name: "Stock",
    precision: 18,
    scale: 2,
    default: () => "(0)",
  })
  stock: number;

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

  @ManyToOne(() => Bodega, (bodega) => bodega.existencias, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "IdBodega", referencedColumnName: "idBodega" }])
  idBodega2: Bodega;

  @ManyToOne(() => Producto, (producto) => producto.existencias, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "IdProducto", referencedColumnName: "idProducto" }])
  idProducto2: Producto;

  @RelationId((existencia: Existencia) => existencia.idBodega2)
  idBodega3: number;

  @RelationId((existencia: Existencia) => existencia.idProducto2)
  idProducto3: number;

  constructor(init?: Partial<Existencia>) {
    Object.assign(this, init);
  }
}
