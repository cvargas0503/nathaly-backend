import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn
} from "typeorm"
import { Usuario } from "./Usuario"
import { Rol } from "./Rol"
import { Permiso } from "./Permiso"

@Entity({ name: "RolPermiso", schema: "SEGURIDAD" })
export class RolPermiso {
  @PrimaryColumn({ type: "int", name: "IdRol" })
  idRol!: number

  @PrimaryColumn({ type: "int", name: "IdPermiso" })
  idPermiso!: number

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

  @ManyToOne(() => Rol, (rol) => rol.rolPermisos, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "IdRol" })
  rol!: Rol

  @ManyToOne(() => Permiso, (permiso) => permiso.rolPermisos, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "IdPermiso" })
  permiso!: Permiso
}