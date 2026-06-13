import { NextFunction, Request, Response } from 'express';
import {
	generateBatchQrCodes,
	generateEmailQrCode,
	generateQrCodeFromUrl,
	generateTextQrCode,
	generateVcardQrCode,
	generateWhatsAppQrCode,
	generateWifiQrCode,
	TQrCodeResult,
	validateBatchQrPayload,
	validateEmailQrPayload,
	validateQrCodeOptions,
	validateQrCodeUrl,
	validateTextQrPayload,
	validateVcardQrPayload,
	validateWhatsAppQrPayload,
	validateWifiQrPayload
} from '@/libs/helpers/generateQrCode';

const sendQrCodeResponse = (
	res: Response,
	message: string,
	result: TQrCodeResult
): void => {
	res.status(200).json({
		success: true,
		message,
		format: result.format,
		mimeType: result.mimeType,
		base64: result.base64
	});
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

		sendQrCodeResponse(res, 'QR code berhasil dibuat', result);
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

		sendQrCodeResponse(res, 'QR code teks berhasil dibuat', result);
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

		sendQrCodeResponse(res, 'QR code WhatsApp berhasil dibuat', result);
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

		sendQrCodeResponse(res, 'QR code email berhasil dibuat', result);
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

		sendQrCodeResponse(res, 'QR code WiFi berhasil dibuat', result);
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

		sendQrCodeResponse(res, 'QR code kontak berhasil dibuat', result);
	} catch (error) {
		next(error);
	}
};
