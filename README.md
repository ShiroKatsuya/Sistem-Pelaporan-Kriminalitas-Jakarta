# Sistem Pelaporan dan Pemetaan Visual Wilayah Rawan Kriminalitas di DKI Jakarta

Developed a web-based crime reporting and visual mapping system for DKI Jakarta. Features an interactive heatmap using Leaflet and PostGIS, anonymous report submission, and a comprehensive admin dashboard for data management and analytics.

Interactive crime heatmap and manual zone mapping
Anonymous public reporting with location picking
Admin dashboard for analytics and report management

## Tech Stack

- **Frontend**: React + Leaflet + TailwindCSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL + PostGIS
- **Authentication**: JWT
- **File Storage**: Local storage

## Fitur

### Halaman Publik
- Peta interaktif dengan heatmap berdasarkan kepadatan laporan
- Zona rawan manual yang ditandai oleh admin
- Filter berdasarkan jenis kejahatan dan periode waktu
- Toggle antara heatmap dan zona manual

### Halaman Submit Laporan
- Form untuk submit laporan kriminalitas (anonim)
- Picker lokasi di peta
- Upload foto (opsional)
- Validasi sederhana (rate limiting berdasarkan IP)

### Halaman Admin
- Dashboard dengan analytics dan statistik
- Kelola laporan (verify, reject, delete)
- Kelola zona rawan (create, update, delete)
- Visualisasi data dengan charts

## Prerequisites

- Node.js (v14 atau lebih baru)
- PostgreSQL (v12 atau lebih baru)
- PostGIS extension untuk PostgreSQL
- npm atau yarn

## Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd dki-jakarta-crime-reporting
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Setup Database

#### 3.1. Install PostgreSQL dan PostGIS

Pastikan PostgreSQL dan PostGIS sudah terinstall di sistem Anda.

#### 3.2. Create Database

```bash
# Login ke PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE crime_reporting_db;

# Connect ke database
\c crime_reporting_db

# Enable PostGIS extension
CREATE EXTENSION postgis;
```

#### 3.3. Run Schema

```bash
# Dari root directory
psql -U postgres -d crime_reporting_db -f database/schema.sql
```

#### 3.4. Seed Sample Data (Opsional)

```bash
psql -U postgres -d crime_reporting_db -f database/seed.sql
```

#### 3.5. Create Admin User

```bash
# Dari backend directory
cd backend
node scripts/createAdmin.js <username> <password>

# Contoh:
node scripts/createAdmin.js admin admin123
```

### 4. Setup Environment Variables

#### 4.1. Backend Environment

Copy file `env.example` ke `.env` di direktori `backend/`:

```bash
cd backend
cp env.example .env
```

Edit file `.env` dan sesuaikan konfigurasi database dan JWT secret:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crime_reporting_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Configuration
JWT_SECRET=your-secret-key-change-this-in-production

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

#### 4.2. Frontend Environment (Opsional)

Buat file `.env` di direktori `frontend/` jika perlu mengubah API URL:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 5. Create Upload Directory

```bash
# Dari backend directory
mkdir uploads
```

## Menjalankan Aplikasi

### Development Mode

#### Option 1: Run Separately

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

#### Option 2: Run Together (dengan concurrently)

```bash
# Dari root directory
npm run dev
```

### Production Mode

#### Build Frontend

```bash
cd frontend
npm run build
```

#### Start Backend

```bash
cd backend
npm start
```

## Akses Aplikasi

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Admin Login**: http://localhost:3000/admin/login
  - Default username: `admin`
  - Default password: `admin123` (atau password yang Anda set saat create admin)

## Struktur Proyek

```
dki-jakarta-crime-reporting/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Komponen React
│   │   ├── pages/           # Halaman aplikasi
│   │   ├── services/        # API services
│   │   ├── utils/           # Utilities
│   │   └── App.jsx
│   ├── public/
│   └── package.json
├── backend/                  # Node.js + Express API
│   ├── routes/              # API routes
│   ├── models/              # Database models
│   ├── middleware/          # Auth, upload, validation
│   ├── controllers/         # Business logic
│   ├── config/              # Database, JWT config
│   ├── uploads/             # Foto laporan (local storage)
│   └── server.js
├── database/                # SQL scripts
│   ├── schema.sql           # PostgreSQL + PostGIS schema
│   └── seed.sql             # Sample data
└── README.md
```

## API Endpoints

### Public Endpoints

- `GET /api/reports` - Get reports untuk heatmap
- `GET /api/zones` - Get manual zones
- `POST /api/reports` - Submit laporan baru (anonim)

### Admin Endpoints (Protected)

- `POST /api/admin/login` - Login admin
- `GET /api/admin/analytics` - Get analytics data
- `GET /api/admin/reports` - Get all reports
- `PUT /api/admin/reports/:id` - Update status laporan
- `DELETE /api/admin/reports/:id` - Delete laporan
- `GET /api/admin/zones` - Get all zones
- `POST /api/admin/zones` - Create zone
- `PUT /api/admin/zones/:id` - Update zone
- `DELETE /api/admin/zones/:id` - Delete zone

## Troubleshooting

### Database Connection Error

- Pastikan PostgreSQL sedang berjalan
- Pastikan database dan user sudah dibuat
- Pastikan PostGIS extension sudah di-enable
- Periksa konfigurasi di `.env` file

### Port Already in Use

- Ubah port di `.env` file atau
- Kill process yang menggunakan port tersebut

### PostGIS Not Found

- Install PostGIS extension untuk PostgreSQL
- Pastikan extension sudah di-enable di database

### File Upload Error

- Pastikan direktori `uploads/` sudah dibuat
- Pastikan permission untuk write ke direktori tersebut

## Kontribusi

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

MIT License

## Author

Sistem Pelaporan Kriminalitas DKI Jakarta

