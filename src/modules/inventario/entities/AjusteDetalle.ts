import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { Ajuste } from "./Ajuste";
import { Producto } from "./Producto";

@Index("PK__AjusteDe__E43646A5BD8FB464", ["idDetalle"], { unique: true })
@Entity("AjusteDetalle")
export class AjusteDetalle {
  @PrimaryGeneratedColumn({ type: "bigint", name: "IdDetalle" })
  idDetalle: string;

  @Column("decimal", { name: "Cantidad", precision: 18, scale: 2 })
  cantidad: number;

  @Column("decimal", { name: "CostoUnit", precision: 18, scale: 4 })
  costoUnit: number;

  @Column("smallint", { name: "IdTipoMov" })
  idTipoMov: number;

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

  @ManyToOne(() => Ajuste, (ajuste) => ajuste.ajusteDetalles, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "IdAjuste", referencedColumnName: "idAjuste" }])
  idAjuste: Ajuste;

  @ManyToOne(() => Producto, (producto) => producto.ajusteDetalles)
  @JoinColumn([{ name: "IdProducto", referencedColumnName: "idProducto" }])
  idProducto: Producto;

  @RelationId((ajusteDetalle: AjusteDetalle) => ajusteDetalle.idAjuste)
  idAjuste2: string;

  @RelationId((ajusteDetalle: AjusteDetalle) => ajusteDetalle.idProducto)
  idProducto2: number;

  constructor(init?: Partial<AjusteDetalle>) {
    Object.assign(this, init);
  }
}
