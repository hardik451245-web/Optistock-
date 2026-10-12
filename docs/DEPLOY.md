# Deployment Guide

This document provides instructions for hosting the OptiStock backend and frontend services in a production environment, configuring environment variables, and mapping a custom domain with HTTPS.

## 1. System Requirements

- Backend: Java 17+ JRE/JDK, MySQL 8.0+ or compatible relational database.
- Frontend: Node.js 18+ (for building static assets), Web server (such as Nginx, Caddy, or Cloudflare Pages / AWS S3 + CloudFront).

## 2. Environment Variables

### Backend Configuration

Set the following environment variables on the backend hosting instance:

| Variable | Description | Example Value |
|---|---|---|
| `DB_URL` | JDBC connection string | `jdbc:mysql://db.internal:3306/optistock?useSSL=true` |
| `DB_USERNAME` | MySQL database user | `optistock_app` |
| `DB_PASSWORD` | MySQL database password | `[Secret - store in vault]` |
| `OPTISTOCK_MANAGER_CODE` | Registration secret required to create MANAGER accounts | `[Secret access code]` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed frontend origins | `https://app.yourdomain.com,https://yourdomain.com` |
| `SERVER_PORT` | HTTP port for Spring Boot (default 8080) | `8080` |

> Note: If `OPTISTOCK_MANAGER_CODE` is unset or empty, registration of new manager accounts is disabled.

### Frontend Configuration

Build the frontend with the target backend URL:

| Variable | Description | Example Value |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL for API requests (empty string if proxied under same origin) | `https://api.yourdomain.com` |

## 3. Building and Packaging

### Backend Build

Run the Maven package command from the project root:
```bash
mvn clean package -DskipTests
```
This produces an executable JAR: `target/optistock-0.0.1-SNAPSHOT.jar`.

To run the application:
```bash
java -jar target/optistock-0.0.1-SNAPSHOT.jar
```

### Frontend Build

From the `optistock-frontend` directory:
```bash
npm install
npm run build
```
This produces optimized production assets in `optistock-frontend/dist/`.

## 4. Web Server and Reverse Proxy (Nginx Example)

Configure Nginx to serve the frontend static files and proxy `/api` requests to Spring Boot:

```nginx
server {
    listen 80;
    server_name app.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/app.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.yourdomain.com/privkey.pem;

    root /var/www/optistock/dist;
    index index.html;

    # Single Page App routing fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 5. Custom Domain and DNS Setup

To route your domain to the OptiStock host:

1. Apex domain (e.g. `yourdomain.com`):
   - Type: `A`
   - Name: `@`
   - Value: IPv4 address of your server
2. Subdomain (e.g. `app.yourdomain.com`):
   - Type: `CNAME`
   - Name: `app`
   - Value: Hostname or target server address
3. SSL / TLS Certificate:
   - Install Certbot or configure automated ACME / Let's Encrypt certificates:
     ```bash
     sudo certbot --nginx -d app.yourdomain.com
     ```
   - Verify automated renewal with `certbot renew --dry-run`.

## 6. Security Audit Notes

- No hardcoded database passwords or API tokens are checked into version control.
- In `application.properties`, default values use environment variable expansion (`${DB_PASSWORD:}`).
- The in-memory token store issues UUID bearer tokens with 8-hour expiry.
- Failed logins trigger rate limiting: 5 consecutive failed attempts lock the email address for 10 minutes.
