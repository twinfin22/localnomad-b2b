-- VisaCampus Dashboard — Test Account Seed
-- Run in Supabase SQL Editor

-- 1. Create test university (비캠대학교 — fictional test university)
INSERT INTO universities (id, name, region, "ieqasStatus", "overstayRate", "planType", "createdAt", "updatedAt")
VALUES (
  'test-univ-vicam-001',
  '비캠대학교',
  '서울 성동구',
  'CERTIFIED',
  0.80,
  'FREE_TRIAL',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create test user (ADMIN role)
-- Email: test@visacampus.org / Password: test1234
INSERT INTO users (id, "universityId", email, name, "hashedPassword", role, "isActive", "createdAt", "updatedAt")
VALUES (
  'test-user-admin-001',
  'test-univ-vicam-001',
  'test@visacampus.org',
  '테스트 관리자',
  '$2b$10$Og5iC1ywFF9ddebvB36KlupQPI.RzlH.KzO.DOmbI.YdMrTEX8eRO',
  'ADMIN',
  true,
  now(),
  now()
)
ON CONFLICT (email) DO NOTHING;
