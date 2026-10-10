import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("TasaCambio", { schema: "ADMIN" })
export class TasaCambio {
  @PrimaryGeneratedColumn({ type: "int", name: "IdTasa" })
  idTasa: number;

  @Column("decimal", { name: "Valor", precision: 18, scale: 4 })
  valor: number;

  @Column("datetime2", {
    name: "FechaVigencia",
    nullable: true,
    default: () => "sysdatetime()",
  })
  fechaVigencia: Date | null;

  @Column("bit", { name: "Activa", nullable: true, default: () => "(1)" })
  activa: boolean | null;

  @Column("int", { name: "CreadoPor" })
  creadoPor: number;

  @Column("datetime2", {
    name: "FechaCreacion",
    nullable: true,
    default: () => "sysdatetime()",
  })
  fechaCreacion: Date | null;

  constructor(init?: Partial<TasaCambio>) {
    Object.assign(this, init);
  }
}
