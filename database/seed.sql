-- Seed admin user
-- NOTE: Admin user should be created using the script: node backend/scripts/createAdmin.js
-- Or manually using: INSERT INTO admins (username, password_hash) VALUES ('admin', '<bcrypt_hash>');
-- Default password is 'admin123', but you should change it after first login

-- Sample manual zones for DKI Jakarta (approximate coordinates)
-- Zone 1: Kawasan Senayan (High Risk)
INSERT INTO manual_zones (nama, geometry, level_risiko, warna)
VALUES (
    'Kawasan Senayan',
    ST_GeomFromText('POLYGON((106.7980 -6.2270, 106.8050 -6.2270, 106.8050 -6.2350, 106.7980 -6.2350, 106.7980 -6.2270))', 4326),
    'tinggi',
    '#FF0000'
) ON CONFLICT DO NOTHING;

-- Zone 2: Kawasan Kota Tua (Medium Risk)
INSERT INTO manual_zones (nama, geometry, level_risiko, warna)
VALUES (
    'Kawasan Kota Tua',
    ST_GeomFromText('POLYGON((106.8120 -6.1350, 106.8200 -6.1350, 106.8200 -6.1420, 106.8120 -6.1420, 106.8120 -6.1350))', 4326),
    'sedang',
    '#FFA500'
) ON CONFLICT DO NOTHING;

-- Note: The admin password hash above is a placeholder
-- In production, generate a proper bcrypt hash for your desired password
-- You can use: bcrypt.hashSync('yourpassword', 10)

