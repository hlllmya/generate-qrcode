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

export type TVcardQrPayload = {
	fullName: string;
	organization?: string;
	phone?: string;
	email?: string;
	website?: string;
	address?: string;
};

const escapeVcardField = (value: string): string =>
	value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

const validateOptionalEmail = (email: unknown): string | undefined => {
	if (email === undefined || email === null || email === '') {
		return undefined;
	}

	if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
		throw new InvalidParameterException('email tidak valid');
	}

	return email.trim();
};

const validateOptionalUrl = (url: unknown, fieldName: string): string | undefined => {
	if (url === undefined || url === null || url === '') {
		return undefined;
	}

	return validateQrCodeUrl(url, fieldName);
};

const validateOptionalString = (value: unknown, fieldName: string): string | undefined => {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}

	if (typeof value !== 'string' || value.trim() === '') {
		throw new InvalidParameterException(`${fieldName} harus berupa string`);
	}

	return value.trim();
};

export const validateVcardQrPayload = (body: unknown): TVcardQrPayload => {
	const payload = body as Record<string, unknown>;

	const fullName = validateOptionalString(payload?.fullName, 'fullName');
	if (!fullName) {
		throw new InvalidParameterException('fullName wajib diisi dan berupa string');
	}

	return {
		fullName,
		organization: validateOptionalString(payload.organization, 'organization'),
		phone: validateOptionalString(payload.phone, 'phone'),
		email: validateOptionalEmail(payload.email),
		website: validateOptionalUrl(payload.website, 'website'),
		address: validateOptionalString(payload.address, 'address')
	};
};

export const buildVcardQrPayload = (contact: TVcardQrPayload): string => {
	const lines = [
		'BEGIN:VCARD',
		'VERSION:3.0',
		`FN:${escapeVcardField(contact.fullName)}`,
		`N:;${escapeVcardField(contact.fullName)};;;`
	];

	if (contact.organization) {
		lines.push(`ORG:${escapeVcardField(contact.organization)}`);
	}

	if (contact.phone) {
		lines.push(`TEL;TYPE=CELL:${escapeVcardField(contact.phone)}`);
	}

	if (contact.email) {
		lines.push(`EMAIL:${escapeVcardField(contact.email)}`);
	}

	if (contact.website) {
		lines.push(`URL:${escapeVcardField(contact.website)}`);
	}

	if (contact.address) {
		lines.push(`ADR;TYPE=WORK:;;${escapeVcardField(contact.address)};;;;`);
	}

	lines.push('END:VCARD');

	return lines.join('\n');
};

export const generateVcardQrCode = async (
	contact: TVcardQrPayload,
	options?: TQrCodeOptions
): Promise<string> => {
	const payload = buildVcardQrPayload(contact);

	return generateQrCodeFromContent(payload, options);
};

const normalizeQrCodeSvg = (svg: string): string => {
	const unescaped = svg.trim().replace(/\\"/g, '"');

	return unescaped.replace(/([\w-:]+)="([^"]*)"/g, "$1='$2'");
};
