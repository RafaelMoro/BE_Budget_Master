import * as dotenv from 'dotenv';
import { SetMetadata } from '@nestjs/common';

dotenv.config();
const publicKey = process.env.PUBLIC_KEY;
export const Public = (...args: string[]) => SetMetadata(publicKey, args);
