import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Ajuste } from "./Ajuste";
import { Existencia } from "./Existencia";
import { Kardex } from "./Kardex";
import { Traslado } from "./Traslado";
import { Sucursal } from "../../catalogos/entities/Sucursal";

@Index("PK__Bodega__42B66742B0B0F3D5", ["idBodega"], { unique: true })
@Index("UQ__Bodega__9B96DC5FA49AF6F2", ["codigoBodega"], { unique: true })
@Index("UQ_Bodega_Nombre", ["idBodega", "nombre"], { unique: true })
@Entity("Bodega", { schema: "INVENTARIO" })
export class Bodega {
  @PrimaryGeneratedColumn({ type: "int", name: "IdBodega" })
  idBodega: number;

  @Column("int", { name: "IdSucursal" })
  idSucursal: number;

  @Column("nvarchar", { name: "CodigoBodega", unique: true, length: 15 })
  codigoBodega: string;

  @Column("nvarchar", { name: "Nombre", unique: true, length: 100 })
  nombre: string;

  @Column("nvarchar", { name: "Descripcion", nullable: true, length: 250 })
  descripcion: string | null;

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

  @OneToMany(() => Ajuste, (ajuste) => ajuste.idBodega)
  ajustes: Ajuste[];

  @OneToMany(() => Existencia, (existencia) => existencia.idBodega2)
  existencias: Existencia[];

  @OneToMany(() => Kardex, (kardex) => kardex.idBodega)
  kardexes: Kardex[];

  @OneToMany(() => Traslado, (traslado) => traslado.idBodegaOrigen)
  traslados: Traslado[];

  @OneToMany(() => Traslado, (traslado) => traslado.idBodegaDestino)
  traslados2: Traslado[];

  @ManyToOne(() => Sucursal, (sucursal) => sucursal.bodegas)
  @JoinColumn({ name: "IdSucursal" }) // <-- Esto es lo importante
  sucursal: Sucursal;
  constructor(init?: Partial<Bodega>) {
    Object.assign(this, init);
  }
}
