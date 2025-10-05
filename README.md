# Email Automation System 🚀

A high-performance **personalized** bulk email automation system built with the MERN stack, featuring real-time progress tracking, dynamic template rendering, and optimized parallel email sending.

## ✨ Features

- **Personalized Email Templates**: Send custom emails with dynamic placeholders ({{name}}, {{rollNumber}}, etc.)
- **Smart Data Extraction**: Automatically extracts name, email, roll number, and ANY custom fields from files
- **Bulk Email Sending**: Send thousands of personalized emails efficiently
- **File Upload Support**: CSV and Excel (XLS, XLSX) file formats
- **Dynamic Placeholders**: Use {{fieldName}} syntax for personalization
- **Real-time Preview**: See how your email looks with sample data
- **Real-time Progress**: Live updates via Socket.IO
- **Parallel Processing**: Sends up to 50 emails concurrently for maximum speed
- **Connection Pooling**: Optimized SMTP connection management
- **Retry Mechanism**: Automatic retry for failed emails
- **Campaign Tracking**: Complete history and statistics
- **Modern UI**: Beautiful, responsive interface with Tailwind CSS
- **No Queue Delays**: Direct processing with minimal latency

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js** - Server framework
- **MongoDB** + **Mongoose** - Database
- **Nodemailer** - Email sending with connection pooling
- **Socket.IO** - Real-time communication
- **p-limit** - Concurrency control
- **xlsx** - Excel file parsing
- **csv-parser** - CSV file parsing
- **Multer** - File upload handling

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool (fast HMR)
- **Tailwind CSS** - Styling
- **React Dropzone** - Drag & drop file upload
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time updates
- **Lucide React** - Beautiful icons

## 📋 Prerequisites

- **Node.js** 18+ installed
- **MongoDB** installed and running
- **SMTP credentials** (Gmail, SendGrid, or any SMTP service)

## 🚀 Installation & Setup

### 1. Clone or navigate to the project
```bash
cd d:\Email
```

### 2. Install all dependencies
```bash
npm run install-all
```

### 3. Configure Backend Environment

Create `.env` file in the `backend` folder:

```bash
cd backend
copy .env.example .env
```

Edit `backend\.env` with your settings:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/email-automation

# SMTP Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Email Sending Configuration
EMAIL_FROM_NAME=Your Company Name
EMAIL_FROM_ADDRESS=your-email@gmail.com

# Performance Settings
MAX_CONCURRENT_EMAILS=50
EMAIL_BATCH_SIZE=100
MAX_POOL_SIZE=10

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 4. Configure Frontend Environment

Create `.env` file in the `frontend` folder:

```bash
cd ..\frontend
copy .env.example .env
```

The default values should work:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 5. Start MongoDB

Make sure MongoDB is running on your system:
```bash
mongod
```

### 6. Run the Application

From the root directory (`d:\Email`):

```bash
# Run both frontend and backend concurrently
npm run dev
```

Or run them separately:

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## 🌐 Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 📧 Gmail Setup (Recommended)

For Gmail SMTP:

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. Use this app password in `SMTP_PASSWORD` (not your regular password)

## 📊 How to Use

### 1. Prepare Your Data File

Create a CSV or Excel file with your recipient data. **Required: Email column**. Any other columns become placeholders!

**Example CSV:**
```csv
name,email,rollNumber,grade,department
John Doe,john@example.com,2021001,A+,Computer Science
Jane Smith,jane@example.com,2021002,A,Electrical Engineering
```

**Supported column variations:**
- Email: `email`, `Email`, `e-mail`, `mail`, `emailAddress`
- Name: `name`, `Name`, `fullName`, `studentName`, `firstName`
- Roll Number: `rollNumber`, `rollNo`, `roll`, `studentId`, `id`
- Any custom field: `department`, `grade`, `company`, `phone`, etc.

### 2. Upload & Create Template

