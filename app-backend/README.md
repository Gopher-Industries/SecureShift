# SecureShift Backend

The backend service for **SecureShift**, a shift management platform connecting employers with security guards. This Node.js API powers the authentication, shift coordination, and messaging system across the Guard App, Employer Panel, and Admin Dashboard.

---

## 🧩 Tech Stack

- **Node.js** + **Express.js**
- **MongoDB Atlas** (via Mongoose)
- **JWT Authentication** with 2FA support
- **RESTful API**
- **Swagger UI** for API documentation
- **Dockerized** for container deployment
- **Cloud Deployment** (GCP / DockerHub / Kubernetes)
- **Notifications** (Guard shift updates & messaging)

---

## 📦 Project Structure

```
/secureshift-backend
├── controllers/        # Route logic
├── models/             # Mongoose schemas
├── routes/             # API endpoints
├── middleware/         # Auth, error handlers
├── utils/              # Helpers (e.g., notifications)
├── config/             # DB and env setup
├── swagger.js          # Swagger UI setup
├── Dockerfile          # Container setup
├── .dockerignore       # Docker exclusions
├── .env                # Environment variables (ignored)
├── server.js           # Entry point
├── app.js              # Express config & middleware
```

---

## 🚀 Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/musahex/secureshift-backend.git
cd secureshift-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Add environment variables

Create a `.env` file in the root:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/secureshift
JWT_SECRET=your_jwt_secret
```

### 4. Start the server
```bash
npm start
```

Visit: [http://localhost:5000/api-docs](http://localhost:5000/api-docs) for Swagger UI.

---

## 🐳 Docker Usage

### Build the image
```bash
docker build -t musahx/secureshift-backend .
```

### Run the container
```bash
docker run -p 5000:5000 --env-file .env musahx/secureshift-backend
```

### Push to Docker Hub
```bash
docker push musahx/secureshift-backend
```

> Replace `musahx` with your DockerHub username.

---

## 📘 API Documentation

API is documented using **Swagger UI**.  
Once the server is running, open:

```
http://localhost:5000/api-docs
```

You can explore, test, and understand the structure of all API endpoints there.

---

## 🔐 Features

- Guard & Employer registration/login
- JWT-based authentication with 2FA
- Shift posting, acceptance, and tracking
- Employer–Guard messaging
- Admin panel access to all records
- Real-time notifications (e.g., shift updates)
- API docs with Swagger UI
- Fully containerized backend with Docker

---

## 🧪 Testing

```bash
npm run test
```

Unit and integration tests are managed via Jest (or Mocha/Chai if used).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🤝 Contributing

Pull requests are welcome! Please open an issue first to discuss changes. Follow the coding guidelines and write clear commit messages.

---

## 👥 Project Maintainers

- **Musa** – [LinkedIn](https://www.linkedin.com/in/muhammad-musa-0132a2197/) | Project Lead & Backend Developer
