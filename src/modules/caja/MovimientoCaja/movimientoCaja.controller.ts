import { Request, Response } from "express";
import { AppDataSource } from "../../../../ormconfig";
import { AperturaCierreCaja } from "../entities/AperturaCierreCaja";
import { MovimientoCaja } from "../entities/MovimientoCaja";
import { MovimientoCajaDetalle } from "../entities/MovimientoCajaDetalle";
import { Venta } from "../../ventas/entities/Venta";
import { Estado } from "../../catalogos/entities/Estado";
import { EstadoCaja } from "../../catalogos/entities/EstadoCaja";
import { AuthenticatedRequest } from "../../auth/auth.middleware";
import { Usuario } from "../../auth/entities/Usuario";
import { Between } from "typeorm";
import { Consecutivos } from "../../admin/entities/Consecutivos";
import { Persona } from "../../catalogos/entities/Persona";
import { Empleado } from "../../rrhh/entities/Empleado";
import { Cliente } from "../../catalogos/entities/Cliente";
import { FormaPago } from "../entities/FormaPago";
export const pagarVenta = async (req: AuthenticatedRequest, res: Response) => {
  const { idVenta } = req.params;
  const { formasPago } = req.body;
  const creadoPor = req.user?.id;
  if (!idVenta || !formasPago?.length || !creadoPor) {
    return res.status(400).json({ success: false, message: "Parámetros incompletos" });
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const usuarioRepo = queryRunner.manager.getRepository(Usuario);
    const usuario = await usuarioRepo.findOneBy({ idUsuario: creadoPor });
    if (!usuario) {
      throw new Error("Usuario no encontrado");
    }

    const idEmpleado = usuario.idEmpleado;
    if (!idEmpleado) {
      throw new Error("El usuario no tiene un empleado asociado");
    }
    // 1. Verificar existencia de venta
    const ventaRepo = queryRunner.manager.getRepository(Venta);
    const venta = await ventaRepo.findOneBy({ idVenta });

    if (!venta) {
      throw new Error("La venta no existe");
    }

    const estadoRepo = queryRunner.manager.getRepository(Estado);
    console.log("Detalles de formas de pago:", formasPago);

    const estado = await estadoRepo.findOneBy({ codigo: "FACT_PAGADA" });
    console.log("Estado encontrado:", estado);
    if (!estado) {
      throw new Error("Estado de venta 'FACT_PAGADA' no encontrado");
    }
    if (venta.idEstado === estado?.idEstado) {
      throw new Error("La venta ya está pagada");
    }

    // 2. Verificar arqueo abierto para el empleado y caja
    const arqueoRepo = queryRunner.manager.getRepository(AperturaCierreCaja);
    const inicioDia = new Date();
    inicioDia.setHours(0, 0, 0, 0);

    const finDia = new Date();
    finDia.setHours(23, 59, 59, 999);
    console.log("ID Empleado:", idEmpleado);
    console.log("Fecha Apertura:", inicioDia, " a ", finDia);

    const arqueo = await arqueoRepo.findOne({
      where: {
        idEmpleado, // Relación ManyToOne
        fechaApertura: Between(inicioDia, finDia),
        eliminado: false,
      },
      order: { idApertura: "DESC" },
      relations: ["idCaja"], // Aseguramos que idCaja esté cargado
    });

    console.log("Arqueo encontrado:", arqueo);

    if (!arqueo) {
      throw new Error("No hay un arqueo abierto para este empleado");
    }

    const estadoCajaRepo = queryRunner.manager.getRepository(EstadoCaja);
    const estadoCaja = await estadoCajaRepo.findOneBy({ codigo: "CAJA_ABIERTA" });
    if (arqueo.idEstadoCaja !== estadoCaja?.idEstadoCaja) {
      throw new Error("El arqueo ya está cerrado");
    }

    // 3. Actualizar estado de venta a PAGADA
    venta.idEstado = estado.idEstado;
    await queryRunner.manager.save(venta);

    // 4. Insertar MovimientoCaja
    const ConsecutivoRepo = queryRunner.manager.getRepository(Consecutivos);
    const consecutivo = await ConsecutivoRepo.findOneBy({ entidad: "MOVIMIENTO_CAJA" });
    if (!consecutivo) {
      throw new Error("Consecutivo para MOVIMIENTO_CAJA no encontrado");
    }
    consecutivo.valorActual += 1;
    await queryRunner.manager.save(consecutivo);
    const numeroMovimiento = `MOV-${consecutivo.valorActual.toString().padStart(8, '0')}`;
    const movimiento = new MovimientoCaja({
      idVenta,
      idAperturaCaja: arqueo,
      esIngreso: true,
      concepto: 'Pago de venta ' + venta.numeroVenta,
      creadoPor,
      idCaja: arqueo.idCaja, // Relación ManyToOne
      fecha: new Date(),
      fechaCreacion: new Date(),
      numeroMovimiento,
    });

    console.log("MovimientoCaja a insertar:", movimiento);
    const movimientoGuardado = await queryRunner.manager.save(movimiento);


    // 5. Insertar detalles por cada forma de pago
    for (const pago of formasPago) {
      const detalle = new MovimientoCajaDetalle({
        idMovimientoCaja: movimientoGuardado,
        idFormaPago: pago.idFormaPago,
        monto: pago.monto,
        numeroReferencia: pago.referencia || null,
        codigoMonedaStr: pago.moneda,
        fechaRegistro: new Date(),
      });

      await queryRunner.manager.save(detalle);
    }

    await queryRunner.commitTransaction();
    return res.json({ success: true, message: "Venta pagada y movimiento registrado" });

  } catch (error: any) {
    console.error(error);
    await queryRunner.rollbackTransaction();
    return res.status(400).json({ success: false, message: error.message || "Error al procesar el pago" });
  } finally {
    await queryRunner.release();
  }
};


