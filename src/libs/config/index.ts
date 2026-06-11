import dotenv from 'dotenv';
import packageJson from '../../../package.json';

dotenv.config();

export const APP_NAME = packageJson.name || 'cms-generate-qrcode';
export const APP_VERSION = packageJson.version || '0.0.0';

export const NODE_ENV = process.env.NODE_ENV ?? 'development';
export const APP_PORT_HTTP = String(process.env.APP_PORT_HTTP || '3050');
