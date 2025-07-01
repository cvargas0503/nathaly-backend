import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ProductoPrecio } from "./ProductoPrecio";

@Index("PK__ListaPre__422318681BBC0D74", ["idListaPrecio"], { unique: true })
@Index("UQ__ListaPre__75E3EFCF234C04E7", ["nombre"], { unique: true })
@Entity("ListaPrecio", {schema: 'INVENTARIO'})
export class ListaPrecio {
  @PrimaryGeneratedColumn({ type: "smallint", name: "IdListaPrecio" })
  idListaPrecio: number;

  @Column("nvarchar", { name: "Nombre", unique: true, length: 30 })
  nombre: string;

  @Column("nvarchar", { name: "Descripcion", nullable: true, length: 100 })
  descripcion: string | null;

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

  @OneToMany(
    () => ProductoPrecio,
    (productoPrecio) => productoPrecio.idListaPrecio2
  )
  productoPrecios: ProductoPrecio[];

  constructor(init?: Partial<ListaPrecio>) {
    Object.assign(this, init);
  }
}
