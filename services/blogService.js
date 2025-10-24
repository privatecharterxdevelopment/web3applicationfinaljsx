import { supabase } from '../lib/supabase';

/**
 * Blog Service for fetching posts from privatecharterx.blog
 * and storing them in Supabase
 *
 * STRATEGY:
 * 1. Try Supabase Edge Function (best - no CORS issues)
 * 2. Try direct RSS fetch
 * 3. Try CORS proxies as fallback
 */

const BLOG_URL = 'https://www.privatecharterx.blog';
// WordPress REST API endpoints
const WP_API_BASE = `${BLOG_URL}/wp-json/wp/v2`;
const WEB3_CATEGORY_ID = 131; // Web3 category ID
const WEB3_API_URL = `${WP_API_BASE}/posts?categories=${WEB3_CATEGORY_ID}&per_page=50&_embed`;
// Alternative: RSS feed for Web3 category (fallback)
const WEB3_RSS_FEED = `${BLOG_URL}/category/web3/feed/`;
// Supabase project URL (will be set from supabase instance)
let SUPABASE_URL = null;
// CORS proxies (last resort fallback)
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://api.allorigins.win/raw?url='
];

/**
 * Fetch blog posts from privatecharterx.blog Web3 category
 * URL: https://www.privatecharterx.blog/category/web3/
 *
 * FETCH STRATEGY (in order):
 * 1. Supabase Edge Function (best - server-side, no CORS)
 * 2. Direct WordPress REST API fetch (with _embed for images)
 * 3. Direct RSS feed fetch
 * 4. CORS proxy fallback (last resort)
 */
