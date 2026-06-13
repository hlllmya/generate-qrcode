import { InvalidParameterException } from '@/libs/exceptions/InvalidParameterException';
import { TQrCodeOptions, TQrCodeResult } from '../types';
import { generateQrCodeOutput } from '../core';

export type TFormQrPayload = {
	formId: string;
};

export const validateFormQrPayload = (body: unknown): TFormQrPayload => {
	const payload = body as Record<string, unknown>;

	if (typeof payload?.formId !== 'string' || payload.formId.trim() === '') {
		throw new InvalidParameterException('formId wajib diisi dan berupa string');
	}

	const formId = payload.formId.trim();

	if (!/^[a-zA-Z0-9_-]{10,200}$/.test(formId)) {
		throw new InvalidParameterException('formId tidak valid');
	}

	return { formId };
};

export const buildGoogleFormUrl = (form: TFormQrPayload): string =>
	`https://docs.google.com/forms/d/${form.formId}/viewform`;

export const generateFormQrCode = async (
	form: TFormQrPayload,
	options?: TQrCodeOptions
): Promise<TQrCodeResult> => {
	return generateQrCodeOutput(buildGoogleFormUrl(form), options, 'form');
};
