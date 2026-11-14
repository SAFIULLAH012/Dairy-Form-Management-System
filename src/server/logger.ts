import fs from 'fs';
import path from 'path';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export class Logger {
  private logDir: string;
  private logFile: string;

  constructor() {
    this.logDir = path.resolve(process.cwd(), 'logs');
    if (!fs.existsSync(this.logDir)) {
      try {
        fs.mkdirSync(this.logDir, { recursive: true });
      } catch {
        // fallback
      }
    }
    const today = new Date().toISOString().slice(0, 10);
    this.logFile = path.join(this.logDir, `dairy_erp_${today}.log`);
  }

  private write(level: LogLevel, message: string, context?: any) {
    const timestamp = new Date().toISOString();
    const ctxString = context ? ` | Context: ${JSON.stringify(context)}` : '';
    const line = `[${timestamp}] [${level}] ${message}${ctxString}\n`;

    // Console output with standard styling
    if (level === 'ERROR') {
      console.error(line.trim());
    } else if (level === 'WARN') {
      console.warn(line.trim());
    } else {
      console.log(line.trim());
    }

    // Append to file
    try {
      fs.appendFileSync(this.logFile, line);
    } catch {
      // In case of permission issues
    }
  }

  info(msg: string, ctx?: any) {
    this.write('INFO', msg, ctx);
  }

  warn(msg: string, ctx?: any) {
    this.write('WARN', msg, ctx);
  }

  error(msg: string, ctx?: any) {
    this.write('ERROR', msg, ctx);
  }

  debug(msg: string, ctx?: any) {
    this.write('DEBUG', msg, ctx);
  }
}

export const logger = new Logger();
