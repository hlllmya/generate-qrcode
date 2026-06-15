import { InvalidParameterException } from '@/libs/exceptions/InvalidParameterException';
import { TQrCodeOptions, TQrCodeResult } from '../types';
import { generateQrCodeOutput } from '../core';

export type TPaymentQrPayload = {
	qrisPayload: string;
};

const QRIS_PAYLOAD_PATTERN = /^000201[\dA-Z]+$/;

export const validatePaymentQrPayload = (body: unknown): TPaymentQrPayload => {
	const payload = body as Record<string, unknown>;

	if (typeof payload?.qrisPayload !== 'string' || payload.qrisPayload.trim() === '') {
		throw new InvalidParameterException('qrisPayload wajib diisi dan berupa string');
	}

	const qrisPayload = payload.qrisPayload.trim().toUpperCase();

	if (qrisPayload.length < 50 || qrisPayload.length > 1000) {
		throw new InvalidParameterException('qrisPayload panjangnya harus antara 50 hingga 1000 karakter');
	}

	if (!QRIS_PAYLOAD_PATTERN.test(qrisPayload)) {
		throw new InvalidParameterException(
			'qrisPayload tidak valid — harus berupa string QRIS EMVCo yang dimulai dengan 000201'
		);
	}

	return { qrisPayload };
};

export const buildPaymentQrPayload = (payment: TPaymentQrPayload): string =>
	payment.qrisPayload;

export const generatePaymentQrCode = async (
	payment: TPaymentQrPayload,
	options?: TQrCodeOptions
): Promise<TQrCodeResult> => {
	return generateQrCodeOutput(buildPaymentQrPayload(payment), options, 'payment');
};
