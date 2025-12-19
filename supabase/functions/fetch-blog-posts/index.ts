// Supabase Edge Function to fetch blog posts from privatecharterx.blog
// This bypasses CORS issues by making the request server-side
// Uses WordPress REST API

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const BLOG_URL = 'https://www.privatecharterx.blog';
const WP_API_BASE = `${BLOG_URL}/wp-json/wp/v2`;

// Category IDs from WordPress
const CATEGORIES = {
  web3: 131,
  aviation: 1, // Default/uncategorized or aviation category
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get category from query params (default to web3)
    const url = new URL(req.url);
    const category = url.searchParams.get('category') || 'web3';
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const categoryId = CATEGORIES[category as keyof typeof CATEGORIES] || CATEGORIES.web3;

    console.log(`🔍 Fetching ${category} posts from privatecharterx.blog (category ${categoryId})...`);

    // Fetch from WordPress REST API with embedded media
    const wpUrl = `${WP_API_BASE}/posts?categories=${categoryId}&per_page=${limit}&_embed&orderby=date&order=desc`;

    const response = await fetch(wpUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PrivateCharterX/1.0)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status}`);
    }

    const wpPosts = await response.json();

    if (!Array.isArray(wpPosts)) {
      throw new Error('Invalid response from WordPress API');
    }

    console.log(`📝 Found ${wpPosts.length} posts`);

    // Format posts
    const posts = wpPosts.map((post: any) => {
      // Extract title
      const title = post.title?.rendered || 'Untitled';

      // Extract content
      const content = post.content?.rendered || '';

      // Extract excerpt
      let excerpt = post.excerpt?.rendered || '';
      excerpt = excerpt.replace(/<[^>]*>/g, '').trim();
      if (!excerpt && content) {
        const textContent = content.replace(/<[^>]*>/g, '').trim();
        excerpt = textContent.substring(0, 200) + '...';
      }

      // Extract featured image from _embedded
      let featuredImage = null;
      if (post._embedded?.['wp:featuredmedia']?.[0]) {
        const media = post._embedded['wp:featuredmedia'][0];
        featuredImage = media.source_url || media.media_details?.sizes?.large?.source_url || null;
      }

      // Fallback: extract image from content
      if (!featuredImage && content) {
        const imageMatch = content.match(/<img[^>]+src="([^">]+)"/);
        featuredImage = imageMatch ? imageMatch[1] : null;
      }

      // Extract author
      let author = 'PrivateCharterX Team';
      if (post._embedded?.author?.[0]) {
        author = post._embedded.author[0].name || author;
      }

      // Extract tags
      let tags: string[] = [];
      if (post._embedded?.['wp:term']) {
        const allTerms = post._embedded['wp:term'].flat();
        tags = allTerms
          .filter((term: any) => term.taxonomy === 'post_tag')
          .map((term: any) => term.name);
      }

      return {
        id: post.id,
        title,
        excerpt,
        content,
        featured_image: featuredImage,
        author,
        source: 'privatecharterx.blog',
        category,
        source_url: post.link,
        slug: post.slug,
        tags,
        published_at: post.date || new Date().toISOString(),
      };
    });

    return new Response(
      JSON.stringify({ success: true, posts, count: posts.length, category }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error fetching blog posts:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        posts: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
