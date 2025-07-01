import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("PK__Persona__2EC8D2AC24912229", ["idPersona"], { unique: true })
@Index("UQ__Persona__F2CD115376532525", ["tipoDoc", "numDoc"], { unique: true })
@Entity("Persona", {schema: "GENERAL"})
export class Persona {
  @PrimaryGeneratedColumn({ type: "int", name: "IdPersona" })
  idPersona: number;

  @Column("nvarchar", { name: "Nombre1", length: 10 })
  nombre1: string;

  @Column("nvarchar", { name: "Nombre2", nullable: true, length: 10 })
  nombre2: string | null;

  @Column("nvarchar", { name: "Apellido1", length: 10 })
  apellido1: string;

  @Column("nvarchar", { name: "Apellido2", nullable: true, length: 10 })
  apellido2: string | null;

  @Column("nvarchar", { name: "Direccion", nullable: true, length: 250 })
  direccion: string | null;

  @Column("varchar", { name: "Telefono", nullable: true, length: 20 })
  telefono: string | null;

  @Column("varchar", { name: "Celular", nullable: true, length: 20 })
  celular: string | null;

  @Column("nvarchar", { name: "Email", nullable: true, length: 50 })
  email: string | null;

  @Column("int", { name: "IdCiudad" })
  idCiudad: number;

  @Column("char", { name: "TipoDoc", unique: true, length: 3 })
  tipoDoc: string;

  @Column("nvarchar", { name: "NumDoc", unique: true, length: 30 })
  numDoc: string;

  @Column("int", { name: "CreadoPor" })
  creadoPor: number;

  @Column("datetime2", {
    name: "FechaCreacion",
    nullable: true,
    default: () => "sysdatetime()",
  })
  fechaCreacion: Date | null;

  @Column("int", { name: "ModificadoPor", nullable: true })
  modificadoPor: number | null;

  @Column("datetime2", { name: "FechaModificacion", nullable: true })
  fechaModificacion: Date | null;

  @Column("bit", { name: "Activo", nullable: true, default: () => "(1)" })
  activo: boolean | null;

  @Column("int", { name: "EliminadoPor", nullable: true })
  eliminadoPor: number | null;

  @Column("datetime2", { name: "FechaEliminacion", nullable: true })
  fechaEliminacion: Date | null;

  @Column("bit", { name: "Eliminado", nullable: true, default: () => "(0)" })
  eliminado: boolean | null;

  constructor(init?: Partial<Persona>) {
    Object.assign(this, init);
  }
}
