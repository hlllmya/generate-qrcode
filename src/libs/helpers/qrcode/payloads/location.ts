import { InvalidParameterException } from '@/libs/exceptions/InvalidParameterException';
import { TQrCodeOptions, TQrCodeResult } from '../types';
import { generateQrCodeOutput } from '../core';
import { validateOptionalString } from '../validators';

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
	return generateQrCodeOutput(buildLocationQrPayload(location), options, 'location');
};
