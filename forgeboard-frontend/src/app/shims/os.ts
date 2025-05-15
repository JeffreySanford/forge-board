/**
 * Minimal browser-compatible implementation of Node's os module
 */

console.log('[Shim] OS module loaded');

/**
 * CPU information
 */
interface CpuInfo {
  model: string;
  speed: number;
  times: {
    user: number;
    nice: number;
    sys: number;
    idle: number;
    irq: number;
  };
}

/**
 * Network interface information
 */
interface NetworkInterfaceInfo {
  address: string;
  netmask: string;
  family: string;
  mac: string;
  internal: boolean;
  cidr: string | null;
}

/**
 * Constants for signaling limit errors
 */
export const constants = {
  signals: {
    SIGHUP: 1,
    SIGINT: 2,
    SIGTERM: 15
  },
  errno: {
    ENOENT: 2,
    EACCES: 13
  },
  priority: {
    PRIORITY_LOW: -1,
    PRIORITY_NORMAL: 0,
    PRIORITY_HIGH: 1
  }
};

/**
 * Return the operating system name
 */
export function platform(): string {
  console.log('[Shim] os.platform called');
  const platform = navigator.platform.toLowerCase();
  
  if (platform.includes('win')) {
    return 'win32';
  } else if (platform.includes('mac') || platform.includes('darwin')) {
    return 'darwin';
  } else if (platform.includes('linux') || platform.includes('android')) {
    return 'linux';
  } else if (platform.includes('freebsd')) {
    return 'freebsd';
  } else {
    return 'unknown';
  }
}

/**
 * Return the operating system release
 */
export function release(): string {
  console.log('[Shim] os.release called');
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Windows NT')) {
    const ntVersion = userAgent.match(/Windows NT (\d+\.\d+)/);
    return ntVersion ? ntVersion[1] : '10.0'; // Default to Windows 10
  } else if (userAgent.includes('Mac OS X')) {
    const macVersion = userAgent.match(/Mac OS X (\d+[._]\d+[._]\d+)/);
    return macVersion ? macVersion[1].replace(/_/g, '.') : '10.15.0';
  } else if (userAgent.includes('Linux')) {
    return '5.4.0'; // Default Linux kernel version
  } else {
    return '1.0.0'; // Default version
  }
}

/**
 * Return the operating system CPU architecture
 */
export function arch(): string {
  console.log('[Shim] os.arch called');
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('x86_64') || userAgent.includes('x64') || userAgent.includes('Win64')) {
    return 'x64';
  } else if (userAgent.includes('x86') || userAgent.includes('WOW64')) {
    return 'x86';
  } else if (userAgent.includes('arm64') || userAgent.includes('aarch64')) {
    return 'arm64';
  } else if (userAgent.includes('arm')) {
    return 'arm';
  } else {
    return 'x64'; // Default to x64
  }
}

/**
 * Return the amount of free memory in bytes
 */
export function freemem(): number {
  console.log('[Shim] os.freemem called');
  if (typeof performance !== 'undefined' && 
      (performance as unknown as {memory?: {jsHeapSizeLimit: number; usedJSHeapSize: number}}).memory) {
    const memory = (performance as unknown as {memory: {jsHeapSizeLimit: number; usedJSHeapSize: number}}).memory;
    return memory.jsHeapSizeLimit - memory.usedJSHeapSize;
  }
  return 1073741824; // Default: 1GB
}

/**
 * Return the total amount of system memory in bytes
 */
export function totalmem(): number {
  console.log('[Shim] os.totalmem called');
  if (typeof performance !== 'undefined' && 
      (performance as unknown as {memory?: {jsHeapSizeLimit: number}}).memory) {
    return (performance as unknown as {memory: {jsHeapSizeLimit: number}}).memory.jsHeapSizeLimit;
  }
  return 8589934592; // Default: 8GB
}

/**
 * Return information about the CPUs
 */
export function cpus(): CpuInfo[] {
  console.log('[Shim] os.cpus called');
  const logicalCores = navigator.hardwareConcurrency || 4;
  const result: CpuInfo[] = [];
  
  for (let i = 0; i < logicalCores; i++) {
    result.push({
      model: 'Browser CPU',
      speed: 2500, // 2.5GHz
      times: {
        user: 0,
        nice: 0,
        sys: 0,
        idle: 0,
        irq: 0
      }
    });
  }
  
  return result;
}

/**
 * Return the hostname of the operating system
 */
export function hostname(): string {
  console.log('[Shim] os.hostname called');
  return 'browser-host';
}

/**
 * Return the system uptime in seconds
 */
export function uptime(): number {
  console.log('[Shim] os.uptime called');
  if (typeof performance !== 'undefined' && performance.now) {
    return Math.floor(performance.now() / 1000);
  }
  return 0;
}

/**
 * Return the system's temporary directory
 */
export function tmpdir(): string {
  console.log('[Shim] os.tmpdir called');
  return '/tmp';
}

/**
 * Return the endianness of the system
 */
export function endianness(): string {
  console.log('[Shim] os.endianness called');
  const buffer = new ArrayBuffer(2);
  const uint8Array = new Uint8Array(buffer);
  const uint16Array = new Uint16Array(buffer);
  
  uint16Array[0] = 256;
  
  return uint8Array[0] === 0 ? 'BE' : 'LE';
}

/**
 * Return information about network interfaces
 */
export function networkInterfaces(): Record<string, NetworkInterfaceInfo[]> {
  console.log('[Shim] os.networkInterfaces called');
  return {
    'lo': [{
      address: '127.0.0.1',
      netmask: '255.0.0.0',
      family: 'IPv4',
      mac: '00:00:00:00:00:00',
      internal: true,
      cidr: '127.0.0.1/8'
    }],
    'eth0': [{
      address: '192.168.1.100',
      netmask: '255.255.255.0',
      family: 'IPv4',
      mac: '00:11:22:33:44:55',
      internal: false,
      cidr: '192.168.1.100/24'
    }]
  };
}

/**
 * Return the operating system type
 */
export function type(): string {
  console.log('[Shim] os.type called');
  const p = platform();
  
  if (p === 'win32') {
    return 'Windows_NT';
  } else if (p === 'darwin') {
    return 'Darwin';
  } else if (p === 'linux') {
    return 'Linux';
  } else {
    return 'Unknown';
  }
}

/**
 * Returns the string path delimiter: ';' for Windows, ':' for others
 */
export const EOL = platform() === 'win32' ? '\r\n' : '\n';

/**
 * Returns the number of logical CPUs available
 */
export function availableParallelism(): number {
  console.log('[Shim] os.availableParallelism called');
  return navigator.hardwareConcurrency || 4;
}

/**
 * Returns the system default directory for temporary files
 */
export function tmpDir(): string {
  return tmpdir(); // Alias for tmpdir()
}

// Add a method to check if the shim is being used
export function isShimActive(): boolean {
  console.log('[Shim] OS shim usage detected');
  return true;
}
