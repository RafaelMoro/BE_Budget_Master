import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomizedException extends HttpException {
  constructor(message?: string, status?: HttpStatus) {
    super(message || 'Error', status || HttpStatus.BAD_REQUEST);
  }
}