export const obtenerMovimientosCaja = async (req: Request, res: Response) => {
  try {
    const movimientos = await AppDataSource.getRepository(MovimientoCaja)
      .createQueryBuilder("mov")
      .leftJoin(Venta, "venta", "venta.idVenta = mov.idVenta")
      .leftJoin(Cliente, "cliente", "cliente.idCliente = venta.idCliente")
      .leftJoin(Persona, "personaCliente", "personaCliente.idPersona = cliente.idPersona")
      .leftJoin(Usuario, "usuario", "usuario.idUsuario = mov.creadoPor")
      .leftJoin(Empleado, "empleado", "empleado.idEmpleado = usuario.idEmpleado")
      .leftJoin(Persona, "personaEmpleado", "personaEmpleado.idPersona = empleado.idPersona")
      .leftJoin(Empleado, "empleadoVenta", "empleadoVenta.idEmpleado = venta.idEmpleado")
      .leftJoin(Persona, "personaVendedor", "personaVendedor.idPersona = empleadoVenta.idPersona")
      .leftJoin(MovimientoCajaDetalle, "detalle", "detalle.idMovimientoCaja = mov.idMovimiento")
      .leftJoin(FormaPago, "fp", "fp.idFormaPago = detalle.idFormaPago") // Catálogo de forma de pago
      .where("mov.eliminado = 0")
      .select([
        "mov.idMovimiento AS idMovimiento",
        "mov.numeroMovimiento AS numeroMovimiento",
        "mov.concepto AS concepto",
        "mov.fecha AS fecha",
        "mov.esIngreso AS esIngreso",
        "mov.idVenta AS idVenta",
        "venta.numeroVenta AS numeroVenta",
        "personaEmpleado.nombre1 AS empleadoNombre1",
        "personaEmpleado.nombre2 AS empleadoNombre2",
        "personaEmpleado.apellido1 AS empleadoApellido1",
        "personaEmpleado.apellido2 AS empleadoApellido2",
        "personaVendedor.nombre1 AS vendedorNombre1",
        "personaVendedor.nombre2 AS vendedorNombre2",
        "personaVendedor.apellido1 AS vendedorApellido1",
        "personaVendedor.apellido2 AS vendedorApellido2",
        "personaCliente.nombre1 AS clienteNombre1",
        "personaCliente.nombre2 AS clienteNombre2",
        "personaCliente.apellido1 AS clienteApellido1",
        "personaCliente.apellido2 AS clienteApellido2",
        "detalle.monto AS montoDetalle",
        "detalle.codigoMoneda AS codigoMoneda",
        "detalle.numeroReferencia AS referencia",
        "fp.descripcion AS metodoPago"
      ])
      .orderBy("mov.fecha", "DESC")
      .getRawMany();

    const agrupados = new Map<string, any>();

    for (const row of movimientos) {
      const id = row.idMovimiento;

      if (!agrupados.has(id)) {
        agrupados.set(id, {
          id: parseInt(id),
          tipo: row.idVenta ? "Venta" : (row.esIngreso ? "Ingreso" : "Egreso"),
          movimiento: row.numeroMovimiento || "-",
          documento: row.numeroVenta || "-",
          empleado: row.empleadoNombre1 ? `${row.empleadoNombre1} ${row.empleadoNombre2 || ""} ${row.empleadoApellido1} ${row.empleadoApellido2 || ""}`.trim() : "-",
          vendedor: row.vendedorNombre1 ? `${row.vendedorNombre1} ${row.vendedorNombre2 || ""} ${row.vendedorApellido1} ${row.vendedorApellido2 || ""}`.trim() : "-",
          cliente: row.clienteNombre1 ? `${row.clienteNombre1} ${row.clienteNombre2 || ""} ${row.clienteApellido1} ${row.clienteApellido2 || ""}`.trim() : "-",
          fecha: row.fecha,
          pagos: [],
          ingresoNio: 0,
          ingresoUsd: 0,
          egresoNio: 0,
          egresoUsd: 0,
        });
      }

      const actual = agrupados.get(id);
      const monto = parseFloat(row.montoDetalle) || 0;
      const moneda = row.codigoMoneda;
      const esIngreso = row.esIngreso;

      actual.pagos.push({
        metodo: row.metodoPago || "Desconocido",
        moneda: moneda === "USD" ? "$" : "C$",
        monto,
        referencia: row.referencia || undefined
      });

      if (esIngreso) {
        if (moneda === "USD") actual.ingresoUsd += monto;
        else actual.ingresoNio += monto;
      } else {
        if (moneda === "USD") actual.egresoUsd += monto;
        else actual.egresoNio += monto;
      }
    }

    const resultado = Array.from(agrupados.values());
    return res.json({ success: true, data: resultado });

  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error al obtener movimientos" });
  }
};

