import { APP_NAME, APP_VERSION } from '@/libs/config';
import { InvalidParameterException } from '@/libs/exceptions/InvalidParameterException';
import { generateBatchQrCodes, validateBatchQrPayload } from './batch';
import { generateQrCodeFromUrl, generateQrCodeOutput } from './core';
import { resolveQrContent } from './registry';
import {
	BATCH_QR_MAX_ITEMS,
	QR_CODE_TYPES,
	TBatchQrItem,
	TBatchQrResultItem,
	TQrCodeOptions,
	TQrCodeResult,
	TQrCodeType
} from './types';
import { validateQrCodeOptions } from './validators';

export type TUnifiedQrPayload = {
	type: TQrCodeType;
	data: unknown;
	options: TQrCodeOptions;
};

export const validateUnifiedQrPayload = (body: unknown): TUnifiedQrPayload => {
	const payload = body as Record<string, unknown>;

	if (typeof payload?.type !== 'string' || !QR_CODE_TYPES.includes(payload.type as TQrCodeType)) {
		throw new InvalidParameterException(
			`type wajib diisi dan harus salah satu dari: ${QR_CODE_TYPES.join(', ')}`
		);
	}

	if (payload.data === undefined || payload.data === null) {
		throw new InvalidParameterException('data wajib diisi');
	}

	return {
		type: payload.type as TQrCodeType,
		data: payload.data,
		options: validateQrCodeOptions(payload.options)
	};
};

export const generateQrByType = async (
	type: TQrCodeType,
	data: unknown,
	options?: TQrCodeOptions
): Promise<TQrCodeResult> => {
	if (type === 'batch') {
		throw new InvalidParameterException('type batch tidak didukung pada generate tunggal');
	}

	const content = resolveQrContent(type, data);

	return generateQrCodeOutput(content, options, type);
};

export const generateBatchFromUnifiedData = async (
	data: unknown,
	options?: TQrCodeOptions
): Promise<TBatchQrResultItem[]> => {
	const payload = data as Record<string, unknown>;

	if (!Array.isArray(payload?.items) || payload.items.length === 0) {
		throw new InvalidParameterException('data.items wajib diisi dan berupa array yang tidak kosong');
	}

	const { items, options: batchOptions } = validateBatchQrPayload({
		items: payload.items,
		options
	});

	return generateBatchQrCodes(items as TBatchQrItem[], batchOptions);
};

export const getQrCodeApiInfo = () => ({
	name: APP_NAME,
	version: APP_VERSION,
	description: 'Layanan pembuatan QR code untuk integrasi CMS',
	types: QR_CODE_TYPES.filter((type) => type !== 'batch'),
	supportedFormats: ['svg', 'png'],
	supportedResponseModes: ['json', 'binary', 'dataUrl'],
	batchLimit: BATCH_QR_MAX_ITEMS,
	endpoints: {
		info: { method: 'GET', path: '/qrcode' },
		health: { method: 'GET', path: '/health' },
		create: {
			method: 'POST',
			path: '/qrcode/create',
			description: 'Endpoint terpadu — semua tipe QR dalam satu request'
		},
		preview: {
			method: 'GET',
			path: '/qrcode/preview',
			description: 'Preview QR URL langsung sebagai gambar (cocok untuk tag img)'
		},
		generate: { method: 'POST', path: '/qrcode/generate' },
		generateBatch: { method: 'POST', path: '/qrcode/generate-batch' },
		generateText: { method: 'POST', path: '/qrcode/generate-text' },
		generateWhatsapp: { method: 'POST', path: '/qrcode/generate-whatsapp' },
		generateEmail: { method: 'POST', path: '/qrcode/generate-email' },
		generateWifi: { method: 'POST', path: '/qrcode/generate-wifi' },
		generateVcard: { method: 'POST', path: '/qrcode/generate-vcard' },
		generateLocation: { method: 'POST', path: '/qrcode/generate-location' },
		generatePhone: { method: 'POST', path: '/qrcode/generate-phone' },
		generateSms: { method: 'POST', path: '/qrcode/generate-sms' },
		generateUtm: { method: 'POST', path: '/qrcode/generate-utm' },
		generateEvent: { method: 'POST', path: '/qrcode/generate-event' },
		generateSocial: { method: 'POST', path: '/qrcode/generate-social' },
		generateApp: { method: 'POST', path: '/qrcode/generate-app' },
		generateForm: { method: 'POST', path: '/qrcode/generate-form' }
	},
	options: {
		width: '100-2000 (px)',
		margin: '0-20',
		errorCorrectionLevel: 'L | M | Q | H',
		darkColor: 'hex color (#000000)',
		lightColor: 'hex color (#ffffff)',
		format: 'svg | png',
		responseMode: 'json | binary | dataUrl'
	},
	examples: {
		createUrl: {
			type: 'url',
			data: { url: 'https://contoh.com' },
			options: { format: 'png', width: 400, responseMode: 'json' }
		},
		createWhatsapp: {
			type: 'whatsapp',
			data: { phone: '6281234567890', message: 'Halo' },
			options: { format: 'png' }
		},
		createLocation: {
			type: 'location',
			data: { latitude: -6.2088, longitude: 106.8456, label: 'Jakarta' },
			options: { format: 'png' }
		},
		createUtm: {
			type: 'utm',
			data: {
				url: 'https://contoh.com/promo',
				utm_source: 'qrcode',
				utm_medium: 'print',
				utm_campaign: 'summer-sale'
			},
			options: { format: 'png' }
		},
		preview: '/qrcode/preview?url=https://contoh.com&format=png&width=300'
	}
});

export const previewUrlQrCode = async (
	url: string,
	options?: TQrCodeOptions
): Promise<TQrCodeResult> => {
	return generateQrCodeFromUrl(url, options);
};
