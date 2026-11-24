# 🛒 SmartCart — Smart Shopping Starts Here

SmartCart is a full-stack e-commerce web application designed to provide a smooth online shopping experience. It includes customer shopping features, secure authentication, order management, and a dedicated seller dashboard.

## 🚀 Features

### Customer Features
- User registration and login
- Browse and search products
- Filter products by category
- Sort products by price
- View detailed product information
- Add and manage items in the shopping cart
- Checkout with simulated payment
- View order history
- Cancel eligible orders

### Seller Features
- Dedicated seller dashboard
- Add, update, and delete products
- Manage product stock
- Low-stock alerts
- View and manage customer orders
- Update order statuses

### Security
- JWT-based authentication
- Access and refresh token handling
- Password hashing with bcrypt
- Role-based authorization
- Seller product ownership validation
- Protected API routes

## 🛠️ Tech Stack

**Frontend**
- React.js
- Vite
- JavaScript
- CSS
- Lucide React

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)
- bcrypt

**Tools**
- Visual Studio Code
- Postman
- MongoDB Compass
- Git and GitHub

## 📁 Project Structure

```text
SmartCart/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── middleware/
│
├── server.js
├── package.json
├── package-lock.json
└── .gitignore
```

## ⚙️ Installation and Setup

### 1. Clone the repository

```bash
git clone YOUR_REPOSITORY_URL
cd SmartCart
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Install frontend dependencies

```bash
cd frontend
npm install
```

### 4. Configure environment variables

Create a `.env` file in the backend root directory.

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
```

Never upload your actual `.env` file or secrets to GitHub.

### 5. Run the application

Start the backend and frontend using the development scripts defined in their respective `package.json` files.

Default development addresses:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## 🔐 Authentication and Authorization

SmartCart uses JWT access and refresh tokens to manage user sessions. Role-based authorization separates customer, seller, and admin permissions.

## 💳 Payment Information

The checkout flow currently uses simulated payment functionality. It does not process real financial transactions.

## 🎯 Project Objective

The objective of SmartCart is to demonstrate practical full-stack development skills, including REST API development, database integration, authentication, authorization, CRUD operations, and responsive frontend development.

## 👨‍💻 Author

**Rahul Kumar**

B.Tech CSE — Artificial Intelligence and Machine Learning

---

⭐ If you find this project interesting, consider giving the repository a star.
