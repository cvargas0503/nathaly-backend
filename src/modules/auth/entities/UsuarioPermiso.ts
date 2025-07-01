import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn
} from "typeorm"
import { Permiso } from "./Permiso"
import { Usuario } from "./Usuario"

@Entity({ name: "UsuarioPermiso", schema: "SEGURIDAD" })
export class UsuarioPermiso {
  @PrimaryColumn({ type: "int", name: "IdUsuario" })
  idUsuario!: number

  @PrimaryColumn({ type: "int", name: "IdPermiso" })
  idPermiso!: number

  @Column("bit", { name: "Permitido" })
  permitido!: boolean

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

  @ManyToOne(() => Permiso, (permiso) => permiso.usuarioPermisos, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "IdPermiso" })
  permiso!: Permiso

  @ManyToOne(() => Usuario, (usuario) => usuario.permisosAsignados, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "IdUsuario" })
  usuario!: Usuario

  @ManyToOne(() => Usuario, (usuario) => usuario.permisosCreadosEnUsuarioPermiso, {
    nullable: true
  })
  @JoinColumn({ name: "CreadoPor" })
  creadoPor?: Usuario

  @ManyToOne(() => Usuario, (usuario) => usuario.permisosModificadosEnUsuarioPermiso, {
    nullable: true
  })
  @JoinColumn({ name: "ModificadoPor" })
  modificadoPor?: Usuario

  @ManyToOne(() => Usuario, (usuario) => usuario.permisosEliminadosEnUsuarioPermiso, {
    nullable: true
  })
  @JoinColumn({ name: "EliminadoPor" })
  eliminadoPor?: Usuario
}