# TimberHaul 🪵

> **India's Premium Timber E-Commerce Platform** — Built with the MERN Stack

A full-stack e-commerce application for selling premium wood products, timber, furniture, plywood, and wooden décor. Features a luxury design with custom CSS, scroll-reveal animations, and a comprehensive admin dashboard.

---

## 🚀 Live Demo
- **Frontend (Netlify):** `[Your Netlify URL here]`
- **Backend API (Render):** `[Your Render URL here]`

*(Note: API is hosted on a free tier. It may take ~50 seconds to wake up on the first request).*

---

## 🛠️ Tech Stack

**Frontend (Vanilla MERN)**
- HTML5, Vanilla CSS, Vanilla JavaScript
- Custom CSS Design System (Glassmorphism, Dark Mode)
- IntersectionObserver (Scroll-reveal animations)
- Chart.js (Admin analytics)

**Backend (Node.js + Express)**
- Node.js & Express.js API
- MongoDB Atlas via Mongoose
- JSON Web Tokens (JWT) for Authentication
- Multer & Cloudinary (Image upload)
- Nodemailer (Order confirmation emails)
- Helmet, Rate Limiting, CORS configuration

---

## 📦 Local Development Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/timberhaul.git
cd timberhaul/backend
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend/` directory by copying the example:
```bash
cp .env.example .env
```
Fill in the necessary credentials in `.env` (MongoDB URI, JWT Secret, Cloudinary keys, Email pass). By default, `DEMO_PAYMENT_MODE=true` is enabled to bypass real payments.

### 3. Seed Database (Optional)
To populate sample products and categories:
```bash
npm run seed
```

### 4. Start the Application
**Backend:**
```bash
npm run dev
# Server starts at http://localhost:5000
```

**Frontend:**
Serve the `frontend/` folder. Do not just double-click the HTML file. Use a local server:
```bash
npx http-server frontend -p 3000
# or with Python: python -m http.server 3000 --directory frontend
```

Navigate to `http://localhost:3000`.

---

## 🌍 Production Deployment Guide (Free Tier)

This project is fully configured for free deployment via **Netlify** (frontend) and **Render** (backend).

### Part 1: Deploy Backend to Render
Render will host our Express.js API and connect to our MongoDB database.

1. Create a free account at [Render.com](https://render.com).
2. Connect your GitHub account and select **"New +" -> "Blueprint"**.
3. Select your repository. Render will automatically read the `render.yaml` file.
4. Render will prompt you to enter the environment variables. Paste the same values from your `.env` file:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `EMAIL_USER`, `EMAIL_PASS`
   - `DEMO_PAYMENT_MODE` (Set to `true`)
   - `CLIENT_URL` (Leave blank for now, we will update this in Part 3)
5. Click **Apply**. Wait for the build to finish. Note down your backend URL (e.g., `https://timberhaul-backend.onrender.com`).

### Part 2: Deploy Frontend to Netlify
Netlify will host our static HTML/CSS/JS frontend.

1. **Important:** In your code, open `frontend/js/api.js`. On line 6, replace `https://your-backend-app-name.onrender.com/api` with the actual URL Render gave you in Part 1. Push this change to GitHub.
2. Create a free account at [Netlify.com](https://netlify.com).
3. Click **"Add new site" -> "Import an existing project"** from GitHub.
4. Select your repository. Netlify automatically reads the `netlify.toml` file.
5. Click **Deploy**. Note down your frontend URL (e.g., `https://timberhaul.netlify.app`).

### Part 3: Finalize CORS Configuration
We must tell the backend to accept requests from our new Netlify frontend.

1. Go back to your Render Dashboard -> Your Web Service -> **Environment Variables**.
2. Add or update `CLIENT_URL` to be your Netlify URL (e.g., `https://timberhaul.netlify.app`).
3. Save changes. Render will quickly restart the server. Your app is now live!

---

## 💳 Payment Processing (Demo Mode vs Live)

By default, the backend is configured with `DEMO_PAYMENT_MODE=true`. 
- When users select **Credit Card** or **UPI**, the UI will display a **🎮 DEMO** badge.
- Orders will instantly succeed and be marked as "Paid".
- No real money is moved, and you don't need real Stripe or Razorpay keys.

**To enable real payments:**
1. Set `DEMO_PAYMENT_MODE=false` in Render Environment Variables.
2. Add your `STRIPE_SECRET_KEY` from your [Stripe Dashboard](https://dashboard.stripe.com/apikeys).
3. Add your `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` from your [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys).

---

## 🔐 Default Credentials

After running the seed script, you can log in with:
- **Admin**: `admin@timberhaul.com` / `Admin@1234`
- **User**: `user@timberhaul.com` / `User@1234`

---

## 📞 Support
- **Email**: support@timberhaul.com
- **Hours**: Mon–Sat, 9AM–7PM IST

*Built with ❤️ and premium timber by TimberHaul*
