# dwatson Ecommerce

A full-stack ecommerce web application inspired by dwatson.pk. The project features a Node.js/Express backend with MongoDB, JWT-secured authentication, role-based admin controls, and a lightweight HTML/CSS/JavaScript frontend served by the same server. Payments are integrated via Stripe (with a PayPal placeholder) and an admin dashboard is provided for managing products, orders, and users.

## Project Structure

```
web/
├── backend/          # Node.js API + admin services
│   ├── package.json
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── services/
│       └── utils/
└── frontend/         # Static frontend assets
    ├── index.html
    ├── product.html
    ├── cart.html
    ├── checkout.html
    ├── admins.html
    ├── admin.html (redirect helper)
    └── assets/
        ├── css/
        └── js/
```

## Features

- **Product catalogue** with search, category filter, rich descriptions, ratings, and reviews.
- **Admin-only authentication** with JWT-secured sessions; no public registration.
- **Content management** for categories (with parent/child hierarchy), banners, and featured products via an enhanced admin dashboard.
- **Shopping cart** backed by MongoDB, synchronized between sessions (admin usage only).
- **Checkout flow** supporting Stripe card payments, PayPal placeholder, and cash-on-delivery.
- **Admin dashboard** at `/admins.html` with login gate for administrators; public self-service registration is disabled.
- **Role-based access control** ensuring only admins can authenticate and manage content.
- **Responsive UI** built with vanilla HTML/CSS/JS that consumes the REST API.

## Prerequisites

- Node.js 18+
- npm
- MongoDB instance (Atlas or local)
- Stripe account (for live payments) and optional PayPal credentials

## Environment Variables

Copy `backend/env.example` to `backend/.env` and update the values:

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=dwatson_ecommerce
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=30d
CLIENT_ORIGIN=http://localhost:5000
STRIPE_SECRET_KEY=sk_test_yourkey
PAYPAL_CLIENT_ID=your_paypal_client_id
TAX_RATE=0.05
SHIPPING_FLAT=10
CURRENCY=pkr
ADMIN_NAME=Site Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!
```

> `PAYPAL_CLIENT_ID` is currently used as a placeholder. Implement real PayPal capture inside `services/paymentService.js` when you have credentials.

## Getting Started

1. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Run the API server**
   ```bash
   npm run dev
   ```
   The API is available at `http://localhost:5000/api` and serves the static frontend from `../frontend` in production mode. During development, you can open the HTML files directly in the browser or serve them via the backend by placing an `index.html` in `frontend/`.

3. **Seed data (optional)**
   - On startup the server seeds a default admin using `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` if that user is missing. Update those env vars before the first run.
   - Additional catalog data can be inserted manually via MongoDB tools.

4. **Access the app**
   - `http://localhost:5000/index.html` – Homepage
   - `http://localhost:5000/admins.html` – Admin dashboard & login (admins only)
   - `http://localhost:5000/register.html` – Admin sign-up (creates admin accounts)

## API Overview

| Method | Endpoint               | Description                          | Auth |
| ------ | ---------------------- | ------------------------------------ | ---- |
| POST   | `/api/auth/login`      | Login administrator                   | Admin|
| GET    | `/api/auth/profile`    | Fetch current admin profile           | Admin|
| PUT    | `/api/auth/profile`    | Update admin profile/password         | Admin|
| GET    | `/api/products`        | List products (supports filters)     | Public |
| GET    | `/api/products/slug/:slug` | Get product by slug               | Public |
| GET    | `/api/categories`         | List active categories            | Public |
| GET    | `/api/banners`            | List active homepage banners      | Public |
| POST   | `/api/products`        | Create product                       | Admin|
| PUT    | `/api/products/:id`    | Update product                       | Admin|
| DELETE | `/api/products/:id`    | Delete product                       | Admin|
| POST   | `/api/products/:id/reviews` | Add product review                | Admin|
| GET    | `/api/cart`            | Get cart                             | Admin|
| POST   | `/api/cart`            | Add/update cart item                 | Admin|
| PUT    | `/api/cart`            | Update cart item quantity            | Admin|
| DELETE | `/api/cart/:productId` | Remove cart item                     | Admin|
| DELETE | `/api/cart`            | Clear cart                           | Admin|
| POST   | `/api/orders`          | Place order                          | Admin|
| GET    | `/api/orders`          | List admin orders                    | Admin|
| GET    | `/api/orders/:id`      | Get order details                    | Admin|
| PUT    | `/api/orders/:id`      | Update order status                  | Admin|
| GET    | `/api/admin/stats`     | Dashboard stats                      | Admin|
| GET    | `/api/admin/users`     | List users                           | Admin|
| PUT    | `/api/admin/users/:id` | Update user role/status              | Admin|
| GET    | `/api/admin/orders`    | List all orders                      | Admin|
| GET    | `/api/admin/categories`| List all categories                  | Admin|
| POST   | `/api/admin/categories`| Create category                      | Admin|
| PUT    | `/api/admin/categories/:id` | Update category                 | Admin|
| DELETE | `/api/admin/categories/:id` | Delete category                 | Admin|
| GET    | `/api/admin/banners`   | List all banners                     | Admin|
| POST   | `/api/admin/banners`   | Create banner                        | Admin|
| PUT    | `/api/admin/banners/:id` | Update banner                      | Admin|
| DELETE | `/api/admin/banners/:id` | Delete banner                      | Admin|

## Development Notes

- Only pre-seeded admin users can log in. Customer self-registration is disabled; create admin accounts directly in MongoDB.
- The admin dashboard (accessible at `/admins.html`) includes sections for products, categories, banners, orders, and users. Use the forms to add or edit content; lists provide quick edit/delete actions.
- Frontend modules (`frontend/assets/js/*.js`) use native ES modules. Serve files via a web server (e.g., the Express backend) to avoid CORS/module issues.
- Stripe payments require a valid payment method ID (`tok_visa` works in test mode).
- PayPal integration is stubbed; replace `capturePayPalOrder` with actual API calls before production use.
- Error handling returns JSON with `message` and, in non-production, an optional stack for easier debugging.

## Future Enhancements

- Add unit/integration tests for critical flows.
- Implement product image uploads (e.g., via S3) and inventory management dashboards.
- Expand frontend into a dedicated React or Next.js SPA for richer UX.
- Add email notifications for orders and password recovery.

## License

This project is provided as-is for educational purposes. Update licensing and attribution per your requirements before production use.
