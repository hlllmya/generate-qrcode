import QRCode from 'qrcode';
import { InvalidParameterException } from '@/libs/exceptions/InvalidParameterException';

export type TQrCodeFormat = 'svg' | 'png';
export type TResponseMode = 'json' | 'binary' | 'dataUrl';
export type TQrCodeType =
	| 'url'
	| 'text'
	| 'wifi'
	| 'vcard'
	| 'whatsapp'
	| 'email'
	| 'location'
	| 'phone'
	| 'sms'
	| 'utm'
	| 'event'
	| 'social'
	| 'app'
	| 'batch';

export type TQrCodeOptions = {
	width?: number;
	margin?: number;
	errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
	darkColor?: string;
	lightColor?: string;
	format?: TQrCodeFormat;
	responseMode?: TResponseMode;
};

export type TQrCodeResult = {
	base64: string;
	dataUrl: string;
	format: TQrCodeFormat;
	mimeType: string;
	content: string;
	sizeBytes: number;
	filename: string;
};

export const BATCH_QR_MAX_ITEMS = 50;

const HEX_COLOR_PATTERN = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

const validateHexColor = (color: unknown, fieldName: string): string | undefined => {
	if (color === undefined || color === null || color === '') {
		return undefined;
	}

	if (typeof color !== 'string' || !HEX_COLOR_PATTERN.test(color.trim())) {
		throw new InvalidParameterException(`${fieldName} harus berupa kode warna hex (#RGB atau #RRGGBB)`);
	}

	return color.trim();
};

export const validateQrCodeOptions = (options: unknown): TQrCodeOptions => {
	if (options === undefined || options === null) {
		return {};
	}

	if (typeof options !== 'object') {
		throw new InvalidParameterException('options harus berupa object');
	}

	const raw = options as Record<string, unknown>;
	const validated: TQrCodeOptions = {};

	if (raw.width !== undefined) {
		if (typeof raw.width !== 'number' || !Number.isInteger(raw.width) || raw.width < 100 || raw.width > 2000) {
			throw new InvalidParameterException('width harus bilangan bulat antara 100 dan 2000');
		}
		validated.width = raw.width;
	}

	if (raw.margin !== undefined) {
		if (typeof raw.margin !== 'number' || !Number.isInteger(raw.margin) || raw.margin < 0 || raw.margin > 20) {
			throw new InvalidParameterException('margin harus bilangan bulat antara 0 dan 20');
		}
		validated.margin = raw.margin;
	}

	if (raw.errorCorrectionLevel !== undefined) {
		if (!['L', 'M', 'Q', 'H'].includes(raw.errorCorrectionLevel as string)) {
			throw new InvalidParameterException('errorCorrectionLevel harus L, M, Q, atau H');
		}
		validated.errorCorrectionLevel = raw.errorCorrectionLevel as TQrCodeOptions['errorCorrectionLevel'];
	}

	const darkColor = validateHexColor(raw.darkColor, 'darkColor');
	if (darkColor) {
		validated.darkColor = darkColor;
	}

	const lightColor = validateHexColor(raw.lightColor, 'lightColor');
	if (lightColor) {
		validated.lightColor = lightColor;
	}

	if (raw.format !== undefined) {
		if (raw.format !== 'svg' && raw.format !== 'png') {
			throw new InvalidParameterException('format harus svg atau png');
		}
		validated.format = raw.format;
	}

	if (raw.responseMode !== undefined) {
		if (raw.responseMode !== 'json' && raw.responseMode !== 'binary' && raw.responseMode !== 'dataUrl') {
			throw new InvalidParameterException('responseMode harus json, binary, atau dataUrl');
		}
		validated.responseMode = raw.responseMode;
	}

	return validated;
};

