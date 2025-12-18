import React, { useState } from 'react';
import { X, Save, Eye, Mail } from 'lucide-react';

interface NewsletterTemplateEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: {
    title: string;
    subject: string;
    content: string;
    template_html: string;
  }) => void;
  initialData?: {
    title: string;
    subject: string;
    content: string;
    template_html: string;
  };
  isSaving: boolean;
}

export const NewsletterTemplateEditor: React.FC<NewsletterTemplateEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isSaving
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [template, setTemplate] = useState(initialData || {
    title: '',
    subject: '',
    content: '',
    template_html: defaultTemplate
  });

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(template);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-black">
            {initialData ? 'Edit Newsletter Template' : 'Create Newsletter Template'}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-2 text-gray-400 hover:text-black transition-colors"
              title={showPreview ? "Edit" : "Preview"}
            >
              <Eye className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {!showPreview ? (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Title *
              </label>
              <input
                type="text"
                value={template.title}
                onChange={(e) => setTemplate({ ...template, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="e.g., Monthly Newsletter"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Subject Line *
              </label>
              <input
                type="text"
                value={template.subject}
                onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="e.g., Your Monthly Update from PrivatecharterX"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <textarea
                value={template.content}
                onChange={(e) => setTemplate({ ...template, content: e.target.value })}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Enter the main content of your newsletter..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This content will be inserted into the template. You can use basic HTML formatting.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HTML Template
              </label>
              <textarea
                value={template.template_html}
                onChange={(e) => setTemplate({ ...template, template_html: e.target.value })}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use {{title}}, {{subject}}, and {{content}} placeholders to insert dynamic content.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-medium text-gray-700">Subject: {template.subject}</p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <iframe
                srcDoc={template.template_html
                  .replace('{{title}}', template.title)
                  .replace('{{subject}}', template.subject)
                  .replace('{{content}}', template.content)
                  .replace('{{unsubscribe_url}}', '#')}
                className="w-full h-[500px]"
                title="Newsletter Preview"
              />
            </div>
          </div>
        )}
        
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!template.title || !template.subject || !template.content || isSaving}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Template</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Default newsletter template
const defaultTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{subject}}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #000;
      color: #fff;
      padding: 20px;
      text-align: center;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
    }
    .content {
      padding: 20px;
      background-color: #fff;
    }
    .footer {
      background-color: #f5f5f5;
      padding: 15px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .button {
      display: inline-block;
      background-color: #000;
      color: #fff;
      padding: 10px 20px;
      text-decoration: none;
      border-radius: 4px;
      margin: 20px 0;
    }
    .unsubscribe {
      color: #999;
      font-size: 12px;
    }
    .social-links {
      margin-top: 15px;
    }
    .social-links a {
      display: inline-block;
      margin: 0 5px;
      color: #666;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">PrivatecharterX</div>
    </div>
    <div class="content">
      <h2>{{title}}</h2>
      {{content}}
      <a href="https://privatecharterx.com" class="button">Learn More</a>
    </div>
    <div class="footer">
      <p>© 2025 PrivatecharterX. All rights reserved.</p>
      <p class="unsubscribe">If you no longer wish to receive these emails, you can <a href="{{unsubscribe_url}}">unsubscribe here</a>.</p>
      <div class="social-links">
        <a href="#">Facebook</a> | <a href="#">Twitter</a> | <a href="#">Instagram</a>
      </div>
    </div>
  </div>
</body>
</html>
`;