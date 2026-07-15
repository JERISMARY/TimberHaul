const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const TARGET_URL = 'https://mayaa-theme-magic.myshopify.com/';
const OUTPUT_DIR = path.join('c:', 'Users', 'jeris', 'antig', 'vac'); // user's workspace
const ASSETS_DIR = path.join(OUTPUT_DIR, 'assets');

// Create directories
[OUTPUT_DIR, ASSETS_DIR, path.join(ASSETS_DIR, 'css'), path.join(ASSETS_DIR, 'js'), path.join(ASSETS_DIR, 'img'), path.join(ASSETS_DIR, 'fonts')].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Helper to fetch data
function fetchUrl(url, encoding = 'utf8') {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchUrl(new URL(res.headers.location, url).href, encoding).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`Status Code: ${res.statusCode} for ${url}`));
            }
            
            if (encoding === 'buffer') {
                const data = [];
                res.on('data', chunk => data.push(chunk));
                res.on('end', () => resolve(Buffer.concat(data)));
            } else {
                let data = '';
                res.setEncoding(encoding);
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
            }
        }).on('error', reject);
    });
}

// Download file
async function downloadAsset(url, outputPath) {
    if (fs.existsSync(outputPath)) return; // Skip if exists
    try {
        console.log(`Downloading: ${url}`);
        const data = await fetchUrl(url, 'buffer');
        fs.writeFileSync(outputPath, data);
    } catch (e) {
        console.error(`Failed to download ${url}: ${e.message}`);
    }
}

// Ensure URL is absolute
function makeAbsolute(urlStr, base) {
    if (urlStr.startsWith('data:')) return urlStr;
    if (urlStr.startsWith('//')) return 'https:' + urlStr;
    try {
        return new URL(urlStr, base).href;
    } catch (e) {
        return urlStr;
    }
}

function getFilename(urlStr) {
    try {
        const urlObj = new URL(urlStr);
        let pathname = urlObj.pathname;
        let filename = path.basename(pathname);
        if (!filename) return 'index.html';
        return filename;
    } catch (e) {
        return path.basename(urlStr) || 'asset';
    }
}

async function cloneSite() {
    console.log(`Fetching main HTML from ${TARGET_URL}...`);
    let html = await fetchUrl(TARGET_URL);

    const assetPromises = [];
    const replacements = [];

    // Robust parsing for CSS
    const linkRegex = /<link[^>]*>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
        const tag = match[0];
        if (tag.includes('stylesheet')) {
            const hrefMatch = tag.match(/href=["']([^"']+)["']/);
            if (hrefMatch) {
                const originalUrl = hrefMatch[1];
                const absoluteUrl = makeAbsolute(originalUrl, TARGET_URL);
                const filename = getFilename(absoluteUrl).split('?')[0];
                const localRelPath = `assets/css/${filename}`;
                const localPath = path.join(OUTPUT_DIR, localRelPath);
                
                assetPromises.push(downloadAsset(absoluteUrl, localPath));
                replacements.push({ original: originalUrl, local: localRelPath });
            }
        }
    }

    // Robust parsing for Scripts
    const scriptRegex = /<script[^>]*>/gi;
    while ((match = scriptRegex.exec(html)) !== null) {
        const tag = match[0];
        const srcMatch = tag.match(/src=["']([^"']+)["']/);
        if (srcMatch) {
            const originalUrl = srcMatch[1];
            const absoluteUrl = makeAbsolute(originalUrl, TARGET_URL);
            const filename = getFilename(absoluteUrl).split('?')[0];
            const localRelPath = `assets/js/${filename}`;
            const localPath = path.join(OUTPUT_DIR, localRelPath);
            
            assetPromises.push(downloadAsset(absoluteUrl, localPath));
            replacements.push({ original: originalUrl, local: localRelPath });
        }
    }

    // Robust parsing for Images
    const imgRegex = /<img[^>]*>/gi;
    while ((match = imgRegex.exec(html)) !== null) {
        const tag = match[0];
        const srcMatch = tag.match(/src=["']([^"']+)["']/);
        if (srcMatch) {
            const originalUrl = srcMatch[1];
            if(originalUrl.startsWith('data:')) continue;
            const absoluteUrl = makeAbsolute(originalUrl, TARGET_URL);
            const filename = getFilename(absoluteUrl).split('?')[0];
            const localRelPath = `assets/img/${filename}`;
            const localPath = path.join(OUTPUT_DIR, localRelPath);
            
            assetPromises.push(downloadAsset(absoluteUrl, localPath));
            replacements.push({ original: originalUrl, local: localRelPath });
        }
    }

    // Replace background images in style tags or inline styles
    const bgImgRegex = /url\(['"]?([^'"\)]+)['"]?\)/gi;
    while ((match = bgImgRegex.exec(html)) !== null) {
        const originalUrl = match[1];
        if(originalUrl.startsWith('data:') || originalUrl.startsWith('#')) continue;
        const absoluteUrl = makeAbsolute(originalUrl, TARGET_URL);
        const filename = getFilename(absoluteUrl).split('?')[0];
        const localRelPath = `assets/img/${filename}`;
        const localPath = path.join(OUTPUT_DIR, localRelPath);
        
        assetPromises.push(downloadAsset(absoluteUrl, localPath));
        replacements.push({ original: originalUrl, local: localRelPath });
    }

    // Remove tracking or external non-essential redirects (links)
    // Replace all external/internal links with "#" so they don't navigate away.
    html = html.replace(/<a([^>]*)href=["']([^"']+)["']/gi, (aMatch, prefix, href) => {
        if (href.startsWith('#')) return aMatch; // Already local anchor
        return `<a${prefix}href="#"`;
    });

    console.log(`Downloading ${assetPromises.length} assets...`);
    await Promise.allSettled(assetPromises);

    // Apply replacements for assets
    // Sort replacements by length descending to prevent partial replacements
    replacements.sort((a, b) => b.original.length - a.original.length);
    for (const rep of replacements) {
        html = html.split(rep.original).join(rep.local);
    }

    // Write the modified HTML directly into index.html
    const indexHtmlPath = path.join(OUTPUT_DIR, 'index.html');
    fs.writeFileSync(indexHtmlPath, html);
    console.log('Site cloned successfully to:', indexHtmlPath);
}

cloneSite().catch(console.error);
