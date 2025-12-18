import React, { useState } from 'react';
import { Mail, Edit2, Trash2, Eye, X, Calendar, Users, CheckCircle } from 'lucide-react';

interface NewsletterTemplateProps {
  id: string;
  title: string;
  subject: string;
  content: string;
  templateHtml: string;
  isDraft: boolean;
  createdAt: string;
  onPreview: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const NewsletterTemplate: React.FC<NewsletterTemplateProps> = ({
  id,
  title,
  subject,
  content,
  isDraft,
  createdAt,
  onPreview,
  onEdit,
  onDelete
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-black text-lg">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{subject}</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => onPreview(id)}
              className="p-2 text-gray-400 hover:text-black transition-colors"
              title="Preview"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onEdit(id)}
              className="p-2 text-gray-400 hover:text-black transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onDelete(id)}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 line-clamp-3">{content}</p>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{new Date(createdAt).toLocaleDateString()}</span>
          <span className={`px-2 py-1 rounded-full ${
            isDraft ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
          }`}>
            {isDraft ? 'Draft' : 'Published'}
          </span>
        </div>
      </div>
    </div>
  );
};

interface NewsletterTemplatePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subject: string;
  content: string;
  templateHtml: string;
}

export const NewsletterTemplatePreview: React.FC<NewsletterTemplatePreviewProps> = ({
  isOpen,
  onClose,
  title,
  subject,
  content,
  templateHtml
}) => {
  if (!isOpen) return null;

  const processedHtml = templateHtml
    .replace('{{title}}', title)
    .replace('{{subject}}', subject)
    .replace('{{content}}', content)
    .replace('{{unsubscribe_url}}', '#');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-black">Template Preview: {title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <p className="text-sm font-medium text-gray-700">Subject: {subject}</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <iframe
              srcDoc={processedHtml}
              className="w-full h-[500px]"
              title="Newsletter Preview"
            />
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface CampaignCardProps {
  id: string;
  name: string;
  description: string | null;
  templateName: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  recipientCount: number;
  scheduledFor: string | null;
  sentAt: string | null;
  onPreview: (id: string) => void;
  onSend: (id: string) => void;
  isSending: boolean;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  id,
  name,
  description,
  templateName,
  status,
  recipientCount,
  scheduledFor,
  sentAt,
  onPreview,
  onSend,
  isSending
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-black text-lg">{name}</h3>
            <p className="text-sm text-gray-500 mt-1">
              Based on: {templateName}
            </p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => onPreview(id)}
              className="p-2 text-gray-400 hover:text-black transition-colors"
              title="Preview"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          {description && (
            <p className="text-sm text-gray-600 mb-2">{description}</p>
          )}
          <div className="flex items-center space-x-2 text-sm">
            <Users className="w-4 h-4 text-gray-400" />
            <span>{recipientCount} recipients</span>
          </div>
          {scheduledFor && status === 'scheduled' && (
            <div className="flex items-center space-x-2 text-sm mt-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Scheduled for {new Date(scheduledFor).toLocaleString()}</span>
            </div>
          )}
          {sentAt && (
            <div className="flex items-center space-x-2 text-sm mt-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Sent on {new Date(sentAt).toLocaleString()}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <span className={`text-xs px-2 py-1 rounded-full ${
            status === 'draft' ? 'bg-gray-100 text-gray-800' :
            status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
            status === 'sending' ? 'bg-yellow-100 text-yellow-800' :
            status === 'sent' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
          
          {status === 'draft' && (
            <button 
              onClick={() => onSend(id)}
              disabled={isSending}
              className="bg-black text-white px-3 py-1 rounded-lg hover:bg-gray-800 transition-colors text-sm flex items-center space-x-1 disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Mail className="w-3 h-3" />
                  <span>Send Now</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};