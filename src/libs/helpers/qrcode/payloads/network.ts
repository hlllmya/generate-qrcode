import { InvalidParameterException } from '@/libs/exceptions/InvalidParameterException';
import { TQrCodeOptions, TQrCodeResult } from '../types';
import { generateQrCodeOutput } from '../core';

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
	return generateQrCodeOutput(buildWifiQrPayload(wifi), options, 'wifi');
};
