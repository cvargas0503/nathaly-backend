import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn
} from "typeorm"
import { Rol } from "./Rol"
import { Usuario } from "./Usuario"

@Entity({ name: "UsuarioRol", schema: "SEGURIDAD" })
export class UsuarioRol {
  @PrimaryColumn({ type: "int", name: "IdUsuario" })
  idUsuario!: number

  @PrimaryColumn({ type: "int", name: "IdRol" })
  idRol!: number

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

  @ManyToOne(() => Rol, (rol) => rol.usuarioRols, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "IdRol" })
  rol!: Rol

  @ManyToOne(() => Usuario, (usuario) => usuario.rolesAsignados, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "IdUsuario" })
  usuario!: Usuario

  @ManyToOne(() => Usuario, (usuario) => usuario.rolesCreadosEnUsuarioRol, {
    nullable: true
  })
  @JoinColumn({ name: "CreadoPor" })
  creadoPor?: Usuario

  @ManyToOne(() => Usuario, (usuario) => usuario.rolesModificadosEnUsuarioRol, {
    nullable: true
  })
  @JoinColumn({ name: "ModificadoPor" })
  modificadoPor?: Usuario

  @ManyToOne(() => Usuario, (usuario) => usuario.rolesEliminadosEnUsuarioRol, {
    nullable: true
  })
  @JoinColumn({ name: "EliminadoPor" })
  eliminadoPor?: Usuario
}