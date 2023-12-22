import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { VERSION_RESPONSE } from '../constants';
import { Response } from 'express';
import { GeneralResponse } from 'src/response.interface';

@Catch(HttpException)
export class GeneralAppExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const error = exception.getResponse();
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();

    const responseFormatted: GeneralResponse = {
      version: VERSION_RESPONSE,
      success: false,
      data: null,
      message: null,
      error,
    };

    response.send(responseFormatted);
  }
}
