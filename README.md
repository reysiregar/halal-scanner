# Halal Scanner

Halal Scanner is a web application for checking ingredient halal status from typed input and OCR text, then storing results and handling user reports with admin moderation. The halal verdict is deterministic and database-driven; AI is used only to extract text from product images so spelling mistakes do not change the result.

## Overview

- Frontend is plain HTML, CSS, and JavaScript.
- Backend is Node.js + Express with JWT authentication.
- Data is stored in PostgreSQL (Supabase-compatible schema).
- AI is used only for OCR text extraction and cleanup with Cohere.
- OCR is handled in the frontend via Tesseract.js CDN.

## Current Features

- Ingredient analysis endpoint backed by a deterministic halal ingredient database and rule set.
- OCR text cleanup + label text extraction flow.
- User sign up and sign in.
- Save and delete scan results per user.
- Submit and track inaccuracy reports.
- Admin review workflow for report status updates.
- Testimonials create/list endpoints.
- User and admin dashboard pages.

## Tech Stack

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js, Express, JWT, pg, Cohere SDK for OCR text extraction
- Database: PostgreSQL
- UI libraries: Font Awesome

## Project Structure

```text
halal-scanner/
  index.html
  user-dashboard.html
  admin-dashboard.html
  main.js
  dashboard.js
  config.js
  styles.css
  backend/
    server.js
    package.json
    .env.example
    ingredients.json
    database/
      schema.sql
      push-schema.js
      seed-users.js
```

## Prerequisites

- Node.js 20+
- PostgreSQL database (Supabase or compatible)
- Cohere API key

## Local Setup

1. Clone the repository.

```bash
git clone <repository-url>
cd halal-scanner
```

2. Install dependencies.

```bash
cd backend
npm install
cd ..
npm install
```

3. Create backend environment file.

- Copy `backend/.env.example` to `backend/.env`, then update values.
- Minimum required values:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:password@db.your-project-ref.supabase.co:5432/postgres
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=12h
COHERE_API_KEY=your_cohere_api_key_here
PG_FORCE_IPV4=true
# Optional fallback if DNS resolves unreachable addresses:
# PGHOSTADDR=1.2.3.4
```

4. Apply schema.

```bash
npm run db:push
```

5. (Optional) Seed default users.

```bash
npm run db:seed
```

6. Start backend.

```bash
cd backend
npm start
```

7. Open the app.

- Recommended: http://localhost:3000
- Alternative: open `index.html` directly and keep backend running.

## Scripts

From repository root:

- `npm run db:push` - apply `backend/database/schema.sql`
- `npm run db:seed` - seed default users

From `backend`:

- `npm start` - start Express server
- `npm run db:push` - apply schema
- `npm run db:seed` - seed users

## API Endpoints

Base URL (local): `http://localhost:3000`

### Authentication

- `POST /auth/signup` - create user
- `POST /auth/signin` - return JWT and user profile

### Ingredient Analysis

- `POST /analyze-ingredients` - analyze ingredients text
- `POST /extract-ingredients-ai` - extract and clean ingredient text from OCR output

### Saved Results (JWT required)

- `GET /user-saved-results` - user-scoped saved results (frontend default)
- `GET /api/saved-results` - alias route; supports admin/global list behavior
- `POST /save-results` - save result payload
- `DELETE /saved-results/:id` - delete saved result (ownership enforced)

### Reports (JWT required)

- `POST /submit-report` - submit report
- `GET /user-reports` - user reports
- `GET /api/user/reports` - user reports alias
- `DELETE /reports/:id` - delete report (role and status rules enforced)

### Admin (admin JWT required)

- `GET /admin/reports` - list all reports
- `PUT /admin/reports/:id` - update report status and admin note

### Testimonials

- `GET /testimonials` - list testimonials (frontend default)
- `POST /testimonials` - create testimonial (frontend default)
- `GET /api/testimonials` - alias route
- `POST /api/testimonials` - alias route

### Health

- `GET /health` - backend health JSON

## Database Schema

Defined in `backend/database/schema.sql`.

Main tables:

- `users` (UUID PK, `is_admin` flag)
- `saved_results` (JSONB payload per user)
- `reports` (status: `pending`, `solved`, `rejected`)
- `testimonials` (rating 1..5)

## Environment Variables

- `PORT` - backend port (use `3000` locally to match frontend config)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRES_IN` - token expiry, default `12h`
- `COHERE_API_KEY` - required for `/extract-ingredients-ai` OCR text extraction
- `PG_FORCE_IPV4` - set `true` when IPv6 egress is unreliable
- `PGHOSTADDR` - optional direct Postgres host override

## Deployment Notes

- `backend/Dockerfile` exposes and health-checks port `3000`.
- `backend/Procfile` runs `node server.js`.
- `backend/koyeb.yaml` maps service port `3000` and required secrets.

## SEO & Performance

### On-Page SEO
- Comprehensive meta tags (title, description, keywords, author)
- Open Graph and Twitter card tags for social media sharing
- JSON-LD structured data for Organization, WebApplication, FAQPage, and BreadcrumbList
- Canonical URLs to prevent duplicate content issues
- Robots and crawler meta tags for search engine optimization

### Technical SEO
- `sitemap.xml` - XML sitemap for all pages with proper priority and changefreq
- `robots.txt` - Crawler directives excluding protected pages and backend files
- `.well-known/security.txt` - Security contact and policy information
- Mobile-friendly meta tags and viewport configuration

### Performance
- Preconnect/DNS-prefetch for external origins
- Preload critical resources (stylesheets, main scripts)
- Prefetch secondary resources (dashboard scripts, pages)
- Semantic HTML structure with proper header/nav/section hierarchy

### Best Practices
- Search engines can index the main website (`/index.html`)
- Protected pages (dashboards) are blocked from indexing via `noindex` robots meta tag
- All public pages include relevant keywords and descriptive content
- JSON-LD schemas validate with Google's Structured Data Testing Tool

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test your changes.
5. Open a pull request.

## Support

- Open an issue in the repository.