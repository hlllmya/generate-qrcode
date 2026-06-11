import QRCode from 'qrcode';
import { InvalidParameterException } from '@/libs/exceptions/InvalidParameterException';

export type TQrCodeOptions = {
	width?: number;
	margin?: number;
	errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
};

export const validateQrCodeUrl = (url: unknown, fieldName = 'url'): string => {
	if (typeof url !== 'string' || url.trim() === '') {
		throw new InvalidParameterException(`${fieldName} wajib diisi dan berupa string`);
	}

	const trimmed = url.trim();

	try {
		const parsed = new URL(trimmed);
		if (!['http:', 'https:'].includes(parsed.protocol)) {
			throw new InvalidParameterException(
				`${fieldName} harus menggunakan protokol http atau https`
			);
		}
	} catch (error) {
		if (error instanceof InvalidParameterException) {
			throw error;
		}
		throw new InvalidParameterException(`${fieldName} tidak valid`);
	}

	return trimmed;
};

export const generateQrCodeSvgFromContent = async (
	content: string,
	options?: TQrCodeOptions
): Promise<string> => {
	if (typeof content !== 'string' || content.trim() === '') {
		throw new InvalidParameterException('Konten wajib diisi dan berupa string');
	}

	try {
		const svg = await QRCode.toString(content.trim(), {
			type: 'svg',
			width: options?.width,
			margin: options?.margin,
			errorCorrectionLevel: options?.errorCorrectionLevel ?? 'M'
		});
		return normalizeQrCodeSvg(svg);
	} catch {
		throw new InvalidParameterException('Gagal membuat QR code dari konten yang diberikan');
	}
};

export const generateQrCodeSvg = async (
	url: string,
	options?: TQrCodeOptions
): Promise<string> => {
	const validatedUrl = validateQrCodeUrl(url);

	return generateQrCodeSvgFromContent(validatedUrl, options);
};

export const svgToBase64 = (svg: string): string => {
	if (typeof svg !== 'string' || svg.trim() === '') {
		throw new InvalidParameterException('SVG QR code tidak valid');
	}

	return Buffer.from(svg, 'utf-8').toString('base64');
};

export const generateQrCodeFromUrl = async (
	url: string,
	options?: TQrCodeOptions
): Promise<string> => {
	const svg = await generateQrCodeSvg(url, options);

	return svgToBase64(svg);
};

export const generateQrCodeFromContent = async (
	content: string,
	options?: TQrCodeOptions
): Promise<string> => {
	const svg = await generateQrCodeSvgFromContent(content, options);

	return svgToBase64(svg);
};

export type TWifiEncryption = 'WPA' | 'WEP' | 'nopass';

export type TWifiQrPayload = {
	ssid: string;
	password: string;
	encryption: TWifiEncryption;
	hidden: boolean;
};

const escapeWifiQrField = (value: string): string =>
	value.replace(/([\\;,":])/g, '\\$1');

export const validateWifiQrPayload = (body: unknown): TWifiQrPayload => {
	const payload = body as Record<string, unknown>;

	if (typeof payload?.ssid !== 'string' || payload.ssid.trim() === '') {
		throw new InvalidParameterException('ssid wajib diisi dan berupa string');
	}

	const encryption = payload.encryption ?? 'WPA';
	if (encryption !== 'WPA' && encryption !== 'WEP' && encryption !== 'nopass') {
		throw new InvalidParameterException('encryption harus WPA, WEP, atau nopass');
	}

	const password = typeof payload.password === 'string' ? payload.password : '';
	if (encryption !== 'nopass' && password === '') {
		throw new InvalidParameterException('password wajib diisi untuk enkripsi WPA atau WEP');
	}

	return {
		ssid: payload.ssid.trim(),
		password,
		encryption,
		hidden: payload.hidden === true
	};
};

export const buildWifiQrPayload = (wifi: TWifiQrPayload): string => {
	const fields = [
		`T:${wifi.encryption}`,
		`S:${escapeWifiQrField(wifi.ssid)}`,
		`P:${escapeWifiQrField(wifi.password)}`,
		`H:${wifi.hidden}`
	];

	return `WIFI:${fields.join(';')};;`;
};

export const generateWifiQrCode = async (
	wifi: TWifiQrPayload,
	options?: TQrCodeOptions
): Promise<string> => {
	const payload = buildWifiQrPayload(wifi);

	return generateQrCodeFromContent(payload, options);
};

const normalizeQrCodeSvg = (svg: string): string => {
	const unescaped = svg.trim().replace(/\\"/g, '"');

	return unescaped.replace(/([\w-:]+)="([^"]*)"/g, "$1='$2'");
};
