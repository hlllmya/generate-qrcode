import { NextFunction, Request, Response } from 'express';
import {
	generateQrCodeFromUrl,
	generateWifiQrCode,
	validateQrCodeUrl,
	validateWifiQrPayload
} from '@/libs/helpers/generateQrCode';

export const generateQrCodeHandler = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const url = validateQrCodeUrl(req.body?.url);
		const base64 = await generateQrCodeFromUrl(url);

		res.status(200).json({
			success: true,
			message: 'QR code berhasil dibuat',
			base64
		});
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
		const base64 = await generateWifiQrCode(wifi);

		res.status(200).json({
			success: true,
			message: 'QR code WiFi berhasil dibuat',
			base64
		});
	} catch (error) {
		next(error);
	}
};
