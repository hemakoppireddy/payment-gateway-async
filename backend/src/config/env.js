import dotenv from "dotenv";
dotenv.config();

export const env = {
    PORT: process.env.PORT || 8000,
    DATABASE_URL: process.env.DATABASE_URL,

    TEST_MERCHANT_EMAIL: process.env.TEST_MERCHANT_EMAIL,
     TEST_API_KEY: process.env.TEST_API_KEY,
  TEST_API_SECRET: process.env.TEST_API_SECRET

}