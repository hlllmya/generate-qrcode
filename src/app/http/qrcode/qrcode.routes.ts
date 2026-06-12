import { Router } from 'express';
import {
	generateQrCodeHandler,
	generateVcardQrCodeHandler,
	generateWifiQrCodeHandler
} from './qrcode.controller';

const qrcodeRouter = Router();

qrcodeRouter.post('/generate', generateQrCodeHandler);
qrcodeRouter.post('/generate-wifi', generateWifiQrCodeHandler);
qrcodeRouter.post('/generate-vcard', generateVcardQrCodeHandler);

export default qrcodeRouter;
