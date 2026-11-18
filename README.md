# Campus Lost and Found Portal

A full-stack Web Technology project for Sai University.

## Technology
- Frontend: HTML5, CSS3, JavaScript ES6+
- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- API testing: Postman

## Requirements
Install Node.js (LTS) and create a MongoDB Atlas database.

## Setup
1. Open this project folder in VS Code.
2. Open the VS Code terminal: Terminal -> New Terminal.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy `.env.example` to a new file named `.env`.
5. In `.env`, replace `MONGO_URI` with your MongoDB Atlas connection string.
6. Change `JWT_SECRET` to a long random secret and change the admin password.
7. Start the project:
   ```bash
   npm run dev
   ```
8. Open http://localhost:5000

## Admin
The first time the server starts, it creates an admin account using `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`. Log in using those credentials. Change the default password before use.

## Main API routes
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me`
- GET `/api/items`
- GET `/api/items/:id`
- POST `/api/items` (login required; multipart form data)
- PUT `/api/items/:id` (owner or admin)
- DELETE `/api/items/:id` (owner or admin)
- POST `/api/claims` (login required)
- GET `/api/claims/mine` (login required)
- GET `/api/claims` (admin only)
- PATCH `/api/claims/:id` (admin only)
- GET `/api/admin/stats` (admin only)

## Important notes
- Do not upload your `.env` file to GitHub.
- Item images are optional and limited to JPG, PNG, WEBP or GIF, up to 3 MB.
- Use only test accounts and sample data for your demonstration.
- The project still needs at least 10 sample records, 8 documented Postman tests, one instructor-approved custom feature, deployment, screenshots, and the prescribed university report before submission.
