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
import { Cliente } from "./Cliente";
import { Ciudad } from "./Ciudad";
import { SucursalTelefono } from "./SucursalTelefono";
import { Bodega } from "../../inventario/entities/Bodega";

@Index("PK__Sucursal__BFB6CD99FEBFC544", ["idSucursal"], { unique: true })
@Index("UQ_Sucursal_Codigo", ["codigoSucursal"], { unique: true })
@Index("UQ_Sucursal_Nombre", ["idSucursal", "nombre"], { unique: true })
@Entity("Sucursal", {schema: 'CATALOGOS'})
export class Sucursal {
  @PrimaryGeneratedColumn({ type: "int", name: "IdSucursal" })
  idSucursal: number;

  @Column("nvarchar", { name: "CodigoSucursal", unique: true, length: 15 })
  codigoSucursal: string;

  @Column("nvarchar", { name: "Nombre", unique: true, length: 100 })
  nombre: string;

  @Column("nvarchar", { name: "Direccion", nullable: true, length: 250 })
  direccion: string | null;

  @Column("nvarchar", { name: "Logo", nullable: true, length: 250 })
  logo: string | null;

  @Column("bit", { name: "Activo", nullable: true, default: () => "(1)" })
  activo: boolean | null;

  @Column("bit", { name: "Eliminado", nullable: true, default: () => "(0)" })
  eliminado: boolean | null;

  @Column("datetime2", {
    name: "FechaCreacion",
    nullable: true,
    default: () => "sysdatetime()",
  })
  fechaCreacion: Date | null;

  @Column("int", { name: "CreadoPor", nullable: true })
  creadoPor: number | null;

  @Column("int", { name: "ModificadoPor", nullable: true })
  modificadoPor: number | null;

  @Column("datetime2", { name: "FechaModificacion", nullable: true })
  fechaModificacion: Date | null;

  @Column("int", { name: "EliminadoPor", nullable: true })
  eliminadoPor: number | null;

  @Column("datetime2", { name: "FechaEliminacion", nullable: true })
  fechaEliminacion: Date | null;

  @OneToMany(() => Cliente, (cliente) => cliente.idSucursal)
  clientes: Cliente[];

  @ManyToOne(() => Ciudad, (ciudad) => ciudad.sucursals)
  @JoinColumn([{ name: "IdCiudad", referencedColumnName: "idCiudad" }])
  idCiudad: Ciudad;

  @OneToMany(() => Bodega, (bodega) => bodega.sucursal)
  bodegas: Bodega[];

  @OneToMany(
    () => SucursalTelefono,
    (sucursalTelefono) => sucursalTelefono.idSucursal
  )
  sucursalTelefonos: SucursalTelefono[];

  @RelationId((sucursal: Sucursal) => sucursal.idCiudad)
  idCiudad2: number | null;

  constructor(init?: Partial<Sucursal>) {
    Object.assign(this, init);
  }
}
