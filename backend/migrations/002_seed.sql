-- Insert a test user
-- Password hash for 'test123' with bcrypt
INSERT INTO users (email, password_hash) VALUES 
    ('admin@test.com', '$2b$10$rT8qY8QZ8qZ8qZ8qZ8qZ8.O8qZ8qZ8qZ8qZ8qZ8qZ8qZ8qZ8qZ8q'), -- password: token123
    ('admin@example.com','$2b$10$SWOqR7Cmn8EQGbNqqYs4IezH.yXiCqPoEfGmQwif2v5XxVr1OcyQ2'), -- password: admin
    ('admin_1@example.com','$2b$10$9ZS2zh24EsUMA686VIynK.4DLr/O6SvVVColdDR2RxUHPhbvs9uPK') -- password: admin
ON CONFLICT (email) DO NOTHING;

-- Seed some vir-robots
INSERT INTO robots (name, status, lat, lon) VALUES
  ('LF-001',    'idle',   51.339695, 12.373075),
  ('LF-002',    'idle', 51.346405, 12.381041),
  ('LF-003',    'idle',   51.330600, 12.334700),
  ('LF-004',    'idle', 51.314900, 12.381300),
  ('LF-005',    'idle',   51.361000, 12.379200),
  ('LF-006',    'idle', 51.334900, 12.402600),
  ('LF-007',    'idle',   51.322900, 12.373900),
  ('LF-008',   'idle', 51.364900, 12.360400),
  ('LF-009',   'idle',   51.391900, 12.221600),
  ('LF-010',   'idle', 51.336200, 12.328900)
ON CONFLICT DO NOTHING;