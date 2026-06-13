import { Router } from 'express';
import {
	createQrCodeHandler,
	generateBatchQrCodeHandler,
	generateAppQrCodeHandler,
	generateEmailQrCodeHandler,
	generateEventQrCodeHandler,
	generateLocationQrCodeHandler,
	generatePhoneQrCodeHandler,
	generateQrCodeHandler,
	generateSmsQrCodeHandler,
	generateSocialQrCodeHandler,
	generateTextQrCodeHandler,
	generateUtmQrCodeHandler,
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
qrcodeRouter.post('/generate-location', generateLocationQrCodeHandler);
qrcodeRouter.post('/generate-phone', generatePhoneQrCodeHandler);
qrcodeRouter.post('/generate-sms', generateSmsQrCodeHandler);
qrcodeRouter.post('/generate-utm', generateUtmQrCodeHandler);
qrcodeRouter.post('/generate-event', generateEventQrCodeHandler);
qrcodeRouter.post('/generate-social', generateSocialQrCodeHandler);
qrcodeRouter.post('/generate-app', generateAppQrCodeHandler);

export default qrcodeRouter;
