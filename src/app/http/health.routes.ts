import { Request, Response, Router } from 'express';
import { APP_NAME, APP_VERSION, NODE_ENV } from '@/libs/config';

const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
	res.status(200).json({
		success: true,
		status: 'ok',
		service: APP_NAME,
		version: APP_VERSION,
		environment: NODE_ENV,
		timestamp: new Date().toISOString()
	});
});

export default healthRouter;
