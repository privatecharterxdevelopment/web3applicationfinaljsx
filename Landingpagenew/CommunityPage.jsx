import React, { useState, useEffect } from 'react';
import { MessageCircle, Eye, Calendar, User, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAccount } from 'wagmi';
import { syncBlogPostsToDatabase } from '../../services/blogService';
import PageHeader from './PageHeader';
import Button from './Button';
import BlogPostDetail from './BlogPostDetail';

export default function CommunityPage() {
  const { address: walletAddress, isConnected } = useAccount();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'latest', 'popular'
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  // Generate realistic view counts based on post age
  const generateViewCount = (publishedDate) => {
    const now = new Date();
    const published = new Date(publishedDate);
    const daysOld = Math.floor((now - published) / (1000 * 60 * 60 * 24));

    // Base views: 2000-5000 for first month
    const baseViews = Math.floor(Math.random() * 3000) + 2000;

    // Daily increment: 50-200 views per day
    const dailyViews = Math.floor(Math.random() * 150) + 50;
    const accumulatedViews = dailyViews * daysOld;

    // Total views
    return baseViews + accumulatedViews;
  };


  const fetchBlogPosts = async () => {
    setLoading(true);
    try {
      console.log('📥 Fetching Web3 blog posts...');

      // STRATEGY 1: Try fetching directly from WordPress API (same method as weather card)
      const WEB3_CATEGORY_ID = 131; // Web3 category
      const wpApiUrl = `https://www.privatecharterx.blog/wp-json/wp/v2/posts?_embed&per_page=20&orderby=date&order=desc&categories=${WEB3_CATEGORY_ID}`;

      try {
        const response = await fetch(wpApiUrl);

        if (response.ok) {
          const wpPosts = await response.json();
          console.log(`✅ Fetched ${wpPosts.length} posts directly from WordPress API`);

          // Format posts from WordPress API
          const formatted = wpPosts.map(post => {
            // Extract featured image
            let image = null;
            if (post._embedded?.['wp:featuredmedia']?.[0]) {
              image = post._embedded['wp:featuredmedia'][0].source_url;
            }

            // Extract author
            let author = 'PrivateCharterX Team';
            if (post._embedded?.author?.[0]) {
              author = post._embedded.author[0].name;
            }

            // Extract tags
            let tags = [];
            if (post._embedded?.['wp:term']) {
              const allTerms = post._embedded['wp:term'].flat();
              tags = allTerms
                .filter(term => term.taxonomy === 'post_tag')
                .map(term => term.name)
                .slice(0, 3);
            }

            // Clean excerpt
            let excerpt = post.excerpt?.rendered?.replace(/<[^>]*>/g, '').trim() || '';
            if (!excerpt && post.content?.rendered) {
              excerpt = post.content.rendered.replace(/<[^>]*>/g, '').trim().substring(0, 200) + '...';
            }

            // Generate realistic view counts
            const views = generateViewCount(post.date);
            const commentCount = 0; // Start at 0 - real comments from wallet users

            return {
              id: post.id,
              title: post.title?.rendered || 'Untitled',
              excerpt: excerpt,
              content: post.content?.rendered || '',
              image: image,
              author: author,
              publishedAt: post.date,
              views: views,
              commentCount: commentCount,
              tags: tags,
              sourceUrl: post.link
            };
          });

          setPosts(formatted);

          // IMPORTANT: Sync posts to database so comments can reference them
          // This runs in background but we need it for comment functionality
          syncBlogPostsToDatabase().then(result => {
            if (result.success) {
              console.log('✅ Posts synced to database for comment support');
            }
          }).catch(err => {
            console.warn('⚠️ Background database sync failed:', err.message);
          });

          return; // Success, exit early
        }
      } catch (apiError) {
        console.warn('⚠️ WordPress API fetch failed, trying database fallback...', apiError.message);
      }

      // STRATEGY 2: Fallback to database
      console.log('📥 Falling back to database...');
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          blog_comments(count)
        `)
        .eq('source', 'privatecharterx.blog')
        .eq('category', 'web3')
        .order('published_at', { ascending: false });

      if (error) throw error;

      const formatted = data?.map(post => ({
        id: post.id,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        image: post.featured_image,
        author: post.author || 'PrivateCharterX Team',
        publishedAt: post.published_at,
        views: post.views || 0,
        commentCount: post.blog_comments?.[0]?.count || 0,
        tags: post.tags || [],
        sourceUrl: post.source_url
      })) || [];

      setPosts(formatted);

      if (formatted.length === 0) {
        console.log('⚠️ No posts found in database, syncing from source...');
        // Try to sync new posts
        const syncResult = await syncBlogPostsToDatabase();
        if (syncResult.success && syncResult.count > 0) {
          console.log(`✅ Synced ${syncResult.count} new posts, refreshing...`);
          setTimeout(() => fetchBlogPosts(), 1000);
        }
      }

    } catch (error) {
      console.error('❌ Error fetching blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async (postId) => {
    try {
      await supabase.rpc('increment_post_views', { post_id: postId });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
    incrementViews(post.id);
  };

  const filteredPosts = () => {
    let sorted = [...posts];
    if (filter === 'latest') {
      sorted = sorted.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    } else if (filter === 'popular') {
      sorted = sorted.sort((a, b) => b.views - a.views);
    }
    return sorted;
  };

  // Get current posts for pagination
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts().slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts().length / postsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset page when filter changes
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  // If a post is selected, show detail view
  if (selectedPost) {
    return (
      <BlogPostDetail
        post={selectedPost}
        onBack={() => setSelectedPost(null)}
        walletAddress={walletAddress}
        isConnected={isConnected}
      />
    );
  }

  return (
    <div className="w-full h-full p-8 overflow-y-auto">
      <PageHeader
        title="Community"
        subtitle="Stay updated with the latest Web3 insights from PrivateCharterX"
      />

      {/* Wallet Status Banner */}
      {!isConnected && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center gap-3">
            <MessageCircle size={20} className="text-blue-600" />
            <p className="text-sm text-blue-800">
              Connect your wallet to comment on posts and engage with the community
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-4 py-3 font-semibold transition-all ${
            filter === 'all'
              ? 'text-gray-900 border-b-2 border-black'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Posts
        </button>
        <button
          onClick={() => handleFilterChange('latest')}
          className={`px-4 py-3 font-semibold transition-all ${
            filter === 'latest'
              ? 'text-gray-900 border-b-2 border-black'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Latest
        </button>
        <button
          onClick={() => handleFilterChange('popular')}
          className={`px-4 py-3 font-semibold transition-all ${
            filter === 'popular'
              ? 'text-gray-900 border-b-2 border-black'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Popular
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={40} className="animate-spin text-gray-400" />
        </div>
      )}

      {/* Empty State */}
      {!loading && posts.length === 0 && (
        <div className="text-center py-20">
          <MessageCircle size={64} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Posts Yet</h3>
          <p className="text-gray-500">Check back soon for Web3 insights and updates</p>
        </div>
      )}

      {/* Blog Posts Grid */}
      {!loading && posts.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentPosts.map((post) => (
              <BlogPostCard
                key={post.id}
                post={post}
                onClick={() => handlePostClick(post)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white/50 backdrop-blur-sm border border-gray-200 text-gray-700 hover:bg-white hover:shadow-md'
                }`}
              >
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                          currentPage === pageNum
                            ? 'bg-black text-white shadow-lg'
                            : 'bg-white/50 backdrop-blur-sm border border-gray-200 text-gray-700 hover:bg-white hover:shadow-md'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    pageNum === currentPage - 2 ||
                    pageNum === currentPage + 2
                  ) {
                    return (
                      <span key={pageNum} className="flex items-center px-2 text-gray-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white/50 backdrop-blur-sm border border-gray-200 text-gray-700 hover:bg-white hover:shadow-md'
                }`}
              >
                Next
              </button>
            </div>
          )}

          {/* Page Info */}
          <div className="text-center mt-4 text-sm text-gray-500">
            Showing {indexOfFirstPost + 1}-{Math.min(indexOfLastPost, filteredPosts().length)} of {filteredPosts().length} posts
          </div>
        </>
      )}
    </div>
  );
}

function BlogPostCard({ post, onClick }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div
      onClick={onClick}
      className="bg-white/35 backdrop-blur-md border border-gray-200/50 rounded-xl overflow-hidden hover:shadow-lg hover:bg-white/45 transition-all duration-300 cursor-pointer group"
    >
      {/* Featured Image - Smaller */}
      <div className="relative h-40 overflow-hidden bg-gray-200/30">
        {post.image ? (
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100/50 to-gray-200/50">
            <MessageCircle size={40} className="text-gray-400" />
          </div>
        )}
      </div>

      {/* Content - More Compact */}
      <div className="p-4">
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {post.tags.slice(0, 2).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-gray-100/70 text-gray-700 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="text-base font-bold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {post.excerpt}
        </p>

        {/* Meta Info - Compact */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3 pb-3 border-b border-gray-200/50">
          <div className="flex items-center gap-1.5">
            <User size={12} />
            <span className="truncate">{post.author}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{formatDate(post.publishedAt)}</span>
          </div>
        </div>

        {/* Stats - Smaller */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Eye size={14} />
              <span className="font-semibold">{formatNumber(post.views)}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle size={14} />
              <span className="font-semibold">{post.commentCount}</span>
            </div>
          </div>

          <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </div>
  );
}
