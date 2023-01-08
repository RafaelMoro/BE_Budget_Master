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
  jwtOneTimeKey: process.env.ONE_TIME_JWT_KEY,
  publicKey: process.env.PUBLIC_KEY,
  frontendPort: process.env.FRONTEND_PORT,
  mailer: {
    email: process.env.MAILER_MAIL,
    pwd: process.env.MAILER_PWD,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
  },
}));
