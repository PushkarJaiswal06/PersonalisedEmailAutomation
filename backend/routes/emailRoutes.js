import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  uploadFile,
  sendBulkEmails,
  getCampaignStatus,
  getAllCampaigns,
  getCampaignLogs
} from '../controllers/emailController.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (allowedTypes.includes(file.mimetype) || 
      file.originalname.endsWith('.csv') || 
      file.originalname.endsWith('.xlsx') || 
      file.originalname.endsWith('.xls')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

// Routes
router.post('/upload', upload.single('file'), uploadFile);
router.post('/send', sendBulkEmails);
router.get('/campaigns', getAllCampaigns);
router.get('/campaigns/:campaignId', getCampaignStatus);
router.get('/campaigns/:campaignId/logs', getCampaignLogs);

export default router;
