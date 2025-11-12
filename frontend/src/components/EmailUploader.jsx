import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import FileDropzone from './FileDropzone';
import ProgressTracker from './ProgressTracker';
import TemplatePlaceholders from './TemplatePlaceholders';
import { uploadFile, sendBulkEmails } from '../api/emailApi';
import { Mail, Send, Loader } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const EmailUploader = ({ onCampaignComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [availableFields, setAvailableFields] = useState([]);
  const [sampleData, setSampleData] = useState(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize Socket.IO connection
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('emailProgress', (data) => {
      setProgress(data);
    });

    newSocket.on('emailComplete', (data) => {
      setProgress(data);
      setTimeout(() => {
        setLoading(false);
        onCampaignComplete?.();
      }, 2000);
    });

    return () => {
      newSocket.close();
    };
  }, [onCampaignComplete]);

  const handleFileSelect = async (file) => {
    setSelectedFile(file);
    setError('');
    setLoading(true);

    try {
      const response = await uploadFile(file);
      setRecipients(response.data.recipients);
      setAvailableFields(response.data.availableFields || []);
      setSampleData(response.data.sampleData);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to parse file');
      setSelectedFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setRecipients([]);
    setAvailableFields([]);
    setSampleData(null);
    setError('');
  };

  const insertPlaceholder = (placeholder, targetField) => {
    const placeholderText = `{{${placeholder}}}`;
    
    if (targetField === 'subject') {
      const input = document.getElementById('email-subject');
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const newValue = subject.substring(0, start) + placeholderText + subject.substring(end);
      setSubject(newValue);
      
      // Set cursor position after placeholder
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + placeholderText.length, start + placeholderText.length);
      }, 0);
    } else {
      const textarea = document.getElementById('email-body');
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = body.substring(0, start) + placeholderText + body.substring(end);
      setBody(newValue);
      
      // Set cursor position after placeholder
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholderText.length, start + placeholderText.length);
      }, 0);
    }
  };

  // Helper to render template with data (same logic as backend)
  const renderTemplate = (template, data) => {
    let rendered = template;
    
    // Create a case-insensitive lookup map
    const dataMap = {};
    Object.keys(data).forEach(key => {
      dataMap[key] = data[key];
      dataMap[key.toLowerCase()] = data[key];
    });
    
    // Replace all {{placeholder}} with actual values (case-insensitive)
    rendered = rendered.replace(/\{\{\s*([^}]+)\s*\}\}/gi, (match, placeholder) => {
      const trimmedPlaceholder = placeholder.trim();
      
      if (dataMap[trimmedPlaceholder] !== undefined) {
        return dataMap[trimmedPlaceholder] || '';
      }
      
      if (dataMap[trimmedPlaceholder.toLowerCase()] !== undefined) {
        return dataMap[trimmedPlaceholder.toLowerCase()] || '';
      }
      
      const cleanPlaceholder = trimmedPlaceholder.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const [key, value] of Object.entries(dataMap)) {
        const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanKey === cleanPlaceholder) {
          return value || '';
        }
      }
      
      return '';
    });
    
    return rendered;
  };

  const handleSendEmails = async (e) => {
    e.preventDefault();
    
    if (!subject.trim() || !body.trim()) {
      setError('Subject and body are required');
      return;
    }

    if (recipients.length === 0) {
      setError('No recipients to send emails');
      return;
    }

    setLoading(true);
    setError('');
    setProgress({ total: recipients.length, sent: 0, failed: 0, progress: 0 });

    try {
      await sendBulkEmails({
        recipients,
        subject: subject.trim(),
        body: body.trim(),
        campaignName: campaignName.trim() || `Campaign ${new Date().toLocaleDateString()}`,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send emails');
      setLoading(false);
      setProgress(null);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setRecipients([]);
    setAvailableFields([]);
    setSampleData(null);
    setSubject('');
    setBody('');
    setCampaignName('');
    setProgress(null);
    setError('');
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl p-6 animate-slide-in">
      <div className="flex items-center mb-6">
        <Mail className="w-8 h-8 text-primary-600 mr-3" />
        <h2 className="text-3xl font-bold text-gray-800">New Personalized Campaign</h2>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSendEmails} className="space-y-6">
        {/* Campaign Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Name (Optional)
          </label>
          <input
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="e.g., Newsletter Dec 2025"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Recipient List (CSV/Excel)
          </label>
          <FileDropzone
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            onRemoveFile={handleRemoveFile}
          />
          {recipients.length > 0 && (
            <p className="mt-2 text-sm text-green-600 font-medium">
              ✓ {recipients.length} recipients found
            </p>
          )}
        </div>

        {/* Show available placeholders */}
        {availableFields.length > 0 && (
          <TemplatePlaceholders
            fields={availableFields}
            sampleData={sampleData}
            onInsert={insertPlaceholder}
          />
        )}

        {/* Email Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Subject * {availableFields.length > 0 && <span className="text-xs text-gray-500">(Click placeholders above to insert)</span>}
          </label>
          <input
            id="email-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g., Hello {{name}}, your results are here!"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
            disabled={loading}
          />
        </div>

        {/* Email Body */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Body (HTML supported) * {availableFields.length > 0 && <span className="text-xs text-gray-500">(Click placeholders above to insert)</span>}
          </label>
          <textarea
            id="email-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={availableFields.length > 0 
              ? "Dear {{name}},\n\nYour Roll Number: {{rollNumber}}\n\nBest regards"
              : "Enter email body (HTML is supported)"}
            rows="10"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
            required
            disabled={loading}
          />
        </div>

        {/* Preview with sample data */}
        {sampleData && (subject || body) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">📧 Preview (with sample data):</h4>
            {subject && (
              <div className="mb-2">
                <span className="text-xs text-gray-600">Subject:</span>
                <div className="font-medium text-gray-800">
                  {renderTemplate(subject, sampleData).replace(/<[^>]*>/g, '')}
                </div>
              </div>
            )}
            {body && (
              <div>
                <span className="text-xs text-gray-600">Body:</span>
                <div 
                  className="text-sm text-gray-700"
                  style={{ lineHeight: '1.6' }}
                  dangerouslySetInnerHTML={{ __html: renderTemplate(body, sampleData).replace(/\n/g, '<br>') }}
                />
              </div>
            )}
          </div>
        )}

        {/* Progress Tracker */}
        {progress && <ProgressTracker progress={progress} />}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading || recipients.length === 0 || !subject || !body}
            className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Send Personalized Emails ({recipients.length})
              </>
            )}
          </button>
          
          {(recipients.length > 0 || subject || body) && !loading && (
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default EmailUploader;
