# 🛒 SmartCart — Smart Shopping Starts Here

SmartCart is a full-stack e-commerce web application designed to provide a smooth online shopping experience. It includes customer shopping features, secure authentication, order management, and a dedicated seller dashboard.

<img width="1917" height="1078" alt="image" src="https://github.com/user-attachments/assets/4e922400-cf7b-4bb7-bca0-25f2d92ca609" />
<img width="1917" height="1078" alt="image" src="https://github.com/user-attachments/assets/caece989-3373-4e0e-9a9e-131797ee68b9" />
<img width="1917" height="1078" alt="image" src="https://github.com/user-attachments/assets/1585842d-8066-46bf-b1ab-f536103c5f18" />
<img width="1917" height="1078" alt="image" src="https://github.com/user-attachments/assets/35c84a84-ecf1-4fa4-8e29-043cb6fa86e2" />
<img width="1917" height="1078" alt="image" src="https://github.com/user-attachments/assets/995d0150-0be8-4507-9a43-729191446690" />
<img width="1917" height="1078" alt="image" src="https://github.com/user-attachments/assets/9f25cbe1-d02f-43c3-a5e4-b64947435567" />
<img width="1917" height="1026" alt="image" src="https://github.com/user-attachments/assets/3febfeb1-f1b9-4092-a466-da49e9407d3c" />
<img width="1917" height="1078" alt="image" src="https://github.com/user-attachments/assets/f485d6ad-aa94-4954-b923-27d341277f99" />
<img width="1917" height="1078" alt="image" src="https://github.com/user-attachments/assets/d3f24157-9b05-429b-b29d-4264aeb7452d" />
<img width="1917" height="1078" alt="image" src="https://github.com/user-attachments/assets/c9c31114-892a-4d5a-87cd-9645f85e7c1a" />
<img width="1917" height="1078" alt="image" src="https://github.com/user-attachments/assets/8f157842-c92f-4571-9892-d1c8aee0c06b" />
<img width="1917" height="1078" alt="image" src="https://github.com/user-attachments/assets/82ca9900-0582-49cd-ac10-2c20843a0bd0" />
<img width="1917" height="1078" alt="image" src="https://github.com/user-attachments/assets/c96d099f-9b6f-405f-b422-0dff74084593" />
<img width="1917" height="1078" alt="image" src="https://github.com/user-attachments/assets/70f04841-0814-46c9-b16d-8c0aa494b426" />
<img width="1917" height="1078" alt="image" src="https://github.com/user-attachments/assets/83d163e5-7c16-4d63-b378-60fd127e2515" />
<img width="1917" height="1078" alt="image" src="https://github.com/user-attachments/assets/18bae68d-2868-4d97-bc7b-1015a83760fe" />



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
