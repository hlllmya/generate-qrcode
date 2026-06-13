export type TQrCodeFormat = 'svg' | 'png';
export type TResponseMode = 'json' | 'binary' | 'dataUrl';
export type TQrCodeType =
	| 'url'
	| 'text'
	| 'wifi'
	| 'vcard'
	| 'whatsapp'
	| 'email'
	| 'location'
	| 'phone'
	| 'sms'
	| 'utm'
	| 'event'
	| 'social'
	| 'app'
	| 'form'
	| 'batch';

export type TSingleQrCodeType = Exclude<TQrCodeType, 'batch'>;

export type TQrCodeOptions = {
	width?: number;
	margin?: number;
	errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
	darkColor?: string;
	lightColor?: string;
	format?: TQrCodeFormat;
	responseMode?: TResponseMode;
};

export type TQrCodeResult = {
	base64: string;
	dataUrl: string;
	format: TQrCodeFormat;
	mimeType: string;
	content: string;
	sizeBytes: number;
	filename: string;
};

export type TBatchQrItem = {
	id?: string;
	url: string;
};

export type TBatchQrResultItem = {
	id?: string;
	url: string;
	success: boolean;
	message?: string;
	content?: string;
	format?: TQrCodeFormat;
	mimeType?: string;
	dataUrl?: string;
	base64?: string;
	sizeBytes?: number;
	filename?: string;
};

export const BATCH_QR_MAX_ITEMS = 50;

export const QR_CODE_TYPES: TQrCodeType[] = [
	'url',
	'text',
	'wifi',
	'vcard',
	'whatsapp',
	'email',
	'location',
	'phone',
	'sms',
	'utm',
	'event',
	'social',
	'app',
	'form',
	'batch'
];
