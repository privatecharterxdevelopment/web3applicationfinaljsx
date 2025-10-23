import React, { useState } from 'react';
import {
  ArrowRight, Check, Shield, Users, Globe, ChevronRight, Search,
  X, Mail, Coins, Clock, CheckCircle, Building2, FileText,
  TrendingUp, Target, Award, Briefcase, PieChart, DollarSign,
  BarChart3, Zap, Eye, ExternalLink, Vote, Calendar
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const DAOProjects = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProject, setSelectedProject] = useState(null);

  const categories = [
    { id: 'all', label: 'All Projects', count: 12 },
    { id: 'investment', label: 'Investment DAOs', count: 4 },
    { id: 'service', label: 'Service DAOs', count: 3 },
    { id: 'protocol', label: 'Protocol DAOs', count: 3 },
    { id: 'social', label: 'Community DAOs', count: 2 }
  ];

  const daoProjects = [
    {
      id: 1,
      name: 'JetShare Collective',
      category: 'investment',
      type: 'Investment DAO',
      description: 'Fractional ownership of premium private jets through democratic governance',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/PrivatecharterX_logo_vectorized.glb.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9Qcml2YXRlY2hhcnRlclhfbG9nb192ZWN0b3JpemVkLmdsYi5wbmciLCJpYXQiOjE3NTcyNDc5MzgsImV4cCI6MTc4ODc4MzkzOH0.gA0Flwg99EsLDyQC5MxSSon5NmL70x_ewRTaWolSHmc',
      members: 342,
      treasury: '€4.2M',
      status: 'Active',
      established: '2024',
      governance: 'Token-based voting',
      proposals: 28,
      features: ['Jet Ownership', 'Profit Sharing', 'Charter Access', 'Global Fleet']
    },
    {
      id: 2,
      name: 'HeliConnect Network',
      category: 'service',
      type: 'Service DAO',
      description: 'Decentralized helicopter service coordination and quality assurance',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/PrivatecharterX_logo_vectorized.glb.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9Qcml2YXRlY2hhcnRlclhfbG9nb192ZWN0b3JpemVkLmdsYi5wbmciLCJpYXQiOjE3NTcyNDc5MzgsImV4cCI6MTc4ODc4MzkzOH0.gA0Flwg99EsLDyQC5MxSSon5NmL70x_ewRTaWolSHmc',
      members: 156,
      treasury: '€850K',
      status: 'Active',
      established: '2024',
      governance: 'Reputation-based',
      proposals: 15,
      features: ['Service Standards', 'Operator Network', 'Quality Control', 'Emergency Response']
    },
    {
      id: 3,
      name: 'AviationChain Protocol',
      category: 'protocol',
      type: 'Protocol DAO',
      description: 'Blockchain infrastructure for aviation data and smart contracts',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/PrivatecharterX_logo_vectorized.glb.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9Qcml2YXRlY2hhcnRlclhfbG9nb192ZWN0b3JpemVkLmdsYi5wbmciLCJpYXQiOjE3NTcyNDc5MzgsImV4cCI6MTc4ODc4MzkzOH0.gA0Flwg99EsLDyQC5MxSSon5NmL70x_ewRTaWolSHmc',
      members: 89,
      treasury: '€1.8M',
      status: 'Development',
      established: '2024',
      governance: 'Technical proposals',
      proposals: 12,
      features: ['Smart Contracts', 'Data Oracle', 'Cross-chain', 'API Gateway']
    },
    {
      id: 4,
      name: 'Carbon Neutral Aviation',
      category: 'investment',
      type: 'Investment DAO',
      description: 'Sustainable aviation fuel and carbon offset investments',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/PrivatecharterX_logo_vectorized.glb.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9Qcml2YXRlY2hhcnRlclhfbG9nb192ZWN0b3JpemVkLmdsYi5wbmciLCJpYXQiOjE3NTcyNDc5MzgsImV4cCI6MTc4ODc4MzkzOH0.gA0Flwg99EsLDyQC5MxSSon5NmL70x_ewRTaWolSHmc',
      members: 245,
      treasury: '€2.1M',
      status: 'Active',
      established: '2024',
      governance: 'Quadratic voting',
      proposals: 22,
      features: ['SAF Investment', 'Carbon Credits', 'Impact Tracking', 'Green Tech']
    },
    {
      id: 5,
      name: 'Pilot Community Hub',
      category: 'social',
      type: 'Community DAO',
      description: 'Professional pilot network for knowledge sharing and career development',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/PrivatecharterX_logo_vectorized.glb.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9Qcml2YXRlY2hhcnRlclhfbG9nb192ZWN0b3JpemVkLmdsYi5wbmciLCJpYXQiOjE3NTcyNDc5MzgsImV4cCI6MTc4ODc4MzkzOH0.gA0Flwg99EsLDyQC5MxSSon5NmL70x_ewRTaWolSHmc',
      members: 567,
      treasury: '€320K',
      status: 'Active',
      established: '2023',
      governance: 'Community consensus',
      proposals: 45,
      features: ['Training Programs', 'Job Board', 'Mentorship', 'Events']
    },
    {
      id: 6,
      name: 'eVTOL Development Fund',
      category: 'investment',
      type: 'Investment DAO',
      description: 'Early-stage funding for electric vertical takeoff and landing aircraft',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/PrivatecharterX_logo_vectorized.glb.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9Qcml2YXRlY2hhcnRlclhfbG9nb192ZWN0b3JpemVkLmdsYi5wbmciLCJpYXQiOjE3NTcyNDc5MzgsImV4cCI6MTc4ODc4MzkzOH0.gA0Flwg99EsLDyQC5MxSSon5NmL70x_ewRTaWolSHmc',
      members: 198,
      treasury: '€5.7M',
      status: 'Active',
      established: '2024',
      governance: 'Expert committee',
      proposals: 18,
      features: ['Early Investment', 'Tech Review', 'Pilot Programs', 'Infrastructure']
    }
  ];

  const filteredProjects = daoProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const ProjectModal = ({ project, onClose }) => (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-8 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden">
              <img src={project.image} alt={project.name} className="w-12 h-12 object-contain" />
            </div>
            <div>
              <h3 className="text-2xl font-light text-black mb-1">{project.name}</h3>
              <p className="text-gray-500 font-light">{project.type}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-gray-50 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Description</h4>
              <p className="text-gray-600 leading-relaxed mb-6">{project.description}</p>

              <h4 className="text-lg font-medium text-gray-900 mb-4">Key Features</h4>
              <div className="space-y-2">
                {project.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-600">
                    <Check size={14} className="text-green-600 mr-2" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">DAO Metrics</h4>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Members</span>
                    <span className="font-medium text-gray-900">{project.members}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Treasury</span>
                    <span className="font-medium text-gray-900">{project.treasury}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Proposals</span>
                    <span className="font-medium text-gray-900">{project.proposals}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Governance</span>
                    <span className="font-medium text-gray-900">{project.governance}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2">
                    Join DAO
                    <ArrowRight size={18} />
                  </button>
                  <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2">
                    <Eye size={18} />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Header />

      <main className="flex-1 pt-[88px]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 md:p-12 mx-4 md:mx-8">

            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-medium text-gray-900 text-center mb-4 tracking-tighter">
                Active DAO Projects
              </h1>
              <p className="text-gray-500 text-center mb-8 max-w-2xl mx-auto font-light">
                Explore active decentralized autonomous organizations in the aviation and mobility space.
                Join existing DAOs or get inspired to create your own.
              </p>
            </div>

            {/* Search and Filter */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search DAOs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`whitespace-nowrap px-4 py-3 rounded-xl transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category.label}
                      <span className="ml-2 text-xs opacity-70">({category.count})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {filteredProjects.map((project) => (
                <div key={project.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 cursor-pointer"
                     onClick={() => setSelectedProject(project)}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden">
                      <img src={project.image} alt={project.name} className="w-8 h-8 object-contain" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      project.status === 'Active' ? 'bg-green-100 text-green-800' :
                      project.status === 'Development' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-medium text-gray-900 mb-2">{project.name}</h3>
                  <p className="text-sm text-gray-500 mb-1">{project.type}</p>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Members:</span>
                      <span className="font-medium text-gray-900">{project.members}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Treasury:</span>
                      <span className="font-medium text-gray-900">{project.treasury}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Proposals:</span>
                      <span className="font-medium text-gray-900">{project.proposals}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
                      Join DAO
                    </button>
                    <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <ExternalLink size={16} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* No Results */}
            {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No DAOs found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                  className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* Stats Section */}
            <div className="border-t border-gray-100 pt-12">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-light text-gray-900 mb-4 tracking-tighter">
                  DAO Ecosystem Stats
                </h2>
                <p className="text-gray-500 max-w-2xl mx-auto font-light">
                  Real-time statistics from our active DAO ecosystem.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Users size={24} className="text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">1,247</div>
                  <div className="text-sm text-gray-500">Total Members</div>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <DollarSign size={24} className="text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">€15.2M</div>
                  <div className="text-sm text-gray-500">Total Treasury</div>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Vote size={24} className="text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">140</div>
                  <div className="text-sm text-gray-500">Active Proposals</div>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Building2 size={24} className="text-orange-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">12</div>
                  <div className="text-sm text-gray-500">Active DAOs</div>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center mt-16">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-2xl md:text-3xl font-light text-gray-900 mb-4 tracking-tighter">
                  Want to Start Your Own DAO?
                </h2>
                <p className="text-gray-500 mb-8 max-w-xl mx-auto font-light">
                  Launch your decentralized autonomous organization with our professional setup and support services.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="bg-black text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2">
                    Create DAO
                    <ArrowRight size={18} />
                  </button>
                  <a
                    href="mailto:dao@privatecharterx.com"
                    className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Mail size={18} />
                    Contact Team
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />

      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
};

export default DAOProjects;