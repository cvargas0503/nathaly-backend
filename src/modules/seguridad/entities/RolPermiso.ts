import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
} from "typeorm";
import { Rol } from "./Rol";
import { Permiso } from "./Permiso";
import { Usuario } from "./Usuario";

@Index("PK__RolPermi__BA9F7EA0A9AB71F5", ["idRol", "idPermiso"], {
  unique: true,
})
@Entity("RolPermiso")
export class RolPermiso {
  @Column("int", { primary: true, name: "IdRol" })
  idRol: number;

  @Column("int", { primary: true, name: "IdPermiso" })
  idPermiso: number;

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

  @ManyToOne(() => Rol, (rol) => rol.rolPermisos, { onDelete: "CASCADE" })
  @JoinColumn([{ name: "IdRol", referencedColumnName: "idRol" }])
  idRol2: Rol;

  @ManyToOne(() => Permiso, (permiso) => permiso.rolPermisos, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "IdPermiso", referencedColumnName: "idPermiso" }])
  idPermiso2: Permiso;

  @ManyToOne(() => Usuario, (usuario) => usuario.rolPermisos)
  @JoinColumn([{ name: "CreadoPor", referencedColumnName: "idUsuario" }])
  creadoPor: Usuario;

  @ManyToOne(() => Usuario, (usuario) => usuario.rolPermisos2)
  @JoinColumn([{ name: "ModificadoPor", referencedColumnName: "idUsuario" }])
  modificadoPor: Usuario;

  @ManyToOne(() => Usuario, (usuario) => usuario.rolPermisos3)
  @JoinColumn([{ name: "EliminadoPor", referencedColumnName: "idUsuario" }])
  eliminadoPor: Usuario;

  @RelationId((rolPermiso: RolPermiso) => rolPermiso.idRol2)
  idRol3: number;

  @RelationId((rolPermiso: RolPermiso) => rolPermiso.idPermiso2)
  idPermiso3: number;

  @RelationId((rolPermiso: RolPermiso) => rolPermiso.creadoPor)
  creadoPor2: number | null;

  @RelationId((rolPermiso: RolPermiso) => rolPermiso.modificadoPor)
  modificadoPor2: number | null;

  @RelationId((rolPermiso: RolPermiso) => rolPermiso.eliminadoPor)
  eliminadoPor2: number | null;

  constructor(init?: Partial<RolPermiso>) {
    Object.assign(this, init);
  }
}
