export class ClienteDTO {
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
    tieneCredito: boolean;
    limiteCredito?: number;
    constructor(init?: Partial<ClienteDTO>) {
        Object.assign(this, init);
    }
}