1. **Upload File**: Drag & drop or click to upload your CSV/Excel file
2. **See Available Fields**: System automatically detects all columns as placeholders
3. **Create Template**: 
   - Click placeholder buttons to insert them into subject/body
   - Use `{{fieldName}}` syntax (e.g., `{{name}}`, `{{rollNumber}}`)
4. **Preview**: See real-time preview with sample data

### 3. Send Personalized Emails

**Example Subject:**
```
Hello {{name}}, Your Grade Report - Roll No: {{rollNumber}}
```

**Example Body:**
```
Dear {{name}},

Your academic performance:
- Roll Number: {{rollNumber}}
- Department: {{department}}
- Grade: {{grade}}

Congratulations!

Best regards,
Academic Office
```

Each recipient gets a **personalized email** with their specific data! 🎯

### 4. Track Progress

Watch real-time progress as emails are sent with live statistics and completion status.

## ⚡ Performance Optimizations

1. **Connection Pooling**: Reuses SMTP connections (up to 10 concurrent)
2. **Parallel Processing**: Sends 50 emails simultaneously using p-limit
3. **Bulk Database Operations**: Uses `insertMany()` for logs
4. **MongoDB Indexing**: Optimized queries with proper indexes
5. **Real-time Updates**: Batched progress updates (every 10 emails)
6. **Compression**: Gzip compression for API responses
7. **Stream Processing**: Efficient CSV parsing with streams

## 🔧 Configuration Options

### Backend (`backend\.env`)

- `MAX_CONCURRENT_EMAILS`: Number of emails sent in parallel (default: 50)
- `MAX_POOL_SIZE`: SMTP connection pool size (default: 10)
- `EMAIL_BATCH_SIZE`: Progress update batch size (default: 100)

### Adjust for Your Needs

**For faster sending (if your SMTP allows):**
```env
MAX_CONCURRENT_EMAILS=100
MAX_POOL_SIZE=20
```

**For more conservative sending:**
```env
MAX_CONCURRENT_EMAILS=20
MAX_POOL_SIZE=5
```

## 📁 Project Structure

```
Email/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   └── emailController.js
│   ├── models/
│   │   ├── Campaign.js
│   │   └── EmailLog.js
│   ├── routes/
│   │   └── emailRoutes.js
│   ├── services/
│   │   ├── emailService.js
│   │   └── fileParser.js
│   ├── socket/
│   │   └── socketHandler.js
│   ├── uploads/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── emailApi.js
│   │   ├── components/
│   │   │   ├── CampaignHistory.jsx
│   │   │   ├── EmailUploader.jsx
│   │   │   ├── FileDropzone.jsx
│   │   │   └── ProgressTracker.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.cjs
│   ├── tailwind.config.js
│   └── vite.config.js
├── package.json
└── README.md
```

## 🐛 Troubleshooting

**MongoDB Connection Error:**
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`

**SMTP Authentication Failed:**
- Use App Password for Gmail (not regular password)
- Check SMTP credentials in `.env`

**Port Already in Use:**
- Change `PORT` in backend `.env`
- Update `VITE_API_URL` in frontend `.env`

**Emails Sending Slowly:**
- Increase `MAX_CONCURRENT_EMAILS`
- Increase `MAX_POOL_SIZE`
- Check your SMTP provider's rate limits

## 📝 API Endpoints

- `POST /api/emails/upload` - Upload and parse file
- `POST /api/emails/send` - Send bulk emails
- `GET /api/emails/campaigns` - Get all campaigns
- `GET /api/emails/campaigns/:id` - Get campaign details
- `GET /api/emails/campaigns/:id/logs` - Get campaign logs

## 🔄 Socket.IO Events

- `emailProgress` - Real-time sending progress
- `emailComplete` - Campaign completion notification

## 📄 License

MIT License - Feel free to use for personal or commercial projects

## 🤝 Support

For issues or questions, please check the troubleshooting section or review the configuration files.

---

**Built with ❤️ using MERN Stack**
