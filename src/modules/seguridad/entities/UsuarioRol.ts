import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
} from "typeorm";
import { Usuario } from "./Usuario";
import { Rol } from "./Rol";

@Index("PK__UsuarioR__89C12A1388F7D5E9", ["idUsuario", "idRol"], {
  unique: true,
})
@Entity("UsuarioRol", { schema: "SEGURIDAD" })
export class UsuarioRol {
  @Column("int", { primary: true, name: "IdUsuario" })
  idUsuario: number;

  @Column("int", { primary: true, name: "IdRol" })
  idRol: number;

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

  @ManyToOne(() => Usuario, (usuario) => usuario.usuarioRols, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "IdUsuario", referencedColumnName: "idUsuario" }])
  idUsuario2: Usuario;

  @ManyToOne(() => Rol, (rol) => rol.usuarioRols, { onDelete: "CASCADE" })
  @JoinColumn([{ name: "IdRol", referencedColumnName: "idRol" }])
  idRol2: Rol;

  @ManyToOne(() => Usuario, (usuario) => usuario.usuarioRols2)
  @JoinColumn([{ name: "CreadoPor", referencedColumnName: "idUsuario" }])
  creadoPor: Usuario;

  @ManyToOne(() => Usuario, (usuario) => usuario.usuarioRols3)
  @JoinColumn([{ name: "ModificadoPor", referencedColumnName: "idUsuario" }])
  modificadoPor: Usuario;

  @ManyToOne(() => Usuario, (usuario) => usuario.usuarioRols4)
  @JoinColumn([{ name: "EliminadoPor", referencedColumnName: "idUsuario" }])
  eliminadoPor: Usuario;

  @RelationId((usuarioRol: UsuarioRol) => usuarioRol.idUsuario2)
  idUsuario3: number;

  @RelationId((usuarioRol: UsuarioRol) => usuarioRol.idRol2)
  idRol3: number;

  @RelationId((usuarioRol: UsuarioRol) => usuarioRol.creadoPor)
  creadoPor2: number | null;

  @RelationId((usuarioRol: UsuarioRol) => usuarioRol.modificadoPor)
  modificadoPor2: number | null;

  @RelationId((usuarioRol: UsuarioRol) => usuarioRol.eliminadoPor)
  eliminadoPor2: number | null;

  constructor(init?: Partial<UsuarioRol>) {
    Object.assign(this, init);
  }
}
