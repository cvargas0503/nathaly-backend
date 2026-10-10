import { Request, Response } from "express";
import { AppDataSource } from "../../../../ormconfig";
import { toCamelCase } from "../../../helpers";
import { Sucursal } from "../../catalogos/entities/Sucursal";
import { Denominacion } from "../entities/Denominacion";
import { DenominacionDTO } from "../dto/DenominacionDTO";
import { AperturaCierreCaja } from "../entities/AperturaCierreCaja";
import { EntityManager } from "typeorm";
import { ArqueoAperturaDetalle } from "../entities/ArqueoAperturaDetalle";
import { ArqueoCierreDetalle } from "../entities/ArqueoCierreDetalle";
import { AuthenticatedRequest } from "../../auth/auth.middleware";
import { EstadoCaja } from "../../catalogos/entities/EstadoCaja";
import { Caja } from "../entities/Caja";
import puppeteer from "puppeteer";
import { obtenerArqueoCompleto } from "./services/ObtenerArqueoCompleto";

export const getDatosArqueoInicio = async (req: Request, res: Response): Promise<Response> => {
    try {
        const empleados: any[] = await AppDataSource.query('EXEC REPORTES.sp_ObtenerEmpleados');
        const denominacionRepo = AppDataSource.getRepository(Denominacion);
        const denominaciones: Denominacion[] = await denominacionRepo.find({
            where: { eliminado: false },
            order: { valor: 'ASC' },
        });
        console.log('Denominaciones obtenidas:', denominaciones);
        const denominacionDto: DenominacionDTO[] = denominaciones.map((denominacion) => {
            return new DenominacionDTO({
                idDenominacion: denominacion.idDenominacion,
                codigoMoneda: denominacion.codigoMoneda2,
                valor: denominacion.valor
            })
        });

        const empleadosProcesados = toCamelCase(empleados);
        return res.status(200).json({
            success: true,
            message: 'Datos del formulario obtenidos correctamente',
            data: {
                empleados: empleadosProcesados,
                denominaciones: denominacionDto
            }
        });
    } catch (error) {
        console.error('Error al obtener datos del formulario de arqueo:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener datos del formulario de arqueo',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

export const cargarArqueo = async (req: Request, res: Response): Promise<Response> => {
    const { fecha, idEmpleado, idSucursal } = req.query;

    if (!fecha || !idEmpleado || !idSucursal) {
        return res.status(400).json({
            success: false,
            message: "Parámetros requeridos: fecha, idEmpleado, idSucursal",
        });
    }

    try {
        return await AppDataSource.transaction(async (manager) => {
            const arqueoRepo = manager.getRepository(AperturaCierreCaja);
            const denominacionRepo = manager.getRepository(Denominacion);

            const denominaciones = await denominacionRepo.find({
                relations: { codigoMoneda: true },
                where: { eliminado: false },
                order: { valor: "DESC" },
            });

            const arqueo = await arqueoRepo.findOne({
                where: {
                    fechaApertura: new Date(fecha as string),
                    idEmpleado: Number(idEmpleado),
                    idSucursal: Number(idSucursal),
                    eliminado: false,
                },
                relations: {
                    estadoCaja: true,
                    arqueoAperturaDetalles: {
                        idDenominacion: { codigoMoneda: true },
                    },
                    arqueoCierreDetalles: {
                        idDenominacion: { codigoMoneda: true },
                    },
                },
            });

            const plantillaEnBlanco = (codigoMoneda: string, detallesExistentes: Array<any> = []) =>
                denominaciones
                    .filter(d => d.codigoMoneda.codigo === codigoMoneda)
                    .map(d => {
                        const encontrado = detallesExistentes.find(det => det.idDenominacion.idDenominacion === d.idDenominacion);
                        return {
                            idDenominacion: d.idDenominacion,
                            valor: d.valor,
                            cantidad: encontrado ? encontrado.cantidad : 0,
                            total: encontrado ? (encontrado.total ?? encontrado.valor * encontrado.cantidad) : 0,
                        };
                    });

            if (!arqueo) {
                return res.status(200).json({
                    success: true,
                    abierto: false,
                    cerrado: false,
                    message: "No se encontró un arqueo en ese día.",
                    data: {
                        saldoInicialCordoba: plantillaEnBlanco("NIO"),
                        saldoInicialDolar: plantillaEnBlanco("USD"),
                        saldoFinalCordoba: plantillaEnBlanco("NIO"),
                        saldoFinalDolar: plantillaEnBlanco("USD"),
                    }
                });
            }

            if (arqueo.estadoCaja.codigo === "CAJA_CERRADA") {
                return res.status(200).json({
                    success: true,
                    abierto: false,
                    cerrado: true,
                    message: "Arqueo no puede modificarse porque ya está cerrada la caja de ese día.",
                });
            }

            return res.status(200).json({
                success: true,
                abierto: true,
                cerrado: false,
                message: "Arqueo abierto encontrado.",
                data: {
                    idArqueo: arqueo.idApertura,
                    saldoInicialCordoba: plantillaEnBlanco("NIO", arqueo.arqueoAperturaDetalles),
                    saldoInicialDolar: plantillaEnBlanco("USD", arqueo.arqueoAperturaDetalles),
                    saldoFinalCordoba: plantillaEnBlanco("NIO", arqueo.arqueoCierreDetalles),
                    saldoFinalDolar: plantillaEnBlanco("USD", arqueo.arqueoCierreDetalles),
                },
            });
        });
    } catch (error) {
        console.error("Error al cargar arqueo:", error);
        return res.status(500).json({
            success: false,
            message: "Error al cargar arqueo",
            error: error instanceof Error ? error.message : String(error),
        });
    }
};


export const guardarArqueo = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    const { fecha, idEmpleado, idSucursal, saldoInicialCordoba, saldoInicialDolar, saldoFinalCordoba, saldoFinalDolar } = req.body;
    const creadoPor = req.user?.id || null;

    if (!fecha || !idEmpleado || !idSucursal) {
        return res.status(400).json({
            success: false,
            message: "Parámetros requeridos: fecha, idEmpleado, idSucursal",
        });
    }

    try {
        await AppDataSource.transaction(async (manager) => {
            const arqueoRepo = manager.getRepository(AperturaCierreCaja);
            const detalleAperturaRepo = manager.getRepository(ArqueoAperturaDetalle);
            const detalleCierreRepo = manager.getRepository(ArqueoCierreDetalle);

            let arqueo = await arqueoRepo.findOne({
                where: {
                    fechaApertura: new Date(fecha),
                    idEmpleado: idEmpleado,
                    idSucursal: idSucursal,
                    eliminado: false,
                },
            });

            if (!arqueo) {
                // Crear nuevo arqueo
                // const estadoCaja: Caja = await estadoCajaRepo.findOne({
                //     where: { codigo: "CAJA_ABIERTA", eliminado: false }, // Asumiendo que
                // })
                // if (!estadoCaja) {
                //     return res.status(400).json({
                //         success: false,
                //         message: "Estado de caja 'CAJA_ABIERTA' no encontrado.",
                //     });
                // }
                console.log("creadoPor:", creadoPor, "idEmpleado:", idEmpleado);
                arqueo = arqueoRepo.create({
                    fechaApertura: new Date(fecha),
                    idEmpleado,
                    idCaja: { idCaja: 2 } as Caja,
                    idSucursal,
                    responsable: creadoPor || idEmpleado,
                    eliminado: false,
                    creadoPor: creadoPor || idEmpleado,
                    fechaCreacion: new Date(),
                    idEstadoCaja: 2, // Asumiendo que 1 es estado inicial, ajusta según tu catálogo
                });
                arqueo = await arqueoRepo.save(arqueo);
            } else {
                // Actualizar fecha de modificación
                arqueo.modificadoPor = creadoPor || idEmpleado;
                arqueo.fechaModificacion = new Date();
                await arqueoRepo.save(arqueo);

                // Limpiar detalles anteriores
                await detalleAperturaRepo.delete({ idApertura2: arqueo.idApertura });
                await detalleCierreRepo.delete({ idApertura2: arqueo.idApertura });
            }

            // Guardar saldos iniciales
            const detallesIniciales = [
                ...(saldoInicialCordoba || []),
                ...(saldoInicialDolar || []),
            ].filter(d => d.cantidad > 0);

            for (const det of detallesIniciales) {
                await manager.query(`
                        INSERT INTO CAJA.ArqueoAperturaDetalle (IdApertura, IdDenominacion, Valor, Cantidad, Eliminado, CreadoPor)
                        VALUES (@0, @1, @2, @3, @4, @5)
                    `, [arqueo.idApertura, det.idDenominacion, det.valor, det.cantidad, 0, creadoPor || idEmpleado]);
            }


            // Guardar saldos finales
            const detallesFinales = [
                ...(saldoFinalCordoba || []),
                ...(saldoFinalDolar || []),
            ].filter(d => d.cantidad > 0);
            for (const det of detallesFinales) {
                await manager.query(`
                    INSERT INTO CAJA.ArqueoCierreDetalle (IdApertura, IdDenominacion, Valor, Cantidad, Eliminado, CreadoPor)
                    VALUES (@0, @1, @2, @3, @4, @5)
                `, [arqueo.idApertura, det.idDenominacion, det.valor, det.cantidad, 0, creadoPor || idEmpleado]);
            }
        });

        return res.status(200).json({
            success: true,
            message: "Arqueo guardado exitosamente.",
        });
    } catch (error) {
        console.error("Error al guardar arqueo:", error);
        return res.status(500).json({
            success: false,
            message: "Error al guardar arqueo",
            error: error instanceof Error ? error.message : String(error),
        });
    }
};
export const generarArqueoPdf = async (req: Request, res: Response) => {

    try {
        const html = await obtenerArqueoCompleto(req.params as any);
        // 2. Inicializar Puppeteer
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        // 3. Setear el contenido HTML
        await page.setContent(html, { waitUntil: "networkidle0" });

        // 4. Generar el PDF
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "20mm", bottom: "20mm", left: "10mm", right: "10mm" },
        });

        await browser.close();

        // 5. Enviar el PDF al frontend
        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=arqueo.pdf",
        });
        return res.send(pdfBuffer);

    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Error generando el PDF" });
    }
};

