/**
 * Vite Plugin to handle /api/claude requests in dev mode
 * Fixes CORS issues by proxying Claude API calls
 */

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

export default function claudeApiPlugin() {
  console.log('🚀 Claude API Plugin Loading...');

  return {
    name: 'claude-api-proxy',
    configureServer(server) {
      console.log('✅ Claude API Plugin: configureServer called');

      server.middlewares.use(async (req, res, next) => {
        // Only handle POST requests to /api/claude
        if (req.url === '/api/claude' && req.method === 'POST') {
          console.log('🔥 Claude API proxy request received');

          // Read request body
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });

          req.on('end', async () => {
            try {
              const requestBody = JSON.parse(body);
              console.log('📤 Proxying to Claude:', {
                model: requestBody.model,
                messageCount: requestBody.messages?.length
              });

              // Forward to Claude API
              const response = await fetch(CLAUDE_API_URL, {
                method: 'POST',
                headers: {
                  'x-api-key': CLAUDE_API_KEY,
                  'anthropic-version': '2023-06-01',
                  'content-type': 'application/json'
                },
                body: JSON.stringify(requestBody)
              });

              const data = await response.json();

              if (!response.ok) {
                console.error('❌ Claude API error:', data);
                res.writeHead(response.status, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data));
                return;
              }

              console.log('✅ Claude response OK:', {
                inputTokens: data.usage?.input_tokens,
                outputTokens: data.usage?.output_tokens,
                cached: data.usage?.cache_read_input_tokens || 0
              });

              // Return successful response
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(data));

            } catch (error) {
              console.error('❌ Proxy error:', error);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: 'Proxy error',
                message: error.message
              }));
            }
          });
        } else {
          next();
        }
      });
    }
  };
}
