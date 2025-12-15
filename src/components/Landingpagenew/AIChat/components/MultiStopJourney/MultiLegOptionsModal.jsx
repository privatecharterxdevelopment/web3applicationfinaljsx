import React from 'react';
import { X, FileText, MessageSquare, Plane, Route, ArrowRight } from 'lucide-react';

/**
 * MultiLegOptionsModal - Lets user choose between building journey via form or chat
 */
const MultiLegOptionsModal = ({ isOpen, onClose, onSelectForm, onSelectChat, routeInfo }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[71] flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} className="text-white" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <Route size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Multi-Leg Journey</h2>
                <p className="text-sm text-gray-300">Choose how to build your route</p>
              </div>
            </div>

            {/* Route Preview */}
            {routeInfo && (
              <div className="mt-4 flex items-center gap-2 text-white/80 text-sm">
                <Plane size={14} />
                <span>{routeInfo}</span>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Build your multi-destination journey step by step. Choose your preferred method:
            </p>

            {/* Option 1: Form Builder */}
            <button
              onClick={onSelectForm}
              className="w-full p-5 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-gray-300 rounded-xl transition-all duration-200 text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <FileText size={24} className="text-gray-700" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">Build with Form</h3>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded">RECOMMENDED</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Use our visual journey builder to add stops, set departure times, passenger count, and special requests.
                  </p>
                  <ul className="mt-3 space-y-1 text-xs text-gray-500">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      Add multiple stops with duration
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      Set departure date & time per leg
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      Specify passengers, pets, luggage
                    </li>
                  </ul>
                </div>
                <ArrowRight size={20} className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            {/* Option 2: Chat Builder */}
            <button
              onClick={onSelectChat}
              className="w-full p-5 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-gray-300 rounded-xl transition-all duration-200 text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <MessageSquare size={24} className="text-gray-700" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Build via Chat</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    I'll guide you through each leg step by step, asking for details as we go.
                  </p>
                  <ul className="mt-3 space-y-1 text-xs text-gray-500">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      Conversational guidance
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      Get suggestions as you build
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      Perfect for complex itineraries
                    </li>
                  </ul>
                </div>
                <ArrowRight size={20} className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              Both methods will create a quote request for our aviation coordinators
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default MultiLegOptionsModal;