/**
 * PATCH /arqueos/:id/cerrar
 * Cierra el arqueo, calcula diferencias automáticamente
 */
export const cerrarArqueo = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    const { id } = req.params;
    const creadoPor = req.user?.id || null;

    if (!id) {
        return res.status(400).json({
            success: false,
            message: "El id del arqueo es requerido.",
        });
    }

    try {
        return await AppDataSource.transaction(async (manager) => {
            const arqueoRepo = manager.getRepository(AperturaCierreCaja);
            const estadoCajaRepo = manager.getRepository(EstadoCaja);

            // 1. Buscar el arqueo
            const arqueo = await arqueoRepo.findOne({
                where: {
                    idApertura: id,
                    eliminado: false,
                },
                relations: {
                    estadoCaja: true,
                    arqueoAperturaDetalles: {
                        idDenominacion: { codigoMoneda: true },
                    },
                    arqueoCierreDetalles: {
                        idDenominacion: { codigoMoneda: true },
                    },
                },
            });

            if (!arqueo) {
                return res.status(404).json({
                    success: false,
                    message: "Arqueo no encontrado.",
                });
            }

            // 2. Verificar que no esté ya cerrado
            if (arqueo.estadoCaja.codigo === "CAJA_CERRADA") {
                return res.status(400).json({
                    success: false,
                    message: "El arqueo ya está cerrado.",
                });
            }

            // 3. Buscar estado CAJA_CERRADA
            const estadoCerrada = await estadoCajaRepo.findOneBy({ codigo: "CAJA_CERRADA" });
            if (!estadoCerrada) {
                return res.status(500).json({
                    success: false,
                    message: "Estado 'CAJA_CERRADA' no encontrado en catálogo.",
                });
            }

            // 4. Calcular totales de apertura y cierre
            const calcularTotal = (detalles: any[], moneda: string) =>
                detalles
                    .filter((d: any) => d.idDenominacion?.codigoMoneda?.codigo === moneda)
                    .reduce((acc: number, d: any) => acc + (d.cantidad * d.valor), 0);

            const totalAperturaCordoba = calcularTotal(arqueo.arqueoAperturaDetalles || [], "NIO");
            const totalAperturaDolar = calcularTotal(arqueo.arqueoAperturaDetalles || [], "USD");
            const totalCierreCordoba = calcularTotal(arqueo.arqueoCierreDetalles || [], "NIO");
            const totalCierreDolar = calcularTotal(arqueo.arqueoCierreDetalles || [], "USD");

            // 5. Obtener ventas del día para calcular diferencias esperadas
            const ventasDelDia = await manager.query(`
                SELECT
                    ISNULL(SUM(CASE WHEN mcd.CodigoMoneda = 'NIO' THEN mcd.Monto ELSE 0 END), 0) AS IngresoNio,
                    ISNULL(SUM(CASE WHEN mcd.CodigoMoneda = 'USD' THEN mcd.Monto ELSE 0 END), 0) AS IngresoUsd
                FROM CAJA.MovimientoCaja mc
                INNER JOIN CAJA.MovimientoCajaDetalle mcd ON mcd.IdMovimientoCaja = mc.IdMovimiento
                WHERE mc.IdAperturaCaja = @0 AND mc.Eliminado = 0 AND mc.EsIngreso = 1
            `, [id]);

            const ingresosNio = parseFloat(ventasDelDia[0]?.IngresoNio) || 0;
            const ingresosUsd = parseFloat(ventasDelDia[0]?.IngresoUsd) || 0;

            const esperadoNio = totalAperturaCordoba + ingresosNio;
            const esperadoUsd = totalAperturaDolar + ingresosUsd;

            const diferenciaNio = totalCierreCordoba - esperadoNio;
            const diferenciaUsd = totalCierreDolar - esperadoUsd;

            // 6. Actualizar arqueo a cerrado
            arqueo.idEstadoCaja = estadoCerrada.idEstadoCaja;
            arqueo.fechaCierre = new Date();
            arqueo.modificadoPor = creadoPor;
            arqueo.fechaModificacion = new Date();
            arqueo.observaciones = `Cierre: Diferencia NIO: ${diferenciaNio.toFixed(2)}, Diferencia USD: ${diferenciaUsd.toFixed(2)}`;

            await arqueoRepo.save(arqueo);

            return res.status(200).json({
                success: true,
                message: "Arqueo cerrado exitosamente.",
                data: {
                    idArqueo: arqueo.idApertura,
                    fechaCierre: arqueo.fechaCierre,
                    resumen: {
                        aperturaCordoba: totalAperturaCordoba,
                        aperturaDolar: totalAperturaDolar,
                        cierreCordoba: totalCierreCordoba,
                        cierreDolar: totalCierreDolar,
                        ingresosNio,
                        ingresosUsd,
                        esperadoNio,
                        esperadoUsd,
                        diferenciaNio,
                        diferenciaUsd,
                    },
                },
            });
        });
    } catch (error) {
        console.error("Error al cerrar arqueo:", error);
        return res.status(500).json({
            success: false,
            message: "Error al cerrar arqueo",
            error: error instanceof Error ? error.message : String(error),
        });
    }
};

