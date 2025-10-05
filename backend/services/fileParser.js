import xlsx from 'xlsx';
import csv from 'csv-parser';
import fs from 'fs';
import { pipeline } from 'stream/promises';

class FileParser {
  // Parse Excel file (.xlsx, .xls)
  async parseExcel(filePath) {
    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);
      
      const recipients = this.extractRecipients(data);
      return recipients;
    } catch (error) {
      throw new Error(`Excel parsing error: ${error.message}`);
    }
  }

  // Parse CSV file
  async parseCsv(filePath) {
    try {
      const results = [];
      const readStream = fs.createReadStream(filePath);
      
      await pipeline(
        readStream,
        csv(),
        async function* (source) {
          for await (const chunk of source) {
            results.push(chunk);
          }
        }
      );

      const recipients = this.extractRecipients(results);
      return recipients;
    } catch (error) {
      throw new Error(`CSV parsing error: ${error.message}`);
    }
  }

  // Normalize column names - create clean aliases for common patterns
  normalizeColumnName(key) {
    const normalized = key.toLowerCase().trim();
    
    // Map common variations to standard names
    const mappings = {
      'email': ['email', 'emailaddress', 'mail', 'e-mail', 'emailid', 'e-mailaddress'],
      'name': ['name', 'fullname', 'username', 'studentname', 'recipientname', 'full name'],
      'firstName': ['firstname', 'fname', 'givenname', 'first name'],
      'lastName': ['lastname', 'lname', 'surname', 'familyname', 'last name'],
      'rollNumber': ['rollnumber', 'rollno', 'roll', 'studentid', 'id', 'regno', 'registrationnumber', 
                     'roll number', 'student id', 'registration number', 'university roll number',
                     'universityrollnumber', 'universityrollnumber(onlyformmmmutstudents)'],
      'phoneNumber': ['phone', 'phonenumber', 'mobile', 'contact', 'mobilenumber', 'whatsapp',
                      'phone number', 'mobile number', 'phonenumber(preferablywhatsapp)'],
      'branch': ['branch', 'department', 'dept', 'division', 'course', 'stream',
                 'whichbranchofstudyareyoufrom?', 'whichbranchofstudyareyoufrom'],
      'company': ['company', 'organization', 'org', 'companyname'],
      'designation': ['designation', 'position', 'title', 'jobtitle'],
      'grade': ['grade', 'marks', 'score', 'cgpa', 'gpa'],
    };

    // Remove special characters for comparison
    const cleanKey = normalized.replace(/[^a-z0-9]/g, '');
    
    for (const [standard, variations] of Object.entries(mappings)) {
      for (const variation of variations) {
        const cleanVariation = variation.replace(/[^a-z0-9]/g, '');
        if (cleanKey === cleanVariation || normalized === variation) {
          return standard;
        }
      }
    }

    // If no mapping found, return original key (preserve exact name for template matching)
    return key;
  }

  // Extract and validate recipients with all their data
  extractRecipients(data) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const recipients = [];
    const seenEmails = new Set(); // Track duplicates

    // Debug: Log the raw first row from CSV/Excel
    if (data.length > 0) {
      console.log('🔍 RAW CSV COLUMNS:', Object.keys(data[0]));
      console.log('🔍 RAW FIRST ROW DATA:', JSON.stringify(data[0], null, 2));
    }

    data.forEach((row, index) => {
      // Create recipient object with BOTH original AND normalized keys
      const recipient = {};
      let email = null;
      
      Object.keys(row).forEach(key => {
        const value = row[key];
        const normalizedKey = this.normalizeColumnName(key);
        
        if (index === 0) {
          console.log(`🔑 Column "${key}" → normalized to "${normalizedKey}" = "${value}"`);
        }
        
        // Store with BOTH original key and normalized key
        recipient[key] = value; // Keep original key for exact template matching
        if (normalizedKey !== key) {
          recipient[normalizedKey] = value; // Add normalized alias
        }
        
        // Check if this is an email
        if (value && typeof value === 'string') {
          const emailValue = value.toString().trim().toLowerCase();
          if (emailRegex.test(emailValue) && !email) {
            email = emailValue;
          }
        }
      });

      // Ensure email field exists
      if (email) {
        recipient.email = email;
        
        // Only add if not duplicate
        if (!seenEmails.has(email)) {
          seenEmails.add(email);
          recipients.push(recipient);
          
          // Debug: Log first recipient to see all fields
          if (recipients.length === 1) {
            console.log('📋 Sample recipient data:', JSON.stringify(recipient, null, 2));
            console.log('📋 Available fields:', Object.keys(recipient));
          }
        }
      }
    });

    if (recipients.length === 0) {
      throw new Error('No valid email addresses found in the file');
    }

    const availableFields = this.getAvailableFields(recipients[0]);
    
    // Debug: Log first recipient and available fields
    console.log('📋 First recipient keys:', Object.keys(recipients[0]));
    console.log('📋 Available fields for UI:', availableFields);
    console.log('📋 Sample values:', JSON.stringify(recipients[0], null, 2));

    return {
      recipients,
      totalCount: recipients.length,
      availableFields
    };
  }

  // Get list of available fields for template placeholders
  getAvailableFields(sampleRecipient) {
    if (!sampleRecipient) return [];
    
    const allKeys = Object.keys(sampleRecipient);
    const seen = new Set();
    const uniqueFields = [];
    
    // Prioritize original CSV column names (ones with spaces/special chars)
    // over normalized aliases (camelCase versions)
    const sortedKeys = allKeys.sort((a, b) => {
      const aHasSpecial = /[^a-zA-Z0-9]/.test(a);
      const bHasSpecial = /[^a-zA-Z0-9]/.test(b);
      if (aHasSpecial && !bHasSpecial) return -1; // a comes first
      if (!aHasSpecial && bHasSpecial) return 1;  // b comes first
      return 0;
    });
    
    for (const key of sortedKeys) {
      if (key === 'email') continue; // Skip email field
      
      // Check if we already have a similar field (case-insensitive, no special chars)
      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (!seen.has(normalizedKey)) {
        seen.add(normalizedKey);
        uniqueFields.push(key);
      }
    }
    
    return uniqueFields;
  }

  // Auto-detect file type and parse
  async parseFile(filePath, mimetype) {
    if (mimetype.includes('spreadsheet') || 
        mimetype.includes('excel') || 
        filePath.endsWith('.xlsx') || 
        filePath.endsWith('.xls')) {
      return await this.parseExcel(filePath);
    } else if (mimetype.includes('csv') || filePath.endsWith('.csv')) {
      return await this.parseCsv(filePath);
    } else {
      throw new Error('Unsupported file format. Please upload CSV or Excel file.');
    }
  }
}

export default new FileParser();
