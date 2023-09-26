/* eslint-disable @typescript-eslint/no-shadow */
import { createLogger, format, transports } from 'winston';
import path from 'path';
import os from 'os';
import fs from 'fs';

const { sep } = path;
const { combine, timestamp, label, printf } = format;
const homeFolder = `${os.homedir() + sep}Documents${sep}VarDots-App`;

const customFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

export const createHomeFolder = (path: string) => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
};

if (process.env.NODE_ENV === 'production') {
  createHomeFolder(homeFolder);
}

const logger = createLogger({
  level: 'info',
  format: combine(
    label({ label: 'vardots-service' }),
    timestamp(),
    customFormat
  ),
  defaultMeta: { service: 'vardots-service' },
  transports: [
    new transports.File({
      filename:
        process.env.NODE_ENV === 'production'
          ? `${homeFolder + sep}log.txt`
          : 'log-dev.txt',
    }),
  ],
});

// If we're not in production then log to the `console` with the custom format
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: customFormat,
    })
  );
}

export default logger;
