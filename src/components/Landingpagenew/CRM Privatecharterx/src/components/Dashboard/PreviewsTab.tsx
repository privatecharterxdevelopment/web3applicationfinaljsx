import React, { useState } from 'react';
import { FileText, Newspaper, Megaphone, Calendar, User, Search, Filter, X, ChevronRight, Download, Share2, Bookmark, Bookmark as BookmarkCheck, ThumbsUp } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  type: 'news' | 'document' | 'announcement';
  content: string;
  created_at: string;
  created_by: string;
}

interface PreviewsTabProps {
  documents: Document[];
}

export const PreviewsTab: React.FC<PreviewsTabProps> = ({ documents }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'news' | 'document' | 'announcement'>('all');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [bookmarkedDocs, setBookmarkedDocs] = useState<string[]>([]);
  const [likedDocs, setLikedDocs] = useState<string[]>([]);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchTerm === '' || 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.created_by.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'news': return <Newspaper className="w-5 h-5 text-blue-600" />;
      case 'document': return <FileText className="w-5 h-5 text-purple-600" />;
      case 'announcement': return <Megaphone className="w-5 h-5 text-yellow-600" />;
      default: return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'news': return 'bg-blue-100 text-blue-800';
      case 'document': return 'bg-purple-100 text-purple-800';
      case 'announcement': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const toggleBookmark = (docId: string) => {
    setBookmarkedDocs(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId) 
        : [...prev, docId]
    );
  };

  const toggleLike = (docId: string) => {
    setLikedDocs(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId) 
        : [...prev, docId]
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search documents by title, content, or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="news">News</option>
                <option value="document">Documents</option>
                <option value="announcement">Announcements</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 h-full">
        {/* Document List */}
        <div className="md:col-span-1 border-r border-gray-200 h-[600px] overflow-y-auto">
          <div className="divide-y divide-gray-100">
            {filteredDocuments.length > 0 ? (
              filteredDocuments.map((doc) => (
                <div 
                  key={doc.id}
                  onClick={() => setSelectedDocument(doc)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedDocument?.id === doc.id ? 'bg-gray-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getDocumentIcon(doc.type)}
                      <span className={`text-xs px-2 py-1 rounded-full ${getDocumentTypeColor(doc.type)}`}>
                        {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {bookmarkedDocs.includes(doc.id) && (
                        <BookmarkCheck className="w-4 h-4 text-blue-500" />
                      )}
                      {likedDocs.includes(doc.id) && (
                        <ThumbsUp className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                  <h3 className="font-medium text-black">{doc.title}</h3>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(doc.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{doc.created_by}</span>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No documents found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter</p>
              </div>
            )}
          </div>
        </div>

        {/* Document Preview */}
        <div className="md:col-span-2 h-[600px] overflow-y-auto">
          {selectedDocument ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  {getDocumentIcon(selectedDocument.type)}
                  <h2 className="text-xl font-semibold text-black">{selectedDocument.title}</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => toggleBookmark(selectedDocument.id)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title={bookmarkedDocs.includes(selectedDocument.id) ? "Remove Bookmark" : "Bookmark"}
                  >
                    {bookmarkedDocs.includes(selectedDocument.id) ? (
                      <BookmarkCheck className="w-5 h-5 text-blue-500" />
                    ) : (
                      <Bookmark className="w-5 h-5" />
                    )}
                  </button>
                  <button 
                    onClick={() => toggleLike(selectedDocument.id)}
                    className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                    title={likedDocs.includes(selectedDocument.id) ? "Unlike" : "Like"}
                  >
                    <ThumbsUp className={`w-5 h-5 ${likedDocs.includes(selectedDocument.id) ? 'text-green-500' : ''}`} />
                  </button>
                  <button 
                    className="p-2 text-gray-400 hover:text-black transition-colors"
                    title="Download"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button 
                    className="p-2 text-gray-400 hover:text-black transition-colors"
                    title="Share"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>By {selectedDocument.created_by}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(selectedDocument.created_at)}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getDocumentTypeColor(selectedDocument.type)}`}>
                    {selectedDocument.type.charAt(0).toUpperCase() + selectedDocument.type.slice(1)}
                  </span>
                </div>

                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {selectedDocument.content}
                  </p>
                </div>
              </div>

              {/* Related Documents */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-black mb-4">Related Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents
                    .filter(doc => doc.id !== selectedDocument.id && doc.type === selectedDocument.type)
                    .slice(0, 2)
                    .map(doc => (
                      <div 
                        key={doc.id}
                        onClick={() => setSelectedDocument(doc)}
                        className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          {getDocumentIcon(doc.type)}
                          <span className="font-medium text-black">{doc.title}</span>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2">{doc.content.substring(0, 100)}...</p>
                        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                          <span>{formatDate(doc.created_at)}</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-6">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No document selected</h3>
                <p className="text-gray-500">Select a document from the list to view its contents</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};