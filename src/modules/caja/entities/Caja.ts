import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { AperturaCierreCaja } from "./AperturaCierreCaja";
import { MovimientoCaja } from "./MovimientoCaja";

@Index("PK__Caja__3B7BF2C51DB72882", ["idCaja"], { unique: true })
@Index("UQ__Caja__75E3EFCFDC5BE199", ["nombre"], { unique: true })
@Entity("Caja", { schema: "CAJA" })
export class Caja {
  @PrimaryGeneratedColumn({ type: "int", name: "IdCaja" })
  idCaja: number;

  @Column("int", { name: "IdSucursal" })
  idSucursal: number;

  @Column("nvarchar", { name: "Nombre", unique: true, length: 50 })
  nombre: string;

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

  @OneToMany(
    () => AperturaCierreCaja,
    (aperturaCierreCaja) => aperturaCierreCaja.idCaja
  )
  aperturaCierreCajas: AperturaCierreCaja[];

  @OneToMany(() => MovimientoCaja, (movimientoCaja) => movimientoCaja.idCaja)
  movimientoCajas: MovimientoCaja[];

  constructor(init?: Partial<Caja>) {
    Object.assign(this, init);
  }
}
