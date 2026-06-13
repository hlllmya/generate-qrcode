import QRCode from 'qrcode';
import { InvalidParameterException } from '@/libs/exceptions/InvalidParameterException';
import { TQrCodeFormat, TQrCodeOptions, TQrCodeResult } from './types';
import { validateQrCodeUrl } from './validators';

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

const normalizeQrCodeSvg = (svg: string): string => {
	const unescaped = svg.trim().replace(/\\"/g, '"');

	return unescaped.replace(/([\w-:]+)="([^"]*)"/g, "$1='$2'");
};

const assertContent = (content: string): void => {
	if (typeof content !== 'string' || content.trim() === '') {
		throw new InvalidParameterException('Konten wajib diisi dan berupa string');
	}
};

export const generateQrCodeSvgFromContent = async (
	content: string,
	options?: TQrCodeOptions
): Promise<string> => {
	assertContent(content);

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
	assertContent(content);

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

export const svgToBase64 = (svg: string): string => {
	if (typeof svg !== 'string' || svg.trim() === '') {
		throw new InvalidParameterException('SVG QR code tidak valid');
	}

	return Buffer.from(svg, 'utf-8').toString('base64');
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

export const generateQrCodeFromUrl = async (
	url: string,
	options?: TQrCodeOptions
): Promise<TQrCodeResult> => {
	const validatedUrl = validateQrCodeUrl(url);

	return generateQrCodeOutput(validatedUrl, options, 'url');
};

export const generateQrCodeSvg = async (
	url: string,
	options?: TQrCodeOptions
): Promise<string> => {
	const validatedUrl = validateQrCodeUrl(url);

	return generateQrCodeSvgFromContent(validatedUrl, options);
};

export const generateQrCodeFromContent = async (
	content: string,
	options?: TQrCodeOptions,
	type = 'content'
): Promise<TQrCodeResult> => {
	return generateQrCodeOutput(content, options, type);
};
