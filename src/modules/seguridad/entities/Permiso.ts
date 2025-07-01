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
import { Usuario } from "./Usuario";
import { RolPermiso } from "./RolPermiso";
import { UsuarioPermiso } from "./UsuarioPermiso";

@Index("PK__Permiso__0D626EC8BAEDD7A9", ["idPermiso"], { unique: true })
@Index("UQ__Permiso__75E3EFCF220970DD", ["nombre"], { unique: true })
@Entity("Permiso", { schema: "SEGURIDAD" })
export class Permiso {
  @PrimaryGeneratedColumn({ type: "int", name: "IdPermiso" })
  idPermiso: number;

  @Column("nvarchar", { name: "Nombre", unique: true, length: 80 })
  nombre: string;

  @Column("nvarchar", { name: "Descripcion", nullable: true, length: 250 })
  descripcion: string | null;

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

  @ManyToOne(() => Usuario, (usuario) => usuario.permisos)
  @JoinColumn([{ name: "CreadoPor", referencedColumnName: "idUsuario" }])
  creadoPor: Usuario;

  @ManyToOne(() => Usuario, (usuario) => usuario.permisos2)
  @JoinColumn([{ name: "ModificadoPor", referencedColumnName: "idUsuario" }])
  modificadoPor: Usuario;

  @ManyToOne(() => Usuario, (usuario) => usuario.permisos3)
  @JoinColumn([{ name: "EliminadoPor", referencedColumnName: "idUsuario" }])
  eliminadoPor: Usuario;

  @OneToMany(() => RolPermiso, (rolPermiso) => rolPermiso.idPermiso2)
  rolPermisos: RolPermiso[];

  @OneToMany(
    () => UsuarioPermiso,
    (usuarioPermiso) => usuarioPermiso.idPermiso2
  )
  usuarioPermisos: UsuarioPermiso[];

  @RelationId((permiso: Permiso) => permiso.creadoPor)
  creadoPor2: number | null;

  @RelationId((permiso: Permiso) => permiso.modificadoPor)
  modificadoPor2: number | null;

  @RelationId((permiso: Permiso) => permiso.eliminadoPor)
  eliminadoPor2: number | null;

  constructor(init?: Partial<Permiso>) {
    Object.assign(this, init);
  }
}