export const parseQrCodeOptionsFromQuery = (query: Record<string, unknown>): TQrCodeOptions => {
	const raw: Record<string, unknown> = {};

	if (query.format !== undefined) raw.format = query.format;
	if (query.responseMode !== undefined) raw.responseMode = query.responseMode;
	if (query.errorCorrectionLevel !== undefined) raw.errorCorrectionLevel = query.errorCorrectionLevel;
	if (query.darkColor !== undefined) raw.darkColor = query.darkColor;
	if (query.lightColor !== undefined) raw.lightColor = query.lightColor;

	if (query.width !== undefined) {
		const width = Number(query.width);
		if (!Number.isNaN(width)) raw.width = width;
	}

	if (query.margin !== undefined) {
		const margin = Number(query.margin);
		if (!Number.isNaN(margin)) raw.margin = margin;
	}

	return validateQrCodeOptions(raw);
};

const buildQrFilename = (type: string, format: TQrCodeFormat): string =>
	`qrcode-${type}-${Date.now()}.${format}`;

const buildEnhancedResult = (
	content: string,
	format: TQrCodeFormat,
	mimeType: string,
	base64: string,
	type = 'content'
): TQrCodeResult => ({
	base64,
	dataUrl: `data:${mimeType};base64,${base64}`,
	format,
	mimeType,
	content,
	sizeBytes: Buffer.byteLength(base64, 'base64'),
	filename: buildQrFilename(type, format)
});

const buildQrCodeRenderOptions = (options?: TQrCodeOptions) => {
	const renderOptions: QRCode.QRCodeToStringOptions & QRCode.QRCodeToBufferOptions = {
		width: options?.width,
		margin: options?.margin,
		errorCorrectionLevel: options?.errorCorrectionLevel ?? 'M'
	};

	if (options?.darkColor || options?.lightColor) {
		renderOptions.color = {
			dark: options.darkColor ?? '#000000',
			light: options.lightColor ?? '#ffffff'
		};
	}

	return renderOptions;
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
			...buildQrCodeRenderOptions(options),
			type: 'svg'
		});
		return normalizeQrCodeSvg(svg);
	} catch {
		throw new InvalidParameterException('Gagal membuat QR code dari konten yang diberikan');
	}
};

export const generateQrCodePngFromContent = async (
	content: string,
	options?: TQrCodeOptions
): Promise<string> => {
	if (typeof content !== 'string' || content.trim() === '') {
		throw new InvalidParameterException('Konten wajib diisi dan berupa string');
	}

	try {
		const buffer = await QRCode.toBuffer(content.trim(), {
			...buildQrCodeRenderOptions(options),
			type: 'png'
		});

		return buffer.toString('base64');
	} catch {
		throw new InvalidParameterException('Gagal membuat QR code dari konten yang diberikan');
	}
};

export const generateQrCodeOutput = async (
	content: string,
	options?: TQrCodeOptions,
	type = 'content'
): Promise<TQrCodeResult> => {
	const format = options?.format ?? 'svg';

	if (format === 'png') {
		const base64 = await generateQrCodePngFromContent(content, options);

		return buildEnhancedResult(content, 'png', 'image/png', base64, type);
	}

	const base64 = svgToBase64(await generateQrCodeSvgFromContent(content, options));

	return buildEnhancedResult(content, 'svg', 'image/svg+xml', base64, type);
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
): Promise<TQrCodeResult> => {
	const validatedUrl = validateQrCodeUrl(url);

	return generateQrCodeOutput(validatedUrl, options, 'url');
};

export const generateQrCodeFromContent = async (
	content: string,
	options?: TQrCodeOptions,
	type = 'content'
): Promise<TQrCodeResult> => {
	return generateQrCodeOutput(content, options, type);
};

export type TBatchQrItem = {
	id?: string;
	url: string;
};

export type TBatchQrResultItem = {
	id?: string;
	url: string;
	success: boolean;
	message?: string;
	content?: string;
	format?: TQrCodeFormat;
	mimeType?: string;
	dataUrl?: string;
	base64?: string;
	sizeBytes?: number;
	filename?: string;
};

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

export type TTextQrPayload = {
	text: string;
};

export const validateTextQrPayload = (body: unknown): TTextQrPayload => {
	const payload = body as Record<string, unknown>;

	if (typeof payload?.text !== 'string' || payload.text.trim() === '') {
		throw new InvalidParameterException('text wajib diisi dan berupa string');
	}

	if (payload.text.length > 2000) {
		throw new InvalidParameterException('text maksimal 2000 karakter');
	}

	return { text: payload.text.trim() };
};

