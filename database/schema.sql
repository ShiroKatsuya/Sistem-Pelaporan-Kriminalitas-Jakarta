-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    lokasi GEOMETRY(Point, 4326) NOT NULL,
    tanggal_kejadian TIMESTAMP NOT NULL,
    jenis_kejahatan VARCHAR(50) NOT NULL,
    deskripsi TEXT,
    foto_path VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending',
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create manual_zones table
CREATE TABLE IF NOT EXISTS manual_zones (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    geometry GEOMETRY(Polygon, 4326) NOT NULL,
    level_risiko VARCHAR(20) NOT NULL,
    warna VARCHAR(7) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reports_lokasi ON reports USING GIST (lokasi);
CREATE INDEX IF NOT EXISTS idx_manual_zones_geometry ON manual_zones USING GIST (geometry);

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_jenis_kejahatan ON reports (jenis_kejahatan);
CREATE INDEX IF NOT EXISTS idx_reports_tanggal_kejadian ON reports (tanggal_kejadian);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports (created_at);
CREATE INDEX IF NOT EXISTS idx_reports_ip_address ON reports (ip_address);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for manual_zones updated_at
CREATE TRIGGER update_manual_zones_updated_at 
    BEFORE UPDATE ON manual_zones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

