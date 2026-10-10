// Network Origin Resolver for Mobile QR Code & Public Invitations
// Resolves:
// 1. Configured Public Application URL (APP_BASE_URL / NEXT_PUBLIC_APP_URL)
// 2. Machine's Local Network IPv4 Address (for mobile devices on same Wi-Fi)
// 3. Fallback Localhost for same-machine browsing

import os from 'os';

export function getLocalNetworkIp(): string | null {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const list = interfaces[name];
    if (!list) continue;
    for (const net of list) {
      // Pick external IPv4 address
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
}

export function resolveApplicationOrigin(req?: Request): {
  canonicalOrigin: string;
  isPublicTunnelOrDomain: boolean;
  localNetworkOrigin: string | null;
  detectedIp: string | null;
} {
  // 1. Explicit configured production or public tunnel URL
  const appBaseUrl = process.env.APP_BASE_URL?.trim();
  if (appBaseUrl && !appBaseUrl.includes('localhost') && !appBaseUrl.includes('127.0.0.1')) {
    return {
      canonicalOrigin: appBaseUrl.replace(/\/$/, ''),
      isPublicTunnelOrDomain: true,
      localNetworkOrigin: null,
      detectedIp: null,
    };
  }

  const nextPublicAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (nextPublicAppUrl && !nextPublicAppUrl.includes('localhost') && !nextPublicAppUrl.includes('127.0.0.1')) {
    return {
      canonicalOrigin: nextPublicAppUrl.replace(/\/$/, ''),
      isPublicTunnelOrDomain: true,
      localNetworkOrigin: null,
      detectedIp: null,
    };
  }

  // 2. Derive port from request header or default 3000
  let port = '3000';
  if (req) {
    const hostHeader = req.headers.get('host');
    if (hostHeader && hostHeader.includes(':')) {
      port = hostHeader.split(':')[1];
    }
  }

  // 3. Detect machine's active LAN IPv4 address for cross-device mobile scanning
  const localIp = getLocalNetworkIp();
  const localNetworkOrigin = localIp ? `http://${localIp}:${port}` : null;

  // If localIp is available, prefer it so mobile devices scanning QR code connect to the host computer
  if (localNetworkOrigin) {
    return {
      canonicalOrigin: localNetworkOrigin,
      isPublicTunnelOrDomain: false,
      localNetworkOrigin,
      detectedIp: localIp,
    };
  }

  // 4. Fallback to localhost
  return {
    canonicalOrigin: `http://localhost:${port}`,
    isPublicTunnelOrDomain: false,
    localNetworkOrigin: null,
    detectedIp: null,
  };
}
