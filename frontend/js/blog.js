/* ============================================================
   TimberHaul — Blog JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('blog-grid-page')) {
    loadBlogListing();
  }
  if (document.getElementById('bd-content')) {
    loadBlogDetail();
  }
  setTimeout(() => document.body.classList.add('loaded'), 100);
});

async function loadBlogListing() {
  const container = document.getElementById('blog-grid-page');
  try {
    const res = await window.api.getBlogs();
    window._allBlogs = res.blogs || MOCK_BLOGS;
    renderBlogGrid(window._allBlogs);
  } catch (err) {
    window._allBlogs = MOCK_BLOGS;
    renderBlogGrid(MOCK_BLOGS);
  }
}

function renderBlogGrid(blogs) {
  const container = document.getElementById('blog-grid-page');
  if (!container) return;

  container.innerHTML = blogs.map(blog => `
    <div class="blog-card" style="margin:0">
      <div class="blog-card-img-wrap">
        <img src="${blog.coverImage || window.PLACEHOLDER_IMG}" alt="${blog.title}" loading="lazy" onerror="${window.ONERROR_IMG}">
        <div class="blog-card-cat"><span class="badge badge-gold">${blog.category}</span></div>
      </div>
      <div class="blog-card-body">
        <div class="blog-card-meta">
          <span>📅 ${formatDate(blog.publishedAt || blog.createdAt)}</span>
          <span>⏱️ ${blog.readTime || 5} min read</span>
        </div>
        <h3 class="blog-card-title" onclick="location.href='blog-detail.html?slug=${blog.slug}'" style="cursor:pointer">${blog.title}</h3>
        <p class="blog-card-excerpt">${blog.excerpt}</p>
        <div class="blog-card-footer">
          <a href="blog-detail.html?slug=${blog.slug}" class="btn btn-ghost btn-sm">Read More <i class="fa-solid fa-arrow-right"></i></a>
        </div>
      </div>
    </div>
  `).join('');
}

window.filterBlog = function(category, btn) {
  document.querySelectorAll('.blog-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const all = window._allBlogs || MOCK_BLOGS;
  if (category === 'all') {
    renderBlogGrid(all);
  } else {
    renderBlogGrid(all.filter(b => b.category === category));
  }
};

async function loadBlogDetail() {
  const slug = new URLSearchParams(location.search).get('slug');
  if (!slug) { location.href = 'blog.html'; return; }

  let blog = null;
  try {
    const res = await window.api.getBlog(slug);
    blog = res.blog;
  } catch {
    blog = MOCK_BLOGS.find(b => b.slug === slug) || MOCK_BLOGS[0];
  }

  document.getElementById('bd-title-tag').textContent = `${blog.title} — TimberHaul Blog`;
  document.getElementById('bd-crumb').textContent = blog.title;
  document.getElementById('bd-category').textContent = blog.category;
  document.getElementById('bd-title').textContent = blog.title;
  document.getElementById('bd-date').textContent = formatDate(blog.publishedAt || blog.createdAt);
  document.getElementById('bd-read').textContent = `${blog.readTime || 5} min`;
  
  const cover = document.getElementById('bd-cover');
  cover.src = blog.coverImage || window.PLACEHOLDER_IMG;
  cover.alt = blog.title;

  document.getElementById('bd-content').innerHTML = blog.content || `
    <p>Loading full content for this article...</p>
    <p>This is placeholder content until the markdown/HTML is parsed from the backend.</p>
  `;
}
