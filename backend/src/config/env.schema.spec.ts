import { validateEnv, envSchema } from './env.schema';

describe('Environment Schema Validation', () => {
  it('should validate valid environment configuration with defaults', () => {
    const validConfig = {
      NODE_ENV: 'development',
      PORT: '3000',
      DATABASE_URL: 'postgresql://seyven_user:seyven_secret_pass@localhost:5432/seyven_db?schema=public',
    };

    const parsed = validateEnv(validConfig);
    expect(parsed.NODE_ENV).toBe('development');
    expect(parsed.PORT).toBe(3000);
    expect(parsed.API_PREFIX).toBe('api/v1');
    expect(parsed.REDIS_PORT).toBe(6379);
  });

  it('should reject invalid NODE_ENV', () => {
    const invalidConfig = {
      NODE_ENV: 'invalid_env',
    };

    expect(() => validateEnv(invalidConfig)).toThrow('Environment variable validation failed');
  });

  it('should reject invalid database URL format', () => {
    const invalidConfig = {
      DATABASE_URL: 'not-a-valid-url',
    };

    expect(() => validateEnv(invalidConfig)).toThrow('Environment variable validation failed');
  });
});
