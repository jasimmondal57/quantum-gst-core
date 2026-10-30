# Quantum GST Core

> **Modern Omnichannel Indian GST Billing, Statutory Accounting, and Multi-Channel eCommerce Reconciliation Engine.**

Quantum GST is an open-source, production-ready system designed for Indian manufacturers, D2C brands, traders, and retail businesses. It provides single-source GST statutory reporting (GSTR-1, GSTR-3B, GSTR-9), real-time tax compliance, marketplace order reconciliation (Amazon, Flipkart, Meesho), and multi-client access across **Web**, **Windows Desktop**, and **Android Mobile (Flutter)**.

---

## 🏛️ Architecture & System Modules

```
quantum-gst-core/
├── backend/            # Modular Monolith Laravel 13 API (PHP 8.4+, PostgreSQL 16)
│   ├── app/Modules/GSTEngine/     # High-precision statutory tax calculator (bcmath)
│   ├── app/Modules/Marketplace/   # Amazon MTR, Meesho, Flipkart report parsers
│   ├── app/Modules/Shopify/       # Real-time webhook & backward tax reconciler
│   └── database/migrations/       # Multi-tenant UUID PostgreSQL schema
├── frontend/           # Modern React 19 + TypeScript + Vite + Tailwind CSS SPA
│   ├── electron/                  # Cross-platform Windows/Mac Desktop app wrapper
│   └── src/                       # 9 Statutory Screens + Interactive Onboarding Wizard
├── mobile/             # Flutter 3.47+ / Dart 3.13+ Cross-Platform POS Mobile App
└── docker-compose.yml  # 1-Click Self-Hosting Orchestration
```

---

## 🚀 Self-Hosting Guide (Deploy on Your Own Server)

Anyone can self-host Quantum GST on their own Virtual Private Server (Ubuntu/Debian, AWS EC2, DigitalOcean, Hetzner, or bare metal).

### Option A: 1-Click Docker Compose (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jasimmondal57/quantum-gst-core.git
   cd quantum-gst-core
   ```

2. **Configure Environment:**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your domain and database credentials
   ```

3. **Start the containers:**
   ```bash
   docker compose up -d --build
   ```

4. **Initialize Database & Key:**
   ```bash
   docker compose exec backend php artisan key:generate
   docker compose exec backend php artisan migrate --force
   ```

---

### Option B: Native VPS Deployment (Nginx + PHP 8.4-FPM + PostgreSQL 16)

#### 1. Server Prerequisites
```bash
sudo apt update && sudo apt install -y nginx postgresql-16 php8.4-fpm php8.4-pgsql php8.4-bcmath php8.4-mbstring php8.4-xml php8.4-curl curl git unzip
```

#### 2. Configure PostgreSQL Database
```sql
sudo -u postgres psql
CREATE DATABASE quantumgst;
CREATE USER quantumgst_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE quantumgst TO quantumgst_user;
\q
```

#### 3. Setup Backend API
```bash
cd /var/www/yourdomain.com/backend
composer install --no-dev --optimize-autoloader
cp .env.example .env
# Configure DB_DATABASE, DB_USERNAME, DB_PASSWORD, and APP_URL
php artisan key:generate
php artisan migrate --force
sudo chown -R www-data:www-data storage bootstrap/cache
```

#### 4. Build and Deploy Web Frontend
```bash
cd /var/www/yourdomain.com/frontend
npm install
# Set VITE_API_URL=https://yourdomain.com/api/v1
npm run build
```

#### 5. Configure Nginx Virtual Host
```nginx
server {
    server_name yourdomain.com;
    root /var/www/yourdomain.com/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ^~ /api {
        root /var/www/yourdomain.com/backend/public;
        try_files $uri $uri/ /api/index.php?$query_string;

        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/var/run/php/php8.4-fpm.sock;
            fastcgi_param SCRIPT_FILENAME /var/www/yourdomain.com/backend/public/index.php;
            include fastcgi_params;
        }
    }
}
```

---

## 💻 Configuring Desktop and Mobile Clients to Point to Your Server

### Windows Desktop App
Set the target API URL in `frontend/.env`:
```env
VITE_API_BASE_URL=https://yourdomain.com/api/v1
```
Build the Windows binary:
```bash
cd frontend
npm run build
npx electron-builder --win --dir
```

### Android Mobile App
Open `mobile/lib/services/api_service.dart` and set your custom endpoint:
```dart
static const String baseUrl = 'https://yourdomain.com/api/v1';
```
Or allow dynamic server URL input directly from the app login screen.

---

## 🛡️ License & Contributing

Licensed under the **MIT License**. Contributions, bug reports, and pull requests are warmly welcomed!
