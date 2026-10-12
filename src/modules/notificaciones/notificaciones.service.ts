import { EntityManager } from 'typeorm';
import { HttpError, lock, id, pagination } from '../../utils/feature';
export function notificationFilters(q: any) {
  const p = pagination(q);
  if (q.usuarioId !== undefined || q.idUsuario !== undefined) throw new HttpError(400, 'Usuario se obtiene de sesión');
  if (q.leida !== undefined && !['true', 'false'].includes(q.leida)) throw new HttpError(400, 'leida inválida');
  if (q.tipo !== undefined && (typeof q.tipo !== 'string' || !/^[a-z_]{1,30}$/.test(q.tipo))) throw new HttpError(400, 'tipo inválido');
  return { ...p, leida: q.leida === undefined ? null : q.leida === 'true', tipo: q.tipo ?? null };
}
export async function reconcile(m: EntityManager) {
  await lock(m, 'notificaciones:reconciliar');
  await m.query(`DECLARE @condiciones TABLE (Clave nvarchar(150) PRIMARY KEY,Tipo nvarchar(30),Titulo nvarchar(150),Descripcion nvarchar(500),Entidad nvarchar(50),EntidadId bigint);
    INSERT INTO @condiciones
    SELECT CONCAT('stock-',p.IdProducto,'-',b.IdBodega),'stock_bajo',LEFT(CONCAT('Stock bajo: ',p.Descripcion),150),
      CONCAT('Producto ',p.Codigo,': ',e.Stock,' unidades en ',b.Nombre,' (mínimo: ',p.ExistenciaMin,')'),'producto',p.IdProducto
    FROM INVENTARIO.Existencia e JOIN INVENTARIO.Producto p ON p.IdProducto=e.IdProducto
    JOIN INVENTARIO.Bodega b ON b.IdBodega=e.IdBodega
    WHERE p.Eliminado=0 AND e.Eliminado=0 AND b.Eliminado=0 AND e.Stock<=p.ExistenciaMin AND p.ExistenciaMin>0;
    INSERT INTO @condiciones
    SELECT CONCAT('pago-',v.IdVenta),'pago_pendiente',LEFT(CONCAT('Pago pendiente: ',v.NumeroVenta),150),
      CONCAT('Factura ',v.NumeroVenta,' por ',v.Total),'venta',v.IdVenta
    FROM VENTAS.Venta v JOIN CATALOGOS.Estado es ON es.IdEstado=v.IdEstado
    WHERE v.Eliminado=0 AND es.Codigo='FACT_PENDIENTE';
    UPDATE n SET Activa=0,FechaCierre=SYSUTCDATETIME() FROM ADMIN.Notificacion n
      WHERE n.ClaveCondicion IS NOT NULL AND n.Activa=1 AND NOT EXISTS (SELECT 1 FROM @condiciones c WHERE c.Clave=n.ClaveCondicion);
    INSERT INTO ADMIN.Notificacion (Tipo,Titulo,Descripcion,Entidad,EntidadId,UsuarioId,Leida,Fecha,ClaveCondicion,Activa)
    SELECT c.Tipo,c.Titulo,c.Descripcion,c.Entidad,c.EntidadId,NULL,0,SYSUTCDATETIME(),c.Clave,1
    FROM @condiciones c WHERE NOT EXISTS (SELECT 1 FROM ADMIN.Notificacion n WHERE n.ClaveCondicion=c.Clave AND n.Activa=1);`);
}
export async function listNotifications(m: EntityManager, user: number, q: any) {
  const { page, limit, skip, leida, tipo } = notificationFilters(q);
  await reconcile(m);
  const args = [user, leida, tipo];
  const from = `FROM ADMIN.Notificacion n LEFT JOIN ADMIN.NotificacionLectura l ON l.IdNotificacion=n.IdNotificacion AND l.UsuarioId=@0
    WHERE n.Activa=1 AND (n.UsuarioId IS NULL OR n.UsuarioId=@0)`;
  const filters = `AND (@1 IS NULL OR CASE WHEN l.IdNotificacion IS NULL THEN 0 ELSE 1 END=@1) AND (@2 IS NULL OR n.Tipo=@2)`;
  const [unread] = await m.query(`SELECT COUNT(*) AS noLeidas ${from} AND l.IdNotificacion IS NULL`, [user]);
  const [count] = await m.query(`SELECT COUNT(*) AS total ${from} ${filters}`, args);
  const data = await m.query(`SELECT CONVERT(varchar(30),n.IdNotificacion) AS id,n.Tipo AS tipo,n.Titulo AS titulo,
    n.Descripcion AS descripcion,n.Entidad AS entidad,CONVERT(varchar(30),n.EntidadId) AS entidadId,
    CAST(CASE WHEN l.IdNotificacion IS NULL THEN 0 ELSE 1 END AS bit) AS leida,n.Fecha AS fecha
    ${from} ${filters} ORDER BY n.Fecha DESC,n.IdNotificacion DESC OFFSET @3 ROWS FETCH NEXT @4 ROWS ONLY`, [...args, skip, limit]);
  return { data, noLeidas: unread.noLeidas, pagination: { page, limit, total: count.total } };
}
export async function readNotification(m: EntityManager, user: number, identifier: unknown) {
  const text = String(identifier);
  let key: string;
  if (/^(stock-\d+-\d+|pago-\d+|stock-\d+)$/.test(text)) {
    // Legacy stock-product IDs are ambiguous across warehouses: refresh instead of guessing.
    if (/^stock-\d+$/.test(text)) throw new HttpError(409, 'Actualice la lista y use el ID persistido de la bodega');
    const [n] = await m.query('SELECT CONVERT(varchar(30),IdNotificacion) AS id FROM ADMIN.Notificacion WHERE ClaveCondicion=@0 AND Activa=1 AND (UsuarioId IS NULL OR UsuarioId=@1)', [text, user]);
    if (!n) throw new HttpError(404, 'Notificación no encontrada');
    key = n.id;
  } else key = id(identifier);
  await lock(m, `notificacion-lectura:${key}:${user}`);
  const [visible] = await m.query('SELECT IdNotificacion FROM ADMIN.Notificacion WHERE IdNotificacion=@0 AND (UsuarioId IS NULL OR UsuarioId=@1)', [key, user]);
  if (!visible) throw new HttpError(404, 'Notificación no encontrada');
  await m.query(`IF NOT EXISTS (SELECT 1 FROM ADMIN.NotificacionLectura WHERE IdNotificacion=@0 AND UsuarioId=@1)
    INSERT INTO ADMIN.NotificacionLectura (IdNotificacion,UsuarioId,FechaLectura) VALUES (@0,@1,SYSUTCDATETIME())`, [key, user]);
}
