import { Response } from 'express';
import { TBatchQrResultItem, TQrCodeOptions, TQrCodeResult, TQrCodeType, TResponseMode } from '@/libs/helpers/qrcode/types';

export const resolveResponseMode = (options?: TQrCodeOptions): TResponseMode =>
	options?.responseMode ?? 'json';

export const sendQrCodeResponse = (
	res: Response,
	message: string,
	result: TQrCodeResult,
	responseMode: TResponseMode = 'json'
): void => {
	if (responseMode === 'binary') {
		const buffer = Buffer.from(result.base64, 'base64');
		res.set('Content-Type', result.mimeType);
		res.set('Content-Disposition', `inline; filename="${result.filename}"`);
		res.set('X-QR-Content', encodeURIComponent(result.content));
		res.set('X-QR-Format', result.format);
		res.send(buffer);
		return;
	}

	const payload: Record<string, unknown> = {
		success: true,
		message,
		format: result.format,
		mimeType: result.mimeType,
		content: result.content,
		sizeBytes: result.sizeBytes,
		filename: result.filename,
		base64: result.base64
	};

	if (responseMode === 'dataUrl') {
		payload.dataUrl = result.dataUrl;
	}

	res.status(200).json(payload);
};

export const sendBatchQrResponse = (
	res: Response,
	results: TBatchQrResultItem[],
	type?: TQrCodeType
): void => {
	const successCount = results.filter((item) => item.success).length;

	res.status(200).json({
		success: true,
		message: `${successCount} dari ${results.length} QR code berhasil dibuat`,
		...(type ? { type } : {}),
		total: results.length,
		successCount,
		failedCount: results.length - successCount,
		items: results
	});
};
