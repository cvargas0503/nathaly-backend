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
import { Pais } from "./Pais";
import { Sucursal } from "./Sucursal";

@Index("PK__Ciudad__D4D3CCB0E97E4190", ["idCiudad"], { unique: true })
@Index("UQ__Ciudad__0BDB3486324BF509", ["idPais", "nombre"], { unique: true })
@Entity("Ciudad", {schema: "CATALOGOS"})
export class Ciudad {
  @PrimaryGeneratedColumn({ type: "int", name: "IdCiudad" })
  idCiudad: number;

  @Column("int", { name: "IdPais", unique: true })
  idPais: number;

  @Column("nvarchar", { name: "Nombre", unique: true, length: 100 })
  nombre: string;

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

  @ManyToOne(() => Pais, (pais) => pais.ciudads, { onDelete: "CASCADE" })
  @JoinColumn([{ name: "IdPais", referencedColumnName: "idPais" }])
  idPais2: Pais;

  @OneToMany(() => Sucursal, (sucursal) => sucursal.idCiudad)
  sucursals: Sucursal[];

  @RelationId((ciudad: Ciudad) => ciudad.idPais2)
  idPais3: number;

  constructor(init?: Partial<Ciudad>) {
    Object.assign(this, init);
  }
}
