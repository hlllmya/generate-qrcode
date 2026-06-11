import express from 'express';
import qrcodeRouter from './qrcode/qrcode.routes';
import { errorHandler } from '@/libs/middlewares/errorHandler.middleware';

const httpApp = express();

httpApp.use(express.json());
httpApp.use('/qrcode', qrcodeRouter);
httpApp.use(errorHandler);

export default httpApp;
