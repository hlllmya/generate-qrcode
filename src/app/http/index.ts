import express from 'express';
import qrcodeRouter from './qrcode/qrcode.routes';
import { errorHandler } from '@/libs/middlewares/errorHandler.middleware';

const httpApp = express();

httpApp.use(express.json());
httpApp.use('/qrcode', qrcodeRouter);
httpApp.use('/qrcode1', qrcodeRouter);
httpApp.use('/qrcode2', qrcodeRouter);
httpApp.use('/qrcode3', qrcodeRouter);
httpApp.use('/qrcode4', qrcodeRouter);
httpApp.use(errorHandler);

export default httpApp;
