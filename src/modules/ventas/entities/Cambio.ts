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
import { Venta } from "./Venta";

@Index("PK__Cambio__B4BBA86E92BF411B", ["idCambio"], { unique: true })
@Entity("Cambio")
export class Cambio {
  @PrimaryGeneratedColumn({ type: "bigint", name: "IdCambio" })
  idCambio: string;

  @Column("int", { name: "IdCliente" })
  idCliente: number;

  @Column("int", { name: "IdEmpleado" })
  idEmpleado: number;

  @Column("decimal", { name: "Diferencia", precision: 18, scale: 4 })
  diferencia: number;

  @Column("datetime2", {
    name: "Fecha",
    nullable: true,
    default: () => "sysdatetime()",
  })
  fecha: Date | null;

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

  @ManyToOne(() => NotaCredito, (notaCredito) => notaCredito.cambios)
  @JoinColumn([
    { name: "IdNotaCredito", referencedColumnName: "idNotaCredito" },
  ])
  idNotaCredito: NotaCredito;

  @ManyToOne(() => Venta, (venta) => venta.cambios)
  @JoinColumn([{ name: "IdVentaNueva", referencedColumnName: "idVenta" }])
  idVentaNueva: Venta;

  @RelationId((cambio: Cambio) => cambio.idNotaCredito)
  idNotaCredito2: string;

  @RelationId((cambio: Cambio) => cambio.idVentaNueva)
  idVentaNueva2: string;

  constructor(init?: Partial<Cambio>) {
    Object.assign(this, init);
  }
}
