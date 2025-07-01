import { Column, Entity, Index } from "typeorm";
@Index("PK__Consecut__EB0C54CDEA7F6A20", ["entidad"], { unique: true })
@Entity("Consecutivos", { schema: "ADMIN" })
export class Consecutivos {
  @Column("nvarchar", { primary: true, name: "Entidad", length: 50 })
  entidad: string;

  @Column("bigint", { name: "ValorActual", nullable: false })
  valorActual: number;

  constructor(init?: Partial<Consecutivos>) {
    Object.assign(this, init);
  }
}
