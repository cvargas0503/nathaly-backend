import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { NotaCredito } from "./NotaCredito";
import { VentaDetalle } from "./VentaDetalle";

@Index("PK__NotaCred__1A67FFFE4EC76035", ["idNotaDetalle"], { unique: true })
@Entity("NotaCreditoDetalle")
export class NotaCreditoDetalle {
  @PrimaryGeneratedColumn({ type: "bigint", name: "IdNotaDetalle" })
  idNotaDetalle: string;

  @Column("decimal", { name: "Cantidad", precision: 18, scale: 2 })
  cantidad: number;

  @Column("decimal", { name: "Monto", precision: 18, scale: 4 })
  monto: number;

  @Column("smallint", { name: "IdMotivoDevol" })
  idMotivoDevol: number;

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

  @ManyToOne(
    () => NotaCredito,
    (notaCredito) => notaCredito.notaCreditoDetalles,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([
    { name: "IdNotaCredito", referencedColumnName: "idNotaCredito" },
  ])
  idNotaCredito: NotaCredito;

  @ManyToOne(
    () => VentaDetalle,
    (ventaDetalle) => ventaDetalle.notaCreditoDetalles
  )
  @JoinColumn([
    { name: "IdVentaDetalle", referencedColumnName: "idVentaDetalle" },
  ])
  idVentaDetalle: VentaDetalle;

  @RelationId(
    (notaCreditoDetalle: NotaCreditoDetalle) => notaCreditoDetalle.idNotaCredito
  )
  idNotaCredito2: string;

  @RelationId(
    (notaCreditoDetalle: NotaCreditoDetalle) =>
      notaCreditoDetalle.idVentaDetalle
  )
  idVentaDetalle2: string;

  constructor(init?: Partial<NotaCreditoDetalle>) {
    Object.assign(this, init);
  }
}