export const registrarMovimiento = async (req: AuthenticatedRequest, res: Response) => {
  console.log("Hola")
  const { idEmpleado, ingreso, fecha, formaPago, concepto } = req.body;
  const creadoPor = req.user?.id;
  if (!idEmpleado || ingreso === undefined || !creadoPor || !fecha || !formaPago || !concepto) {
    return res.status(400).json({ success: false, message: "Parámetros incompletos" });
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 2. Verificar arqueo abierto para el empleado y caja
    const arqueoRepo = queryRunner.manager.getRepository(AperturaCierreCaja);
    const inicioDia = new Date(fecha);
    inicioDia.setHours(0, 0, 0, 0);

    const finDia = new Date(fecha);
    finDia.setHours(23, 59, 59, 999);

    console.log(inicioDia, finDia);
    const arqueo = await arqueoRepo.findOne({
      where: {
        idEmpleado, // Relación ManyToOne
        fechaApertura: Between(inicioDia, finDia),
        eliminado: false,
      },
      order: { idApertura: "DESC" },
      relations: ["idCaja"], // Aseguramos que idCaja esté cargado
    });

    if (!arqueo) {
      throw new Error("No hay un arqueo abierto para este empleado");
    }

    const estadoCajaRepo = queryRunner.manager.getRepository(EstadoCaja);
    const estadoCaja = await estadoCajaRepo.findOneBy({ codigo: "CAJA_ABIERTA" });
    if (arqueo.idEstadoCaja !== estadoCaja?.idEstadoCaja) {
      throw new Error("El arqueo ya está cerrado");
    }

    // 4. Insertar MovimientoCaja
    const ConsecutivoRepo = queryRunner.manager.getRepository(Consecutivos);
    const consecutivo = await ConsecutivoRepo.findOneBy({ entidad: "MOVIMIENTO_CAJA" });
    if (!consecutivo) {
      throw new Error("Consecutivo para MOVIMIENTO_CAJA no encontrado");
    }
    consecutivo.valorActual += 1;
    await queryRunner.manager.save(consecutivo);
    const numeroMovimiento = `${ingreso ? "ING" : "EGR"}-${consecutivo.valorActual.toString().padStart(8, '0')}`;
    const movimiento = new MovimientoCaja({
      idAperturaCaja: arqueo,
      esIngreso: ingreso,
      concepto,
      creadoPor,
      idCaja: arqueo.idCaja,
      fecha: new Date(),
      fechaCreacion: new Date(),
      numeroMovimiento,
    });

    console.log("MovimientoCaja a insertar:", movimiento);
    const movimientoGuardado = await queryRunner.manager.save(movimiento);


    // 5. Insertar detalles por cada forma de pago
      const detalle = new MovimientoCajaDetalle({
        idMovimientoCaja: movimientoGuardado,
        idFormaPago: formaPago.idFormaPago,
        monto: formaPago.monto,
        numeroReferencia: formaPago.referencia || null,
        codigoMonedaStr: formaPago.moneda,
        fechaRegistro: new Date(),
      });
      await queryRunner.manager.save(detalle);

    await queryRunner.commitTransaction();
    return res.json({ success: true, message: "Movimiento registrado" });

  } catch (error: any) {
    console.error(error);
    await queryRunner.rollbackTransaction();
    return res.status(400).json({ success: false, message: error.message || "Error al procesar el pago" });
  } finally {
    await queryRunner.release();
  }
};