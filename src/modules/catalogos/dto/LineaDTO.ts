export class LineaDTO {
    idLinea: number;
    nombre: string;
    eliminado: boolean | null;
    creadoPor: number | null;
    fechaCreacion: Date | null;
    eliminadoPor: number | null;
    fechaEliminacion: Date | null;
    modificadoPor: number | null;
    fechaModificacion: Date | null;
    constructor(init?: Partial<LineaDTO>) {
        Object.assign(this, init);
    }
}