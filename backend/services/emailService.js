import nodemailer from 'nodemailer';
import pLimit from 'p-limit';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  initializeTransporter() {
    if (this.initialized) return; // Already initialized
    
    // Create reusable transporter with connection pooling
    console.log('📧 Initializing SMTP with:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER
    });

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      pool: true, // Use pooled connections
      maxConnections: parseInt(process.env.MAX_POOL_SIZE) || 10,
      maxMessages: 100, // Send up to 100 messages per connection
      rateDelta: 1000, // Time window for rate limiting
      rateLimit: 10, // Max messages per rateDelta
    });

    this.initialized = true;

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ SMTP connection error:', error);
      } else {
        console.log('✅ SMTP server is ready to send emails');
      }
    });
  }

  // Render template with recipient data
  renderTemplate(template, data) {
    let rendered = template;
    
    // Create a case-insensitive lookup map
    const dataMap = {};
    Object.keys(data).forEach(key => {
      // Store both original case and lowercase versions
      dataMap[key] = data[key];
      dataMap[key.toLowerCase()] = data[key];
    });
    
    // Replace all {{placeholder}} with actual values (case-insensitive)
    rendered = rendered.replace(/\{\{\s*([^}]+)\s*\}\}/gi, (match, placeholder) => {
      const trimmedPlaceholder = placeholder.trim();
      
      // Try exact match first
      if (dataMap[trimmedPlaceholder] !== undefined) {
        return dataMap[trimmedPlaceholder] || '';
      }
      
      // Try lowercase match
      if (dataMap[trimmedPlaceholder.toLowerCase()] !== undefined) {
        return dataMap[trimmedPlaceholder.toLowerCase()] || '';
      }
      
      // Try finding by removing special characters
      const cleanPlaceholder = trimmedPlaceholder.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const [key, value] of Object.entries(dataMap)) {
        const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanKey === cleanPlaceholder) {
          return value || '';
        }
      }
      
      // Return empty string if no match found
      return '';
    });
    
    return rendered;
  }

  // Convert plain text to simple HTML (preserves original formatting)
  convertPlainTextToHTML(text) {
    // Convert plain text to clean HTML with professional formatting
    // Preserves line breaks and spacing while using a clean sans-serif font
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif; white-space: pre-wrap; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #ffffff; color: #202124; font-size: 14px; line-height: 1.6;">
${text}
      </div>
    `;
    
    return html;
  }

  async sendSingleEmail(to, subject, body, recipientData = {}, retries = 3) {
    // Lazy initialize on first use
    if (!this.initialized) {
      this.initializeTransporter();
    }
    
    // Debug: Log recipient data for first email
    if (Object.keys(recipientData).length > 0 && !this.loggedSample) {
      console.log('📧 Sample recipientData for rendering:', JSON.stringify(recipientData, null, 2));
      console.log('📧 Keys available:', Object.keys(recipientData));
      this.loggedSample = true;
    }
    
    // Render subject and body with recipient data
    const renderedSubject = this.renderTemplate(subject, recipientData);
    const renderedBody = this.renderTemplate(body, recipientData);

    // Auto-detect if body contains HTML tags
    const isHTML = /<[a-z][\s\S]*>/i.test(renderedBody);

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
      to,
      subject: renderedSubject,
    };

    // If HTML detected, send as HTML with plain text fallback
    if (isHTML) {
      mailOptions.html = renderedBody;
      // Create plain text version by stripping HTML
      mailOptions.text = renderedBody.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    } else {
      // Send as plain text AND auto-converted HTML for better Gmail rendering
      mailOptions.text = renderedBody;
      mailOptions.html = this.convertPlainTextToHTML(renderedBody);
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const info = await this.transporter.sendMail(mailOptions);
        return {
          success: true,
          email: to,
          messageId: info.messageId,
          response: info.response
        };
      } catch (error) {
        if (attempt === retries) {
          return {
            success: false,
            email: to,
            error: error.message
          };
        }
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  async sendBulkEmails(recipients, subject, body, onProgress) {
    const maxConcurrent = parseInt(process.env.MAX_CONCURRENT_EMAILS) || 50;
    const limit = pLimit(maxConcurrent);
    
    const results = {
      total: recipients.length,
      sent: 0,
      failed: 0,
      details: []
    };

    // Process emails in parallel batches with concurrency limit
    const promises = recipients.map((recipient, index) => 
      limit(async () => {
        // Extract email and other data
        const email = typeof recipient === 'string' ? recipient : recipient.email;
        const recipientData = typeof recipient === 'object' ? recipient : { email };
        
        const result = await this.sendSingleEmail(email, subject, body, recipientData);
        
        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
        }
        
        results.details.push(result);

        // Report progress every 10 emails or on completion
        if ((index + 1) % 10 === 0 || index === recipients.length - 1) {
          if (onProgress) {
            onProgress({
              total: results.total,
              sent: results.sent,
              failed: results.failed,
              progress: Math.round(((results.sent + results.failed) / results.total) * 100)
            });
          }
        }

        return result;
      })
    );

    await Promise.all(promises);
    
    return results;
  }

  async closeTransporter() {
    if (this.transporter) {
      this.transporter.close();
    }
  }
}

// Export singleton instance
export default new EmailService();
