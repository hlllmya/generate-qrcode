import { Router } from 'express';
import {
	createQrCodeHandler,
	generateBatchQrCodeHandler,
	generateEmailQrCodeHandler,
	generateQrCodeHandler,
	generateTextQrCodeHandler,
	generateVcardQrCodeHandler,
	generateWhatsAppQrCodeHandler,
	generateWifiQrCodeHandler,
	getQrCodeInfoHandler,
	previewQrCodeHandler
} from './qrcode.controller';

const qrcodeRouter = Router();

qrcodeRouter.get('/', getQrCodeInfoHandler);
qrcodeRouter.get('/preview', previewQrCodeHandler);
qrcodeRouter.post('/create', createQrCodeHandler);
qrcodeRouter.post('/generate', generateQrCodeHandler);
qrcodeRouter.post('/generate-batch', generateBatchQrCodeHandler);
qrcodeRouter.post('/generate-text', generateTextQrCodeHandler);
qrcodeRouter.post('/generate-whatsapp', generateWhatsAppQrCodeHandler);
qrcodeRouter.post('/generate-email', generateEmailQrCodeHandler);
qrcodeRouter.post('/generate-wifi', generateWifiQrCodeHandler);
qrcodeRouter.post('/generate-vcard', generateVcardQrCodeHandler);

export default qrcodeRouter;
