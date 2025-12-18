import React, { useState } from 'react';
import { 
  User, 
  Building2, 
  Mail, 
  Tag, 
  Check, 
  X, 
  Search, 
  Filter,
  Plane,
  Ship,
  Zap,
  Car,
  Activity
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

interface Subscriber {
  id: string;
  name: string;
  email: string;
  company: string | null;
  type: string;
  categories?: string[];
}

interface SubscriberListProps {
  subscribers: Subscriber[];
  onManageCategories: (subscriber: Subscriber) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  categories: Category[];
}

export const SubscriberList: React.FC<SubscriberListProps> = ({
  subscribers,
  onManageCategories,
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  categories
}) => {
  const getCategoryById = (id: string) => {
    return categories.find(c => c.id === id) || null;
  };

  return (
    <div>
      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search subscribers by name, email, or company..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-700">Subscriber</th>
                <th className="text-left p-4 font-medium text-gray-700">Email</th>
                <th className="text-left p-4 font-medium text-gray-700">Type</th>
                <th className="text-left p-4 font-medium text-gray-700">Categories</th>
                <th className="text-left p-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((subscriber) => (
                <tr key={subscriber.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {subscriber.type === 'corporate' ? (
                          <Building2 className="w-5 h-5 text-gray-600" />
                        ) : (
                          <User className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-black">{subscriber.name}</p>
                        {subscriber.company && (
                          <p className="text-sm text-gray-500">{subscriber.company}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm">{subscriber.email}</p>
                  </td>
                  <td className="p-4">
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 capitalize">
                      {subscriber.type}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {subscriber.categories?.map((categoryId) => {
                        const category = getCategoryById(categoryId);
                        return category ? (
                          <span 
                            key={categoryId} 
                            className={`text-xs px-2 py-1 rounded-full flex items-center space-x-1 ${category.color}`}
                          >
                            {category.icon}
                            <span>{category.name}</span>
                          </span>
                        ) : null;
                      })}
                      {(!subscriber.categories || subscriber.categories.length === 0) && (
                        <span className="text-xs text-gray-500">No categories</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => onManageCategories(subscriber)}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    >
                      <Tag className="w-4 h-4" />
                      <span>Manage Categories</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

interface SubscriberCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriber: Subscriber | null;
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  onSave: () => void;
  isSaving: boolean;
  categories: Category[];
}

export const SubscriberCategoriesModal: React.FC<SubscriberCategoriesModalProps> = ({
  isOpen,
  onClose,
  subscriber,
  selectedCategories,
  onCategoryChange,
  onSave,
  isSaving,
  categories
}) => {
  if (!isOpen || !subscriber) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-black">Manage Categories</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600">Subscriber:</p>
            <p className="font-medium text-black">{subscriber.name}</p>
            <p className="text-sm text-gray-500">{subscriber.email}</p>
          </div>
          
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Select Categories:</p>
            <div className="space-y-3">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onCategoryChange([...selectedCategories, category.id]);
                      } else {
                        onCategoryChange(selectedCategories.filter(id => id !== category.id));
                      }
                    }}
                    className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                  />
                  <div className={`flex items-center space-x-2 px-2 py-1 rounded-full ${category.color}`}>
                    {category.icon}
                    <span>{category.name}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Categories</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};