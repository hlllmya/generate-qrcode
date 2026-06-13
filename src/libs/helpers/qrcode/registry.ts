import { InvalidParameterException } from '@/libs/exceptions/InvalidParameterException';
import { TSingleQrCodeType } from './types';
import { validateQrCodeUrl } from './validators';
import {
	buildAppStoreUrl,
	buildEventCalendarUrl,
	buildLocationQrPayload,
	buildMailtoUrl,
	buildPhoneQrPayload,
	buildSmsQrPayload,
	buildSocialQrUrl,
	buildUtmUrl,
	buildVcardQrPayload,
	buildWhatsAppUrl,
	buildWifiQrPayload,
	validateAppQrPayload,
	validateEventQrPayload,
	validateLocationQrPayload,
	validateEmailQrPayload,
	validatePhoneQrPayload,
	validateSmsQrPayload,
	validateSocialQrPayload,
	validateTextQrPayload,
	validateUtmQrPayload,
	validateVcardQrPayload,
	validateWhatsAppQrPayload,
	validateWifiQrPayload
} from './payloads';

type TContentResolver = (data: unknown) => string;

export const QR_CONTENT_RESOLVERS: Record<TSingleQrCodeType, TContentResolver> = {
	url: (data) => validateQrCodeUrl((data as Record<string, unknown>).url),
	text: (data) => validateTextQrPayload(data).text,
	wifi: (data) => buildWifiQrPayload(validateWifiQrPayload(data)),
	vcard: (data) => buildVcardQrPayload(validateVcardQrPayload(data)),
	whatsapp: (data) => buildWhatsAppUrl(validateWhatsAppQrPayload(data)),
	email: (data) => buildMailtoUrl(validateEmailQrPayload(data)),
	location: (data) => buildLocationQrPayload(validateLocationQrPayload(data)),
	phone: (data) => buildPhoneQrPayload(validatePhoneQrPayload(data)),
	sms: (data) => buildSmsQrPayload(validateSmsQrPayload(data)),
	utm: (data) => buildUtmUrl(validateUtmQrPayload(data)),
	event: (data) => buildEventCalendarUrl(validateEventQrPayload(data)),
	social: (data) => buildSocialQrUrl(validateSocialQrPayload(data)),
	app: (data) => buildAppStoreUrl(validateAppQrPayload(data))
};

export const resolveQrContent = (type: TSingleQrCodeType, data: unknown): string => {
	const resolver = QR_CONTENT_RESOLVERS[type];

	if (!resolver) {
		throw new InvalidParameterException(`Tipe QR code "${type}" tidak didukung`);
	}

	return resolver(data);
};
