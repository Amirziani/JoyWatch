/** Central, validated access to server environment variables. */
export class ConfigError extends Error {}

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new ConfigError(`Missing environment variable ${name}. See .env.example.`);
  return v;
}

export function livekitConfig() {
  return {
    url: required("LIVEKIT_URL"),
    apiKey: required("LIVEKIT_API_KEY"),
    apiSecret: required("LIVEKIT_API_SECRET"),
  };
}

export function kvConfig(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}
