import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/emails/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const sendBulkEmails = async (data) => {
  const response = await api.post('/emails/send', data);
  return response.data;
};

export const getCampaigns = async () => {
  const response = await api.get('/emails/campaigns');
  return response.data;
};

export const getCampaignStatus = async (campaignId) => {
  const response = await api.get(`/emails/campaigns/${campaignId}`);
  return response.data;
};

export const getCampaignLogs = async (campaignId, params = {}) => {
  const response = await api.get(`/emails/campaigns/${campaignId}/logs`, { params });
  return response.data;
};

export default api;
