import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Plus, 
  Search, 
  Filter, 
  Users, 
  Calendar, 
  Send, 
  X, 
  Tag,
  CheckCircle,
  AlertCircle,
  Clock,
  Plane,
  Ship,
  Zap,
  Car,
  Activity
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/CRM/AuthContext';
import { useNotification } from '../../../contexts/CRM/NotificationContext';
import { NewsletterTemplate, NewsletterTemplatePreview, CampaignCard } from './NewsletterTemplates';
import { NewsletterTemplateEditor } from './NewsletterTemplateEditor';
import { SubscriberList, SubscriberCategoriesModal } from './SubscriberManagement';
import { EmptyLegNewsletterTemplate, PrivateJetNewsletterTemplate } from './EmptyLegNewsletter';

interface Template {
  id: string;
  title: string;
  subject: string;
  content: string;
  template_html: string;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface Campaign {
  id: string;
  newsletter_id: string;
  name: string;
  description: string | null;
  scheduled_for: string | null;
  sent_at: string | null;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  created_by: string;
  total_recipients: number;
  opens: number;
  clicks: number;
  created_at: string;
  updated_at: string;
  newsletter?: {
    title: string;
  };
}

interface Subscriber {
  id: string;
  name: string;
  email: string;
  company: string | null;
  type: string;
  categories?: string[];
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

export const NewsletterSystem: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [activeTab, setActiveTab] = useState<'templates' | 'campaigns' | 'subscribers'>('templates');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [showCampaignCreator, setShowCampaignCreator] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    newsletter_id: '',
    scheduled_for: ''
  });

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'marketing') {
      fetchTemplates();
      fetchCampaigns();
      fetchSubscribers();
      fetchCategories();
    }
  }, [user]);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('newsletters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err: any) {
      console.error('Error fetching templates:', err);
      showError('Error', 'Failed to load newsletter templates');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletter_campaigns')
        .select(`
          *,
          newsletters!newsletter_id (title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (err: any) {
      console.error('Error fetching campaigns:', err);
      showError('Error', 'Failed to load campaigns');
    }
  };

  const fetchSubscribers = async () => {
    try {
      // Get clients as subscribers
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (clientsError) throw clientsError;

      // Get category subscriptions
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('client_category_subscriptions')
        .select('client_id, category_id');

      if (subscriptionsError) throw subscriptionsError;

      // Map subscriptions to clients
      const subscriptionMap = new Map<string, string[]>();
      subscriptionsData?.forEach(sub => {
        const categories = subscriptionMap.get(sub.client_id) || [];
        categories.push(sub.category_id);
        subscriptionMap.set(sub.client_id, categories);
      });

      // Format clients as subscribers
      const formattedSubscribers = clientsData?.map(client => ({
        id: client.id,
        name: client.name,
        email: client.email,
        company: client.company,
        type: client.type,
        categories: subscriptionMap.get(client.id) || []
      })) || [];

      setSubscribers(formattedSubscribers);
    } catch (err: any) {
      console.error('Error fetching subscribers:', err);
      showError('Error', 'Failed to load subscribers');
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('client_categories')
        .select('*')
        .order('name');

      if (error) throw error;

      const formattedCategories: Category[] = (data || []).map(category => ({
        id: category.id,
        name: category.name,
        icon: getCategoryIcon(category.name),
        color: getCategoryColor(category.name)
      }));

      setCategories(formattedCategories);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      showError('Error', 'Failed to load categories');
    }
  };

  const getCategoryIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'private jets':
        return <Plane className="w-4 h-4" />;
      case 'yachts':
        return <Ship className="w-4 h-4" />;
      case 'helicopters':
        return <Zap className="w-4 h-4" />;
      case 'luxury cars':
        return <Car className="w-4 h-4" />;
      case 'empty legs':
        return <Activity className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (name: string) => {
    switch (name.toLowerCase()) {
      case 'private jets':
        return 'bg-blue-100 text-blue-800';
      case 'yachts':
        return 'bg-green-100 text-green-800';
      case 'helicopters':
        return 'bg-purple-100 text-purple-800';
      case 'luxury cars':
        return 'bg-yellow-100 text-yellow-800';
      case 'empty legs':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const saveTemplate = async (templateData: {
    title: string;
    subject: string;
    content: string;
    template_html: string;
  }) => {
    try {
      setIsSaving(true);

      // Get current user from system_users
      const { data: systemUser } = await supabase
        .from('system_users')
        .select('id')
        .eq('email', user?.email)
        .single();

      if (!systemUser) {
        throw new Error('User not found in system');
      }

      if (selectedTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('newsletters')
          .update({
            title: templateData.title,
            subject: templateData.subject,
            content: templateData.content,
            template_html: templateData.template_html,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedTemplate.id);

        if (error) throw error;
        showSuccess('Success', 'Template updated successfully');
      } else {
        // Create new template
        const { error } = await supabase
          .from('newsletters')
          .insert([{
            title: templateData.title,
            subject: templateData.subject,
            content: templateData.content,
            template_html: templateData.template_html,
            created_by: systemUser.id,
            is_draft: true
          }]);

        if (error) throw error;
        showSuccess('Success', 'Template created successfully');
      }

      setShowTemplateEditor(false);
      setSelectedTemplate(null);
      fetchTemplates();
    } catch (err: any) {
      console.error('Error saving template:', err);
      showError('Error', err.message || 'Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const createCampaign = async () => {
    try {
      setIsSaving(true);

      // Get current user from system_users
      const { data: systemUser } = await supabase
        .from('system_users')
        .select('id')
        .eq('email', user?.email)
        .single();

      if (!systemUser) {
        throw new Error('User not found in system');
      }

      // Create campaign
      const { data: campaign, error } = await supabase
        .from('newsletter_campaigns')
        .insert([{
          newsletter_id: newCampaign.newsletter_id,
          name: newCampaign.name,
          description: newCampaign.description || null,
          scheduled_for: newCampaign.scheduled_for ? new Date(newCampaign.scheduled_for).toISOString() : null,
          status: 'draft',
          created_by: systemUser.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Get all clients
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, email');

      if (clientsError) throw clientsError;

      // Add all clients as recipients
      if (clients && clients.length > 0) {
        const recipients = clients.map(client => ({
          campaign_id: campaign.id,
          client_id: client.id,
          email: client.email,
          name: client.name,
          status: 'pending'
        }));

        const { error: recipientsError } = await supabase
          .from('newsletter_recipients')
          .insert(recipients);

        if (recipientsError) throw recipientsError;

        // Update campaign with recipient count
        await supabase
          .from('newsletter_campaigns')
          .update({ total_recipients: clients.length })
          .eq('id', campaign.id);
      }

      showSuccess('Success', 'Campaign created successfully');
      setShowCampaignCreator(false);
      setNewCampaign({
        name: '',
        description: '',
        newsletter_id: '',
        scheduled_for: ''
      });
      fetchCampaigns();
    } catch (err: any) {
      console.error('Error creating campaign:', err);
      showError('Error', err.message || 'Failed to create campaign');
    } finally {
      setIsSaving(false);
    }
  };

  const sendCampaign = async (campaignId: string) => {
    try {
      setIsSending(true);

      // Call the edge function to send the newsletter
      const { data, error } = await supabase.functions.invoke('send-newsletter', {
        body: { campaignId }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      showSuccess('Success', `Campaign sent to ${data.sentCount} recipients`);
      fetchCampaigns();
    } catch (err: any) {
      console.error('Error sending campaign:', err);
      showError('Error', err.message || 'Failed to send campaign');
    } finally {
      setIsSending(false);
    }
  };

  const updateSubscriberCategories = async () => {
    if (!selectedSubscriber) return;

    try {
      setIsSaving(true);

      // Delete existing subscriptions
      const { error: deleteError } = await supabase
        .from('client_category_subscriptions')
        .delete()
        .eq('client_id', selectedSubscriber.id);

      if (deleteError) throw deleteError;

      // Add new subscriptions
      if (selectedCategories.length > 0) {
        const subscriptions = selectedCategories.map(categoryId => ({
          client_id: selectedSubscriber.id,
          category_id: categoryId
        }));

        const { error: insertError } = await supabase
          .from('client_category_subscriptions')
          .insert(subscriptions);

        if (insertError) throw insertError;
      }

      showSuccess('Success', 'Subscriber categories updated');
      setShowCategoriesModal(false);
      setSelectedSubscriber(null);
      fetchSubscribers();
    } catch (err: any) {
      console.error('Error updating subscriber categories:', err);
      showError('Error', err.message || 'Failed to update subscriber categories');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('newsletters')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      showSuccess('Success', 'Template deleted successfully');
      fetchTemplates();
    } catch (err: any) {
      console.error('Error deleting template:', err);
      showError('Error', err.message || 'Failed to delete template');
    }
  };

  const createEmptyLegTemplate = async () => {
    try {
      setIsSaving(true);

      // Get current user from system_users
      const { data: systemUser } = await supabase
        .from('system_users')
        .select('id')
        .eq('email', user?.email)
        .single();

      if (!systemUser) {
        throw new Error('User not found in system');
      }

      // Create new template
      const { error } = await supabase
        .from('newsletters')
        .insert([{
          title: 'Empty Leg Flight Deals',
          subject: 'Special Empty Leg Offers - Save Up to 75%',
          content: 'Take advantage of these exclusive empty leg flight opportunities at significantly reduced prices. These one-way flights are available due to repositioning needs and offer substantial savings compared to regular charter prices.',
          template_html: EmptyLegNewsletterTemplate,
          created_by: systemUser.id,
          is_draft: true
        }]);

      if (error) throw error;
      showSuccess('Success', 'Empty Leg template created successfully');
      fetchTemplates();
    } catch (err: any) {
      console.error('Error creating template:', err);
      showError('Error', err.message || 'Failed to create template');
    } finally {
      setIsSaving(false);
    }
  };

  const createPrivateJetTemplate = async () => {
    try {
      setIsSaving(true);

      // Get current user from system_users
      const { data: systemUser } = await supabase
        .from('system_users')
        .select('id')
        .eq('email', user?.email)
        .single();

      if (!systemUser) {
        throw new Error('User not found in system');
      }

      // Create new template
      const { error } = await supabase
        .from('newsletters')
        .insert([{
          title: 'Luxury Private Jet Collection',
          subject: 'Discover Our Premium Private Jet Fleet',
          content: 'Experience the ultimate in luxury air travel with our exclusive private jet collection. From midsize to ultra-long-range aircraft, we offer the perfect solution for your travel needs with unparalleled comfort and service.',
          template_html: PrivateJetNewsletterTemplate,
          created_by: systemUser.id,
          is_draft: true
        }]);

      if (error) throw error;
      showSuccess('Success', 'Private Jet template created successfully');
      fetchTemplates();
    } catch (err: any) {
      console.error('Error creating template:', err);
      showError('Error', err.message || 'Failed to create template');
    } finally {
      setIsSaving(false);
    }
  };

  if (user?.role !== 'admin' && user?.role !== 'marketing') {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          Access denied. This section is only available to marketing and admin users.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-black mb-2">Newsletter System</h1>
            <p className="text-gray-600">Create, manage, and send newsletters to your clients</p>
          </div>
          <div className="flex space-x-3">
            {activeTab === 'templates' && (
              <div className="flex space-x-2">
                <button 
                  onClick={createEmptyLegTemplate}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Activity className="w-4 h-4" />
                  <span>Empty Leg Template</span>
                </button>
                <button 
                  onClick={createPrivateJetTemplate}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <Plane className="w-4 h-4" />
                  <span>Jet Template</span>
                </button>
              </div>
            )}
            <button 
              onClick={() => {
                if (activeTab === 'templates') {
                  setSelectedTemplate(null);
                  setShowTemplateEditor(true);
                } else if (activeTab === 'campaigns') {
                  setShowCampaignCreator(true);
                }
              }}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>{activeTab === 'templates' ? 'New Template' : activeTab === 'campaigns' ? 'New Campaign' : 'Add Subscriber'}</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'campaigns'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            Campaigns
          </button>
          <button
            onClick={() => setActiveTab('subscribers')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'subscribers'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            Subscribers
          </button>
        </div>
      </div>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading templates...</p>
              </div>
            </div>
          ) : templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <NewsletterTemplate
                  key={template.id}
                  id={template.id}
                  title={template.title}
                  subject={template.subject}
                  content={template.content}
                  templateHtml={template.template_html}
                  isDraft={template.is_draft}
                  createdAt={template.created_at}
                  onPreview={(id) => {
                    const template = templates.find(t => t.id === id);
                    if (template) {
                      setSelectedTemplate(template);
                      setShowTemplatePreview(true);
                    }
                  }}
                  onEdit={(id) => {
                    const template = templates.find(t => t.id === id);
                    if (template) {
                      setSelectedTemplate(template);
                      setShowTemplateEditor(true);
                    }
                  }}
                  onDelete={deleteTemplate}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No templates yet</h3>
              <p className="text-gray-500 mb-6">Create your first newsletter template to get started</p>
              <button
                onClick={() => {
                  setSelectedTemplate(null);
                  setShowTemplateEditor(true);
                }}
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Create Template
              </button>
            </div>
          )}
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading campaigns...</p>
              </div>
            </div>
          ) : campaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  id={campaign.id}
                  name={campaign.name}
                  description={campaign.description}
                  templateName={campaign.newsletter?.title || 'Unknown Template'}
                  status={campaign.status}
                  recipientCount={campaign.total_recipients}
                  scheduledFor={campaign.scheduled_for}
                  sentAt={campaign.sent_at}
                  onPreview={(id) => {
                    // Preview functionality
                  }}
                  onSend={(id) => sendCampaign(id)}
                  isSending={isSending}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Send className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No campaigns yet</h3>
              <p className="text-gray-500 mb-6">Create your first campaign to start sending newsletters</p>
              <button
                onClick={() => setShowCampaignCreator(true)}
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Create Campaign
              </button>
            </div>
          )}
        </div>
      )}

      {/* Subscribers Tab */}
      {activeTab === 'subscribers' && (
        <SubscriberList
          subscribers={subscribers}
          onManageCategories={(subscriber) => {
            setSelectedSubscriber(subscriber);
            setSelectedCategories(subscriber.categories || []);
            setShowCategoriesModal(true);
          }}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          categories={categories}
        />
      )}

      {/* Template Editor Modal */}
      <NewsletterTemplateEditor
        isOpen={showTemplateEditor}
        onClose={() => {
          setShowTemplateEditor(false);
          setSelectedTemplate(null);
        }}
        onSave={saveTemplate}
        initialData={selectedTemplate ? {
          title: selectedTemplate.title,
          subject: selectedTemplate.subject,
          content: selectedTemplate.content,
          template_html: selectedTemplate.template_html
        } : undefined}
        isSaving={isSaving}
      />

      {/* Template Preview Modal */}
      {selectedTemplate && (
        <NewsletterTemplatePreview
          isOpen={showTemplatePreview}
          onClose={() => {
            setShowTemplatePreview(false);
            setSelectedTemplate(null);
          }}
          title={selectedTemplate.title}
          subject={selectedTemplate.subject}
          content={selectedTemplate.content}
          templateHtml={selectedTemplate.template_html}
        />
      )}

      {/* Campaign Creator Modal */}
      {showCampaignCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Create New Campaign</h2>
              <button
                onClick={() => setShowCampaignCreator(false)}
                className="p-2 text-gray-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="e.g., June Newsletter"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Optional description for this campaign"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Template *
                </label>
                <select
                  value={newCampaign.newsletter_id}
                  onChange={(e) => setNewCampaign({ ...newCampaign, newsletter_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                >
                  <option value="">Select a template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>{template.title}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule For (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={newCampaign.scheduled_for}
                  onChange={(e) => setNewCampaign({ ...newCampaign, scheduled_for: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to save as draft without scheduling
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-4 h-4" />
                  <p className="font-medium">Recipients</p>
                </div>
                <p>This campaign will be sent to all {subscribers.length} subscribers in your database.</p>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCampaignCreator(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createCampaign}
                disabled={!newCampaign.name || !newCampaign.newsletter_id || isSaving}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create Campaign</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscriber Categories Modal */}
      <SubscriberCategoriesModal
        isOpen={showCategoriesModal}
        onClose={() => {
          setShowCategoriesModal(false);
          setSelectedSubscriber(null);
        }}
        subscriber={selectedSubscriber}
        selectedCategories={selectedCategories}
        onCategoryChange={setSelectedCategories}
        onSave={updateSubscriberCategories}
        isSaving={isSaving}
        categories={categories}
      />
    </div>
  );
};