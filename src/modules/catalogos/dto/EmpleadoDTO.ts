export class EmpleadoDTO {
    nombres: string;
    apellidos: string;
    direccion?: string;
    telefono?: string;
    celular: string;
    email?: string;
    tipoDoc: string;
    numDoc: string;
    idCiudad: number;
    idSucursal: number;
    puesto: string;
    constructor(init?: Partial<EmpleadoDTO>) {
        Object.assign(this, init);
    }
}