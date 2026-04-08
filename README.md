# On.store

Group members:
1.NGENZI KUNDWA CIAN(Leader)
2.BAKORA ABDUL DJABAL
3.TUGANE BRIAN
4.SHAMI JOVAN
5.IGIHOZO UWASE ALINE
6.ISHIMWE NANCY KAREGEYA
7.CYUZUZO LIVINGSTONE
8.ILIZA ACSAH
9.GAHUNGU PRINCE




#  OnStore System

##  Description

**OnStore** is a full e-commerce management system designed to connect buyers and sellers on a single platform. Sellers can manage and list products, while buyers can explore, purchase, and track items . The system organizes products into categories, manages pricing, and records all transactions to ensure smooth and efficient operations.

It also includes real-time insights and analytics to help monitor sales performance and support better decision-making.

---

##  Key Features

*  **User Management**
  Supports buyers and sellers with role-based access and account handling.

*  **Product Management**
  Sellers can add, update, delete, and organize products into categories.

*  **Purchase & Order Tracking**
  Buyers can purchase products, with tracking of quantity and purchase history.

*  **Category Organization**
  Products are grouped into categories for easy browsing and management.

*  **Pricing System**
  Flexible pricing structure to manage and update product prices.

*  **Live Sales Dashboard** 
  Displays real-time sales data, popular products, and performance trends.

*  **Search & Filtering**
  Quickly find products based on category, price, or seller.

*  **Real-Time Updates**
  Instant updates for purchases, product changes, and analytics.

---

##  Purpose
The goal of OnStore is to provide a simple yet powerful platform for managing online store activities, making it suitable for small businesses, startups, and scalable commercial systems.


# OnStore Frontend

React 18 frontend for the OnStore e-commerce platform.

## Stack
- **React 18** + React Router v6
- **Zustand** — global state (auth, cart, wishlist, notifications)
- **Axios** — API calls with JWT interceptors
- **Socket.io-client** — real-time chat & notifications
- **Recharts** — analytics charts on seller dashboard
- **React Hot Toast** — toast notifications
- **CSS Modules** — scoped component styles

## Setup

```bash
cd onstore-frontend
npm install
cp .env.example .env
npm start
```

Open [http://localhost:3000](http://localhost:3000)

> Make sure the backend is running on port 5000 first.

## Pages & Routes

| Route | Component | Access |
|-------|-----------|--------|
| `/` | Home — product grid with search, filter, sort | Public |
| `/products/:slug` | Product detail with images, reviews, add to cart | Public |
| `/auth` | Login / Register (buyer or seller) | Public |
| `/cart` | Cart with checkout flow | Buyer |
| `/orders` | Order history with status tracker | Buyer |
| `/wishlist` | Saved products | Buyer |
| `/dashboard` | Revenue charts, top products, orders table | Seller |
| `/chat` | Real-time messaging with sellers/buyers | Auth |

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Navbar.jsx          # Sticky nav with cart badge, notifications
│   │   └── Navbar.module.css
│   └── product/
│       ├── ProductCard.jsx     # Grid card with quick-add & wishlist
│       └── ProductCard.module.css
├── context/
│   └── store.js                # Zustand stores (auth, cart, wishlist, notifs)
├── pages/
│   ├── Home.jsx                # Explore page
│   ├── Home.module.css
│   └── Pages.jsx               # All other pages in one file
├── services/
│   ├── api.js                  # Axios instance + all API functions
│   └── socket.js               # Socket.io connection manager
├── index.css                   # Global design system (CSS vars, utilities)
├── App.js                      # Router + protected routes
└── index.js                    # Entry point
```

## Design System

Colors are defined as CSS variables in `index.css`:

- `--indigo` — Primary actions, links, badges
- `--teal` — Success, in-stock indicators
- `--amber` — Ratings, warnings, bestseller tags
- `--rose` — Errors, low stock, wishlist
- `--green` — Delivered, paid status

Typography:
- `Playfair Display` — page titles and product names
- `Plus Jakarta Sans` — body and UI text
- `DM Mono` — prices, IDs, timestamps

## Key Features

- JWT auto-attach via Axios interceptor
- Token refresh and 401 auto-redirect
- Optimistic wishlist toggle (instant UI, rollback on error)
- Socket.io real-time chat with typing indicators
- Real-time notifications via socket events
- Responsive product grid with search, category filter, price range, and sort
- Protected routes with role-based access (buyer / seller / admin)
- Skeleton loading states
- CSS animations with `fade-up` on page transitions

