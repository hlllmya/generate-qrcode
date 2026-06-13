import { InvalidParameterException } from '@/libs/exceptions/InvalidParameterException';
import { TQrCodeOptions, TQrCodeResult } from '../types';
import { generateQrCodeOutput } from '../core';
import {
	validateOptionalEmail,
	validateOptionalString,
	validateOptionalUrl
} from '../validators';

export type TVcardQrPayload = {
	fullName: string;
	organization?: string;
	phone?: string;
	email?: string;
	website?: string;
	address?: string;
};

const escapeVcardField = (value: string): string =>
	value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

export const validateVcardQrPayload = (body: unknown): TVcardQrPayload => {
	const payload = body as Record<string, unknown>;

	const fullName = validateOptionalString(payload?.fullName, 'fullName');
	if (!fullName) {
		throw new InvalidParameterException('fullName wajib diisi dan berupa string');
	}

	return {
		fullName,
		organization: validateOptionalString(payload.organization, 'organization'),
		phone: validateOptionalString(payload.phone, 'phone'),
		email: validateOptionalEmail(payload.email),
		website: validateOptionalUrl(payload.website, 'website'),
		address: validateOptionalString(payload.address, 'address')
	};
};

export const buildVcardQrPayload = (contact: TVcardQrPayload): string => {
	const lines = [
		'BEGIN:VCARD',
		'VERSION:3.0',
		`FN:${escapeVcardField(contact.fullName)}`,
		`N:;${escapeVcardField(contact.fullName)};;;`
	];

	if (contact.organization) lines.push(`ORG:${escapeVcardField(contact.organization)}`);
	if (contact.phone) lines.push(`TEL;TYPE=CELL:${escapeVcardField(contact.phone)}`);
	if (contact.email) lines.push(`EMAIL:${escapeVcardField(contact.email)}`);
	if (contact.website) lines.push(`URL:${escapeVcardField(contact.website)}`);
	if (contact.address) lines.push(`ADR;TYPE=WORK:;;${escapeVcardField(contact.address)};;;;`);

	lines.push('END:VCARD');

	return lines.join('\n');
};

export const generateVcardQrCode = async (
	contact: TVcardQrPayload,
	options?: TQrCodeOptions
): Promise<TQrCodeResult> => {
	return generateQrCodeOutput(buildVcardQrPayload(contact), options, 'vcard');
};
