import { InvalidParameterException } from '@/libs/exceptions/InvalidParameterException';
import {
	BATCH_QR_MAX_ITEMS,
	TBatchQrItem,
	TBatchQrResultItem,
	TQrCodeOptions
} from './types';
import { generateQrCodeFromUrl } from './core';
import { validateQrCodeOptions, validateQrCodeUrl } from './validators';

export const validateBatchQrPayload = (
	body: unknown
): { items: TBatchQrItem[]; options: TQrCodeOptions } => {
	const payload = body as Record<string, unknown>;

	if (!Array.isArray(payload?.items) || payload.items.length === 0) {
		throw new InvalidParameterException('items wajib diisi dan berupa array yang tidak kosong');
	}

	if (payload.items.length > BATCH_QR_MAX_ITEMS) {
		throw new InvalidParameterException(`items maksimal ${BATCH_QR_MAX_ITEMS} item per request`);
	}

	const items = payload.items.map((item, index) => {
		if (typeof item !== 'object' || item === null) {
			throw new InvalidParameterException(`items[${index}] harus berupa object`);
		}

		const entry = item as Record<string, unknown>;
		const url = validateQrCodeUrl(entry.url, `items[${index}].url`);

		return {
			id: typeof entry.id === 'string' && entry.id.trim() !== '' ? entry.id.trim() : undefined,
			url
		};
	});

	return {
		items,
		options: validateQrCodeOptions(payload.options)
	};
};

export const generateBatchQrCodes = async (
	items: TBatchQrItem[],
	options?: TQrCodeOptions
): Promise<TBatchQrResultItem[]> => {
	return Promise.all(
		items.map(async (item): Promise<TBatchQrResultItem> => {
			try {
				const result = await generateQrCodeFromUrl(item.url, options);

				return {
					id: item.id,
					url: item.url,
					success: true,
					content: result.content,
					format: result.format,
					mimeType: result.mimeType,
					dataUrl: result.dataUrl,
					base64: result.base64,
					sizeBytes: result.sizeBytes,
					filename: result.filename
				};
			} catch (error) {
				return {
					id: item.id,
					url: item.url,
					success: false,
					message: error instanceof Error ? error.message : 'Gagal membuat QR code'
				};
			}
		})
	);
};
