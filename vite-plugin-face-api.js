// Vite plugin to load face-api.js from CDN
export default function faceApiCdnPlugin() {
  return {
    name: 'face-api-cdn',
    transformIndexHtml(html) {
      return html.replace(
        '</head>',
        `  <script src="https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js"></script>
</head>`
      );
    }
  };
}
