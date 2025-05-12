// This file is intentionally_empty.
// It is used in tsconfig.base.json to map Node.js built-in modules
// (like fs, net, perf_hooks, etc.) to an empty module for browser builds,
// preventing "module not found" errors when these modules are
// spuriously imported by dependencies but not actually used.
export {};
