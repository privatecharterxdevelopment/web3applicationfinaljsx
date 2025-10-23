// Supabase Edge Function to fetch blog posts from privatecharterx.blog
// This bypasses CORS issues by making the request server-side

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const BLOG_URL = 'https://www.privatecharterx.blog';
const WEB3_RSS_FEED = `${BLOG_URL}/feeds/posts/default/-/web3?alt=json&max-results=50`;

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    console.log('🔍 Fetching Web3 posts from privatecharterx.blog...');

    // Fetch RSS feed from Blogger
    const response = await fetch(WEB3_RSS_FEED, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PrivateCharterX/1.0)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();

    // Validate JSON
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      throw new Error('Received HTML instead of JSON');
    }

    const data = JSON.parse(responseText);
    const entries = data.feed?.entry || [];

    console.log(`📝 Found ${entries.length} posts`);

    // Format posts
    const posts = entries.map((entry: any) => {
      const title = entry.title?.$t || 'Untitled';
      const content = entry.content?.$t || '';
      const published = entry.published?.$t;
      const link = entry.link?.find((l: any) => l.rel === 'alternate')?.href || '';

      // Extract excerpt
      const textContent = content.replace(/<[^>]*>/g, '');
      const excerpt = textContent.substring(0, 200) + '...';

      // Extract featured image
      const imageMatch = content.match(/<img[^>]+src="([^">]+)"/);
      const featuredImage = imageMatch ? imageMatch[1] : null;

      // Extract tags
      const tags = (entry.category || [])
        .map((cat: any) => cat.term)
        .filter((term: string) => term && !term.toLowerCase().includes('http'));

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
        published_at: published || new Date().toISOString(),
      };
    });

    return new Response(JSON.stringify({ success: true, posts, count: posts.length }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
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
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
