/**
 * Type definitions for Node.js-like APIs in browser environment
 */

// Global NodeJS-like APIs
declare global {
  namespace NodeJS {
    interface Process {
      env: Record<string, string>;
      nextTick: (callback: (...args: any[]) => void, ...args: any[]) => void;
      hrtime?: {
        (time?: [number, number]): [number, number];
        bigint: () => bigint;
      };
      cwd: () => string;
      platform?: string;
      versions?: {
        node: string;
        [key: string]: string;
      };
    }

    interface ProcessEnv {
      [key: string]: string | undefined;
    }
  }

  var process: NodeJS.Process;
  var __dirname: string;
  var __filename: string;
  var require: NodeRequire;
  
  interface NodeRequire {
    (id: string): any;
    resolve: RequireResolve;
    cache: any;
    extensions: any;
    main: NodeModule;
  }
  
  interface RequireResolve {
    (id: string, options?: { paths?: string[]; }): string;
  }
  
  interface NodeModule {
    exports: any;
    require: NodeRequire;
    id: string;
    filename: string;
    loaded: boolean;
    parent: NodeModule | null;
    children: NodeModule[];
    paths: string[];
  }
}

// This is needed to make this a module
export {};
