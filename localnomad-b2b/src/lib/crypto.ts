import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

// 암호화 키 가져오기 (정확히 32바이트 필요)
function getKey(): Buffer {
  const key = process.env.AES_ENCRYPTION_KEY;
  if (!key || key.length !== 32) {
    throw new Error('AES_ENCRYPTION_KEY must be exactly 32 bytes');
  }
  return Buffer.from(key, 'utf-8');
}

// 평문을 AES-256-GCM으로 암호화 (iv:tag:encrypted hex 형식)
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

// AES-256-GCM 암호화된 텍스트를 복호화
export function decrypt(encryptedText: string): string {
  const [ivHex, tagHex, dataHex] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const encrypted = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
}
