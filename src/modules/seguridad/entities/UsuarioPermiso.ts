import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
} from "typeorm";
import { Usuario } from "./Usuario";
import { Permiso } from "./Permiso";

@Index("PK__UsuarioP__CBB3997B0E21370C", ["idUsuario", "idPermiso"], {
  unique: true,
})
@Entity("UsuarioPermiso", { schema: "SEGURIDAD" })
export class UsuarioPermiso {
  @Column("int", { primary: true, name: "IdUsuario" })
  idUsuario: number;

  @Column("int", { primary: true, name: "IdPermiso" })
  idPermiso: number;

  @Column("bit", { name: "Permitido" })
  permitido: boolean;

  @Column("bit", { name: "Activo", default: () => "(1)" })
  activo: boolean;

  @Column("bit", { name: "Eliminado", default: () => "(0)" })
  eliminado: boolean;

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

  @ManyToOne(() => Usuario, (usuario) => usuario.usuarioPermisos, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "IdUsuario", referencedColumnName: "idUsuario" }])
  idUsuario2: Usuario;

  @ManyToOne(() => Permiso, (permiso) => permiso.usuarioPermisos, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "IdPermiso", referencedColumnName: "idPermiso" }])
  idPermiso2: Permiso;

  @ManyToOne(() => Usuario, (usuario) => usuario.usuarioPermisos2)
  @JoinColumn([{ name: "CreadoPor", referencedColumnName: "idUsuario" }])
  creadoPor: Usuario;

  @ManyToOne(() => Usuario, (usuario) => usuario.usuarioPermisos3)
  @JoinColumn([{ name: "ModificadoPor", referencedColumnName: "idUsuario" }])
  modificadoPor: Usuario;

  @ManyToOne(() => Usuario, (usuario) => usuario.usuarioPermisos4)
  @JoinColumn([{ name: "EliminadoPor", referencedColumnName: "idUsuario" }])
  eliminadoPor: Usuario;

  @RelationId((usuarioPermiso: UsuarioPermiso) => usuarioPermiso.idUsuario2)
  idUsuario3: number;

  @RelationId((usuarioPermiso: UsuarioPermiso) => usuarioPermiso.idPermiso2)
  idPermiso3: number;

  @RelationId((usuarioPermiso: UsuarioPermiso) => usuarioPermiso.creadoPor)
  creadoPor2: number | null;

  @RelationId((usuarioPermiso: UsuarioPermiso) => usuarioPermiso.modificadoPor)
  modificadoPor2: number | null;

  @RelationId((usuarioPermiso: UsuarioPermiso) => usuarioPermiso.eliminadoPor)
  eliminadoPor2: number | null;

  constructor(init?: Partial<UsuarioPermiso>) {
    Object.assign(this, init);
  }
}
