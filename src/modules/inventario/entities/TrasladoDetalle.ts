import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { Traslado } from "./Traslado";
import { Producto } from "./Producto";

@Index("PK__Traslado__E43646A5C4974C61", ["idDetalle"], { unique: true })
@Entity("TrasladoDetalle")
export class TrasladoDetalle {
  @PrimaryGeneratedColumn({ type: "bigint", name: "IdDetalle" })
  idDetalle: string;

  @Column("decimal", { name: "Cantidad", precision: 18, scale: 2 })
  cantidad: number;

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

  @ManyToOne(() => Traslado, (traslado) => traslado.trasladoDetalles, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "IdTraslado", referencedColumnName: "idTraslado" }])
  idTraslado: Traslado;

  @ManyToOne(() => Producto, (producto) => producto.trasladoDetalles)
  @JoinColumn([{ name: "IdProducto", referencedColumnName: "idProducto" }])
  idProducto: Producto;

  @RelationId((trasladoDetalle: TrasladoDetalle) => trasladoDetalle.idTraslado)
  idTraslado2: string;

  @RelationId((trasladoDetalle: TrasladoDetalle) => trasladoDetalle.idProducto)
  idProducto2: number;

  constructor(init?: Partial<TrasladoDetalle>) {
    Object.assign(this, init);
  }
}
