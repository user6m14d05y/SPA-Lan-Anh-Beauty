import dotenv from 'dotenv';

dotenv.config();

const baseConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  dialect: 'mysql',
  logging: false,
};

export default {
  development: { ...baseConfig },
  test: { ...baseConfig },
  production: { ...baseConfig },
};
