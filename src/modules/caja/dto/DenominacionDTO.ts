export class DenominacionDTO {
    idDenominacion: number;
    codigoMoneda: string;
    valor: number;
    constructor(init?: Partial<DenominacionDTO>) {
        Object.assign(this, init);
    }
}