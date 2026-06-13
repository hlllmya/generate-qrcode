import { InvalidParameterException } from '@/libs/exceptions/InvalidParameterException';

const HEX_COLOR_PATTERN = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export const validateHexColor = (color: unknown, fieldName: string): string | undefined => {
	if (color === undefined || color === null || color === '') {
		return undefined;
	}

	if (typeof color !== 'string' || !HEX_COLOR_PATTERN.test(color.trim())) {
		throw new InvalidParameterException(`${fieldName} harus berupa kode warna hex (#RGB atau #RRGGBB)`);
	}

	return color.trim();
};

export const validateOptionalString = (value: unknown, fieldName: string): string | undefined => {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}

	if (typeof value !== 'string' || value.trim() === '') {
		throw new InvalidParameterException(`${fieldName} harus berupa string`);
	}

	return value.trim();
};

export const validateOptionalEmail = (email: unknown): string | undefined => {
	if (email === undefined || email === null || email === '') {
		return undefined;
	}

	if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
		throw new InvalidParameterException('email tidak valid');
	}

	return email.trim();
};

export const validatePhoneNumber = (phone: unknown, fieldName = 'phone'): string => {
	if (typeof phone !== 'string' || phone.trim() === '') {
		throw new InvalidParameterException(`${fieldName} wajib diisi dan berupa string`);
	}

	const normalized = phone.replace(/[\s\-+()]/g, '');
	if (!/^\d{8,15}$/.test(normalized)) {
		throw new InvalidParameterException(`${fieldName} harus berupa nomor valid (8-15 digit)`);
	}

	return normalized;
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

export const validateOptionalUrl = (url: unknown, fieldName: string): string | undefined => {
	if (url === undefined || url === null || url === '') {
		return undefined;
	}

	return validateQrCodeUrl(url, fieldName);
};

export const validateUtmParam = (value: unknown, fieldName: string): string | undefined => {
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

export const validatePlatform = <T extends string>(
	value: unknown,
	fieldName: string,
	platforms: readonly T[]
): T => {
	if (typeof value !== 'string' || !platforms.includes(value as T)) {
		throw new InvalidParameterException(
			`${fieldName} wajib diisi dan harus salah satu dari: ${platforms.join(', ')}`
		);
	}

	return value as T;
};
