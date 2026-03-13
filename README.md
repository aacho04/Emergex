# Emergex - Emergency Response System

Emergency response platform connecting Citizens, ERS Officers, Ambulances, Traffic Police, Hospitals, and Volunteers..

Live Link:- https://emergex-six.vercel.app/
Demo Video - https://drive.google.com/file/d/1tephn_WigwRSOydkdxKOZ_eXssOhof3r/view?usp=sharing

## Tech Stack

### Frontend
- Next.js 14 with TypeScript
- Tailwind CSS
- Shadcn-inspired UI components
- Socket.io Client
- React Hook Form + Zod
- Axios

### Backend
- Node.js / Express.js with TypeScript
- MongoDB with Mongoose
- JWT Authentication
- Socket.io for real-time communication
- Nodemailer for email services

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally or Atlas connection string

### Installation

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Environment Variables
Copy `.env` to root and update values.

### Running the Application

```bash
# Start backend server (development)
cd server
npm run dev

# Start frontend (development)
cd client
npm run dev
```

### Default Super Admin
- Username: `superadmin`
- Password: `Admin@123`

## System Roles
1. **Super Admin** - Government authorities, full system access
2. **ERS Officer** - Manages emergency responses and assignments
3. **Ambulance** - Receives alerts, shares location, updates status
4. **Traffic Police** - Receives route alerts, clears traffic
5. **Hospital** - Self-registration, manages volunteers
6. **Volunteer** - Community First Responders (no account needed)