export const generateTextQrCode = async (
	text: string,
	options?: TQrCodeOptions
): Promise<TQrCodeResult> => {
	return generateQrCodeFromContent(text, options, 'text');
};

export type TWhatsAppQrPayload = {
	phone: string;
	message: string;
};

export const validateWhatsAppQrPayload = (body: unknown): TWhatsAppQrPayload => {
	const payload = body as Record<string, unknown>;

	if (typeof payload?.phone !== 'string' || payload.phone.trim() === '') {
		throw new InvalidParameterException('phone wajib diisi dan berupa string');
	}

	const phone = payload.phone.replace(/[\s\-+()]/g, '');
	if (!/^\d{8,15}$/.test(phone)) {
		throw new InvalidParameterException('phone harus berupa nomor valid (8-15 digit)');
	}

	const message = typeof payload.message === 'string' ? payload.message : '';
	if (message.length > 1000) {
		throw new InvalidParameterException('message maksimal 1000 karakter');
	}

	return { phone, message };
};

export const buildWhatsAppUrl = (whatsapp: TWhatsAppQrPayload): string => {
	const baseUrl = `https://wa.me/${whatsapp.phone}`;

	if (!whatsapp.message) {
		return baseUrl;
	}

	return `${baseUrl}?text=${encodeURIComponent(whatsapp.message)}`;
};

export const generateWhatsAppQrCode = async (
	whatsapp: TWhatsAppQrPayload,
	options?: TQrCodeOptions
): Promise<TQrCodeResult> => {
	const url = buildWhatsAppUrl(whatsapp);

	return generateQrCodeOutput(url, options, 'whatsapp');
};

export type TEmailQrPayload = {
	email: string;
	subject: string;
	body: string;
};

export const validateEmailQrPayload = (body: unknown): TEmailQrPayload => {
	const payload = body as Record<string, unknown>;

	if (typeof payload?.email !== 'string' || payload.email.trim() === '') {
		throw new InvalidParameterException('email wajib diisi dan berupa string');
	}

	const email = payload.email.trim();
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		throw new InvalidParameterException('email tidak valid');
	}

	const subject = typeof payload.subject === 'string' ? payload.subject : '';
	const emailBody = typeof payload.body === 'string' ? payload.body : '';

	if (subject.length > 200) {
		throw new InvalidParameterException('subject maksimal 200 karakter');
	}

	if (emailBody.length > 1000) {
		throw new InvalidParameterException('body maksimal 1000 karakter');
	}

	return { email, subject, body: emailBody };
};

export const buildMailtoUrl = (emailQr: TEmailQrPayload): string => {
	const params = new URLSearchParams();

	if (emailQr.subject) {
		params.set('subject', emailQr.subject);
	}

	if (emailQr.body) {
		params.set('body', emailQr.body);
	}

	const query = params.toString();

	return query ? `mailto:${emailQr.email}?${query}` : `mailto:${emailQr.email}`;
};

export const generateEmailQrCode = async (
	emailQr: TEmailQrPayload,
	options?: TQrCodeOptions
): Promise<TQrCodeResult> => {
	const url = buildMailtoUrl(emailQr);

	return generateQrCodeOutput(url, options, 'email');
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
): Promise<TQrCodeResult> => {
	const payload = buildWifiQrPayload(wifi);

	return generateQrCodeOutput(payload, options, 'wifi');
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
): Promise<TQrCodeResult> => {
	const payload = buildVcardQrPayload(contact);

	return generateQrCodeOutput(payload, options, 'vcard');
};

const validatePhoneNumber = (phone: unknown, fieldName = 'phone'): string => {
	if (typeof phone !== 'string' || phone.trim() === '') {
		throw new InvalidParameterException(`${fieldName} wajib diisi dan berupa string`);
	}

	const normalized = phone.replace(/[\s\-+()]/g, '');
	if (!/^\d{8,15}$/.test(normalized)) {
		throw new InvalidParameterException(`${fieldName} harus berupa nomor valid (8-15 digit)`);
	}

	return normalized;
};

