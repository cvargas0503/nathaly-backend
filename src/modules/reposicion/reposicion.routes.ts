import { Router } from 'express';
import { AppDataSource } from '../../../ormconfig';
import { fail } from '../../utils/feature';
import { queryReplenishment } from './reposicion.service';
const router = Router();
for (const [path, summary] of [['/', false], ['/resumen', true]] as const) {
  router.get(path, (async (req: any, res: any) => {
    try {
      const result = await AppDataSource.transaction('REPEATABLE READ', m => queryReplenishment(m, req.query, summary));
      res.json({ success: true, ...result });
    } catch (e) { fail(res, e); }
  }) as any);
}
export default router;
