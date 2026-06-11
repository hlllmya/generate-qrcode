import { Router } from 'express';
import { generateQrCodeHandler, generateWifiQrCodeHandler } from './qrcode.controller';

const qrcodeRouter = Router();

qrcodeRouter.post('/generate', generateQrCodeHandler);
qrcodeRouter.post('/generate-wifi', generateWifiQrCodeHandler);

export default qrcodeRouter;
