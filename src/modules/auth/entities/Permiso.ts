import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn
} from "typeorm"
import { Usuario } from "./Usuario"
import { RolPermiso } from "./RolPermiso"
import { UsuarioPermiso } from "./UsuarioPermiso"

@Entity({ name: "Permiso", schema: "SEGURIDAD" })
export class Permiso {
  @PrimaryGeneratedColumn({ name: "IdPermiso" })
  idPermiso!: number

  @Column("nvarchar", { name: "Nombre", unique: true, length: 80 })
  nombre!: string

  @Column("nvarchar", { name: "Codigo", unique: true, length: 50 })
  codigo!: string

  @Column("nvarchar", { name: "Descripcion", nullable: true, length: 250 })
  descripcion?: string

  @Column("bit", { name: "Activo", default: () => "(1)" })
  activo!: boolean

  @Column("bit", { name: "Eliminado", default: () => "(0)" })
  eliminado!: boolean

  @Column("datetime2", {
    name: "FechaCreacion",
    nullable: true,
    default: () => "SYSDATETIME()"
  })
  fechaCreacion?: Date

  @Column("datetime2", { name: "FechaModificacion", nullable: true })
  fechaModificacion?: Date

  @Column("datetime2", { name: "FechaEliminacion", nullable: true })
  fechaEliminacion?: Date

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: "CreadoPor" })
  creadoPor?: Usuario

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: "ModificadoPor" })
  modificadoPor?: Usuario

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: "EliminadoPor" })
  eliminadoPor?: Usuario

  @OneToMany(() => RolPermiso, (rp) => rp.permiso)
  rolPermisos?: RolPermiso[]

  @OneToMany(() => UsuarioPermiso, (up) => up.permiso)
  usuarioPermisos?: UsuarioPermiso[]
}
