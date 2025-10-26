import React, { useState, useEffect } from 'react';
import { Mail, Users, TrendingUp, Send, FileText, Download, Eye, Edit2, Trash2, Plus, X, Check, Loader2, AlertCircle } from 'lucide-react';

interface Subscription {
  id: string;
  email: string;
  status: string;
  source: string;
  preferences: {
    emptyLegs: boolean;
    luxuryCars: boolean;
    adventures: boolean;
    generalUpdates: boolean;
  };
  created_at: string;
  last_email_sent_at: string | null;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  category: string;
  html_content: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

interface Stats {
  totalSubscribers: number;
  activeSubscribers: number;
  unsubscribed: number;
  webSubscribers: number;
  wordpressSubscribers: number;
  totalEmailsSent: number;
  recentSubscribers: number;
}

export default function AdminNewsletter() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'subscribers' | 'templates' | 'send'>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [subscribers, setSubscribers] = useState<Subscription[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Template Editor State
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [templatePreview, setTemplatePreview] = useState(false);

  // Send Newsletter State
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [sendingNewsletter, setSendingNewsletter] = useState(false);

  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats();
    } else if (activeTab === 'subscribers') {
      fetchSubscribers();
    } else if (activeTab === 'templates') {
      fetchTemplates();
    } else if (activeTab === 'send') {
      fetchTemplates();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/newsletter/stats`);
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/newsletter/subscribers?limit=1000`);
      const data = await response.json();
      if (data.success) {
        setSubscribers(data.subscribers);
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/newsletter/templates`);
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportSubscribers = () => {
    const csv = [
      ['Email', 'Status', 'Source', 'Empty Legs', 'Luxury Cars', 'Adventures', 'General Updates', 'Created At'].join(','),
      ...subscribers.map(s => [
        s.email,
        s.status,
        s.source,
        s.preferences.emptyLegs,
        s.preferences.luxuryCars,
        s.preferences.adventures,
        s.preferences.generalUpdates,
        new Date(s.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const saveTemplate = async () => {
    if (!editingTemplate) return;

    setLoading(true);
    setMessage('');

    try {
      const isNew = !editingTemplate.id;
      const url = isNew
        ? `${apiUrl}/newsletter/templates`
        : `${apiUrl}/newsletter/templates/${editingTemplate.id}`;

      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingTemplate.name,
          subject: editingTemplate.subject,
          category: editingTemplate.category,
          html_content: editingTemplate.html_content,
          is_active: editingTemplate.is_active
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessageType('success');
        setMessage('Template saved successfully!');
        setShowTemplateEditor(false);
        setEditingTemplate(null);
        fetchTemplates();
      } else {
        setMessageType('error');
        setMessage(data.error || 'Failed to save template');
      }
    } catch (error) {
      setMessageType('error');
      setMessage('Network error');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`${apiUrl}/newsletter/templates/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setMessageType('success');
        setMessage('Template deleted successfully!');
        fetchTemplates();
      } else {
        setMessageType('error');
        setMessage(data.error || 'Failed to delete template');
      }
    } catch (error) {
      setMessageType('error');
      setMessage('Network error');
    } finally {
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const sendTestEmail = async () => {
    if (!selectedTemplate || !testEmail) {
      setMessageType('error');
      setMessage('Please select a template and enter a test email');
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    setSendingNewsletter(true);
    setMessage('');

    try {
      const response = await fetch(`${apiUrl}/newsletter/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
          testEmail: testEmail
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessageType('success');
        setMessage('Test email sent successfully!');
        setTestEmail('');
      } else {
        setMessageType('error');
        setMessage(data.error || 'Failed to send test email');
      }
    } catch (error) {
      setMessageType('error');
      setMessage('Network error');
    } finally {
      setSendingNewsletter(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const sendNewsletter = async () => {
    if (!selectedTemplate) {
      setMessageType('error');
      setMessage('Please select a template');
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    const confirm_send = confirm(
      `Send newsletter to all subscribers?\n\nTemplate: ${template.name}\nThis will send to all active subscribers who have opted in for "${template.category}" emails.`
    );

    if (!confirm_send) return;

    setSendingNewsletter(true);
    setMessage('');

    try {
      const response = await fetch(`${apiUrl}/newsletter/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
          category: template.category
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessageType('success');
        setMessage(`Newsletter sent to ${data.sent} subscribers!`);
        fetchStats();
      } else {
        setMessageType('error');
        setMessage(data.error || 'Failed to send newsletter');
      }
    } catch (error) {
      setMessageType('error');
      setMessage('Network error');
    } finally {
      setSendingNewsletter(false);
      setTimeout(() => setMessage(''), 10000);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-light text-gray-900 mb-2">Newsletter Management</h1>
        <p className="text-gray-600">Manage subscribers, templates, and send newsletters</p>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`mb-6 flex items-start gap-2 p-4 rounded-lg ${
          messageType === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {messageType === 'success' ? (
            <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <p>{message}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`pb-4 px-2 border-b-2 font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Dashboard</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('subscribers')}
            className={`pb-4 px-2 border-b-2 font-medium transition-colors ${
              activeTab === 'subscribers'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Subscribers</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`pb-4 px-2 border-b-2 font-medium transition-colors ${
              activeTab === 'templates'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Templates</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('send')}
            className={`pb-4 px-2 border-b-2 font-medium transition-colors ${
              activeTab === 'send'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              <span>Send Newsletter</span>
            </div>
          </button>
        </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : stats ? (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <Users className="w-8 h-8 text-blue-600" />
                    <span className="text-sm text-gray-500">Total</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stats.totalSubscribers}</div>
                  <div className="text-sm text-gray-600 mt-1">Total Subscribers</div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                    <span className="text-sm text-gray-500">Active</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stats.activeSubscribers}</div>
                  <div className="text-sm text-gray-600 mt-1">Active Subscribers</div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <Mail className="w-8 h-8 text-purple-600" />
                    <span className="text-sm text-gray-500">Sent</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stats.totalEmailsSent}</div>
                  <div className="text-sm text-gray-600 mt-1">Emails Sent</div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <TrendingUp className="w-8 h-8 text-orange-600" />
                    <span className="text-sm text-gray-500">7 Days</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stats.recentSubscribers}</div>
                  <div className="text-sm text-gray-600 mt-1">New This Week</div>
                </div>
              </div>

              {/* Source Breakdown */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Subscriber Sources</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Website</span>
                    <span className="text-2xl font-bold text-blue-600">{stats.webSubscribers}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">WordPress Blog</span>
                    <span className="text-2xl font-bold text-purple-600">{stats.wordpressSubscribers}</span>
                  </div>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Subscriber Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active</span>
                    <div className="flex items-center gap-3">
                      <div className="w-48 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${(stats.activeSubscribers / stats.totalSubscribers) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">
                        {stats.totalSubscribers > 0
                          ? Math.round((stats.activeSubscribers / stats.totalSubscribers) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Unsubscribed</span>
                    <div className="flex items-center gap-3">
                      <div className="w-48 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-600 h-2 rounded-full"
                          style={{ width: `${(stats.unsubscribed / stats.totalSubscribers) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">
                        {stats.totalSubscribers > 0
                          ? Math.round((stats.unsubscribed / stats.totalSubscribers) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Subscribers Tab */}
      {activeTab === 'subscribers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">{subscribers.length} total subscribers</p>
            <button
              onClick={exportSubscribers}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preferences</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscribed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {subscribers.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{sub.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          sub.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {sub.source}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          {sub.preferences.emptyLegs && (
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">Empty Legs</span>
                          )}
                          {sub.preferences.luxuryCars && (
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">Cars</span>
                          )}
                          {sub.preferences.adventures && (
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">Adventures</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingTemplate({
                  id: '',
                  name: '',
                  subject: '',
                  category: 'generalUpdates',
                  html_content: '',
                  is_active: true,
                  last_used_at: null,
                  created_at: new Date().toISOString()
                });
                setShowTemplateEditor(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Template</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div key={template.id} className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    template.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">Category:</span>
                    <span className="capitalize">{template.category}</span>
                  </div>
                  {template.last_used_at && (
                    <div className="text-xs text-gray-500">
                      Last used: {new Date(template.last_used_at).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingTemplate(template);
                      setTemplatePreview(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingTemplate(template);
                      setShowTemplateEditor(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    className="px-3 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Send Newsletter Tab */}
      {activeTab === 'send' && (
        <div className="max-w-2xl">
          <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="">Choose a template...</option>
                {templates.filter(t => t.is_active).map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.subject}
                  </option>
                ))}
              </select>
            </div>

            {selectedTemplate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Template Info</h4>
                {(() => {
                  const template = templates.find(t => t.id === selectedTemplate);
                  if (!template) return null;
                  return (
                    <div className="text-sm text-blue-800 space-y-1">
                      <p><span className="font-medium">Subject:</span> {template.subject}</p>
                      <p><span className="font-medium">Category:</span> {template.category}</p>
                      <p className="text-xs text-blue-600 mt-2">
                        This will be sent to subscribers who opted in for "{template.category}" emails.
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Email (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <button
                  onClick={sendTestEmail}
                  disabled={!selectedTemplate || !testEmail || sendingNewsletter}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sendingNewsletter ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Send Test</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Send a test email to yourself before sending to all subscribers
              </p>
            </div>

            <div className="border-t pt-6">
              <button
                onClick={sendNewsletter}
                disabled={!selectedTemplate || sendingNewsletter}
                className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-black transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sendingNewsletter ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending Newsletter...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Send Newsletter to All Subscribers</span>
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                This will send the newsletter to all active subscribers who opted in for this category
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Template Editor Modal */}
      {showTemplateEditor && editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-medium">
                {editingTemplate.id ? 'Edit Template' : 'New Template'}
              </h2>
              <button
                onClick={() => {
                  setShowTemplateEditor(false);
                  setEditingTemplate(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
                <input
                  type="text"
                  value={editingTemplate.subject}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={editingTemplate.category}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                >
                  <option value="welcome">Welcome</option>
                  <option value="emptyLegs">Empty Legs</option>
                  <option value="luxuryCars">Luxury Cars</option>
                  <option value="adventures">Adventures</option>
                  <option value="generalUpdates">General Updates</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingTemplate.is_active}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, is_active: e.target.checked })}
                    className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">HTML Content</label>
                <textarea
                  value={editingTemplate.html_content}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, html_content: e.target.value })}
                  rows={20}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 font-mono text-sm"
                  placeholder="<html>...</html>"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Available variables: {'{'}{'{'} email {'}'}{'}'},  {'{'}{'{'} preferencesLink {'}'}{'}'},  {'{'}{'{'} unsubscribeLink {'}'}{'}'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t">
              <button
                onClick={() => {
                  setShowTemplateEditor(false);
                  setEditingTemplate(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveTemplate}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Template</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
      {templatePreview && editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-medium">Template Preview</h2>
              <button
                onClick={() => {
                  setTemplatePreview(false);
                  setEditingTemplate(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <iframe
                srcDoc={editingTemplate.html_content}
                className="w-full h-full min-h-[600px] border border-gray-200 rounded-lg"
                title="Template Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
