import { Request, Response } from "express";
import { AppDataSource } from "../../../../ormconfig";
import { UsuarioPermiso } from "../entities/UsuarioPermiso";
import { Permiso } from "../entities/Permiso";
import { Empleado } from "../../rrhh/entities/Empleado";
import { Usuario } from "../entities/Usuario";

export const asignarPermisos = async (req: Request, res: Response) => {
    const { idEmpleado, permisos } = req.body;

    if (!idEmpleado || !Array.isArray(permisos) || permisos.length === 0) {
        return res.status(400).json({ success: false, message: "Datos incompletos" });
    }

    const repo = AppDataSource.getRepository(UsuarioPermiso);

    try {
        const usuarioRepo = AppDataSource.getRepository(Usuario);
        const usuarioObject = await usuarioRepo.find({ where: { idEmpleado: Number(idEmpleado), eliminado: false } })
        const idUsuario = usuarioObject[0]?.idUsuario;
        for (const idPermiso of permisos) {
            const existente = await repo.findOneBy({ idUsuario, idPermiso });

            if (existente) {
                if (existente.eliminado || !existente.permitido) {
                    existente.permitido = true;
                    existente.eliminado = false;
                    existente.fechaCreacion = new Date();
                    await repo.save(existente);
                }
            } else {
                const nuevo = repo.create({
                    idUsuario,
                    idPermiso,
                    permitido: true,
                    eliminado: false,
                    fechaCreacion: new Date(),
                });
                await repo.save(nuevo);
            }
        }

        return res.json({ success: true, message: "Permisos asignados correctamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Error al asignar permisos" });
    }
};

export const revocarPermisos = async (req: Request, res: Response) => {
    const { idEmpleado, permisos } = req.body;

    if (!idEmpleado || !Array.isArray(permisos) || permisos.length === 0) {
        return res.status(400).json({ success: false, message: "Datos incompletos" });
    }

    const repo = AppDataSource.getRepository(UsuarioPermiso);

    try {
        const usuarioRepo = AppDataSource.getRepository(Usuario);
        const usuarioObject = await usuarioRepo.find({ where: { idEmpleado: Number(idEmpleado), eliminado: false } })
        const idUsuario = usuarioObject[0]?.idUsuario;
        for (const idPermiso of permisos) {
            const existente = await repo.findOneBy({ idUsuario, idPermiso });

            if (existente) {
                existente.permitido = false;
                existente.eliminado = true;
                await repo.save(existente);
            }
        }

        return res.json({ success: true, message: "Permisos revocados correctamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Error al revocar permisos" });
    }
};

export const obtenerPermisosPorUsuario = async (req: Request, res: Response) => {
    const { idEmpleado } = req.params;

    if (!idEmpleado) return res.status(400).json({ success: false, message: "Falta el ID del empleado" });

    console.log(idEmpleado)
    const usuarioRepo = AppDataSource.getRepository(Usuario);
    const permisosRepo = AppDataSource.getRepository(Permiso);
    const usuarioPermisoRepo = AppDataSource.getRepository(UsuarioPermiso);

    try {
        // Traer todos los permisos
        const usuarioObject = await usuarioRepo.find({ where: { idEmpleado: Number(idEmpleado), eliminado: false } })
        console.log("Usuario Object:", usuarioObject);
        if (usuarioObject.length === 0) {
            return res.status(404).json({ success: false, message: "Usuario no encontrado" });
        }

        const todos = await permisosRepo.find({ where: { eliminado: false } });

        // Traer los permisos que tiene asignados
        const asignadosRaw = await usuarioPermisoRepo.find({
            where: { idUsuario: Number(usuarioObject[0].idUsuario), eliminado: false, permitido: true },
        });

        const asignadosIds = asignadosRaw.map((p) => p.idPermiso);

        const asignados = todos.filter((p) => asignadosIds.includes(p.idPermiso));
        const noAsignados = todos.filter((p) => !asignadosIds.includes(p.idPermiso));

        return res.json({
            success: true,
            asignados,
            noAsignados,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Error al obtener permisos" });
    }
};