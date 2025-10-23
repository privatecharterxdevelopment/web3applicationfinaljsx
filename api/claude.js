/**
 * Claude API Proxy - Solves CORS issues
 *
 * Direct browser calls to Claude API fail due to CORS.
 * This serverless function acts as a proxy.
 */

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;
  const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

  try {
    console.log('🔥 Proxying Claude request:', {
      messageCount: req.body?.messages?.length,
      model: req.body?.model
    });

    // Forward request to Claude API
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Claude API Error:', data);
      return res.status(response.status).json(data);
    }

    console.log('✅ Claude response OK:', {
      inputTokens: data.usage?.input_tokens,
      outputTokens: data.usage?.output_tokens
    });

    // Return Claude response
    return res.status(200).json(data);

  } catch (error) {
    console.error('❌ Proxy error:', error);
    return res.status(500).json({
      error: 'Proxy error',
      message: error.message
    });
  }
}
