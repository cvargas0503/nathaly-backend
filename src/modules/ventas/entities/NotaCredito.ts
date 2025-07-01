import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { Cambio } from "./Cambio";
import { Venta } from "./Venta";
import { NotaCreditoDetalle } from "./NotaCreditoDetalle";

@Index("PK__NotaCred__B2E9DEB753269518", ["idNotaCredito"], { unique: true })
@Index("UQ__NotaCred__C664FD485164566D", ["numeroNc"], { unique: true })
@Entity("NotaCredito")
export class NotaCredito {
  @PrimaryGeneratedColumn({ type: "bigint", name: "IdNotaCredito" })
  idNotaCredito: string;

  @Column("nvarchar", { name: "NumeroNC", unique: true, length: 25 })
  numeroNc: string;

  @Column("datetime2", {
    name: "Fecha",
    nullable: true,
    default: () => "sysdatetime()",
  })
  fecha: Date | null;

  @Column("smallint", { name: "IdEstadoNota", default: () => "(1)" })
  idEstadoNota: number;

  @Column("nvarchar", { name: "Motivo", nullable: true, length: 250 })
  motivo: string | null;

  @Column("decimal", { name: "Total", precision: 18, scale: 4 })
  total: number;

  @Column("int", { name: "AprobadoPor", nullable: true })
  aprobadoPor: number | null;

  @Column("datetime2", { name: "FechaAprobacion", nullable: true })
  fechaAprobacion: Date | null;

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

  @OneToMany(() => Cambio, (cambio) => cambio.idNotaCredito)
  cambios: Cambio[];

  @ManyToOne(() => Venta, (venta) => venta.notaCreditos)
  @JoinColumn([{ name: "IdVenta", referencedColumnName: "idVenta" }])
  idVenta: Venta;

  @OneToMany(
    () => NotaCreditoDetalle,
    (notaCreditoDetalle) => notaCreditoDetalle.idNotaCredito
  )
  notaCreditoDetalles: NotaCreditoDetalle[];

  @RelationId((notaCredito: NotaCredito) => notaCredito.idVenta)
  idVenta2: string;

  constructor(init?: Partial<NotaCredito>) {
    Object.assign(this, init);
  }
}