export type TLocationQrPayload = {
	latitude: number;
	longitude: number;
	label?: string;
};

export const validateLocationQrPayload = (body: unknown): TLocationQrPayload => {
	const payload = body as Record<string, unknown>;

	if (typeof payload?.latitude !== 'number' || payload.latitude < -90 || payload.latitude > 90) {
		throw new InvalidParameterException('latitude wajib diisi dan harus antara -90 hingga 90');
	}

	if (typeof payload?.longitude !== 'number' || payload.longitude < -180 || payload.longitude > 180) {
		throw new InvalidParameterException('longitude wajib diisi dan harus antara -180 hingga 180');
	}

	return {
		latitude: payload.latitude,
		longitude: payload.longitude,
		label: validateOptionalString(payload.label, 'label')
	};
};

export const buildLocationQrPayload = (location: TLocationQrPayload): string => {
	const base = `geo:${location.latitude},${location.longitude}`;

	if (!location.label) {
		return base;
	}

	return `${base}?q=${encodeURIComponent(location.label)}`;
};

export const generateLocationQrCode = async (
	location: TLocationQrPayload,
	options?: TQrCodeOptions
): Promise<TQrCodeResult> => {
	const payload = buildLocationQrPayload(location);

	return generateQrCodeOutput(payload, options, 'location');
};

export type TPhoneQrPayload = {
	phone: string;
};

export const validatePhoneQrPayload = (body: unknown): TPhoneQrPayload => {
	const payload = body as Record<string, unknown>;

	return { phone: validatePhoneNumber(payload?.phone) };
};

export const buildPhoneQrPayload = (phoneQr: TPhoneQrPayload): string =>
	`tel:+${phoneQr.phone}`;

export const generatePhoneQrCode = async (
	phoneQr: TPhoneQrPayload,
	options?: TQrCodeOptions
): Promise<TQrCodeResult> => {
	const payload = buildPhoneQrPayload(phoneQr);

	return generateQrCodeOutput(payload, options, 'phone');
};

export type TSmsQrPayload = {
	phone: string;
	message: string;
};

export const validateSmsQrPayload = (body: unknown): TSmsQrPayload => {
	const payload = body as Record<string, unknown>;
	const message = typeof payload?.message === 'string' ? payload.message : '';

	if (message.length > 500) {
		throw new InvalidParameterException('message maksimal 500 karakter');
	}

	return {
		phone: validatePhoneNumber(payload?.phone),
		message
	};
};

export const buildSmsQrPayload = (sms: TSmsQrPayload): string => {
	const base = `sms:+${sms.phone}`;

	if (!sms.message) {
		return base;
	}

	return `${base}?body=${encodeURIComponent(sms.message)}`;
};

export const generateSmsQrCode = async (
	sms: TSmsQrPayload,
	options?: TQrCodeOptions
): Promise<TQrCodeResult> => {
	const payload = buildSmsQrPayload(sms);

	return generateQrCodeOutput(payload, options, 'sms');
};

export type TUtmQrPayload = {
	url: string;
	utm_source?: string;
	utm_medium?: string;
	utm_campaign?: string;
	utm_term?: string;
	utm_content?: string;
};

const validateUtmParam = (value: unknown, fieldName: string): string | undefined => {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}

	if (typeof value !== 'string' || value.trim() === '') {
		throw new InvalidParameterException(`${fieldName} harus berupa string`);
	}

	if (value.length > 100) {
		throw new InvalidParameterException(`${fieldName} maksimal 100 karakter`);
	}

	return value.trim();
};

export const validateUtmQrPayload = (body: unknown): TUtmQrPayload => {
	const payload = body as Record<string, unknown>;
	const url = validateQrCodeUrl(payload?.url);

	const utm = {
		utm_source: validateUtmParam(payload.utm_source, 'utm_source'),
		utm_medium: validateUtmParam(payload.utm_medium, 'utm_medium'),
		utm_campaign: validateUtmParam(payload.utm_campaign, 'utm_campaign'),
		utm_term: validateUtmParam(payload.utm_term, 'utm_term'),
		utm_content: validateUtmParam(payload.utm_content, 'utm_content')
	};

	if (!utm.utm_source && !utm.utm_medium && !utm.utm_campaign && !utm.utm_term && !utm.utm_content) {
		throw new InvalidParameterException(
			'Minimal satu parameter UTM wajib diisi (utm_source, utm_medium, utm_campaign, utm_term, atau utm_content)'
		);
	}

	return { url, ...utm };
};

