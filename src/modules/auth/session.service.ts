import { createHash } from 'node:crypto';
import { AppDataSource } from '../../../ormconfig';
export const huellaToken = (token: string) => createHash('sha256').update(token).digest('hex');
export async function sesionRevocada(token: string): Promise<boolean> {
  const rows = await AppDataSource.query('SELECT 1 AS Revocada FROM SEGURIDAD.SesionRevocada WHERE Huella=@0', [huellaToken(token)]);
  return rows.length > 0;
}
export async function revocarSesion(token: string, expira: number): Promise<void> {
  const segundosRestantes = Math.max(0, expira - Math.floor(Date.now() / 1000));
  await AppDataSource.query(`INSERT INTO SEGURIDAD.SesionRevocada(Huella,Expira)
    SELECT @0,DATEADD(SECOND,@1,SYSUTCDATETIME()) WHERE NOT EXISTS (SELECT 1 FROM SEGURIDAD.SesionRevocada WITH (UPDLOCK,HOLDLOCK) WHERE Huella=@0)`,
    [huellaToken(token), segundosRestantes]);
}
