import crypto from 'crypto';
import { redisService } from '../services/redis.service.js';
import { VALIDATION_LIMITS } from '@jobconnect/shared';

export function generate6DigitOtp(): string {
  // Cryptographically secure 6-digit integer
  return crypto.randomInt(100000, 999999).toString();
}

export function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

export async function storeOtpInRedis(
  purpose: string,
  identifier: string,
  otp: string
): Promise<{ success: boolean; cooldownRemaining?: number }> {
  const cooldownKey = `otp:cooldown:${purpose}:${identifier}`;
  const isCooldown = await redisService.exists(cooldownKey);
  if (isCooldown) {
    return { success: false, cooldownRemaining: 60 };
  }

  const hashed = hashOtp(otp);
  const otpKey = `otp:${purpose}:${identifier}`;
  const attemptsKey = `otp:attempts:${purpose}:${identifier}`;

  // Store hashed OTP with 5 min TTL
  await redisService.set(otpKey, hashed, VALIDATION_LIMITS.OTP_TTL_SECONDS);

  // Set 60-second cooldown
  await redisService.set(cooldownKey, '1', VALIDATION_LIMITS.OTP_COOLDOWN_SECONDS);

  // Reset attempts
  await redisService.set(attemptsKey, '0', VALIDATION_LIMITS.OTP_TTL_SECONDS);

  return { success: true };
}

export async function verifyOtpFromRedis(
  purpose: string,
  identifier: string,
  candidateOtp: string
): Promise<{ valid: boolean; reason?: string }> {
  const otpKey = `otp:${purpose}:${identifier}`;
  const attemptsKey = `otp:attempts:${purpose}:${identifier}`;

  const storedHashedOtp = await redisService.get(otpKey);
  if (!storedHashedOtp) {
    return { valid: false, reason: 'OTP has expired or does not exist. Please request a new one.' };
  }

  // Check attempt limit (Section 6A.39)
  const currentAttempts = parseInt((await redisService.get(attemptsKey)) || '0', 10);
  if (currentAttempts >= VALIDATION_LIMITS.OTP_MAX_ATTEMPTS) {
    await redisService.del(otpKey);
    return {
      valid: false,
      reason: 'Maximum verification attempts exceeded. Please request a new OTP.',
    };
  }

  const candidateHash = hashOtp(candidateOtp);
  if (candidateHash !== storedHashedOtp) {
    await redisService.set(attemptsKey, (currentAttempts + 1).toString(), VALIDATION_LIMITS.OTP_TTL_SECONDS);
    return {
      valid: false,
      reason: `Invalid OTP. You have ${VALIDATION_LIMITS.OTP_MAX_ATTEMPTS - (currentAttempts + 1)} attempts remaining.`,
    };
  }

  // Valid OTP: purge keys
  await redisService.del(otpKey);
  await redisService.del(attemptsKey);
  return { valid: true };
}

// Section 6A.40: Display masking helpers
export function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const [local, domain] = parts as [string, string];
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

export function maskPhone(phoneE164: string): string {
  if (phoneE164.length < 7) return phoneE164;
  const prefix = phoneE164.slice(0, 5);
  const suffix = phoneE164.slice(-3);
  return `${prefix}*****${suffix}`;
}
