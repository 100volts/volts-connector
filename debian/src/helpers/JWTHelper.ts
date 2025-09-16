export function isJwtExpired(token: string): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );
    if (!payload.exp) return true;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch {
    return true;
  }
}
