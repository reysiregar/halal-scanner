# Halal Scanner

A modern web app to scan and analyze food ingredients for halal status, with user authentication, dashboards, reporting, and admin moderation.

---

## 🛠️ Tech Stack
- **Frontend:** HTML, Vanilla JS, CSS
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT Auth, Cohere AI, Tesseract.js
- **Database:** MongoDB (local or Atlas)
- **UI/UX:** SweetAlert2, FontAwesome

---

## ✨ Features
- Scan and analyze food ingredients for halal status (OCR & AI extraction)
- User registration and login (JWT-based)
- Save scan results (per user)
- Submit and manage inaccuracy reports
- User dashboard: manage saved results & reports
- Admin dashboard: review/respond to reports, moderate saved results
- Testimonials system
- Responsive, modern UI

---

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd halal-scanner
   ```
2. **Install dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   npm install
   ```
3. **Configure MongoDB**
   - Create `.env` in `backend`:
     ```env
     MONGODB_URI=mongodb://localhost:27017/halal-scanner
     JWT_SECRET=your_secret
     ```
   - Or use your MongoDB Atlas URI.
4. **Start the backend**
   ```bash
   cd backend
   npm start
   ```
5. **Open the app**
   - Open `index.html` in your browser.

---

## 🔑 Test Accounts
- **Admin:** admin@halalscanner.com / 8uWskpH015Gz
- **User:** user@halalscanner.com / GqTXG7UbS5YQ

---

## 📚 API Endpoints (Backend)
- `POST   /signup` — Register user
- `POST   /login` — Authenticate user, returns JWT
- `POST   /analyze-ingredients` — Analyze ingredient list for halal status
- `POST   /extract-ingredients-ai` — Extract ingredients from OCR text (AI)
- `POST   /save-results` — Save scan result (auth required)
- `GET    /user-saved-results` — Get user’s saved results (auth required)
- `DELETE /saved-results/:id` — Delete saved result (auth required)
- `POST   /submit-report` — Submit inaccuracy report (auth required)
- `GET    /user-reports` — Get user’s reports (auth required)
- `GET    /admin/reports` — Get all reports (admin only)
- `PUT    /admin/reports/:id` — Update report status/note (admin only)
- `DELETE /reports/:id` — Delete report (user or admin)
- `POST   /api/testimonials` — Submit testimonial
- `GET    /api/testimonials` — Get all testimonials

---

## 🗄️ Database Models
- **User:** { name, email, password (hashed), is_admin }
- **SavedResult:** { user_id, result_data, created_at }
- **Report:** { user_id, item_name, reason, status, admin_note, created_at }
- **Testimonial:** { name, rating, testimony, created_at }

---

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 🆘 Support
- Open an issue in the repository
- Contact the development team