export async function fetchBlogPostsFromSource() {
  console.log('🔍 Fetching Web3 posts from privatecharterx.blog/category/web3/...');

  // Get Supabase URL for Edge Function
  if (!SUPABASE_URL) {
    SUPABASE_URL = supabase.supabaseUrl;
  }

  // STRATEGY 1: Try Supabase Edge Function first (best solution)
  if (SUPABASE_URL) {
    try {
      console.log('📡 Trying Supabase Edge Function...');
      const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/fetch-blog-posts`;

      const response = await fetch(edgeFunctionUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.posts) {
          console.log(`✅ Edge Function successful! Fetched ${result.posts.length} posts`);
          return result.posts;
        }
      }

      console.log('⚠️ Edge Function failed or not deployed, trying WordPress API...');
    } catch (error) {
      console.log('⚠️ Edge Function error:', error.message);
    }
  }

  // STRATEGY 2: Try WordPress REST API directly (best format)
  try {
    console.log('📡 Trying WordPress REST API...');
    const response = await fetch(WEB3_API_URL);

    if (response.ok) {
      const posts = await response.json();

      if (posts && posts.length > 0) {
        console.log(`✅ WordPress API successful! Found ${posts.length} posts`);
        const formattedPosts = posts.map(post => formatWordPressPost(post));
        return formattedPosts;
      }
    }

    console.log('⚠️ WordPress API failed, trying RSS feed...');
  } catch (error) {
    console.log('⚠️ WordPress API error:', error.message);
  }

  // STRATEGY 3: Try RSS feed
  let lastError = null;

  try {
    console.log('📡 Trying direct RSS fetch...');
    const response = await fetch(WEB3_RSS_FEED);

    if (response.ok) {
      const responseText = await response.text();

      // Check if it's valid RSS/XML
      if (responseText.trim().startsWith('<?xml')) {
        console.log('✅ RSS feed fetched, parsing XML...');
        const posts = parseRSSFeed(responseText);
        if (posts.length > 0) {
          console.log(`✅ RSS parse successful! Found ${posts.length} posts`);
          return posts;
        }
      } else if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.log('❌ Received HTML instead of RSS');
      }
    }

    // STRATEGY 4: Try CORS proxies as fallback
    console.log('⚠️ Direct RSS failed, trying CORS proxies...');

    for (const proxy of CORS_PROXIES) {
      try {
        const proxiedUrl = `${proxy}${encodeURIComponent(WEB3_API_URL)}`;
        console.log(`📡 Trying proxy with WordPress API: ${proxy.substring(0, 30)}...`);

        const response = await fetch(proxiedUrl);

        if (response.ok) {
          const responseText = await response.text();

          // Try parsing as JSON (WordPress API)
          try {
            const posts = JSON.parse(responseText);
            if (Array.isArray(posts) && posts.length > 0) {
              console.log(`✅ Proxy successful! Found ${posts.length} posts`);
              const formattedPosts = posts.map(post => formatWordPressPost(post));
              return formattedPosts;
            }
          } catch (jsonError) {
            console.log('❌ Proxy response not valid JSON, trying next...');
            continue;
          }
        }
      } catch (proxyError) {
        console.log(`❌ Proxy failed: ${proxyError.message}`);
        lastError = proxyError;
        continue;
      }
    }

    throw new Error(`All fetch strategies failed. Last error: ${lastError?.message || 'Unknown'}`);
  } catch (error) {
    console.error('❌ Error fetching blog posts:', error);
    console.log('💡 TIP: Deploy the Supabase Edge Function for reliable fetching:');
    console.log('   supabase functions deploy fetch-blog-posts');
    return [];
  }
}

/**
 * Format blog post from WordPress REST API response
 */
function formatWordPressPost(post) {
  // Extract title
  const title = post.title?.rendered || 'Untitled';

  // Extract content
  const content = post.content?.rendered || '';

  // Extract excerpt
  let excerpt = post.excerpt?.rendered || '';
  // Clean HTML tags from excerpt
  excerpt = excerpt.replace(/<[^>]*>/g, '').trim();
  if (!excerpt && content) {
    // Fallback: create excerpt from content
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    excerpt = textContent.substring(0, 200) + '...';
  }

  // Extract featured image from _embedded
  let featuredImage = null;
  if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) {
    const media = post._embedded['wp:featuredmedia'][0];
    featuredImage = media.source_url || media.media_details?.sizes?.large?.source_url || null;
  }

  // If no embedded image, try to extract from content
  if (!featuredImage && content) {
    const imageMatch = content.match(/<img[^>]+src="([^">]+)"/);
    featuredImage = imageMatch ? imageMatch[1] : null;
  }

  // Extract author from _embedded
  let author = 'PrivateCharterX Team';
  if (post._embedded && post._embedded.author && post._embedded.author[0]) {
    author = post._embedded.author[0].name || author;
  }

  // Extract tags from _embedded
  let tags = [];
  if (post._embedded && post._embedded['wp:term']) {
    const allTerms = post._embedded['wp:term'].flat();
    tags = allTerms
      .filter(term => term.taxonomy === 'post_tag')
      .map(term => term.name);
  }

  return {
    title,
    excerpt,
    content,
    featured_image: featuredImage,
    author,
    source: 'privatecharterx.blog',
    category: 'web3',
    source_url: post.link,
    tags,
    published_at: post.date || new Date().toISOString()
  };
}

/**
 * Parse RSS feed XML and extract posts
 */
function parseRSSFeed(xmlText) {
  try {
    // Create a simple XML parser using DOMParser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      console.error('XML parsing error:', parserError.textContent);
      return [];
    }

    // Extract items from RSS
    const items = xmlDoc.querySelectorAll('item');
    const posts = [];

    items.forEach(item => {
      const title = item.querySelector('title')?.textContent || 'Untitled';
      const link = item.querySelector('link')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString();
      const creator = item.querySelector('creator')?.textContent || 'PrivateCharterX Team';

      // Get content (try content:encoded first, then description)
      let content = item.querySelector('encoded')?.textContent ||
                    item.querySelector('description')?.textContent || '';

      // Extract excerpt from content
      const textContent = content.replace(/<[^>]*>/g, '').trim();
      const excerpt = textContent.substring(0, 200) + '...';

      // Extract featured image
      const imageMatch = content.match(/<img[^>]+src="([^">]+)"/);
      const featuredImage = imageMatch ? imageMatch[1] : null;

      // Extract categories/tags
      const categories = Array.from(item.querySelectorAll('category'))
        .map(cat => cat.textContent)
        .filter(cat => cat && !cat.toLowerCase().includes('http'));

      posts.push({
        title,
        excerpt,
        content,
        featured_image: featuredImage,
        author: creator,
        source: 'privatecharterx.blog',
        category: 'web3',
        source_url: link,
        tags: categories,
        published_at: pubDate
      });
    });

    return posts;
  } catch (error) {
    console.error('Error parsing RSS feed:', error);
    return [];
  }
}

/**
 * Legacy format blog post from Blogger RSS feed entry (kept for compatibility)
 */
function formatBlogPost(entry) {
  const title = entry.title?.$t || 'Untitled';
  const content = entry.content?.$t || '';
  const published = entry.published?.$t;
  const link = entry.link?.find(l => l.rel === 'alternate')?.href || '';

  // Extract excerpt from content (first 200 chars)
  const textContent = content.replace(/<[^>]*>/g, '');
  const excerpt = textContent.substring(0, 200) + '...';

  // Extract featured image
  const imageMatch = content.match(/<img[^>]+src="([^">]+)"/);
  const featuredImage = imageMatch ? imageMatch[1] : null;

  // Extract tags
  const tags = (entry.category || [])
    .map(cat => cat.term)
    .filter(term => term && !term.toLowerCase().includes('http'));

  return {
    title,
    excerpt,
    content,
    featured_image: featuredImage,
    author: entry.author?.[0]?.name?.$t || 'PrivateCharterX Team',
    source: 'privatecharterx.blog',
    category: 'web3',
    source_url: link,
    tags,
    published_at: published || new Date().toISOString()
  };
}

/**
 * Sync blog posts to Supabase database
 * Only adds new posts, doesn't update existing ones
 */
export async function syncBlogPostsToDatabase() {
  console.log('🔄 Starting blog sync to database...');

  try {
    const posts = await fetchBlogPostsFromSource();

    if (posts.length === 0) {
      console.log('⚠️ No blog posts fetched from source');
      return { success: true, count: 0, message: 'No posts fetched' };
    }

    console.log(`📥 Fetched ${posts.length} posts from source`);

    // Check which posts already exist
    const { data: existingPosts, error: selectError } = await supabase
      .from('blog_posts')
      .select('source_url')
      .eq('source', 'privatecharterx.blog');

    if (selectError) {
      console.error('❌ Error checking existing posts:', selectError);
      throw selectError;
    }

    const existingUrls = new Set(existingPosts?.map(p => p.source_url) || []);
    console.log(`📊 Found ${existingUrls.size} existing posts in database`);

    // Filter out existing posts
    const newPosts = posts.filter(post => !existingUrls.has(post.source_url));

    if (newPosts.length === 0) {
      console.log('✅ All posts already synced - no new posts');
      return { success: true, count: 0, message: 'All posts already synced' };
    }

    console.log(`📝 Inserting ${newPosts.length} new posts...`);

    // Insert new posts
    const { data, error } = await supabase
      .from('blog_posts')
      .insert(newPosts)
      .select();

    if (error) {
      console.error('❌ Error inserting posts:', error);
      throw error;
    }

    console.log(`✅ Successfully synced ${newPosts.length} new blog posts!`);
    return { success: true, count: newPosts.length, posts: data };
  } catch (error) {
    console.error('❌ Error syncing blog posts:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Manually add a blog post to database
 * (For when automatic fetching doesn't work)
 */
export async function addBlogPostManually(postData) {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .insert([{
        title: postData.title,
        excerpt: postData.excerpt,
        content: postData.content,
        featured_image: postData.featuredImage,
        author: postData.author || 'PrivateCharterX Team',
        source: 'privatecharterx.blog',
        category: 'web3',
        source_url: postData.sourceUrl,
        tags: postData.tags || [],
        published_at: postData.publishedAt || new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    return { success: true, post: data };
  } catch (error) {
    console.error('Error adding blog post:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Alternative: Fetch using WordPress REST API directly
 * This is now the primary method used in fetchBlogPostsFromSource()
 */
export async function fetchFromWordPressAPI() {
  try {
    console.log('📡 Fetching from WordPress REST API...');
    const response = await fetch(WEB3_API_URL);

    if (!response.ok) {
      throw new Error(`WordPress API failed: ${response.status}`);
    }

    const posts = await response.json();

    if (!Array.isArray(posts) || posts.length === 0) {
      throw new Error('No posts returned from WordPress API');
    }

    console.log(`✅ Fetched ${posts.length} posts from WordPress API`);
    return posts.map(post => formatWordPressPost(post));
  } catch (error) {
    console.error('❌ WordPress API error:', error.message);
    console.warn('Falling back to RSS feed...');
    return fetchBlogPostsFromSource();
  }
}

/**
 * Schedule automatic sync (call this on app init or periodically)
 */
export async function setupBlogSync(intervalMinutes = 60) {
  // Initial sync
  await syncBlogPostsToDatabase();

  // Set up periodic sync
  setInterval(async () => {
    console.log('Running scheduled blog sync...');
    await syncBlogPostsToDatabase();
  }, intervalMinutes * 60 * 1000);
}