export const buildUtmUrl = (utm: TUtmQrPayload): string => {
	const parsed = new URL(utm.url);
	const params = new URLSearchParams(parsed.search);

	if (utm.utm_source) params.set('utm_source', utm.utm_source);
	if (utm.utm_medium) params.set('utm_medium', utm.utm_medium);
	if (utm.utm_campaign) params.set('utm_campaign', utm.utm_campaign);
	if (utm.utm_term) params.set('utm_term', utm.utm_term);
	if (utm.utm_content) params.set('utm_content', utm.utm_content);

	parsed.search = params.toString();

	return parsed.toString();
};

export const generateUtmQrCode = async (
	utm: TUtmQrPayload,
	options?: TQrCodeOptions
): Promise<TQrCodeResult> => {
	const url = buildUtmUrl(utm);

	return generateQrCodeOutput(url, options, 'utm');
};

export type TEventQrPayload = {
	title: string;
	startAt: string;
	endAt: string;
	description?: string;
	location?: string;
};

const formatGoogleCalendarDate = (value: string, fieldName: string): string => {
	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		throw new InvalidParameterException(`${fieldName} harus berupa tanggal/waktu valid (ISO 8601)`);
	}

	return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

export const validateEventQrPayload = (body: unknown): TEventQrPayload => {
	const payload = body as Record<string, unknown>;

	const title = validateOptionalString(payload?.title, 'title');
	if (!title) {
		throw new InvalidParameterException('title wajib diisi dan berupa string');
	}

	if (typeof payload?.startAt !== 'string' || payload.startAt.trim() === '') {
		throw new InvalidParameterException('startAt wajib diisi dan berupa string (ISO 8601)');
	}

	if (typeof payload?.endAt !== 'string' || payload.endAt.trim() === '') {
		throw new InvalidParameterException('endAt wajib diisi dan berupa string (ISO 8601)');
	}

	const startAt = formatGoogleCalendarDate(payload.startAt.trim(), 'startAt');
	const endAt = formatGoogleCalendarDate(payload.endAt.trim(), 'endAt');

	if (new Date(payload.endAt).getTime() <= new Date(payload.startAt).getTime()) {
		throw new InvalidParameterException('endAt harus lebih besar dari startAt');
	}

	return {
		title,
		startAt,
		endAt,
		description: validateOptionalString(payload.description, 'description'),
		location: validateOptionalString(payload.location, 'location')
	};
};

