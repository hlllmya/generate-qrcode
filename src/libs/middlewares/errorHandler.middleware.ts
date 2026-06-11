import { NextFunction, Request, Response } from 'express';
import { InvalidParameterException } from '@/libs/exceptions/InvalidParameterException';

export const errorHandler = (
	error: Error,
	_req: Request,
	res: Response,
	_next: NextFunction
): void => {
	if (error instanceof InvalidParameterException) {
		res.status(400).json({
			success: false,
			message: error.message
		});
		return;
	}

	res.status(500).json({
		success: false,
		message: 'Terjadi kesalahan pada server'
	});
};
