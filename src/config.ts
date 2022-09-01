import { registerAs } from '@nestjs/config';

export default registerAs('config', () => ({
  database: {
    cluster: process.env.CLUSTER,
    mongoDbName: process.env.MONGO_DB_NAME,
    user: process.env.MONGO_USER,
    password: process.env.MONGO_PWD,
    connection: process.env.MONGO_CONNECTION,
  },
  jwtKey: process.env.JWT_KEY,
  publicKey: process.env.PUBLIC_KEY,
}));
