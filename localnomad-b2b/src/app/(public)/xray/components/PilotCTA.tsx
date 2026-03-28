'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { getSupabase } from '../lib/supabase';
import { trackFormSubmit } from '../lib/analytics';

interface Props {
  universityName: string;
  isOpen: boolean;
  onClose: () => void;
}

const CHALLENGE_OPTIONS = [
  '유학생 유치',
  'IEQAS 대응',
  '중도탈락 관리',
  '기타',
];

export default function PilotCTA({ universityName, isOpen, onClose }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('국제교류팀');
  const [challenge, setChallenge] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;

    setIsSubmitting(true);
    try {
      const { error } = await getSupabase().from('leads').insert({
        name,
        email,
        phone: phone || null,
        org: universityName,
        role,
        challenge: challenge || null,
        source: 'xray',
      });

      if (error) throw error;

      trackFormSubmit(universityName, challenge);
      toast.success('감사합니다. 3일 내 연락드리겠습니다.');
      onClose();
    } catch (err) {
      console.error('Form submit error:', err);
      toast.error('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 md:p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-500 hover:text-gray-600"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-xl font-bold text-gray-900 mb-2">
          파일럿 신청
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          VisaCampus 유학생 관리 플랫폼을 무료로 체험해보세요.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* University (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">대학명</label>
            <input
              type="text"
              value={universityName}
              readOnly
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">담당자명 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="홍길동"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg
                         focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일 *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="hong@university.ac.kr"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg
                         focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-0000-0000"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg
                         focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">소속/직책</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="국제교류팀"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg
                         focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none"
            />
          </div>

          {/* Challenge */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주요 관심사</label>
            <select
              value={challenge}
              onChange={(e) => setChallenge(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg
                         focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none"
            >
              <option value="">선택해주세요</option>
              {CHALLENGE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-amber-500 text-white rounded-xl font-semibold
                       hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
          >
            {isSubmitting ? '제출 중...' : '파일럿 신청하기'}
          </button>
        </form>
      </div>
    </div>
  );
}
