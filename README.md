# TimberHaul 🪵

> **India's Premium Timber E-Commerce Platform** — Built with MERN Stack

A full-stack e-commerce website for selling premium wood products, timber, furniture, plywood, and wooden décor. Features a dark luxury theme with premium wood-inspired aesthetics.

---

## 🛠️ Tech Stack

**Frontend**
- HTML5, Vanilla CSS, Vanilla JavaScript
- Custom CSS Design System with glassmorphism, 3D animations
- IntersectionObserver for scroll-reveal
- Canvas-based particle system
- Chart.js (admin dashboard)

**Backend**
- Node.js + Express.js
- MongoDB Atlas (Mongoose)
- JWT Authentication
- Multer (file uploads)
- Stripe + Razorpay (payments)
- Helmet, Rate Limiting, CORS

---

## 📁 Project Structure

```
timberhaul/
├── frontend/
│   ├── index.html              # Home page
│   ├── products.html           # Products listing
│   ├── product-detail.html     # Product detail
│   ├── cart.html               # Shopping cart
│   ├── checkout.html           # Checkout
│   ├── login.html              # Sign in
│   ├── register.html           # Create account
│   ├── profile.html            # User profile
│   ├── wishlist.html           # Wishlist
│   ├── blog.html               # Blog listing
│   ├── blog-detail.html        # Blog article
│   ├── admin/
│   │   ├── index.html          # Admin dashboard
│   │   ├── products.html       # Product management
│   │   ├── orders.html         # Order management
│   │   └── ...
│   ├── css/
│   │   ├── global.css          # Design tokens + base
│   │   ├── animations.css      # Keyframes + 3D effects
│   │   ├── components.css      # All component styles
│   │   ├── home.css            # Home page styles
│   │   ├── products.css        # Products/cart/auth styles
│   │   └── responsive.css      # Breakpoints
│   ├── js/
│   │   ├── api.js              # Backend API client
│   │   ├── auth.js             # Authentication
│   │   ├── main.js             # Global behaviors
│   │   ├── animations.js       # Scroll reveal, particles
│   │   ├── home.js             # Home page logic
│   │   ├── products.js         # Products page logic
│   │   ├── product-detail.js   # Product detail logic
│   │   └── cart.js             # Cart logic
│   └── assets/
│       └── images/             # Generated wood images
│
└── backend/
    ├── server.js               # Express app
    ├── .env.example            # Environment vars template
    ├── config/
    │   └── db.js               # MongoDB connection
    ├── models/
    │   ├── User.js
    │   ├── Product.js
    │   ├── Order.js
    │   ├── Category.js
    │   ├── Review.js
    │   ├── Cart.js
    │   ├── Wishlist.js
    │   ├── Payment.js
    │   ├── Inventory.js
    │   ├── Supplier.js
    │   ├── Blog.js
    │   └── Message.js
    ├── routes/
    │   ├── auth.js
    │   ├── products.js
    │   ├── orders.js
    │   ├── categories.js
    │   ├── reviews.js
    │   ├── cart.js
    │   ├── wishlist.js
    │   ├── payments.js
    │   ├── blogs.js
    │   └── messages.js
    └── middleware/
        ├── auth.js
        └── upload.js
```

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
cd timberhaul/backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

Required environment variables:
```env
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_super_secret_key
STRIPE_SECRET_KEY=sk_test_...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
PORT=5000
```

### 3. Seed Database (optional)

```bash
node utils/seed.js
```

### 4. Start Backend

```bash
npm run dev
# Server starts at http://localhost:5000
```

### 5. Open Frontend

Simply open `frontend/index.html` in your browser, or use a local server:

```bash
# Using Python
python -m http.server 3000 --directory frontend

# Using Node.js http-server
npx http-server frontend -p 3000
```

---

## 🎨 Design System

### Color Palette
- **Walnut**: `#8B5E3C` — Primary brand warm brown
- **Oak**: `#C8A96E` — Secondary golden caramel  
- **Teak**: `#D4A843` — Accent golden yellow
- **Forest**: `#4A7C59` — Eco/sustainability green

### Typography
- **Display**: Playfair Display (headings, hero)
- **Body**: Poppins (paragraphs, UI)

### CSS Variables
All design tokens are defined in `:root` in `global.css` and support both dark/light themes via `[data-theme]`.

---

## 🔐 Default Credentials

After seeding:
- **Admin**: `admin@timberhaul.com` / `Admin@1234`
- **User**: `user@timberhaul.com` / `User@1234`

---

## 📱 Pages

| Page | URL | Description |
|------|-----|-------------|
| Home | `/index.html` | Hero, categories, products, reviews |
| Products | `/products.html` | Filter, sort, search products |
| Product Detail | `/product-detail.html?id=...` | Gallery, specs, reviews |
| Cart | `/cart.html` | Cart items, coupon, summary |
| Login | `/login.html` | JWT authentication |
| Register | `/register.html` | Create account |
| Admin | `/admin/index.html` | Dashboard, analytics |

---

## 🌱 Sustainability

TimberHaul is committed to sustainable sourcing:
- 🏅 FSC® Certified timber
- 🌿 PEFC Certified
- 🌳 10 trees planted per order
- ♻️ Eco-friendly packaging

---

## 📞 Support

- **Email**: support@timberhaul.com
- **Phone**: +91 80 4567 8900
- **Hours**: Mon–Sat, 9AM–7PM IST

---

*Built with ❤️ and premium timber by TimberHaul*
