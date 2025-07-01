export class ListaPrecioDTO {
    idListaPrecio: number;
    nombre: string;
    descripcion: string;
    eliminado: boolean | null;
    creadoPor: number | null;
    fechaCreacion: Date | null;
    eliminadoPor: number | null;
    fechaEliminacion: Date | null;
    modificadoPor: number | null;
    fechaModificacion: Date | null;
    constructor(init?: Partial<ListaPrecioDTO>) {
        Object.assign(this, init);
    }
}