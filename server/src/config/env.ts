import dotenv from "dotenv";

dotenv.config();

function read(name: string, fallback = "") {
  return process.env[name] || fallback;
}

export const env = {
  port: Number(read("PORT", "4000")),
  mongoUrl: read("MONGO_URL", "mongodb://127.0.0.1:27017/heritage"),
  jwtSecret: read("JWT_SECRET"),
  adminLogin: read("ADMIN_LOGIN", "Heritage"),
  adminPassword: read("ADMIN_PASSWORD"),
  corsOrigin: read("CORS_ORIGIN", "http://localhost:8080,http://localhost:5173"),
  aiApiKey: read("AI_API_KEY"),
  aiBaseUrl: read("AI_BASE_URL", "https://api.openai.com/v1"),
  aiModel: read("AI_MODEL", "gpt-4o-mini"),
};
