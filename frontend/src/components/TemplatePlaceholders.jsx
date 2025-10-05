import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

const TemplatePlaceholders = ({ fields, sampleData, onInsert }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTarget, setActiveTarget] = useState('body');

  if (!fields || fields.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h4 className="font-semibold text-gray-800">
            Available Personalization Fields
          </h4>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
            {fields.length} fields
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-600" />
        )}
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-gray-600">
            Click on any field below to insert it into your email:
          </p>

          {/* Target selector */}
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setActiveTarget('subject')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                activeTarget === 'subject'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-purple-100'
              }`}
            >
              Insert to Subject
            </button>
            <button
              type="button"
              onClick={() => setActiveTarget('body')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                activeTarget === 'body'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-purple-100'
              }`}
            >
              Insert to Body
            </button>
          </div>

          {/* Field buttons */}
          <div className="flex flex-wrap gap-2">
            {fields.map((field) => (
              <button
                key={field}
                type="button"
                onClick={() => onInsert(field, activeTarget)}
                className="group relative px-3 py-2 bg-white hover:bg-purple-100 border border-purple-300 rounded-lg text-sm font-medium text-gray-700 hover:text-purple-700 transition-all hover:shadow-md"
              >
                <span className="font-mono">{'{{' + field + '}}'}</span>
                {sampleData && sampleData[field] && (
                  <span className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10">
                    Example: {sampleData[field]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Help text */}
          <div className="bg-white rounded p-3 text-sm text-gray-600">
            <p className="font-semibold mb-1">💡 How to use:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Choose whether to insert into Subject or Body</li>
              <li>Click on a field to insert it at cursor position</li>
              <li>Each recipient will get a personalized email with their own data</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatePlaceholders;
