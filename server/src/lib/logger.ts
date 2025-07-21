import pino from "pino";
import pretty from "pino-pretty";
import pinoMultiStream from "pino-multi-stream";
import fs from "node:fs";
import path from "node:path";

const isDev = process.env.NODE_ENV !== "production";

const logDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const streams = [
  { stream: isDev ? pretty({ colorize: true }) : process.stdout },
  {
    stream: fs.createWriteStream(path.join(logDir, "app.log"), { flags: "a" }),
  },
];

const logger = pino(
  {
    level: isDev ? "debug" : "info",
    formatters: {
      level(label) {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    messageKey: "msg",
  },
  pinoMultiStream.multistream(streams)
);

export default logger;
