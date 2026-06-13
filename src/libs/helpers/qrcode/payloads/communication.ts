import { InvalidParameterException } from '@/libs/exceptions/InvalidParameterException';
import { TQrCodeOptions, TQrCodeResult } from '../types';
import { generateQrCodeOutput } from '../core';
import { validatePhoneNumber } from '../validators';

export type TWhatsAppQrPayload = {
	phone: string;
	message: string;
};

export const validateWhatsAppQrPayload = (body: unknown): TWhatsAppQrPayload => {
	const payload = body as Record<string, unknown>;
	const message = typeof payload?.message === 'string' ? payload.message : '';

	if (message.length > 1000) {
		throw new InvalidParameterException('message maksimal 1000 karakter');
	}

	return {
		phone: validatePhoneNumber(payload?.phone),
		message
	};
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
	return generateQrCodeOutput(buildWhatsAppUrl(whatsapp), options, 'whatsapp');
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

	if (emailQr.subject) params.set('subject', emailQr.subject);
	if (emailQr.body) params.set('body', emailQr.body);

	const query = params.toString();

	return query ? `mailto:${emailQr.email}?${query}` : `mailto:${emailQr.email}`;
};

export const generateEmailQrCode = async (
	emailQr: TEmailQrPayload,
	options?: TQrCodeOptions
): Promise<TQrCodeResult> => {
	return generateQrCodeOutput(buildMailtoUrl(emailQr), options, 'email');
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
	return generateQrCodeOutput(buildPhoneQrPayload(phoneQr), options, 'phone');
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
	return generateQrCodeOutput(buildSmsQrPayload(sms), options, 'sms');
};
