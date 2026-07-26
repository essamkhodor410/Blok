import dotenv from "dotenv";
dotenv.config();

const num = (v, d) => (v ? Number(v) : d);

export const config = {
  port: num(process.env.PORT, 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  publicBaseUrl: process.env.PUBLIC_BASE_URL || "http://localhost:4000",
  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: num(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "blok",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "dev_insecure_secret_change_me",
    expires: process.env.JWT_EXPIRES || "7d",
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ||
      "http://localhost:4000/api/auth/google/callback",
    enabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  },
};
