import { InvalidParameterException } from '@/libs/exceptions/InvalidParameterException';
import { TQrCodeOptions } from '../types';
import { validateHexColor } from './common';

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
	if (darkColor) validated.darkColor = darkColor;

	const lightColor = validateHexColor(raw.lightColor, 'lightColor');
	if (lightColor) validated.lightColor = lightColor;

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
