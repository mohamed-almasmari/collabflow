import "dotenv/config";

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getPort() {
  const rawPort = process.env.PORT?.trim();

  if (!rawPort) {
    return 3000;
  }

  const port = Number(rawPort);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT value: ${rawPort}`);
  }

  return port;
}

function getNodeEnvironment() {
  const value = process.env.NODE_ENV?.trim() ?? "development";

  if (value !== "development" && value !== "test" && value !== "production") {
    throw new Error(
      `Invalid NODE_ENV value: ${value}. Expected development, test, or production.`,
    );
  }

  return value;
}

export const env = {
  NODE_ENV: getNodeEnvironment(),
  PORT: getPort(),
  DATABASE_URL: getRequiredEnv("DATABASE_URL"),
  JWT_SECRET: getRequiredEnv("JWT_SECRET"),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN?.trim() ?? "http://localhost:5173",
} as const;

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
export const isTest = env.NODE_ENV === "test";
