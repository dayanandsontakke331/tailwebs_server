# Assignment Workflow Portal – Backend (Node + Express + MongoDB)

This is the backend for the Assignment Workflow Portal.  
Provides secure authentication, assignment lifecycle management, submissions, and role-based access control.

---

## 🚀 Features

### 🔐 Authentication
- Login with email + password
- JWT Protected Routes
- Role returned in login response
- Secure middleware enforcement

### 🧑‍🏫 Teacher
- Create assignment
- Edit Draft
- Publish assignment
- Mark Completed
- Cannot delete Published assignments
- View submissions
- Review support

Workflow:
Draft → Published → Completed

---

### 🎓 Student
- View Published assignments only
- Submit answer once
- Cannot edit after submission
- View their answer
- Block submission after due date

---

## 🛠️ Tech Stack
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT Auth

---

## 📦 Setup
### .env already pushed to the github project you just need to update the ip addresses as per you local machine

### 1️⃣ Install Dependencies using update database address
### npm innstall

### To start the node express server use the command in root directory of prject
### node index.js in project root directly