export const buildEventCalendarUrl = (event: TEventQrPayload): string => {
	const params = new URLSearchParams({
		action: 'TEMPLATE',
		text: event.title,
		dates: `${event.startAt}/${event.endAt}`
	});

	if (event.description) {
		params.set('details', event.description);
	}

	if (event.location) {
		params.set('location', event.location);
	}

	return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export const generateEventQrCode = async (
	event: TEventQrPayload,
	options?: TQrCodeOptions
): Promise<TQrCodeResult> => {
	const url = buildEventCalendarUrl(event);

	return generateQrCodeOutput(url, options, 'event');
};

export type TSocialPlatform =
	| 'instagram'
	| 'tiktok'
	| 'youtube'
	| 'linkedin'
	| 'facebook'
	| 'twitter'
	| 'telegram';

export type TSocialQrPayload = {
	platform: TSocialPlatform;
	username: string;
};

const SOCIAL_PLATFORMS: TSocialPlatform[] = [
	'instagram',
	'tiktok',
	'youtube',
	'linkedin',
	'facebook',
	'twitter',
	'telegram'
];

const buildSocialProfileUrl = (platform: TSocialPlatform, username: string): string => {
	const handle = username.replace(/^@/, '');

	switch (platform) {
		case 'instagram':
			return `https://instagram.com/${handle}`;
		case 'tiktok':
			return `https://tiktok.com/@${handle}`;
		case 'youtube':
			return handle.startsWith('UC')
				? `https://youtube.com/channel/${handle}`
				: `https://youtube.com/@${handle}`;
		case 'linkedin':
			return `https://linkedin.com/in/${handle}`;
		case 'facebook':
			return `https://facebook.com/${handle}`;
		case 'twitter':
			return `https://x.com/${handle}`;
		case 'telegram':
			return `https://t.me/${handle}`;
	}
};

export const validateSocialQrPayload = (body: unknown): TSocialQrPayload => {
	const payload = body as Record<string, unknown>;

	if (
		typeof payload?.platform !== 'string' ||
		!SOCIAL_PLATFORMS.includes(payload.platform as TSocialPlatform)
	) {
		throw new InvalidParameterException(
			`platform wajib diisi dan harus salah satu dari: ${SOCIAL_PLATFORMS.join(', ')}`
		);
	}

	if (typeof payload?.username !== 'string' || payload.username.trim() === '') {
		throw new InvalidParameterException('username wajib diisi dan berupa string');
	}

	const username = payload.username.trim().replace(/^@/, '');

	if (!/^[a-zA-Z0-9._-]{1,50}$/.test(username) && !/^UC[\w-]{20,}$/.test(username)) {
		throw new InvalidParameterException('username tidak valid');
	}

	return {
		platform: payload.platform as TSocialPlatform,
		username
	};
};

export const buildSocialQrUrl = (social: TSocialQrPayload): string =>
	buildSocialProfileUrl(social.platform, social.username);

export const generateSocialQrCode = async (
	social: TSocialQrPayload,
	options?: TQrCodeOptions
): Promise<TQrCodeResult> => {
	const url = buildSocialQrUrl(social);

	return generateQrCodeOutput(url, options, 'social');
};

export type TAppStorePlatform = 'ios' | 'android';

export type TAppQrPayload = {
	platform: TAppStorePlatform;
	appId: string;
};

const APP_STORE_PLATFORMS: TAppStorePlatform[] = ['ios', 'android'];

export const validateAppQrPayload = (body: unknown): TAppQrPayload => {
	const payload = body as Record<string, unknown>;

	if (
		typeof payload?.platform !== 'string' ||
		!APP_STORE_PLATFORMS.includes(payload.platform as TAppStorePlatform)
	) {
		throw new InvalidParameterException(
			`platform wajib diisi dan harus salah satu dari: ${APP_STORE_PLATFORMS.join(', ')}`
		);
	}

	if (typeof payload?.appId !== 'string' || payload.appId.trim() === '') {
		throw new InvalidParameterException('appId wajib diisi dan berupa string');
	}

	const appId = payload.appId.trim();
	const platform = payload.platform as TAppStorePlatform;

	if (platform === 'ios' && !/^\d{5,12}$/.test(appId)) {
		throw new InvalidParameterException('appId iOS harus berupa angka App Store ID (5-12 digit)');
	}

	if (platform === 'android' && !/^[a-zA-Z][\w]*(\.[a-zA-Z][\w]*)+$/.test(appId)) {
		throw new InvalidParameterException(
			'appId Android harus berupa package name valid (contoh: com.contoh.app)'
		);
	}

	return { platform, appId };
};

export const buildAppStoreUrl = (app: TAppQrPayload): string => {
	if (app.platform === 'ios') {
		return `https://apps.apple.com/app/id${app.appId}`;
	}

	return `https://play.google.com/store/apps/details?id=${app.appId}`;
};

export const generateAppQrCode = async (
	app: TAppQrPayload,
	options?: TQrCodeOptions
): Promise<TQrCodeResult> => {
	const url = buildAppStoreUrl(app);

	return generateQrCodeOutput(url, options, 'app');
};

const normalizeQrCodeSvg = (svg: string): string => {
	const unescaped = svg.trim().replace(/\\"/g, '"');

	return unescaped.replace(/([\w-:]+)="([^"]*)"/g, "$1='$2'");
};
