import Campaign from '../models/Campaign.js';
import EmailLog from '../models/EmailLog.js';
import emailService from '../services/emailService.js';
import fileParser from '../services/fileParser.js';
import fs from 'fs';

// Upload and parse file
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const parseResult = await fileParser.parseFile(req.file.path, req.file.mimetype);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    if (parseResult.totalCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid emails found in the file'
      });
    }

    res.json({
      success: true,
      message: 'File parsed successfully',
      data: {
        totalRecipients: parseResult.totalCount,
        recipients: parseResult.recipients,
        availableFields: parseResult.availableFields,
        sampleData: parseResult.recipients[0] // Send first recipient as sample
      }
    });
  } catch (error) {
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Send bulk emails
export const sendBulkEmails = async (req, res) => {
  try {
    const { recipients, subject, body, campaignName } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipients array is required'
      });
    }

    if (!subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Subject and body are required'
      });
    }

    // Create campaign
    const campaign = await Campaign.create({
      name: campaignName || `Campaign ${Date.now()}`,
      subject,
      body,
      totalEmails: recipients.length,
      status: 'processing',
      startedAt: new Date()
    });

    // Send response immediately
    res.json({
      success: true,
      message: 'Email sending started',
      campaignId: campaign._id,
      totalEmails: recipients.length
    });

    // Get Socket.IO instance
    const io = req.app.get('io');

    // Send emails asynchronously
    const results = await emailService.sendBulkEmails(
      recipients,
      subject,
      body,
      (progress) => {
        // Emit real-time progress via Socket.IO
        io.emit('emailProgress', {
          campaignId: campaign._id,
          ...progress
        });
      }
    );

    // Save email logs in bulk for better performance
    const emailLogs = results.details.map(detail => ({
      campaignId: campaign._id,
      email: detail.email,
      status: detail.success ? 'sent' : 'failed',
      error: detail.error || null
    }));

    // Use insertMany for bulk insert (faster than individual saves)
    await EmailLog.insertMany(emailLogs);

    // Update campaign
    campaign.sentCount = results.sent;
    campaign.failedCount = results.failed;
    campaign.status = 'completed';
    campaign.completedAt = new Date();
    await campaign.save();

    // Emit completion event
    io.emit('emailComplete', {
      campaignId: campaign._id,
      total: results.total,
      sent: results.sent,
      failed: results.failed
    });

  } catch (error) {
    console.error('Send bulk emails error:', error);
    
    // Don't send response if headers already sent
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
};

// Get campaign status
export const getCampaignStatus = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    res.json({
      success: true,
      data: campaign
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all campaigns
export const getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get campaign logs
export const getCampaignLogs = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { status, page = 1, limit = 100 } = req.query;

    const query = { campaignId };
    if (status) {
      query.status = status;
    }

    const logs = await EmailLog.find(query)
      .sort({ sentAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await EmailLog.countDocuments(query);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
