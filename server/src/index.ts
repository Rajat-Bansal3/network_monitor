import express from "express";
import env from "./env";
import cookie from "cookie-parser";
import loggingMiddleware from "./middleware/loggingMiddleware";
import { authRouter, networkRouter } from "./routes";
import productionConfig from "./lib/productionConfig";
import cors from "cors";
import helmet from "helmet";
import logger from "./lib/logger";
import { connect } from "./lib/db";
import morgan from "morgan";
// type extensions
declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

connect();
const app = express();
app.use(express.json());
env.NODE_ENV === "development"
  ? app.use(morgan("dev"))
  : app.use(loggingMiddleware);
app.use(cookie());
app.use(express.urlencoded());
app.use(cors(productionConfig.corsOptions));
app.use(helmet(productionConfig.helmetOptions));
app.use("/api/auth", authRouter);
app.use("/api/network", networkRouter);

app.listen(env.PORT, () => {
  logger.info(`Server running on http://localhost:${env.PORT}`);
});
