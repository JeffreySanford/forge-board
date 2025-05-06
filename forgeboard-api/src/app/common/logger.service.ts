import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LoggerService extends Logger {
  debug(message: string, context?: string, data?: Record<string, unknown>): void {
    if (data) {
      super.debug({ message, ...data }, context);
    } else {
      super.debug(message, context);
    }
  }

  info(message: string, context?: string, data?: Record<string, unknown>): void {
    if (data) {
      super.log({ message, ...data }, context);
    } else {
      super.log(message, context);
    }
  }

  warn(message: string, context?: string, data?: Record<string, unknown>): void {
    if (data) {
      super.warn({ message, ...data }, context);
    } else {
      super.warn(message, context);
    }
  }

  // Fix method signature to match the base class implementation and remove 'any'
  error(message: unknown, stackOrContext?: string, contextOrData?: string | Record<string, unknown>): void {
    // If contextOrData is an object, treat as data
    if (typeof contextOrData === 'object' && contextOrData !== null) {
      // If stackOrContext is a string, treat as context
      const context = typeof stackOrContext === 'string' ? stackOrContext : undefined;
      // If contextOrData has an 'error' property, use its stack
      const data = contextOrData as Record<string, unknown>;
      const errorObj = data.error;
      const stack = errorObj instanceof Error ? errorObj.stack : undefined;
      super.error({ message, ...data }, stack, context);
    } else if (typeof stackOrContext === 'string' && typeof contextOrData === 'string') {
      // (message, stack, context)
      super.error(message, stackOrContext, contextOrData);
    } else if (typeof stackOrContext === 'string') {
      // (message, context)
      super.error(message, undefined, stackOrContext);
    } else {
      // (message)
      super.error(message);
    }
  }
}
