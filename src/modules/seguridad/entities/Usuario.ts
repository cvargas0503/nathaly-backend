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
import { Permiso } from "./Permiso";
import { Rol } from "./Rol";
import { RolPermiso } from "./RolPermiso";
import { UsuarioPermiso } from "./UsuarioPermiso";
import { UsuarioRol } from "./UsuarioRol";

@Index("PK__Usuario__5B65BF97FC740DBC", ["idUsuario"], { unique: true })
@Index("UQ__Usuario__5E55825B1864390C", ["login"], { unique: true })
@Index("UQ_Usuario_IdEmpleado", ["idEmpleado"], { unique: true })
@Entity("Usuario", {schema: "SEGURIDAD"})
export class Usuario {
  @PrimaryGeneratedColumn({ type: "int", name: "IdUsuario" })
  idUsuario: number;

  @Column("int", { name: "IdEmpleado", nullable: true, unique: true })
  idEmpleado: number | null;

  @Column("varchar", { name: "Login", unique: true, length: 50 })
  login: string;

  @Column("nvarchar", { name: "PassHash", length: 100 })
  passHash: string;

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

  @Column("datetime2", { name: "FechaModificacion", nullable: true })
  fechaModificacion: Date | null;

  @Column("datetime2", { name: "FechaEliminacion", nullable: true })
  fechaEliminacion: Date | null;

  @OneToMany(() => Permiso, (permiso) => permiso.creadoPor)
  permisos: Permiso[];

  @OneToMany(() => Permiso, (permiso) => permiso.modificadoPor)
  permisos2: Permiso[];

  @OneToMany(() => Permiso, (permiso) => permiso.eliminadoPor)
  permisos3: Permiso[];

  @OneToMany(() => Rol, (rol) => rol.creadoPor)
  rols: Rol[];

  @OneToMany(() => Rol, (rol) => rol.modificadoPor)
  rols2: Rol[];

  @OneToMany(() => Rol, (rol) => rol.eliminadoPor)
  rols3: Rol[];

  @OneToMany(() => RolPermiso, (rolPermiso) => rolPermiso.creadoPor)
  rolPermisos: RolPermiso[];

  @OneToMany(() => RolPermiso, (rolPermiso) => rolPermiso.modificadoPor)
  rolPermisos2: RolPermiso[];

  @OneToMany(() => RolPermiso, (rolPermiso) => rolPermiso.eliminadoPor)
  rolPermisos3: RolPermiso[];

  @ManyToOne(() => Usuario, (usuario) => usuario.usuarios)
  @JoinColumn([{ name: "CreadoPor", referencedColumnName: "idUsuario" }])
  creadoPor: Usuario;

  @OneToMany(() => Usuario, (usuario) => usuario.creadoPor)
  usuarios: Usuario[];

  @ManyToOne(() => Usuario, (usuario) => usuario.usuarios2)
  @JoinColumn([{ name: "ModificadoPor", referencedColumnName: "idUsuario" }])
  modificadoPor: Usuario;

  @OneToMany(() => Usuario, (usuario) => usuario.modificadoPor)
  usuarios2: Usuario[];

  @ManyToOne(() => Usuario, (usuario) => usuario.usuarios3)
  @JoinColumn([{ name: "EliminadoPor", referencedColumnName: "idUsuario" }])
  eliminadoPor: Usuario;

  @OneToMany(() => Usuario, (usuario) => usuario.eliminadoPor)
  usuarios3: Usuario[];

  @OneToMany(
    () => UsuarioPermiso,
    (usuarioPermiso) => usuarioPermiso.idUsuario2
  )
  usuarioPermisos: UsuarioPermiso[];

  @OneToMany(() => UsuarioPermiso, (usuarioPermiso) => usuarioPermiso.creadoPor)
  usuarioPermisos2: UsuarioPermiso[];

  @OneToMany(
    () => UsuarioPermiso,
    (usuarioPermiso) => usuarioPermiso.modificadoPor
  )
  usuarioPermisos3: UsuarioPermiso[];

  @OneToMany(
    () => UsuarioPermiso,
    (usuarioPermiso) => usuarioPermiso.eliminadoPor
  )
  usuarioPermisos4: UsuarioPermiso[];

  @OneToMany(() => UsuarioRol, (usuarioRol) => usuarioRol.idUsuario2)
  usuarioRols: UsuarioRol[];

  @OneToMany(() => UsuarioRol, (usuarioRol) => usuarioRol.creadoPor)
  usuarioRols2: UsuarioRol[];

  @OneToMany(() => UsuarioRol, (usuarioRol) => usuarioRol.modificadoPor)
  usuarioRols3: UsuarioRol[];

  @OneToMany(() => UsuarioRol, (usuarioRol) => usuarioRol.eliminadoPor)
  usuarioRols4: UsuarioRol[];

  @RelationId((usuario: Usuario) => usuario.creadoPor)
  creadoPor2: number | null;

  @RelationId((usuario: Usuario) => usuario.modificadoPor)
  modificadoPor2: number | null;

  @RelationId((usuario: Usuario) => usuario.eliminadoPor)
  eliminadoPor2: number | null;

  constructor(init?: Partial<Usuario>) {
    Object.assign(this, init);
  }
}
