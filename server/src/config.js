import dotenv from "dotenv";
dotenv.config();

const num = (v, d) => (v ? Number(v) : d);

export const config = {
  port: num(process.env.PORT, 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  publicBaseUrl: process.env.PUBLIC_BASE_URL || "http://localhost:4000",

  // PostgreSQL / Neon connection string
  databaseUrl: process.env.DATABASE_URL || "",

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
