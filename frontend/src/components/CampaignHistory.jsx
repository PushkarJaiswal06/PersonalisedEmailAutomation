import { useState, useEffect } from 'react';
import { getCampaigns } from '../api/emailApi';
import { History, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';

const CampaignHistory = ({ refreshTrigger }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, [refreshTrigger]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await getCampaigns();
      setCampaigns(response.data);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-gray-100 text-gray-800',
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl p-6 animate-slide-in h-full">
      <div className="flex items-center mb-6">
        <History className="w-8 h-8 text-primary-600 mr-3" />
        <h2 className="text-2xl font-bold text-gray-800">Recent Campaigns</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No campaigns yet</p>
          <p className="text-sm mt-2">Start by creating your first campaign</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {campaigns.map((campaign) => (
            <div
              key={campaign._id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3 flex-1">
                  {getStatusIcon(campaign.status)}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {campaign.name}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {campaign.subject}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                    campaign.status
                  )}`}
                >
                  {campaign.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-lg font-bold text-gray-800">
                    {campaign.totalEmails}
                  </div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
                <div className="bg-green-50 rounded p-2">
                  <div className="text-lg font-bold text-green-600">
                    {campaign.sentCount}
                  </div>
                  <div className="text-xs text-gray-600">Sent</div>
                </div>
                <div className="bg-red-50 rounded p-2">
                  <div className="text-lg font-bold text-red-600">
                    {campaign.failedCount}
                  </div>
                  <div className="text-xs text-gray-600">Failed</div>
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                {new Date(campaign.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CampaignHistory;
