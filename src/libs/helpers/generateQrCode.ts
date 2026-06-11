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

export const generateQrCodeSvg = async (
	url: string,
	options?: TQrCodeOptions
): Promise<string> => {
	const validatedUrl = validateQrCodeUrl(url);

	try {
		const svg = await QRCode.toString(validatedUrl, {
			type: 'svg',
			width: options?.width,
			margin: options?.margin,
			errorCorrectionLevel: options?.errorCorrectionLevel ?? 'M'
		});
		return normalizeQrCodeSvg(svg);
	} catch {
		throw new InvalidParameterException('Gagal membuat QR code dari URL yang diberikan');
	}
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

const normalizeQrCodeSvg = (svg: string): string => {
	const unescaped = svg.trim().replace(/\\"/g, '"');

	return unescaped.replace(/([\w-:]+)="([^"]*)"/g, "$1='$2'");
};
