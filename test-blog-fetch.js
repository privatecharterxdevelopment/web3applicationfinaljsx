/**
 * Simple test script to verify blog fetching from WordPress API
 * Run with: node test-blog-fetch.js
 */

const BLOG_URL = 'https://www.privatecharterx.blog';
const WP_API_BASE = `${BLOG_URL}/wp-json/wp/v2`;
const WEB3_CATEGORY_ID = 131;
const WEB3_API_URL = `${WP_API_BASE}/posts?categories=${WEB3_CATEGORY_ID}&per_page=5&_embed`;

async function testWordPressAPI() {
  console.log('🧪 Testing WordPress API fetch...\n');
  console.log(`📡 URL: ${WEB3_API_URL}\n`);

  try {
    const response = await fetch(WEB3_API_URL);

    console.log(`✅ Response status: ${response.status} ${response.statusText}`);
    console.log(`📋 Content-Type: ${response.headers.get('content-type')}\n`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const posts = await response.json();

    if (!Array.isArray(posts)) {
      throw new Error('Response is not an array');
    }

    console.log(`✅ Successfully fetched ${posts.length} posts!\n`);
    console.log('📝 Sample post data:\n');

    if (posts.length > 0) {
      const post = posts[0];
      console.log('Title:', post.title?.rendered);
      console.log('Date:', post.date);
      console.log('Link:', post.link);
      console.log('Author:', post._embedded?.author?.[0]?.name);

      // Check for featured image
      if (post._embedded?.['wp:featuredmedia']?.[0]) {
        const media = post._embedded['wp:featuredmedia'][0];
        console.log('Featured Image:', media.source_url);
      }

      // Check excerpt
      const excerpt = post.excerpt?.rendered?.replace(/<[^>]*>/g, '').trim();
      console.log('Excerpt:', excerpt.substring(0, 100) + '...');

      console.log('\n✅ Blog API is working correctly!');
    }

    return true;
  } catch (error) {
    console.error('❌ Error testing WordPress API:', error.message);
    return false;
  }
}

// Test RSS feed as fallback
async function testRSSFeed() {
  console.log('\n🧪 Testing RSS feed fetch...\n');

  const RSS_URL = `${BLOG_URL}/category/web3/feed/`;
  console.log(`📡 URL: ${RSS_URL}\n`);

  try {
    const response = await fetch(RSS_URL);

    console.log(`✅ Response status: ${response.status} ${response.statusText}`);
    console.log(`📋 Content-Type: ${response.headers.get('content-type')}\n`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();

    if (text.trim().startsWith('<?xml')) {
      console.log('✅ Valid RSS/XML feed received');

      // Count items
      const itemCount = (text.match(/<item>/g) || []).length;
      console.log(`📝 Found ${itemCount} items in RSS feed`);

      console.log('\n✅ RSS feed is working correctly!');
      return true;
    } else {
      throw new Error('Not a valid RSS feed');
    }
  } catch (error) {
    console.error('❌ Error testing RSS feed:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('='.repeat(60));
  console.log('🚀 Blog Fetch Test Suite');
  console.log('='.repeat(60) + '\n');

  const apiResult = await testWordPressAPI();
  const rssResult = await testRSSFeed();

  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results:');
  console.log('='.repeat(60));
  console.log(`WordPress API: ${apiResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`RSS Feed: ${rssResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(60) + '\n');

  if (apiResult || rssResult) {
    console.log('✅ At least one fetch method is working!');
    console.log('💡 The blogService.js should work correctly now.');
  } else {
    console.log('❌ All fetch methods failed.');
    console.log('💡 Check CORS settings or network connection.');
  }
}

runTests();
