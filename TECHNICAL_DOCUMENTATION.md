# National Health Facility Registry (MFL) - Technical Documentation

**Version:** 1.0.0  
**Last Updated:** December 2025  
**Department:** National Department of Health - EPI

---

## 1. System Overview

The **National Health Facility Registry (MFL)** is a centralized, authoritative database of all health facilities in Papua New Guinea. It is designed to provide a "Single Source of Truth" for facility data, supporting geospatial visualization, facility attribute management, and interoperability with other health systems (e.g., mSupply, DHIS2) via FHIR standards.

### Key Modules
1.  **Interactive Map Dashboard**: A geospatial visualization tool using Leaflet.js to display facility locations, filtered by sector, status, and type.
2.  **Facility Management**: A CRUD interface for creating, editing, and archiving facility records.
3.  **Workflow Management Console**: A governed approval system where facility updates (submitted by officers) must be approved by administrators before going live.
4.  **Public Verification**: A QR-code based system allowing public verification of facility licenses and details without login.
5.  **Analytics Dashboard**: Visual reports on facility coverage, functional status, and infrastructure analysis.
6.  **Admin Console**: User role management and reference data control.

---

## 2. Technical Architecture

The system follows a modern **Client-Server** architecture, containerized for easy deployment.

### 2.1 Technology Stack

*   **Frontend**: 
    *   **Framework**: React.js (Vite)
    *   **Styling**: Tailwind CSS (custom design system)
    *   **Maps**: React-Leaflet
    *   **State Management**: React Hooks & Context API
    *   **Build Tool**: Vite (Production build via `npm run build`)

*   **Backend**: 
    *   **Runtime**: Node.js
    *   **Framework**: Express.js
    *   **Security**: Helmet, CORS, Rate Limiting
    *   **Authentication**: JWT (JSON Web Tokens) + BCrypt (Password Hashing)
    *   **API Standard**: RESTful + FHIR R4 (Location Resources)

*   **Database**: 
    *   **Engine**: PostgreSQL 16
    *   **Extensions**: PostGIS (for advanced geospatial queries - planned/enabled)

*   **Infrastructure**: 
    *   **OS**: Ubuntu Linux 24.04 (Hostinger VPS)
    *   **Web Server**: Nginx (Reverse Proxy & SSL Termination)
    *   **Containerization**: Docker & Docker Compose
    *   **SSL**: Let's Encrypt (Certbot)

### 2.2 Data Flow
1.  **User Request**: Traffic enters via HTTPS (Port 443) -> Nginx Host Proxy.
2.  **Routing**: 
    *   `/api/*` requests are proxied to the **Backend Container** (Port 5001).
    *   Static assets (`/`, `/assets/*`) are served by the **Nginx Container** (Port 80/8081).
3.  **Processing**: The Node.js backend processes requests, authenticates via JWT, and queries PostgreSQL.
4.  **Response**: Data is returned as JSON (or GeoJSON for maps).

---

## 3. Deployment Guide

The production environment maps `mfl.lamtoninvestments.com` to a VPS hosting the Docker stack.

### 3.1 Prerequisites
*   Ubuntu VPS with Docker & Docker Compose v2 installed.
*   Domain DNS A-Record pointing to VPS IP.

### 3.2 Docker Configuration
The system uses `docker-compose.prod.yml` (aliased to `docker-compose.yml`) which defines three services:

1.  **`mfl-postgres`**: Database service.
    *   Mounts volume `mfl_postgres_data` for persistence.
    *   Initializes via `mfl_prod_db.sql` on first run.
2.  **`mfl-backend`**: Node.js API.
    *   Exposes internal port 5001.
    *   Depends on `mfl-postgres`.
3.  **`mfl-nginx`**: Frontend Web Server.
    *   Serves the React `dist/` or `build/` folder.
    *   Proxies API requests internally to `mfl-backend`.
    *   Exposed to Host on Port 8081.

### 3.3 Deployment Steps (Update Procedure)

To deploy new changes (Frontend or Backend):

1.  **Local Build (Frontend)**:
    ```powershell
    # In c:\mfl directory
    npm run build
    ```
2.  **Upload to Server**:
    ```powershell
    scp -r c:\mfl\build root@<VPS_IP>:/root/mfl
    scp -r c:\mfl\backend root@<VPS_IP>:/root/mfl  # Only if backend changed
    ```
3.  **Apply Changes on Server**:
    ```bash
    ssh root@<VPS_IP>
    cd /root/mfl
    
    # 1. Fix Permissions (Crucial for Nginx access)
    chmod -R 755 /root/mfl/build
    
    # 2. Restart Containers
    docker restart mfl-nginx-1   # If frontend changed
    docker restart mfl-backend-1 # If backend changed
    ```

### 3.4 Host Nginx Configuration
The Host Nginx (`/etc/nginx/sites-available/mfl.lamtoninvestments.com`) acts as the SSL Terminator and Reverse Proxy:

```nginx
server {
    server_name mfl.lamtoninvestments.com;
    
    location / {
        proxy_pass http://127.0.0.1:8081; # Proxies to Docker Nginx
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    listen 443 ssl; 
    # ... SSL Certbot paths ...
}
```

---

## 4. API & Integration

### 4.1 Authentication
*   **Endpoint**: `POST /api/auth/login`
*   **Payload**: `{ "email": "user@example.com", "password": "..." }`
*   **Response**: Returns `{ "token": "eyJhbGci...", "user": { ... } }`
*   **Usage**: All protected endpoints require header `Authorization: Bearer <token>`.

### 4.2 FHIR Interoperability
The system exposes public endpoints following the HL7 FHIR standard for `Location` resources.
*   **Get Facility**: `GET /api/fhir/Location/:id`
*   **QR Verification**: The Public Verification page consumes this FHIR endpoint to render the certificate.

---

## 5. Security Protocols

1.  **SSL/TLS**: Enforced via Let's Encrypt. HTTP requests automatically redirect to HTTPS.
2.  **Protected Routes**: The Frontend utilizes a `ProtectedRoute` wrapper to ensure unauthenticated users cannot access the Dashboard or Admin consoles.
3.  **Backend Validation**: All protected API routes verify the JWT signature before processing.
4.  **Network Isolation**: The PostgreSQL database is NOT exposed to the public internet; it is only accessible within the Docker Network.

## 6. Maintenance & Troubleshooting

### Common Issues
*   **"Invalid Credentials"**: 
    *   Check `docker logs mfl-backend-1`.
    *   Ensure the password hash in the DB matches the backend's BCrypt logic.
*   **"Network Error" / Mixed Content**:
    *   Ensure `VITE_API_URL` in `.env` is set to `https://mfl.lamtoninvestments.com/api` before building.
    *   Clear browser cache/incognito mode.
*   **"Blank Page"**:
    *   Check permissions: `chmod -R 755 /root/mfl/build`.
    *   Check if API is crashing (Backend logs).

### Database Backup
To backup the live database:
```bash
docker exec -t mfl-postgres-1 pg_dump -U postgres mfl_db > mfl_prod_backup_$(date +%F).sql
```

---
**National Department of Health - ICT Division**
