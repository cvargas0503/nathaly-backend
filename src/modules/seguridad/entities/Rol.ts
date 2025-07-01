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
import { UsuarioRol } from "./UsuarioRol";

@Index("PK__Rol__2A49584CF0E852AA", ["idRol"], { unique: true })
@Index("UQ__Rol__75E3EFCFA0784E61", ["nombre"], { unique: true })
@Entity("Rol", { schema: "SEGURIDAD" })
export class Rol {
  @PrimaryGeneratedColumn({ type: "int", name: "IdRol" })
  idRol: number;

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

  @ManyToOne(() => Usuario, (usuario) => usuario.rols)
  @JoinColumn([{ name: "CreadoPor", referencedColumnName: "idUsuario" }])
  creadoPor: Usuario;

  @ManyToOne(() => Usuario, (usuario) => usuario.rols2)
  @JoinColumn([{ name: "ModificadoPor", referencedColumnName: "idUsuario" }])
  modificadoPor: Usuario;

  @ManyToOne(() => Usuario, (usuario) => usuario.rols3)
  @JoinColumn([{ name: "EliminadoPor", referencedColumnName: "idUsuario" }])
  eliminadoPor: Usuario;

  @OneToMany(() => RolPermiso, (rolPermiso) => rolPermiso.idRol2)
  rolPermisos: RolPermiso[];

  @OneToMany(() => UsuarioRol, (usuarioRol) => usuarioRol.idRol2)
  usuarioRols: UsuarioRol[];

  @RelationId((rol: Rol) => rol.creadoPor)
  creadoPor2: number | null;

  @RelationId((rol: Rol) => rol.modificadoPor)
  modificadoPor2: number | null;

  @RelationId((rol: Rol) => rol.eliminadoPor)
  eliminadoPor2: number | null;

  constructor(init?: Partial<Rol>) {
    Object.assign(this, init);
  }
}
