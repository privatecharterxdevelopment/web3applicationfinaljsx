import React from 'react';
import { Building2, Clock, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';

const TokenizationDraftCard = ({ draft, onContinue, onDelete }) => {
  const getStatusBadge = (status) => {
    const badges = {
      draft: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', text: 'Draft' },
      submitted: { color: 'bg-blue-100 text-blue-800 border-blue-200', text: 'Submitted' },
      approved: { color: 'bg-green-100 text-green-800 border-green-200', text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', text: 'Rejected' },
      cancelled: { color: 'bg-gray-100 text-gray-800 border-gray-200', text: 'Cancelled' },
    };
    return badges[status] || badges.draft;
  };

  const getTokenTypeBadge = (type) => {
    return type === 'security'
      ? { color: 'bg-purple-100 text-purple-800', text: 'Security Token' }
      : { color: 'bg-blue-100 text-blue-800', text: 'Utility Token' };
  };

  const calculateProgress = () => {
    const maxSteps = draft.token_type === 'security' ? 6 : 5;
    return Math.round((draft.current_step / maxSteps) * 100);
  };

  const statusBadge = getStatusBadge(draft.status);
  const tokenBadge = getTokenTypeBadge(draft.token_type);
  const progress = calculateProgress();

  return (
    <div className="bg-white/30 border border-gray-300/50 rounded-2xl overflow-hidden backdrop-blur-xl hover:shadow-lg transition-all">
      {/* Header Image */}
      <div className="h-32 bg-gradient-to-r from-gray-800 to-gray-600 relative">
        {draft.header_image_url ? (
          <img
            src={draft.header_image_url}
            alt={draft.asset_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/30">
            <Building2 size={48} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Logo & Title */}
        <div className="flex items-start gap-4 mb-4 -mt-10">
          {/* Logo */}
          <div className="w-16 h-16 bg-white border-4 border-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            {draft.logo_url ? (
              <img
                src={draft.logo_url}
                alt={draft.asset_name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Building2 size={24} className="text-gray-400" />
            )}
          </div>

          {/* Title & Badges */}
          <div className="flex-1 pt-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {draft.asset_name || 'Untitled Asset'}
            </h3>
            <div className="flex flex-wrap gap-2">
              <span className={`px-2 py-1 rounded-md text-xs font-medium border ${statusBadge.color}`}>
                {statusBadge.text}
              </span>
              <span className={`px-2 py-1 rounded-md text-xs font-medium ${tokenBadge.color}`}>
                {tokenBadge.text}
              </span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3 mb-4">
          {draft.asset_value && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Asset Value:</span>
              <span className="font-semibold text-gray-900">
                ${parseFloat(draft.asset_value).toLocaleString()}
              </span>
            </div>
          )}

          {draft.asset_category && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Category:</span>
              <span className="font-medium text-gray-900 capitalize">{draft.asset_category}</span>
            </div>
          )}

          {draft.asset_location && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Location:</span>
              <span className="font-medium text-gray-900">{draft.asset_location}</span>
            </div>
          )}

          {/* Progress Bar */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs text-gray-700 mb-1">
              <span>Progress</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-black rounded-full h-2 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Last Updated */}
          <div className="flex items-center gap-2 text-xs text-gray-600 pt-2">
            <Clock size={14} />
            <span>
              Updated {new Date(draft.updated_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {draft.status === 'draft' && (
            <>
              <button
                onClick={() => onContinue(draft)}
                className="flex-1 px-4 py-2.5 bg-black hover:bg-gray-800 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                <Edit size={16} />
                {draft.current_step === 1 ? 'Start' : 'Continue'}
              </button>
              <button
                onClick={() => onDelete(draft.id)}
                className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-all"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}

          {draft.status === 'submitted' && (
            <button
              disabled
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-500 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Clock size={16} />
              Under Review
            </button>
          )}

          {draft.status === 'approved' && (
            <button
              className="flex-1 px-4 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <CheckCircle size={16} />
              View Details
            </button>
          )}

          {draft.status === 'rejected' && (
            <button
              onClick={() => onContinue(draft)}
              className="flex-1 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
            >
              <XCircle size={16} />
              Revise & Resubmit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenizationDraftCard;
