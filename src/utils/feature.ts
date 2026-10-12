import { Response } from 'express';
import { EntityManager } from 'typeorm';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function id(value: unknown, field = 'id'): string {
  const text = String(value ?? '');
  if (!/^[1-9]\d*$/.test(text) || BigInt(text) > 9223372036854775807n) throw new HttpError(400, `${field} inválido`);
  return BigInt(text).toString();
}
export function integer(value: unknown, field: string): number {
  const n = Number(id(value, field));
  if (!Number.isSafeInteger(n) || n > 2147483647) throw new HttpError(400, `${field} inválido`);
  return n;
}
export function pagination(q: any) {
  const page = q.page === undefined ? 1 : integer(q.page, 'page');
  const limit = q.limit === undefined ? 20 : integer(q.limit, 'limit');
  if (limit > 100 || !Number.isSafeInteger((page - 1) * limit)) throw new HttpError(400, 'Paginación inválida');
  return { page, limit, skip: (page - 1) * limit };
}
export function dates(q: any) {
  const parse = (v: any) => {
    if (v === undefined) return null;
    if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(v)) throw new HttpError(400, 'Fecha UTC ISO 8601 requerida');
    const d = new Date(v);
    if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0, 19) !== v.slice(0, 19)) throw new HttpError(400, 'Fecha inválida');
    return d;
  };
  const desde = parse(q.desde), hasta = parse(q.hasta);
  if (desde && hasta && desde > hasta) throw new HttpError(400, 'Rango de fechas invertido');
  return { desde, hasta };
}
/** Fixed point: quantities scale 2, costs scale 4. No floating-point arithmetic. */
export function units(value: unknown, scale: number): bigint {
  const text = String(value);
  if (!new RegExp(`^-?\\d+(\\.\\d{1,${scale}})?$`).test(text)) throw new HttpError(400, `Decimal de hasta ${scale} posiciones requerido`);
  const negative = text.startsWith('-');
  const [whole, fraction = ''] = text.replace(/^-/, '').split('.');
  const n = BigInt(whole) * 10n ** BigInt(scale) + BigInt(fraction.padEnd(scale, '0'));
  if (n > 999999999999999999n) throw new HttpError(400, 'Decimal fuera de rango');
  return negative ? -n : n;
}
export function decimal(n: bigint, scale: number): string {
  const sign = n < 0n ? '-' : '', abs = n < 0n ? -n : n, divisor = 10n ** BigInt(scale);
  return `${sign}${abs / divisor}.${String(abs % divisor).padStart(scale, '0')}`;
}
export function quantity(value: unknown): string {
  const n = units(value, 2);
  if (n <= 0n) throw new HttpError(400, 'Cantidad debe ser positiva');
  return decimal(n, 2);
}
export function fail(res: Response, error: unknown) {
  return res.status(error instanceof HttpError ? error.status : 500).json({ success: false,
    message: error instanceof HttpError ? error.message : 'Error interno del servidor' });
}
/** Transaction-owned application lock; SQL Server rejects failures explicitly. */
export async function lock(manager: EntityManager, resource: string) {
  const [r] = await manager.query(`DECLARE @result int;
    EXEC @result=sys.sp_getapplock @Resource=@0,@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=15000;
    SELECT @result AS result`, [resource]);
  if (!r || r.result < 0) throw new HttpError(409, 'Operación concurrente; reintente');
}
