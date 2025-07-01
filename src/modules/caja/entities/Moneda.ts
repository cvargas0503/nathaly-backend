import { Column, Entity, Index, OneToMany } from "typeorm";
import { Denominacion } from "./Denominacion";
import { MovimientoCajaDetalle } from "./MovimientoCajaDetalle";

@Index("PK__Moneda__06370DAD3055D74D", ["codigo"], { unique: true })
@Entity("Moneda", { schema: "CAJA" })
export class Moneda {
  @Column("char", { primary: true, name: "Codigo", length: 3 })
  codigo: string;

  @Column("nvarchar", { name: "Nombre", length: 50 })
  nombre: string;

  @Column("nvarchar", { name: "Simbolo", nullable: true, length: 5 })
  simbolo: string | null;

  @Column("bit", { name: "Eliminado", nullable: true, default: () => "(0)" })
  eliminado: boolean | null;

  @Column("int", { name: "CreadoPor", nullable: true })
  creadoPor: number | null;

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

  @OneToMany(() => Denominacion, (denominacion) => denominacion.codigoMoneda)
  denominacions: Denominacion[];

  @OneToMany(
    () => MovimientoCajaDetalle,
    (movimientoCajaDetalle) => movimientoCajaDetalle.codigoMoneda
  )
  movimientoCajaDetalles: MovimientoCajaDetalle[];

  constructor(init?: Partial<Moneda>) {
    Object.assign(this, init);
  }
}
