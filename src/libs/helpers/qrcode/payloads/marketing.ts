import { InvalidParameterException } from '@/libs/exceptions/InvalidParameterException';
import { TQrCodeOptions, TQrCodeResult } from '../types';
import { generateQrCodeOutput } from '../core';
import { validatePlatform, validateQrCodeUrl, validateUtmParam } from '../validators';

export type TUtmQrPayload = {
	url: string;
	utm_source?: string;
	utm_medium?: string;
	utm_campaign?: string;
	utm_term?: string;
	utm_content?: string;
};

export const validateUtmQrPayload = (body: unknown): TUtmQrPayload => {
	const payload = body as Record<string, unknown>;
	const url = validateQrCodeUrl(payload?.url);

	const utm = {
		utm_source: validateUtmParam(payload.utm_source, 'utm_source'),
		utm_medium: validateUtmParam(payload.utm_medium, 'utm_medium'),
		utm_campaign: validateUtmParam(payload.utm_campaign, 'utm_campaign'),
		utm_term: validateUtmParam(payload.utm_term, 'utm_term'),
		utm_content: validateUtmParam(payload.utm_content, 'utm_content')
	};

	if (!utm.utm_source && !utm.utm_medium && !utm.utm_campaign && !utm.utm_term && !utm.utm_content) {
		throw new InvalidParameterException(
			'Minimal satu parameter UTM wajib diisi (utm_source, utm_medium, utm_campaign, utm_term, atau utm_content)'
		);
	}

	return { url, ...utm };
};

export const buildUtmUrl = (utm: TUtmQrPayload): string => {
	const parsed = new URL(utm.url);
	const params = new URLSearchParams(parsed.search);

	if (utm.utm_source) params.set('utm_source', utm.utm_source);
	if (utm.utm_medium) params.set('utm_medium', utm.utm_medium);
	if (utm.utm_campaign) params.set('utm_campaign', utm.utm_campaign);
	if (utm.utm_term) params.set('utm_term', utm.utm_term);
	if (utm.utm_content) params.set('utm_content', utm.utm_content);

	parsed.search = params.toString();

	return parsed.toString();
};

export const generateUtmQrCode = async (
	utm: TUtmQrPayload,
	options?: TQrCodeOptions
): Promise<TQrCodeResult> => {
	return generateQrCodeOutput(buildUtmUrl(utm), options, 'utm');
};

export type TSocialPlatform =
	| 'instagram'
	| 'tiktok'
	| 'youtube'
	| 'linkedin'
	| 'facebook'
	| 'twitter'
	| 'telegram';

export type TSocialQrPayload = {
	platform: TSocialPlatform;
	username: string;
};

const SOCIAL_PLATFORMS: TSocialPlatform[] = [
	'instagram',
	'tiktok',
	'youtube',
	'linkedin',
	'facebook',
	'twitter',
	'telegram'
];

const buildSocialProfileUrl = (platform: TSocialPlatform, username: string): string => {
	const handle = username.replace(/^@/, '');

	switch (platform) {
		case 'instagram':
			return `https://instagram.com/${handle}`;
		case 'tiktok':
			return `https://tiktok.com/@${handle}`;
		case 'youtube':
			return handle.startsWith('UC')
				? `https://youtube.com/channel/${handle}`
				: `https://youtube.com/@${handle}`;
		case 'linkedin':
			return `https://linkedin.com/in/${handle}`;
		case 'facebook':
			return `https://facebook.com/${handle}`;
		case 'twitter':
			return `https://x.com/${handle}`;
		case 'telegram':
			return `https://t.me/${handle}`;
	}
};

export const validateSocialQrPayload = (body: unknown): TSocialQrPayload => {
	const payload = body as Record<string, unknown>;
	const platform = validatePlatform(payload?.platform, 'platform', SOCIAL_PLATFORMS);

	if (typeof payload?.username !== 'string' || payload.username.trim() === '') {
		throw new InvalidParameterException('username wajib diisi dan berupa string');
	}

	const username = payload.username.trim().replace(/^@/, '');

	if (!/^[a-zA-Z0-9._-]{1,50}$/.test(username) && !/^UC[\w-]{20,}$/.test(username)) {
		throw new InvalidParameterException('username tidak valid');
	}

	return { platform, username };
};

export const buildSocialQrUrl = (social: TSocialQrPayload): string =>
	buildSocialProfileUrl(social.platform, social.username);

export const generateSocialQrCode = async (
	social: TSocialQrPayload,
	options?: TQrCodeOptions
): Promise<TQrCodeResult> => {
	return generateQrCodeOutput(buildSocialQrUrl(social), options, 'social');
};

export type TAppStorePlatform = 'ios' | 'android';

export type TAppQrPayload = {
	platform: TAppStorePlatform;
	appId: string;
};

const APP_STORE_PLATFORMS: TAppStorePlatform[] = ['ios', 'android'];

export const validateAppQrPayload = (body: unknown): TAppQrPayload => {
	const payload = body as Record<string, unknown>;
	const platform = validatePlatform(payload?.platform, 'platform', APP_STORE_PLATFORMS);

	if (typeof payload?.appId !== 'string' || payload.appId.trim() === '') {
		throw new InvalidParameterException('appId wajib diisi dan berupa string');
	}

	const appId = payload.appId.trim();

	if (platform === 'ios' && !/^\d{5,12}$/.test(appId)) {
		throw new InvalidParameterException('appId iOS harus berupa angka App Store ID (5-12 digit)');
	}

	if (platform === 'android' && !/^[a-zA-Z][\w]*(\.[a-zA-Z][\w]*)+$/.test(appId)) {
		throw new InvalidParameterException(
			'appId Android harus berupa package name valid (contoh: com.contoh.app)'
		);
	}

	return { platform, appId };
};

export const buildAppStoreUrl = (app: TAppQrPayload): string => {
	if (app.platform === 'ios') {
		return `https://apps.apple.com/app/id${app.appId}`;
	}

	return `https://play.google.com/store/apps/details?id=${app.appId}`;
};

export const generateAppQrCode = async (
	app: TAppQrPayload,
	options?: TQrCodeOptions
): Promise<TQrCodeResult> => {
	return generateQrCodeOutput(buildAppStoreUrl(app), options, 'app');
};
