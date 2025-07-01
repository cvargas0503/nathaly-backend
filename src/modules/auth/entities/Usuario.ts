import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn
} from "typeorm"
import { Permiso } from "./Permiso"
import { Rol } from "./Rol"
import { RolPermiso } from "./RolPermiso"
import { UsuarioPermiso } from "./UsuarioPermiso"
import { UsuarioRol } from "./UsuarioRol"

@Entity({ name: "Usuario", schema: "SEGURIDAD" })
export class Usuario {
  @PrimaryGeneratedColumn({ name: "IdUsuario" })
  idUsuario!: number

  @Column("int", { name: "IdEmpleado", nullable: true, unique: true })
  idEmpleado!: number | null

  @Column("varchar", { name: "Login", unique: true, length: 50 })
  login!: string

  @Column("nvarchar", { name: "PassHash", length: 100 })
  passHash!: string

  @Column("bit", { name: "Activo", nullable: true, default: () => "(1)" })
  activo!: boolean | null

  @Column("bit", { name: "Eliminado", nullable: true, default: () => "(0)" })
  eliminado!: boolean | null

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

  // Relaciones a Permiso
  @OneToMany(() => Permiso, (permiso) => permiso.creadoPor)
  permisosCreados?: Permiso[]

  @OneToMany(() => Permiso, (permiso) => permiso.modificadoPor)
  permisosModificados?: Permiso[]

  @OneToMany(() => Permiso, (permiso) => permiso.eliminadoPor)
  permisosEliminados?: Permiso[]

  // Relaciones a Rol
  @OneToMany(() => Rol, (rol) => rol.creadoPor)
  rolesCreados?: Rol[]

  @OneToMany(() => Rol, (rol) => rol.modificadoPor)
  rolesModificados?: Rol[]

  @OneToMany(() => Rol, (rol) => rol.eliminadoPor)
  rolesEliminados?: Rol[]

  // Relaciones a RolPermiso
  @OneToMany(() => RolPermiso, (rp) => rp.creadoPor)
  rolPermisosCreados?: RolPermiso[]

  @OneToMany(() => RolPermiso, (rp) => rp.modificadoPor)
  rolPermisosModificados?: RolPermiso[]

  @OneToMany(() => RolPermiso, (rp) => rp.eliminadoPor)
  rolPermisosEliminados?: RolPermiso[]

  // Relaciones autorreferenciales (creado, modificado, eliminado por otro usuario)
  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: "CreadoPor" })
  creadoPor?: Usuario

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: "ModificadoPor" })
  modificadoPor?: Usuario

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: "EliminadoPor" })
  eliminadoPor?: Usuario

  // Inversas: otros usuarios creados por este usuario
  @OneToMany(() => Usuario, (u) => u.creadoPor)
  usuariosCreados?: Usuario[]

  @OneToMany(() => Usuario, (u) => u.modificadoPor)
  usuariosModificados?: Usuario[]

  @OneToMany(() => Usuario, (u) => u.eliminadoPor)
  usuariosEliminados?: Usuario[]

  // UsuarioPermiso
  @OneToMany(() => UsuarioPermiso, (up) => up.usuario)
  permisosAsignados?: UsuarioPermiso[]

  @OneToMany(() => UsuarioPermiso, (up) => up.creadoPor)
  permisosCreadosEnUsuarioPermiso?: UsuarioPermiso[]

  @OneToMany(() => UsuarioPermiso, (up) => up.modificadoPor)
  permisosModificadosEnUsuarioPermiso?: UsuarioPermiso[]

  @OneToMany(() => UsuarioPermiso, (up) => up.eliminadoPor)
  permisosEliminadosEnUsuarioPermiso?: UsuarioPermiso[]

  // UsuarioRol
  @OneToMany(() => UsuarioRol, (ur) => ur.usuario)
  rolesAsignados?: UsuarioRol[]

  @OneToMany(() => UsuarioRol, (ur) => ur.creadoPor)
  rolesCreadosEnUsuarioRol?: UsuarioRol[]

  @OneToMany(() => UsuarioRol, (ur) => ur.modificadoPor)
  rolesModificadosEnUsuarioRol?: UsuarioRol[]

  @OneToMany(() => UsuarioRol, (ur) => ur.eliminadoPor)
  rolesEliminadosEnUsuarioRol?: UsuarioRol[]
}