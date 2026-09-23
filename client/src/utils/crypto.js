/**
 * Generates a SHA-256 hex digest for DPDP consent session signatures
 */
export async function generateSessionHash(payload) {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload) + Date.now().toString());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
