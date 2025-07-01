export class ProveedorDTO {
    idProveedor: number;
    nombre: string;
    razonSocial: string;
    ruc: string;
    direccion: string | null;
    telefono: string | null;
    email: string | null;
    eliminado: boolean | null;
    creadoPor: number | null;
    fechaCreacion: Date | null;
    eliminadoPor: number | null;
    fechaEliminacion: Date | null;
    modificadoPor: number | null;
    fechaModificacion: Date | null;
    constructor(init?: Partial<ProveedorDTO>) {
        Object.assign(this, init);
    }
}