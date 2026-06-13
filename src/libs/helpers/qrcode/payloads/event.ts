import { InvalidParameterException } from '@/libs/exceptions/InvalidParameterException';
import { TQrCodeOptions, TQrCodeResult } from '../types';
import { generateQrCodeOutput } from '../core';
import { validateOptionalString } from '../validators';

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

	if (event.description) params.set('details', event.description);
	if (event.location) params.set('location', event.location);

	return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export const generateEventQrCode = async (
	event: TEventQrPayload,
	options?: TQrCodeOptions
): Promise<TQrCodeResult> => {
	return generateQrCodeOutput(buildEventCalendarUrl(event), options, 'event');
};
