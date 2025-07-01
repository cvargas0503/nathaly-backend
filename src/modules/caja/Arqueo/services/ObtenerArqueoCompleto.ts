import { AppDataSource } from "../../../../../ormconfig";
import { AperturaCierreCaja } from "../../entities/AperturaCierreCaja";
import { MovimientoCaja } from "../../entities/MovimientoCaja";
import { MovimientoCajaDetalle } from "../../entities/MovimientoCajaDetalle";
import { Denominacion } from "../../entities/Denominacion";
import { Between } from "typeorm";
import { Empleado } from "../../../rrhh/entities/Empleado";
import { Persona } from "../../../catalogos/entities/Persona";
import { Usuario } from "../../../auth/entities/Usuario";

interface Params {
    idArqueo: number;
}
function formatNumber(num: number | string) {
    return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export const obtenerArqueoCompleto = async (params: Params): Promise<string> => {
    //   const { fecha, idEmpleado, idSucursal } = params;

    const { idArqueo } = params;

    const arqueoRepo = AppDataSource.getRepository(AperturaCierreCaja);
    const denominacionRepo = AppDataSource.getRepository(Denominacion);
    const movimientosRepo = AppDataSource.getRepository(MovimientoCaja);

    const arqueo = await arqueoRepo.findOne({
        where: {
            idApertura: idArqueo.toString(),
            eliminado: false,
        },
        relations: {
            arqueoAperturaDetalles: { idDenominacion: { codigoMoneda: true } },
            arqueoCierreDetalles: { idDenominacion: { codigoMoneda: true } },
        },
    });

    if (!arqueo) throw new Error("No se encontró el arqueo");

    const denominaciones = await denominacionRepo.find({
        relations: { codigoMoneda: true },
        where: { eliminado: false },
        order: { valor: "DESC" },
    });

    const plantilla = (moneda: string, detalles: any[] = []) =>
        denominaciones.filter(d => d.codigoMoneda.codigo === moneda).map(d => {
            const encontrado = detalles.find(x => x.idDenominacion.idDenominacion === d.idDenominacion);
            return {
                valor: d.valor,
                cantidad: encontrado?.cantidad || 0,
                total: encontrado?.total || 0,
            };
        });

    const saldoInicialCordoba = plantilla("NIO", arqueo.arqueoAperturaDetalles);
    const saldoInicialDolar = plantilla("USD", arqueo.arqueoAperturaDetalles);
    const saldoFinalCordoba = plantilla("NIO", arqueo.arqueoCierreDetalles);
    const saldoFinalDolar = plantilla("USD", arqueo.arqueoCierreDetalles);

    const movimientos = await movimientosRepo.createQueryBuilder("mov")
        .leftJoin("mov.movimientoCajaDetalles", "detalle")
        .leftJoin("mov.idAperturaCaja", "arqueo")
        .leftJoin(Usuario, "usuario", "mov.creadoPor=usuario.idUsuario")
        .leftJoin(Empleado, "empleado", "usuario.idEmpleado=empleado.idEmpleado")
        .leftJoin(Persona, "persona", "empleado.idPersona=persona.idPersona")
        .where("mov.idAperturaCaja = :idApertura", { idApertura: arqueo.idApertura })
        .select([
            "mov.numeroMovimiento AS numeroMovimiento",
            "mov.concepto AS concepto",
            "mov.fecha AS fecha",
            "mov.esIngreso AS esIngreso",
            "detalle.monto AS monto",
            "detalle.codigoMoneda AS moneda",
            "detalle.numeroReferencia AS referencia",
            "persona.nombre1 AS nombre1",
            "persona.nombre2 AS nombre2",
            "persona.apellido1 AS apellido1",
            "persona.apellido2 AS apellido2"
        ])
        .getRawMany();

    console.log("Movimientos obtenidos:", movimientos);

       // ...existing code...
    
    let efectivoCordoba = 0, efectivoDolar = 0, bacCordoba = 0, bacDolar = 0, banproCordoba = 0, banproDolar = 0, lafiseCordoba = 0, lafiseDolar = 0;
    const detallesBac = [], detallesBanpro = [], detallesLafise = [], ingresosEgresos = [];
    
    // Agrupa los detalles por movimiento
    const movimientosPorNumero : any= {};
    for (const m of movimientos) {
        if (!movimientosPorNumero[m.numeroMovimiento]) movimientosPorNumero[m.numeroMovimiento] = [];
        movimientosPorNumero[m.numeroMovimiento].push(m);
    }
    
for (const grupo of Object.values(movimientosPorNumero) as any[][]) {
        // Todos los detalles de un mismo movimiento
        const m = grupo[0]; // Para datos generales
        const empleadoNombre = `${m.nombre1 || ''} ${m.nombre2 || ''} ${m.apellido1 || ''} ${m.apellido2 || ''}`.trim() || "-";
        for (const detalle of grupo) {
            const monto = parseFloat(detalle.monto);
            const esDolar = detalle.moneda === "USD";
            let tipoPago = "EFECTIVO";
            if (detalle.referencia) {
                if (detalle.referencia.includes("BAC")) tipoPago = "BAC";
                else if (detalle.referencia.includes("BANPRO")) tipoPago = "BANPRO";
                else if (detalle.referencia.includes("LAFISE")) tipoPago = "LAFISE";
            }
    
            // Sumar totales correctamente
            if (m.esIngreso) {
                if (tipoPago === "BAC") esDolar ? bacDolar += monto : bacCordoba += monto;
                else if (tipoPago === "BANPRO") esDolar ? banproDolar += monto : banproCordoba += monto;
                else if (tipoPago === "LAFISE") esDolar ? lafiseDolar += monto : lafiseCordoba += monto;
                else esDolar ? efectivoDolar += monto : efectivoCordoba += monto;
            }
    
            // Detalles para tablas
            const detalleHtml = `<tr><td>${m.numeroMovimiento}</td><td>${empleadoNombre}</td><td>${formatNumber(detalle.monto)}</td><td>${new Date(m.fecha).toLocaleDateString()}</td><td>${m.concepto}</td><td>${detalle.referencia || "-"}</td></tr>`;
            if (tipoPago === "BAC") detallesBac.push(detalleHtml);
            if (tipoPago === "BANPRO") detallesBanpro.push(detalleHtml);
            if (tipoPago === "LAFISE") detallesLafise.push(detalleHtml);
            if (!detalle.referencia) ingresosEgresos.push(`<tr><td>${m.numeroMovimiento}</td><td>${empleadoNombre}</td><td>${formatNumber(detalle.monto)}</td><td>${new Date(m.fecha).toLocaleDateString()}</td><td>${m.concepto}</td><td>${m.esIngreso ? "Ingreso" : "Egreso"}</td></tr>`);
        }
    }
    
    // ...resto del código igual...


    // Calcular totales de caja inicial y final por moneda
    const totalInicialCordoba = saldoInicialCordoba.reduce((sum, d) => sum + Number(d.total), 0);
    const totalInicialDolar = saldoInicialDolar.reduce((sum, d) => sum + Number(d.total), 0);
    const totalFinalCordoba = saldoFinalCordoba.reduce((sum, d) => sum + Number(d.total), 0);
    const totalFinalDolar = saldoFinalDolar.reduce((sum, d) => sum + Number(d.total), 0);

    // Si quieres mostrar el total general en C$ (convirtiendo dólares a córdobas), agrega aquí la tasa de cambio si la tienes.
    // Por ahora, se muestran por separado.

    // Calcular ingresos y egresos por moneda
    let ingresosCordoba = 0, ingresosDolar = 0, egresosCordoba = 0, egresosDolar = 0;
    for (const m of movimientos) {
        const monto = parseFloat(m.monto);
        const esDolar = m.moneda === "USD";
        if (m.esIngreso) {
            if (esDolar) ingresosDolar += monto;
            else ingresosCordoba += monto;
        } else {
            if (esDolar) egresosDolar += monto;
            else egresosCordoba += monto;
        }
    }

    // Calcular saldo teórico
    const saldoTeoricoCordoba = totalInicialCordoba + ingresosCordoba - egresosCordoba;
    const saldoTeoricoDolar = totalInicialDolar + ingresosDolar - egresosDolar;

    // Calcular sobrante y faltante
    const sobranteCordoba = totalFinalCordoba > saldoTeoricoCordoba ? (totalFinalCordoba - saldoTeoricoCordoba) : 0;
    const faltanteCordoba = saldoTeoricoCordoba > totalFinalCordoba ? (saldoTeoricoCordoba - totalFinalCordoba) : 0;
    const sobranteDolar = totalFinalDolar > saldoTeoricoDolar ? (totalFinalDolar - saldoTeoricoDolar) : 0;
    const faltanteDolar = saldoTeoricoDolar > totalFinalDolar ? (saldoTeoricoDolar - totalFinalDolar) : 0;

    // Construcción de secciones condicionales
    const seccionBac = detallesBac.length
        ? `<div class="seccion"><h2>Detalle Transferencias BAC</h2>
            <table><tr><th>N° Movimiento</th><th>Empleado</th><th>Monto</th><th>Fecha</th><th>Concepto</th><th>Referencia</th></tr>
            ${detallesBac.join('')}
            </table>
        </div>
        <div class="pagina"></div>`
        : '';

    const seccionBanpro = detallesBanpro.length
        ? `<div class="seccion"><h2>Detalle Transferencias BANPRO</h2>
            <table><tr><th>N° Movimiento</th><th>Empleado</th><th>Monto</th><th>Fecha</th><th>Concepto</th><th>Referencia</th></tr>
            ${detallesBanpro.join('')}
            </table>
        </div>
        <div class="pagina"></div>`
        : '';

    const seccionLafise = detallesLafise.length
        ? `<div class="seccion"><h2>Detalle Transferencias LAFISE</h2>
            <table><tr><th>N° Movimiento</th><th>Empleado</th><th>Monto</th><th>Fecha</th><th>Concepto</th><th>Referencia</th></tr>
            ${detallesLafise.join('')}
            </table>
        </div>
        <div class="pagina"></div>`
        : '';

    const seccionIngresosEgresos = ingresosEgresos.length
        ? `<div class="seccion"><h2>Detalle Ingresos y Egresos</h2>
            <table><tr><th>N° Movimiento</th><th>Empleado</th><th>Monto</th><th>Fecha</th><th>Concepto</th><th>Tipo</th></tr>
            ${ingresosEgresos.join('')}
            </table>
        </div>`
        : '';

    const html = `
  <html><head><style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        h1, h2 { background-color: #004080; color: white; padding: 10px; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #333; padding: 6px; text-align: right; }
        th { background-color: #e6f0ff; text-align: center; }
        .denominaciones { width: 48%; float: left; margin-right: 2%; }
        .clear { clear: both; }
        .seccion { margin-top: 30px; }
        .totales { font-weight: bold; background-color: #f0f8ff; }
        .pagina { page-break-after: always; }
  </style></head><body>
  <h1>ARQUEO DE CAJA</h1>
  <p><b>Fecha:</b> ${arqueo.fechaApertura?.toLocaleDateString()} - <b>Empleado:</b> JUAN - <b>Sucursal:</b> TIENDA NATHALY </p>
 <div class="seccion">
        <div class="denominaciones">
            <h2>CAJA INICIAL CÓRDOBAS</h2>
  <table><tr><th>Denominación</th><th>Cantidad</th><th>Total</th></tr>
  ${saldoInicialCordoba.map(d => `<tr><td>C$${d.valor}</td><td>${d.cantidad}</td><td>${d.total}</td></tr>`).join('')}
  </table>
  </div>
    <div class="denominaciones">
  <h2>CAJA FINAL CÓRDOBAS</h2>
  <table><tr><th>Denominación</th><th>Cantidad</th><th>Total</th></tr>
  ${saldoFinalCordoba.map(d => `<tr><td>C$${d.valor}</td><td>${d.cantidad}</td><td>${d.total}</td></tr>`).join('')}
  </table>
  </div>
          <div class="clear"></div>

<div class="denominaciones">
            <h2>CAJA INICIAL DÓLARES</h2>
  <table><tr><th>Denominación</th><th>Cantidad</th><th>Total</th></tr>
  ${saldoInicialDolar.map(d => `<tr><td>$${d.valor}</td><td>${d.cantidad}</td><td>${d.total}</td></tr>`).join('')}
  </table>
  </div>
<div class="denominaciones"><h2>CAJA FINAL DÓLARES</h2><table><tr><th>Denominación</th><th>Cantidad</th><th>Total</th></tr>
  ${saldoFinalDolar.map(d => `<tr><td>$${d.valor}</td><td>${d.cantidad}</td><td>${d.total}</td></tr>`).join('')}
  </table>
</div>

   <div class="clear"></div>
        <h2>Total Caja Inicial: C$ ${formatNumber(totalInicialCordoba)} &nbsp;&nbsp; | &nbsp;&nbsp; $ ${formatNumber(totalInicialDolar)}</h2>
        <h2>Total Caja Final: C$ ${formatNumber(totalFinalCordoba)} &nbsp;&nbsp; | &nbsp;&nbsp; $ ${formatNumber(totalFinalDolar)}</h2>
    </div>

<div class="seccion">
        <h2>Consolidado de Ventas y Pagos</h2>
  <table><tr><th></th><th>Efectivo C$</th><th>Transf BAC C$</th><th>Transf BANPRO C$</th><th>Transf LAFISE C$</th><th>Efectivo $</th><th>Transf BAC $</th><th>Transf BANPRO $</th><th>Transf LAFISE $</th></tr>
  <tr><td>Total</td><td>${efectivoCordoba}</td><td>${bacCordoba}</td><td>${banproCordoba}</td><td>${lafiseCordoba}</td><td>${efectivoDolar}</td><td>${bacDolar}</td><td>${banproDolar}</td><td>${lafiseDolar}</td></tr>
  </table>
  </div>

<div class="seccion">
        <h2>Sobrantes / Faltantes</h2>
 <table><tr><th>Moneda</th><th>Sobrante</th><th>Faltante</th></tr>
 <tr><td>C$</td><td>${formatNumber(sobranteCordoba)}</td><td>${formatNumber(faltanteCordoba)}</td></tr>
<tr><td>$</td><td>${formatNumber(sobranteDolar)}</td><td>${formatNumber(faltanteDolar)}</td></tr>
  </table>
   </div>

    <div class="pagina"></div>

    ${seccionBac}
    ${seccionBanpro}
    ${seccionLafise}
    ${seccionIngresosEgresos}

  </body></html>
  `;

    return html;
};