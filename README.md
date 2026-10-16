# Employee & Task Management System

A full-stack MERN application for managing employees, assigning tasks, tracking progress, and monitoring workloads.

## Features

- **Employee Management:** Create, view, update, delete, search, and filter employees.
- **Task Management:** Create and update tasks, assign employees, set priorities, and track statuses.
- **Dashboard:** View employee statistics, task counts, overdue tasks, and employee workloads.
- **Business Rules:** Validate employee availability, leave dates, task limits, due dates, and status transitions.
- **Filtering & Pagination:** Server-side search, filtering, sorting, and pagination.
- **CSV Export:** Export task records for reporting.
- **Responsive UI:** Interface built with React and Tailwind CSS.

## Tech Stack

- **Frontend:** React.js, Vite, Tailwind CSS, React Router, Axios, Lucide React
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Tools:** Git, npm, dotenv

## Installation

**1. Clone the repository**

```bash
git clone https://github.com/shashank91514/Employee-Task-Management-System.git
cd Employee-Task-Management-System
```

**2. Set up the backend**

```bash
cd server
npm install
```

Create `server/.env` using `.env.example`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
```

Start the backend:

```bash
node server.js
```

**3. Set up the frontend**

Open another terminal from the project root:

```bash
cd client
npm install
```

Create `client/.env` using `.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Open the local URL displayed by Vite, usually `http://localhost:5173`.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/employees` | List employees |
| POST | `/api/employees` | Create employee |
| GET | `/api/employees/:id` | Get employee details |
| PUT | `/api/employees/:id` | Update employee |
| DELETE | `/api/employees/:id` | Delete employee |
| GET | `/api/tasks` | List and filter tasks |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Get task details |
| PUT | `/api/tasks/:id` | Update task |
| PATCH | `/api/tasks/:id/status` | Update task status |
| GET | `/api/tasks/export/csv` | Export tasks to CSV |
| GET | `/api/dashboard` | Get dashboard statistics |

## Environment Variables

**Backend — `server/.env.example`**

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
```

**Frontend — `client/.env.example`**

```env
VITE_API_URL=http://localhost:5000/api
```
## Author

**Shashank Kumar**

- [GitHub](https://github.com/shashank91514)
- [LinkedIn](https://www.linkedin.com/in/shashank91514)
