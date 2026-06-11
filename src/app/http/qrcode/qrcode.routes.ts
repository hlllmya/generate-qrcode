import { Router } from 'express';
import { generateQrCodeHandler } from './qrcode.controller';

const qrcodeRouter = Router();

qrcodeRouter.post('/generate', generateQrCodeHandler);

export default qrcodeRouter;
