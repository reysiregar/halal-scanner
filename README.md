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
3. **Configure Environment Variables**
   - Create `.env` in `backend`:
     ```env
     MONGO_URI=mongodb://localhost:27017/halal-scanner
     JWT_SECRET=your_jwt_secret_here
     COHERE_API_KEY=your_cohere_api_key_here
     ```
   - Replace `your_jwt_secret_here` with a secure secret for JWT
   - Replace `your_cohere_api_key_here` with your Cohere API key
   - For production, use a MongoDB Atlas URI instead of localhost
4. **Start the backend**
   ```bash
   cd backend
   npm start
   ```
5. **Open the app**
   - Open `index.html` in your browser.

---

## 🔑 Test Accounts
You can generate default credentials for Admin and User using the `mongo-init.js` script.
```bash
cd backend
node mongo-init.js
```

---

## 📚 API Endpoints (Backend)

### Authentication
- `POST   /auth/signup` — Register user
- `POST   /auth/signin` — Authenticate user, returns JWT

### Ingredient Analysis
- `POST   /analyze-ingredients` — Analyze ingredient list for halal status
- `POST   /extract-ingredients-ai` — Extract ingredients from OCR text (AI)

### Saved Results (Auth Required)
- `GET    /api/saved-results` — Get user's saved results
- `POST   /save-results` — Save scan result
- `DELETE /saved-results/:id` — Delete saved result

### Reports (Auth Required)
- `POST   /submit-report` — Submit inaccuracy report
- `GET    /user-reports` — Get user's reports
- `GET    /api/user/reports` — Get user's reports (alternative endpoint)
- `DELETE /reports/:id` — Delete report

### Admin Endpoints (Admin Only)
- `GET    /admin/reports` — Get all reports
- `PUT    /admin/reports/:id` — Update report status/note

### Testimonials
- `GET    /api/testimonials` — Get all testimonials
- `POST   /api/testimonials` — Submit testimonial

### Health Check
- `GET    /health` — Check API status
- `GET    /` — Welcome message and API status

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