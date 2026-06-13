import { NextFunction, Request, Response } from 'express';
import {
	generateBatchQrCodes,
	generateAppQrCode,
	generateEmailQrCode,
	generateEventQrCode,
	generateLocationQrCode,
	generatePhoneQrCode,
	generateQrCodeFromUrl,
	generateSmsQrCode,
	generateSocialQrCode,
	generateTextQrCode,
	generateUtmQrCode,
	generateVcardQrCode,
	generateWhatsAppQrCode,
	generateWifiQrCode,
	parseQrCodeOptionsFromQuery,
	validateBatchQrPayload,
	validateAppQrPayload,
	validateEmailQrPayload,
	validateEventQrPayload,
	validateLocationQrPayload,
	validatePhoneQrPayload,
	validateQrCodeOptions,
	validateQrCodeUrl,
	validateSmsQrPayload,
	validateSocialQrPayload,
	validateTextQrPayload,
	validateUtmQrPayload,
	validateVcardQrPayload,
	validateWhatsAppQrPayload,
	validateWifiQrPayload
} from '@/libs/helpers/generateQrCode';
import {
	generateBatchFromUnifiedData,
	generateQrByType,
	getQrCodeApiInfo,
	previewUrlQrCode,
	validateUnifiedQrPayload
} from '@/libs/helpers/qrcode.service';
import { resolveResponseMode, sendQrCodeResponse } from './qrcode.response';

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
		const responseMode = resolveResponseMode(options);

		if (type === 'batch') {
			const results = await generateBatchFromUnifiedData(data, options);
			const successCount = results.filter((item) => item.success).length;

			res.status(200).json({
				success: true,
				message: `${successCount} dari ${results.length} QR code berhasil dibuat`,
				type,
				total: results.length,
				successCount,
				failedCount: results.length - successCount,
				items: results
			});
			return;
		}

		const result = await generateQrByType(type, data, options);
		sendQrCodeResponse(res, `QR code ${type} berhasil dibuat`, result, responseMode);
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

export const generateQrCodeHandler = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const url = validateQrCodeUrl(req.body?.url);
		const options = validateQrCodeOptions(req.body?.options);
		const result = await generateQrCodeFromUrl(url, options);

		sendQrCodeResponse(res, 'QR code berhasil dibuat', result, resolveResponseMode(options));
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
		const successCount = results.filter((item) => item.success).length;

		res.status(200).json({
			success: true,
			message: `${successCount} dari ${results.length} QR code berhasil dibuat`,
			total: results.length,
			successCount,
			failedCount: results.length - successCount,
			items: results
		});
	} catch (error) {
		next(error);
	}
};

export const generateTextQrCodeHandler = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const { text } = validateTextQrPayload(req.body);
		const options = validateQrCodeOptions(req.body?.options);
		const result = await generateTextQrCode(text, options);

		sendQrCodeResponse(res, 'QR code teks berhasil dibuat', result, resolveResponseMode(options));
	} catch (error) {
		next(error);
	}
};

export const generateWhatsAppQrCodeHandler = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const whatsapp = validateWhatsAppQrPayload(req.body);
		const options = validateQrCodeOptions(req.body?.options);
		const result = await generateWhatsAppQrCode(whatsapp, options);

		sendQrCodeResponse(res, 'QR code WhatsApp berhasil dibuat', result, resolveResponseMode(options));
	} catch (error) {
		next(error);
	}
};

export const generateEmailQrCodeHandler = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const emailQr = validateEmailQrPayload(req.body);
		const options = validateQrCodeOptions(req.body?.options);
		const result = await generateEmailQrCode(emailQr, options);

		sendQrCodeResponse(res, 'QR code email berhasil dibuat', result, resolveResponseMode(options));
	} catch (error) {
		next(error);
	}
};

export const generateWifiQrCodeHandler = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const wifi = validateWifiQrPayload(req.body);
		const options = validateQrCodeOptions(req.body?.options);
		const result = await generateWifiQrCode(wifi, options);

		sendQrCodeResponse(res, 'QR code WiFi berhasil dibuat', result, resolveResponseMode(options));
	} catch (error) {
		next(error);
	}
};

export const generateVcardQrCodeHandler = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const contact = validateVcardQrPayload(req.body);
		const options = validateQrCodeOptions(req.body?.options);
		const result = await generateVcardQrCode(contact, options);

		sendQrCodeResponse(res, 'QR code kontak berhasil dibuat', result, resolveResponseMode(options));
	} catch (error) {
		next(error);
	}
};

export const generateLocationQrCodeHandler = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const location = validateLocationQrPayload(req.body);
		const options = validateQrCodeOptions(req.body?.options);
		const result = await generateLocationQrCode(location, options);

		sendQrCodeResponse(res, 'QR code lokasi berhasil dibuat', result, resolveResponseMode(options));
	} catch (error) {
		next(error);
	}
};

export const generatePhoneQrCodeHandler = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const phoneQr = validatePhoneQrPayload(req.body);
		const options = validateQrCodeOptions(req.body?.options);
		const result = await generatePhoneQrCode(phoneQr, options);

		sendQrCodeResponse(res, 'QR code telepon berhasil dibuat', result, resolveResponseMode(options));
	} catch (error) {
		next(error);
	}
};

export const generateSmsQrCodeHandler = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const sms = validateSmsQrPayload(req.body);
		const options = validateQrCodeOptions(req.body?.options);
		const result = await generateSmsQrCode(sms, options);

		sendQrCodeResponse(res, 'QR code SMS berhasil dibuat', result, resolveResponseMode(options));
	} catch (error) {
		next(error);
	}
};

export const generateUtmQrCodeHandler = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const utm = validateUtmQrPayload(req.body);
		const options = validateQrCodeOptions(req.body?.options);
		const result = await generateUtmQrCode(utm, options);

		sendQrCodeResponse(res, 'QR code UTM berhasil dibuat', result, resolveResponseMode(options));
	} catch (error) {
		next(error);
	}
};

export const generateEventQrCodeHandler = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const event = validateEventQrPayload(req.body);
		const options = validateQrCodeOptions(req.body?.options);
		const result = await generateEventQrCode(event, options);

		sendQrCodeResponse(res, 'QR code event berhasil dibuat', result, resolveResponseMode(options));
	} catch (error) {
		next(error);
	}
};

export const generateSocialQrCodeHandler = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const social = validateSocialQrPayload(req.body);
		const options = validateQrCodeOptions(req.body?.options);
		const result = await generateSocialQrCode(social, options);

		sendQrCodeResponse(res, 'QR code media sosial berhasil dibuat', result, resolveResponseMode(options));
	} catch (error) {
		next(error);
	}
};

export const generateAppQrCodeHandler = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const app = validateAppQrPayload(req.body);
		const options = validateQrCodeOptions(req.body?.options);
		const result = await generateAppQrCode(app, options);

		sendQrCodeResponse(res, 'QR code aplikasi berhasil dibuat', result, resolveResponseMode(options));
	} catch (error) {
		next(error);
	}
};
