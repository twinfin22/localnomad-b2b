import { describe, it, expect } from 'vitest';
import { maskPii, unmaskPii, containsPii } from '../pii-masker';

describe('PII Masker', () => {
  describe('maskPii', () => {
    it('should mask email addresses', () => {
      const result = maskPii('My email is student@hoseo.ac.kr and backup is test@gmail.com');
      expect(result.masked).not.toContain('student@hoseo.ac.kr');
      expect(result.masked).not.toContain('test@gmail.com');
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0].original).toBe('student@hoseo.ac.kr');
      expect(result.entries[1].original).toBe('test@gmail.com');
    });

    it('should mask Korean phone numbers', () => {
      const result = maskPii('전화번호는 010-1234-5678이고 01012345678도 있어요');
      expect(result.masked).not.toContain('010-1234-5678');
      expect(result.masked).not.toContain('01012345678');
      expect(result.entries).toHaveLength(2);
    });

    it('should mask international phone numbers', () => {
      const result = maskPii('Call me at +84-123-456-7890 or +1-234-567-8901');
      expect(result.masked).not.toContain('+84-123-456-7890');
      expect(result.masked).not.toContain('+1-234-567-8901');
      expect(result.entries).toHaveLength(2);
    });

    it('should mask passport numbers', () => {
      const result = maskPii('여권번호는 M12345678 입니다');
      expect(result.masked).not.toContain('M12345678');
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].original).toBe('M12345678');
    });

    it('should mask RRN (주민등록번호)', () => {
      const result = maskPii('주민번호 950101-1234567 확인해주세요');
      expect(result.masked).not.toContain('950101-1234567');
      expect(result.entries).toHaveLength(1);
    });

    it('should NOT mask visa codes like D-2-2, D-4-1', () => {
      const result = maskPii('I have a D-2-2 visa and my friend has D-4-1');
      expect(result.masked).toContain('D-2-2');
      expect(result.masked).toContain('D-4-1');
      expect(result.entries).toHaveLength(0);
    });

    it('should NOT mask dates', () => {
      const result = maskPii('비자 만료일은 2024-06-15입니다');
      expect(result.masked).toContain('2024-06-15');
      expect(result.entries).toHaveLength(0);
    });

    it('should handle mixed PII in a single message', () => {
      const text = '이름: 김철수, 이메일: kim@univ.kr, 전화: 010-1111-2222, 여권: A1234567';
      const result = maskPii(text);
      expect(result.masked).not.toContain('kim@univ.kr');
      expect(result.masked).not.toContain('010-1111-2222');
      expect(result.masked).not.toContain('A1234567');
      expect(result.entries.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle text with no PII', () => {
      const result = maskPii('비자 연장은 어떻게 하나요?');
      expect(result.masked).toBe('비자 연장은 어떻게 하나요?');
      expect(result.entries).toHaveLength(0);
    });
  });

  describe('unmaskPii', () => {
    it('should restore masked PII', () => {
      const original = 'Contact: student@hoseo.ac.kr, 010-1234-5678';
      const { masked, entries } = maskPii(original);
      const restored = unmaskPii(masked, entries);
      expect(restored).toBe(original);
    });

    it('should handle AI response referencing placeholders', () => {
      const entries = [
        { placeholder: '[EMAIL_1]', original: 'user@test.com' },
        { placeholder: '[PHONE_2]', original: '010-9999-8888' },
      ];
      const aiResponse = 'Your email [EMAIL_1] and phone [PHONE_2] are on file.';
      const result = unmaskPii(aiResponse, entries);
      expect(result).toBe('Your email user@test.com and phone 010-9999-8888 are on file.');
    });
  });

  describe('containsPii', () => {
    it('should return true for text with email', () => {
      expect(containsPii('email is test@example.com')).toBe(true);
    });

    it('should return true for text with phone', () => {
      expect(containsPii('call 010-1234-5678')).toBe(true);
    });

    it('should return false for text without PII', () => {
      expect(containsPii('비자 연장 방법을 알려주세요')).toBe(false);
    });

    it('should return false for visa codes', () => {
      expect(containsPii('D-2-2 visa extension')).toBe(false);
    });
  });
});
