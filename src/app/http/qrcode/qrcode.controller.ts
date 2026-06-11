import { NextFunction, Request, Response } from 'express';
import {
	generateQrCodeFromUrl,
	validateQrCodeUrl
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
