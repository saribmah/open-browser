export namespace Log {
    export interface Logger {
        info: (message: string, meta?: Record<string, any>) => void;
        error: (message: string, meta?: Record<string, any>) => void;
        warn: (message: string, meta?: Record<string, any>) => void;
        debug: (message: string, meta?: Record<string, any>) => void;
    }

    export function create(opts: { service: string }): Logger {
        const { service } = opts;

        const log = (level: string, message: string, meta?: Record<string, any>) => {
            const timestamp = new Date().toISOString();
            const logData = {
                timestamp,
                level,
                service,
                message,
                ...meta,
            };
            
            const colorMap: Record<string, string> = {
                info: '\x1b[36m',    // cyan
                error: '\x1b[31m',   // red
                warn: '\x1b[33m',    // yellow
                debug: '\x1b[90m',   // gray
            };
            const reset = '\x1b[0m';
            const color = colorMap[level] || '';
            
            console.log(`${color}[${timestamp}] [${level.toUpperCase()}] [${service}]${reset} ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
        };

        return {
            info: (message: string, meta?: Record<string, any>) => log('info', message, meta),
            error: (message: string, meta?: Record<string, any>) => log('error', message, meta),
            warn: (message: string, meta?: Record<string, any>) => log('warn', message, meta),
            debug: (message: string, meta?: Record<string, any>) => log('debug', message, meta),
        };
    }
}
