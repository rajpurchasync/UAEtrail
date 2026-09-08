import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'crypto';
import { appendFileSync } from 'node:fs';

type LogLevel = 'fatal' | 'error' | 'warn' | 'info';

const logFilePath = process.env.LOG_FILE_PATH;

const levelWeight: Record<LogLevel, number> = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30
};

const configuredLevel = ((process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel);

const safeSerializeError = (value: unknown) => {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack
    };
  }
  return value;
};

class JsonLogger {
  private context: Record<string, unknown>;

  constructor(context: Record<string, unknown> = {}) {
    this.context = context;
  }

  child(context: Record<string, unknown>) {
    return new JsonLogger({ ...this.context, ...context });
  }

  fatal(dataOrMessage?: unknown, maybeMessage?: string) {
    this.write('fatal', dataOrMessage, maybeMessage);
  }

  error(dataOrMessage?: unknown, maybeMessage?: string) {
    this.write('error', dataOrMessage, maybeMessage);
  }

  warn(dataOrMessage?: unknown, maybeMessage?: string) {
    this.write('warn', dataOrMessage, maybeMessage);
  }

  info(dataOrMessage?: unknown, maybeMessage?: string) {
    this.write('info', dataOrMessage, maybeMessage);
  }

  private write(level: LogLevel, dataOrMessage?: unknown, maybeMessage?: string) {
    if (levelWeight[level] < (levelWeight[configuredLevel] || levelWeight.info)) {
      return;
    }

    const payload: Record<string, unknown> = {
      ts: new Date().toISOString(),
      level,
      ...this.context
    };

    if (typeof dataOrMessage === 'string') {
      payload.msg = dataOrMessage;
    } else if (dataOrMessage && typeof dataOrMessage === 'object') {
      const objectData = dataOrMessage as Record<string, unknown>;
      for (const [key, value] of Object.entries(objectData)) {
        payload[key] = key === 'err' ? safeSerializeError(value) : value;
      }
    } else if (dataOrMessage !== undefined) {
      payload.data = dataOrMessage;
    }

    if (maybeMessage) {
      payload.msg = maybeMessage;
    }

    const line = `${JSON.stringify(payload)}\n`;
    if (logFilePath) {
      try {
        mkdirSync(dirname(logFilePath), { recursive: true });
        appendFileSync(logFilePath, line, 'utf8');
      } catch {
        process.stdout.write(line);
      }
    } else {
      process.stdout.write(line);
    }
  }
}

export const logger = new JsonLogger();

export const createRequestLogger = (req: { traceId?: string; method?: string; url?: string }) => {
  const traceId = req.traceId || randomUUID();
  return logger.child({ traceId, method: req.method, url: req.url });
};

export const logError = (message: string, error: unknown, context?: Record<string, unknown>) => {
  logger.error({ err: error, ...context }, message);
};
