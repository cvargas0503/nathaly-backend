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
import { Bodega } from "./Bodega";
import { TrasladoDetalle } from "./TrasladoDetalle";

@Index("PK__Traslado__9FEFD23C6DDF1FA0", ["idTraslado"], { unique: true })
@Entity("Traslado")
export class Traslado {
  @PrimaryGeneratedColumn({ type: "bigint", name: "IdTraslado" })
  idTraslado: string;

  @Column("datetime2", {
    name: "Fecha",
    nullable: true,
    default: () => "sysdatetime()",
  })
  fecha: Date | null;

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

  @ManyToOne(() => Bodega, (bodega) => bodega.traslados)
  @JoinColumn([{ name: "IdBodegaOrigen", referencedColumnName: "idBodega" }])
  idBodegaOrigen: Bodega;

  @ManyToOne(() => Bodega, (bodega) => bodega.traslados2)
  @JoinColumn([{ name: "IdBodegaDestino", referencedColumnName: "idBodega" }])
  idBodegaDestino: Bodega;

  @OneToMany(
    () => TrasladoDetalle,
    (trasladoDetalle) => trasladoDetalle.idTraslado
  )
  trasladoDetalles: TrasladoDetalle[];

  @RelationId((traslado: Traslado) => traslado.idBodegaOrigen)
  idBodegaOrigen2: number;

  @RelationId((traslado: Traslado) => traslado.idBodegaDestino)
  idBodegaDestino2: number;

  constructor(init?: Partial<Traslado>) {
    Object.assign(this, init);
  }
}
