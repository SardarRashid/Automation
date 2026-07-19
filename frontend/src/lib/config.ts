// Replace this with your actual deployed Render backend URL once your web service is active
export const CLOUD_BACKEND_URL = "https://inventory-suite-backend.onrender.com";

/**
 * Dynamically resolves the best backend API URL.
 * 1. If accessed on the host PC itself (localhost/127.0.0.1), always use the local backend directly.
 * 2. If accessed via local network IP (192.168.x.x), check if the host server is running.
 * 3. Otherwise, fallback to the Render cloud backend.
 */
export async function getBackendUrl(): Promise<string> {
  const hostname = window.location.hostname;
  
  // If accessing on the host PC itself, bypass pings and use local loopback directly
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://127.0.0.1:8000';
  }
  
  // If accessing via local office network IP, ping the server to check status
  const isLocalNetwork = 
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.');

  if (isLocalNetwork) {
    const localUrl = `http://${hostname}:8000`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200); // 1.2s timeout
      const res = await fetch(`${localUrl}/`, { method: 'GET', signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        return localUrl;
      }
    } catch (e) {
      // Local server is offline, fallback to cloud below
    }
  }

  return CLOUD_BACKEND_URL;
}
