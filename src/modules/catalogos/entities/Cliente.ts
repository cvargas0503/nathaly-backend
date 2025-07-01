import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { Sucursal } from "./Sucursal";
import { Persona } from "./Persona";

@Index("PK__Cliente__D59466426C039801", ["idCliente"], { unique: true })
@Index("UQ__Cliente__06370DAC19619832", ["codigo"], { unique: true })
@Index("UQ__Cliente__2EC8D2ADBC7EC750", ["idPersona"], { unique: true })
@Entity("Cliente", {schema: 'CATALOGOS'})
export class Cliente {
  @PrimaryGeneratedColumn({ type: "int", name: "IdCliente" })
  idCliente: number;

    @Column("int", { name: "IdPersona", unique: true })
    idPersona: number;
  @Column("varchar", { name: "Codigo", unique: true, length: 20 })
  codigo: string;

  @Column("bit", { name: "TieneCredito", nullable: true, default: () => "(0)" })
  tieneCredito: boolean | null;

  @Column("decimal", {
    name: "LimiteCredito",
    nullable: true,
    precision: 18,
    scale: 2,
  })
  limiteCredito: number | null;

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

  @Column("bit", { name: "Activo", nullable: true, default: () => "(1)" })
  activo: boolean | null;

  @Column("int", { name: "EliminadoPor", nullable: true })
  eliminadoPor: number | null;

  @Column("datetime2", { name: "FechaEliminacion", nullable: true })
  fechaEliminacion: Date | null;

  @Column("bit", { name: "Eliminado", nullable: true, default: () => "(0)" })
  eliminado: boolean | null;

  @ManyToOne(() => Sucursal, (sucursal) => sucursal.clientes, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "IdSucursal", referencedColumnName: "idSucursal" }])
  idSucursal: Sucursal;

  @RelationId((cliente: Cliente) => cliente.idSucursal)
  idSucursal2: number;

  constructor(init?: Partial<Cliente>) {
    Object.assign(this, init);
  }
}
