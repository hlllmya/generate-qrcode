import { Router } from 'express';
import {
	generateBatchQrCodeHandler,
	generateEmailQrCodeHandler,
	generateQrCodeHandler,
	generateTextQrCodeHandler,
	generateVcardQrCodeHandler,
	generateWhatsAppQrCodeHandler,
	generateWifiQrCodeHandler
} from './qrcode.controller';

const qrcodeRouter = Router();

qrcodeRouter.post('/generate', generateQrCodeHandler);
qrcodeRouter.post('/generate-batch', generateBatchQrCodeHandler);
qrcodeRouter.post('/generate-text', generateTextQrCodeHandler);
qrcodeRouter.post('/generate-whatsapp', generateWhatsAppQrCodeHandler);
qrcodeRouter.post('/generate-email', generateEmailQrCodeHandler);
qrcodeRouter.post('/generate-wifi', generateWifiQrCodeHandler);
qrcodeRouter.post('/generate-vcard', generateVcardQrCodeHandler);

export default qrcodeRouter;
