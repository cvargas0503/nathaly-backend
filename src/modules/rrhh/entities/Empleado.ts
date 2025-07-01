import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("PK__Empleado__CE6D8B9E29969E62", ["idEmpleado"], { unique: true })
@Index("UQ__Empleado__06370DACC2EBBB0D", ["codigo"], { unique: true })
@Index("UQ__Empleado__2EC8D2AD2CF645CD", ["idPersona"], { unique: true })
@Entity("Empleado", {schema: "RRHH"})
export class Empleado {
  @PrimaryGeneratedColumn({ type: "int", name: "IdEmpleado" })
  idEmpleado: number;

  @Column("int", { name: "IdPersona", unique: true })
  idPersona: number;

  @Column("int", { name: "IdSucursal" })
  idSucursal: number;

  @Column("varchar", { name: "Codigo", unique: true, length: 20 })
  codigo: string;

  @Column("nvarchar", { name: "Puesto", nullable: true, length: 80 })
  puesto: string | null;

  @Column("date", { name: "FechaIngreso", nullable: true })
  fechaIngreso: Date | null;

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

  @Column("int", { name: "EliminadoPor", nullable: true })
  eliminadoPor: number | null;

  @Column("datetime2", { name: "FechaEliminacion", nullable: true })
  fechaEliminacion: Date | null;

  @Column("bit", { name: "Activo", nullable: true, default: () => "(1)" })
  activo: boolean | null;

  @Column("bit", { name: "Eliminado", nullable: true, default: () => "(0)" })
  eliminado: boolean | null;

  constructor(init?: Partial<Empleado>) {
    Object.assign(this, init);
  }
}
