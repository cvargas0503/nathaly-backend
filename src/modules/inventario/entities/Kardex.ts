import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { Bodega } from "./Bodega";
import { Producto } from "./Producto";

@Index("PK__Kardex__BC1BA400FE2D22B5", ["idKardex"], { unique: true })
@Entity("Kardex", { schema: 'INVENTARIO' })
export class Kardex {
  @PrimaryGeneratedColumn({ type: "bigint", name: "IdKardex" })
  idKardex: string;

  @Column("smallint", { name: "IdTipoMov" })
  idTipoMov: number;

  @Column("bigint", { name: "ReferenciaId", nullable: true })
  referenciaId: string | null;

  @Column("datetime2", { name: "Fecha", default: () => "sysdatetime()" })
  fecha: Date;

  @Column("decimal", { name: "Cantidad", precision: 18, scale: 2 })
  cantidad: number;

  @Column("decimal", { name: "CostoUnit", precision: 18, scale: 4 })
  costoUnit: number;

  @Column("nvarchar", { name: "Observacion", nullable: true, length: 250 })
  observacion: string | null;

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

  @ManyToOne(() => Bodega, (bodega) => bodega.kardexes)
  @JoinColumn([{ name: "IdBodega", referencedColumnName: "idBodega" }])
  idBodega: Bodega;

  @ManyToOne(() => Producto, (producto) => producto.kardexes)
  @JoinColumn([{ name: "IdProducto", referencedColumnName: "idProducto" }])
  idProducto: Producto;

  @RelationId((kardex: Kardex) => kardex.idBodega)
  idBodega2: number;

  @RelationId((kardex: Kardex) => kardex.idProducto)
  idProducto2: number;

  constructor(init?: Partial<Kardex>) {
    Object.assign(this, init);
  }
}
