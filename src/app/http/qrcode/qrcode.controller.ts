import { NextFunction, Request, Response } from 'express';
import { TSingleQrCodeType } from '@/libs/helpers/qrcode/types';
import {
	generateBatchFromUnifiedData,
	generateBatchQrCodes,
	generateQrByType,
	getQrCodeApiInfo,
	previewUrlQrCode,
	validateBatchQrPayload,
	validateQrCodeUrl,
	validateUnifiedQrPayload
} from '@/libs/helpers/qrcode';
import { parseQrCodeOptionsFromQuery, validateQrCodeOptions } from '@/libs/helpers/qrcode/validators';
import {
	resolveResponseMode,
	sendBatchQrResponse,
	sendQrCodeResponse
} from './qrcode.response';

const createQrTypeHandler = (type: TSingleQrCodeType, message: string) => {
	return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const options = validateQrCodeOptions(req.body?.options);
			const result = await generateQrByType(type, req.body, options);

			sendQrCodeResponse(res, message, result, resolveResponseMode(options));
		} catch (error) {
			next(error);
		}
	};
};

export const getQrCodeInfoHandler = (_req: Request, res: Response): void => {
	res.status(200).json({
		success: true,
		data: getQrCodeApiInfo()
	});
};

export const createQrCodeHandler = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const { type, data, options } = validateUnifiedQrPayload(req.body);

		if (type === 'batch') {
			const results = await generateBatchFromUnifiedData(data, options);
			sendBatchQrResponse(res, results, type);
			return;
		}

		const result = await generateQrByType(type, data, options);
		sendQrCodeResponse(res, `QR code ${type} berhasil dibuat`, result, resolveResponseMode(options));
	} catch (error) {
		next(error);
	}
};

export const previewQrCodeHandler = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const url = validateQrCodeUrl(req.query.url, 'url');
		const options = parseQrCodeOptionsFromQuery(req.query as Record<string, unknown>);
		const responseMode = resolveResponseMode({
			...options,
			responseMode: options.responseMode ?? 'binary'
		});
		const result = await previewUrlQrCode(url, options);

		sendQrCodeResponse(res, 'QR code preview berhasil dibuat', result, responseMode);
	} catch (error) {
		next(error);
	}
};

export const generateBatchQrCodeHandler = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const { items, options } = validateBatchQrPayload(req.body);
		const results = await generateBatchQrCodes(items, options);

		sendBatchQrResponse(res, results);
	} catch (error) {
		next(error);
	}
};

export const generateQrCodeHandler = createQrTypeHandler('url', 'QR code berhasil dibuat');
export const generateTextQrCodeHandler = createQrTypeHandler('text', 'QR code teks berhasil dibuat');
export const generateWhatsAppQrCodeHandler = createQrTypeHandler('whatsapp', 'QR code WhatsApp berhasil dibuat');
export const generateEmailQrCodeHandler = createQrTypeHandler('email', 'QR code email berhasil dibuat');
export const generateWifiQrCodeHandler = createQrTypeHandler('wifi', 'QR code WiFi berhasil dibuat');
export const generateVcardQrCodeHandler = createQrTypeHandler('vcard', 'QR code kontak berhasil dibuat');
export const generateLocationQrCodeHandler = createQrTypeHandler('location', 'QR code lokasi berhasil dibuat');
export const generatePhoneQrCodeHandler = createQrTypeHandler('phone', 'QR code telepon berhasil dibuat');
export const generateSmsQrCodeHandler = createQrTypeHandler('sms', 'QR code SMS berhasil dibuat');
export const generateUtmQrCodeHandler = createQrTypeHandler('utm', 'QR code UTM berhasil dibuat');
export const generateEventQrCodeHandler = createQrTypeHandler('event', 'QR code event berhasil dibuat');
export const generateSocialQrCodeHandler = createQrTypeHandler('social', 'QR code media sosial berhasil dibuat');
export const generateAppQrCodeHandler = createQrTypeHandler('app', 'QR code aplikasi berhasil dibuat');
export const generateFormQrCodeHandler = createQrTypeHandler('form', 'QR code formulir berhasil dibuat');
