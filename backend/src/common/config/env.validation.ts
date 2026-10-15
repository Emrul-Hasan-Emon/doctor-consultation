export function validateEnv(config: Record<string, unknown>) {
  const secret = typeof config.JWT_SECRET === 'string' ? config.JWT_SECRET : '';
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters');
  }
  return config;
}
