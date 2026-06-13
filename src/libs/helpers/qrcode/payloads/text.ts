import { InvalidParameterException } from '@/libs/exceptions/InvalidParameterException';
import { TQrCodeOptions, TQrCodeResult } from '../types';
import { generateQrCodeFromContent } from '../core';

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
