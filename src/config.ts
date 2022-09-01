import { registerAs } from '@nestjs/config';

export default registerAs('config', () => ({
  test: process.env.TEST,
}));
