import React, { useState, useEffect } from 'react';
import { Info, ArrowRight, ExternalLink } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  link: string;
  image_url: string;
  date: string;
  slug: string;
}

interface WordPressBlogPost {
  id: number;
  title: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  slug: string;
  date: string;
  featured_media?: number;
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
    }>;
  };
}

const BlogPosts: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWordPressPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Starting WordPress API fetch...');

      // Method 1: Try direct WordPress REST API with better error handling
      try {
        console.log('Attempting Method 1: Direct WordPress REST API...');
        
        const response = await fetch(
          'https://www.privatecharterx.blog/wp-json/wp/v2/posts?_embed&per_page=6&orderby=date&order=desc',
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            // Remove explicit CORS mode - let browser handle it
          }
        );

        console.log('Method 1 Response status:', response.status);
        console.log('Method 1 Response headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
          const wordPressPosts: WordPressBlogPost[] = await response.json();
          console.log('Method 1 Success - Posts fetched:', wordPressPosts.length);
          console.log('First post data:', wordPressPosts[0]);
          
          const formattedPosts: BlogPost[] = wordPressPosts.map((post) => ({
            id: post.id.toString(),
            title: post.title.rendered.replace(/<[^>]*>/g, ''), // Strip HTML tags
            excerpt: post.excerpt.rendered.replace(/<[^>]*>/g, '').trim(), // Strip HTML tags
            link: `https://www.privatecharterx.blog/${post.slug}`,
            image_url: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || 
                       'https://via.placeholder.com/400x300?text=No+Image',
            date: post.date,
            slug: post.slug
          }));

          console.log('Formatted posts:', formattedPosts);
          setPosts(formattedPosts);
          setLoading(false);
          return; // Success! Exit the function
        } else {
          console.log('Method 1 failed with status:', response.status);
          const errorText = await response.text();
          console.log('Method 1 error response:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      } catch (apiError) {
        console.log('Method 1 failed:', apiError);
        console.log('Method 1 error details:', {
          name: apiError.name,
          message: apiError.message,
          stack: apiError.stack
        });
      }

      // Method 2: Try WordPress.com public API
      try {
        console.log('Attempting Method 2: WordPress.com public API...');
        
        const wpComResponse = await fetch(
          'https://public-api.wordpress.com/rest/v1.1/sites/privatecharterx.blog/posts/?number=6&order_by=date&order=DESC',
          {
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        console.log('Method 2 Response status:', wpComResponse.status);

        if (wpComResponse.ok) {
          const wpComData = await wpComResponse.json();
          console.log('Method 2 Success - Posts fetched:', wpComData.posts?.length || 0);
          console.log('Method 2 first post:', wpComData.posts?.[0]);
          
          if (!wpComData.posts || wpComData.posts.length === 0) {
            throw new Error('No posts returned from WordPress.com API');
          }

          const formattedPosts: BlogPost[] = wpComData.posts.map((post: any) => ({
            id: post.ID.toString(),
            title: post.title,
            excerpt: post.excerpt || (post.content ? post.content.substring(0, 150) + '...' : 'No excerpt available'),
            link: post.URL,
            image_url: post.featured_image || 'https://via.placeholder.com/400x300?text=No+Image',
            date: post.date,
            slug: post.slug
          }));

          console.log('Method 2 formatted posts:', formattedPosts);
          setPosts(formattedPosts);
          setLoading(false);
          return; // Success! Exit the function
        } else {
          console.log('Method 2 failed with status:', wpComResponse.status);
          const errorText = await wpComResponse.text();
          console.log('Method 2 error response:', errorText);
          throw new Error(`HTTP ${wpComResponse.status}: ${errorText}`);
        }
      } catch (wpComError) {
        console.log('Method 2 failed:', wpComError);
        console.log('Method 2 error details:', {
          name: wpComError.name,
          message: wpComError.message
        });
      }

      // Method 3: Try alternative endpoint without CORS restrictions
      try {
        console.log('Attempting Method 3: CORS proxy...');
        
        // Try using a CORS proxy service
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const targetUrl = encodeURIComponent('https://www.privatecharterx.blog/wp-json/wp/v2/posts?per_page=6&orderby=date&order=desc');
        
        const proxyResponse = await fetch(proxyUrl + targetUrl);
        
        console.log('Method 3 Response status:', proxyResponse.status);

        if (proxyResponse.ok) {
          const proxyData = await proxyResponse.json();
          console.log('Method 3 proxy data:', proxyData);
          
          if (!proxyData.contents) {
            throw new Error('No contents in proxy response');
          }

          const wordPressPosts = JSON.parse(proxyData.contents);
          console.log('Method 3 Success - Posts fetched:', wordPressPosts.length);
          
          const formattedPosts: BlogPost[] = wordPressPosts.map((post: any) => ({
            id: post.id.toString(),
            title: post.title.rendered.replace(/<[^>]*>/g, ''),
            excerpt: post.excerpt.rendered.replace(/<[^>]*>/g, '').trim(),
            link: `https://www.privatecharterx.blog/${post.slug}`,
            image_url: post.featured_media 
              ? `https://www.privatecharterx.blog/wp-json/wp/v2/media/${post.featured_media}` 
              : 'https://via.placeholder.com/400x300?text=No+Image',
            date: post.date,
            slug: post.slug
          }));

          console.log('Method 3 formatted posts:', formattedPosts);
          setPosts(formattedPosts);
          setLoading(false);
          return;
        } else {
          console.log('Method 3 failed with status:', proxyResponse.status);
          throw new Error(`Proxy failed: HTTP ${proxyResponse.status}`);
        }
      } catch (proxyError) {
        console.log('Method 3 failed:', proxyError);
        console.log('Method 3 error details:', {
          name: proxyError.name,
          message: proxyError.message
        });
      }

      // Method 4: Try simple fetch without _embed
      try {
        console.log('Attempting Method 4: Simple WordPress API without _embed...');
        
        const simpleResponse = await fetch(
          'https://www.privatecharterx.blog/wp-json/wp/v2/posts?per_page=6&orderby=date&order=desc',
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        console.log('Method 4 Response status:', simpleResponse.status);

        if (simpleResponse.ok) {
          const simplePosts = await simpleResponse.json();
          console.log('Method 4 Success - Posts fetched:', simplePosts.length);
          
          const formattedPosts: BlogPost[] = simplePosts.map((post: any) => ({
            id: post.id.toString(),
            title: post.title.rendered.replace(/<[^>]*>/g, ''),
            excerpt: post.excerpt.rendered.replace(/<[^>]*>/g, '').trim(),
            link: `https://www.privatecharterx.blog/${post.slug}`,
            image_url: 'https://via.placeholder.com/400x300?text=Blog+Post', // Default image since no _embed
            date: post.date,
            slug: post.slug
          }));

          console.log('Method 4 formatted posts:', formattedPosts);
          setPosts(formattedPosts);
          setLoading(false);
          return;
        }
      } catch (simpleError) {
        console.log('Method 4 failed:', simpleError);
      }

      // If all methods fail, show error instead of fallback
      console.error('All API methods failed');
      setError('Unable to load blog posts from WordPress. Please check your internet connection and try again.');
      setPosts([]);

    } catch (err) {
      console.error('Error fetching WordPress posts:', err);
      setError('Failed to load blog posts. Please try again later.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWordPressPosts();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handlePostClick = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const truncateExcerpt = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  const handleRetry = () => {
    console.log('Retry button clicked - refetching posts...');
    fetchWordPressPosts();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Main Content */}
      <main className="flex-1 pt-[88px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section - Matching HowItWorks styling */}
          <div className="text-center mb-20 mt-12">
            <h1 className="text-3xl md:text-4xl font-light text-gray-900 mb-4 tracking-tighter">
              Latest Insights
            </h1>
            <p className="text-gray-500 mb-12 max-w-2xl mx-auto font-light">
              Stay updated with our latest insights about private aviation, yachting, and luxury travel.
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              <p className="ml-4 text-gray-600">Loading latest blog posts...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 mb-8 text-center">
              <div className="flex items-center justify-center mb-4">
                <Info className="text-red-500 mr-2" size={24} />
                <h3 className="text-lg font-medium text-red-800">Unable to Load Blog Posts</h3>
              </div>
              <p className="text-red-700 mb-6">{error}</p>
              <div className="space-x-4">
                <button
                  onClick={handleRetry}
                  className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium"
                >
                  Try Again
                </button>
                <a
                  href="https://www.privatecharterx.blog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-colors font-medium"
                >
                  Visit Blog Directly
                </a>
              </div>
            </div>
          )}

          {/* No Posts State */}
          {!loading && !error && posts.length === 0 && (
            <div className="text-center py-16">
              <h3 className="text-xl font-light text-gray-600 mb-4">No blog posts found</h3>
              <p className="text-gray-500 mb-6">Check back later for new content or visit our blog directly.</p>
              <div className="space-x-4">
                <button
                  onClick={handleRetry}
                  className="bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium"
                >
                  Refresh
                </button>
                <a
                  href="https://www.privatecharterx.blog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
                  Visit Blog
                </a>
              </div>
            </div>
          )}

          {/* Blog Posts Grid */}
          {!loading && posts.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => (
                  <article 
                    key={post.id} 
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer group transform hover:-translate-y-1"
                    onClick={() => handlePostClick(post.link)}
                  >
                    <div className="relative h-52 overflow-hidden">
                      <img 
                        src={post.image_url} 
                        alt={post.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Blog+Post';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ExternalLink size={18} className="text-white drop-shadow-lg" />
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <time className="text-xs text-gray-500 font-medium">
                          {formatDate(post.date)}
                        </time>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-gray-700 transition-colors">
                        {post.title}
                      </h3>
                      
                      <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                        {truncateExcerpt(post.excerpt)}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                          Read more
                        </span>
                        <ArrowRight size={16} className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              
              {/* Success message */}
              <div className="text-center mt-8">
                <p className="text-sm text-green-600">✓ Successfully loaded {posts.length} blog posts</p>
              </div>
            </>
          )}

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-gray-900 to-black text-white p-12 rounded-3xl text-center mt-20">
            <h2 className="text-2xl md:text-3xl font-light mb-4">
              Discover More <span className="font-medium">Stories</span>
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
              Explore our complete collection of insights on private aviation, yachting, luxury travel, and blockchain innovations.
            </p>
            <a 
              href="https://www.privatecharterx.blog" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-medium hover:bg-gray-100 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              Visit Our Blog
              <ArrowRight size={18} />
            </a>
          </div>

          {/* Debug Information (remove in production) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
              <strong>Debug Info:</strong>
              <br />Posts loaded: {posts.length}
              <br />Loading: {loading.toString()}
              <br />Error: {error || 'None'}
              <br />Check browser console for detailed API logs
              <br />Current URL: {window.location.href}
              <br />User Agent: {navigator.userAgent.substring(0, 50)}...
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default BlogPosts;
