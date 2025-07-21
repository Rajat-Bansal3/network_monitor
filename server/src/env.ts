import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

import logger from "./lib/logger";
const envSchema = z.object({
  PORT: z.coerce.number().positive().default(3000),
  MONGO_URI: z.coerce.string().nonempty(),
  JWT_SECRET: z.coerce.string().nonempty(),
  NODE_ENV: z
    .enum(["production", "development", "testing"])
    .default("development"),
});

const payload = envSchema.safeParse(process.env);
if (!payload.success) {
  logger.error(payload.error.format());
  process.exit(1);
}
const env = payload.data;

export default env;
