const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, '../frontend');

const ogMetaTags = `
  <!-- SEO & Open Graph (Added by script) -->
  <meta property="og:type" content="website">
  <meta property="og:image" content="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80">
  <meta property="og:url" content="https://timberhaul.com">
  <meta name="twitter:card" content="summary_large_image">
`;

fs.readdirSync(frontendDir).forEach(file => {
  if (file.endsWith('.html')) {
    const filePath = path.join(frontendDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Add meta tags if not present
    if (!content.includes('og:type')) {
      content = content.replace('</head>', `${ogMetaTags}\n</head>`);
      fs.writeFileSync(filePath, content);
      console.log(`Added SEO meta tags to ${file}`);
    }
  }
});

console.log('✅ All HTML files updated with Open Graph tags.');
