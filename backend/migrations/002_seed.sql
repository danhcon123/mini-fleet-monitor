-- Insert a test user
-- Password hash for 'test123' with bcrypt
INSERT INTO users (email, password_hash) VALUES 
    ('admin@test.com', '$2b$10$rT8qY8QZ8qZ8qZ8qZ8qZ8.O8qZ8qZ8qZ8qZ8qZ8qZ8qZ8qZ8qZ8q'), -- password: token123
    ('admin@example.com','$2b$10$SWOqR7Cmn8EQGbNqqYs4IezH.yXiCqPoEfGmQwif2v5XxVr1OcyQ2'), -- password: admin
    ('admin_1@example.com','$2b$10$9ZS2zh24EsUMA686VIynK.4DLr/O6SvVVColdDR2RxUHPhbvs9uPK') -- password: admin
ON CONFLICT (email) DO NOTHING;

-- Seed some vir-robots
INSERT INTO robots (name, status, lat, lon) VALUES
  ('Robot-Leipzig-Zentrum',      'idle',   51.339695, 12.373075),
  ('Robot-Leipzig-Hbf',          'moving', 51.346405, 12.381041),
  ('Robot-Leipzig-Plagwitz',     'idle',   51.330600, 12.334700),
  ('Robot-Leipzig-Connewitz',    'moving', 51.314900, 12.381300),
  ('Robot-Leipzig-Gohlis',       'idle',   51.361000, 12.379200),
  ('Robot-Leipzig-Reudnitz',     'moving', 51.334900, 12.402600),
  ('Robot-Leipzig-Suedvorstadt', 'idle',   51.322900, 12.373900),
  ('Robot-Leipzig-Lindenthal',   'moving', 51.364900, 12.360400),
  ('Robot-Leipzig-Schkeuditz',   'idle',   51.391900, 12.221600),
  ('Robot-Leipzig-Lindenau',     'moving', 51.336200, 12.328900)
ON CONFLICT DO NOTHING;