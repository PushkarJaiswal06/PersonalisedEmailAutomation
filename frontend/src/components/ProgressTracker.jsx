import { CheckCircle, XCircle, Loader } from 'lucide-react';

const ProgressTracker = ({ progress }) => {
  if (!progress) return null;

  const { total, sent, failed, progress: percentage } = progress;
  const isComplete = (sent + failed) === total;

  return (
    <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-lg p-6 border border-primary-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {isComplete ? '✅ Campaign Completed!' : '📧 Sending in Progress...'}
      </h3>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Progress</span>
          <span className="font-semibold text-gray-800">{percentage || 0}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-primary-500 to-purple-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${percentage || 0}%` }}
          />
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="flex items-center justify-center mb-2">
            {isComplete ? (
              <CheckCircle className="w-6 h-6 text-gray-600" />
            ) : (
              <Loader className="w-6 h-6 text-gray-600 animate-spin" />
            )}
          </div>
          <div className="text-2xl font-bold text-gray-800">{total}</div>
          <div className="text-xs text-gray-600 mt-1">Total</div>
        </div>

        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="flex items-center justify-center mb-2">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-600">{sent}</div>
          <div className="text-xs text-gray-600 mt-1">Sent</div>
        </div>

        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="flex items-center justify-center mb-2">
            <XCircle className="w-6 h-6 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600">{failed}</div>
          <div className="text-xs text-gray-600 mt-1">Failed</div>
        </div>
      </div>

      {/* Success Rate */}
      {total > 0 && (
        <div className="mt-4 text-center">
          <span className="text-sm text-gray-600">Success Rate: </span>
          <span className="text-lg font-bold text-primary-600">
            {((sent / total) * 100).toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;
