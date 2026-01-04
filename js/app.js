/**
 * AI Image Gallery - Main Application
 * Complete functionality: Gallery, Upload, Download, GitHub API
 */

const CONFIG = {
    API_BASE: '/.netlify/functions',
    IMAGES_PER_PAGE: 12,
    CACHE_TTL: 3600000,
    MAX_FILE_SIZE: 52428800,
    ALLOWED_FORMATS: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
};

const state = {
    images: [],
    currentPage: 1,
    currentSearch: '',
    currentCategory: '',
    currentSort: 'newest',
    selectedImage: null,
    isLoading: false
};

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    if (document.getElementById('uploadForm')) setupUploadForm();
});

// ============================================
// INITIALIZATION
// ============================================

function initializeApp() {
    if (document.getElementById('galleryGrid')) {
        loadImages();
    }
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // Upload area
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length) {
                document.getElementById('imageFile').files = files;
                handleImageSelect();
            }
        });
        uploadArea.addEventListener('click', () => {
            document.getElementById('imageFile').click();
        });
    }

    const imageFile = document.getElementById('imageFile');
    if (imageFile) {
        imageFile.addEventListener('change', handleImageSelect);
    }

    // Character counters
    const titleInput = document.getElementById('imageTitle');
    const descInput = document.getElementById('imageDesc');
    if (titleInput) titleInput.addEventListener('input', updateCharCount);
    if (descInput) descInput.addEventListener('input', updateCharCount);
}

// ============================================
// IMAGE LOADING & GALLERY
// ============================================

async function loadImages() {
    state.isLoading = true;
    const gallery = document.getElementById('galleryGrid');
    
    try {
        const response = await fetch(`${CONFIG.API_BASE}/github-list`);
        const data = await response.json();
        state.images = data.images || [];
        
        renderGallery();
    } catch (error) {
        console.error('Error loading images:', error);
        gallery.innerHTML = '<div class="error-state">Failed to load images. Please refresh.</div>';
    } finally {
        state.isLoading = false;
    }
}

function renderGallery() {
    const gallery = document.getElementById('galleryGrid');
    if (!gallery) return;

    let filtered = state.images;

    // Apply search filter
    if (state.currentSearch) {
        const query = state.currentSearch.toLowerCase();
        filtered = filtered.filter(img => 
            img.title.toLowerCase().includes(query) ||
            img.description.toLowerCase().includes(query) ||
            img.tags.some(tag => tag.toLowerCase().includes(query))
        );
    }

    // Apply category filter
    if (state.currentCategory) {
        filtered = filtered.filter(img => img.category === state.currentCategory);
    }

    // Apply sorting
    if (state.currentSort === 'newest') {
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (state.currentSort === 'popular') {
        filtered.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    } else if (state.currentSort === 'random') {
        filtered = filtered.sort(() => Math.random() - 0.5);
    }

    // Update count
    document.getElementById('total-count').textContent = filtered.length;

    // Paginate
    const start = (state.currentPage - 1) * CONFIG.IMAGES_PER_PAGE;
    const paginated = filtered.slice(0, start + CONFIG.IMAGES_PER_PAGE);

    // Render
    if (paginated.length === 0 && state.currentPage === 1) {
        gallery.innerHTML = '';
        document.getElementById('emptyState').style.display = 'block';
        return;
    }

    document.getElementById('emptyState').style.display = 'none';
    gallery.innerHTML = paginated.map((img, index) => `
        <div class="gallery-item" onclick="viewImage('${img.id}', ${index})" role="button" tabindex="0" 
             onkeypress="if(event.key==='Enter') viewImage('${img.id}', ${index})">
            <img src="${img.url}" alt="${img.title}" loading="lazy">
            <div class="gallery-item-overlay">
                <h3 class="gallery-item-title">${img.title}</h3>
                <span class="gallery-item-category">${getCategoryLabel(img.category)}</span>
            </div>
        </div>
    `).join('');

    // Show/hide load more button
    const allFiltered = state.images.filter(img => {
        const query = state.currentSearch.toLowerCase();
        const matchesSearch = !query || 
            img.title.toLowerCase().includes(query) ||
            img.description.toLowerCase().includes(query);
        const matchesCategory = !state.currentCategory || img.category === state.currentCategory;
        return matchesSearch && matchesCategory;
    });

    document.getElementById('loadMoreBtn').style.display = 
        paginated.length < allFiltered.length ? 'block' : 'none';
}

function getCategoryLabel(category) {
    const labels = {
        'anime': '🎌 Anime',
        'digital-art': '🎨 Art',
        'landscape': '🏔️ Landscape',
        'cyberpunk': '🌃 Cyberpunk',
        'fantasy': '✨ Fantasy',
        'abstract': '🌀 Abstract',
        'character': '👤 Character'
    };
    return labels[category] || category;
}

// ============================================
// SEARCH & FILTER
// ============================================

function performSearch() {
    state.currentSearch = document.getElementById('searchInput')?.value || '';
    state.currentPage = 1;
    renderGallery();
}

function searchTag(tag) {
    document.getElementById('searchInput').value = tag;
    performSearch();
}

function handleSort() {
    state.currentSort = document.getElementById('sortSelect').value;
    state.currentPage = 1;
    renderGallery();
}

function handleCategory() {
    state.currentCategory = document.getElementById('categorySelect').value;
    state.currentPage = 1;
    renderGallery();
}

function resetFilters() {
    state.currentSearch = '';
    state.currentCategory = '';
    state.currentSort = 'newest';
    state.currentPage = 1;
    
    if (document.getElementById('searchInput')) {
        document.getElementById('searchInput').value = '';
    }
    if (document.getElementById('sortSelect')) {
        document.getElementById('sortSelect').value = 'newest';
    }
    if (document.getElementById('categorySelect')) {
        document.getElementById('categorySelect').value = '';
    }
    
    renderGallery();
}

function loadMore() {
    state.currentPage++;
    renderGallery();
}

// ============================================
// MODAL & VIEWER
// ============================================

function viewImage(id, index) {
    const img = state.images.find(i => i.id === id);
    if (!img) return;

    state.selectedImage = img;
    
    document.getElementById('modalImage').src = img.url;
    document.getElementById('modalImage').alt = img.title;
    document.getElementById('modalTitle').textContent = img.title;
    document.getElementById('modalDesc').textContent = img.description;
    document.getElementById('modalSize').textContent = img.dimensions || 'Unknown';
    document.getElementById('modalFormat').textContent = img.format || 'Unknown';
    document.getElementById('modalDate').textContent = new Date(img.date).toLocaleDateString();
    
    document.getElementById('imageModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('imageModal').classList.remove('active');
    document.body.style.overflow = '';
}

async function downloadImage() {
    if (!state.selectedImage) return;
    
    try {
        const response = await fetch(`${CONFIG.API_BASE}/github-download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageId: state.selectedImage.id })
        });
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = state.selectedImage.filename || 'image.jpg';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    } catch (error) {
        console.error('Download error:', error);
        alert('Download failed. Please try again.');
    }
}

function copyToClipboard() {
    if (!state.selectedImage) return;
    
    const url = state.selectedImage.url;
    navigator.clipboard.writeText(url).then(() => {
        alert('Image link copied to clipboard!');
    }).catch(err => {
        console.error('Copy failed:', err);
    });
}

// ============================================
// UPLOAD FORM
// ============================================

function setupUploadForm() {
    const form = document.getElementById('uploadForm');
    if (!form) return;

    form.addEventListener('submit', handleUploadSubmit);
}

function handleImageSelect() {
    const input = document.getElementById('imageFile');
    const file = input.files[0];
    
    if (!file) return;

    if (file.size > CONFIG.MAX_FILE_SIZE) {
        alert('File is too large (max 50MB)');
        input.value = '';
        return;
    }

    if (!CONFIG.ALLOWED_FORMATS.includes(file.type)) {
        alert('Invalid file format. Use JPG, PNG, WebP, or GIF.');
        input.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('imagePreview').style.display = 'block';
        document.getElementById('previewImage').src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function removePreview() {
    document.getElementById('imageFile').value = '';
    document.getElementById('imagePreview').style.display = 'none';
}

function updateCharCount() {
    const titleInput = document.getElementById('imageTitle');
    const descInput = document.getElementById('imageDesc');
    
    if (titleInput) {
        document.getElementById('titleCount').textContent = titleInput.value.length;
    }
    if (descInput) {
        document.getElementById('descCount').textContent = descInput.value.length;
    }
}

function addTag(tag) {
    const tagsInput = document.getElementById('imageTags');
    const current = tagsInput.value.trim();
    if (current && !current.includes(tag)) {
        tagsInput.value = current + ', ' + tag;
    } else if (!current) {
        tagsInput.value = tag;
    }
}

// Step Navigation
function goToStep(step) {
    document.querySelectorAll('.form-step').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelectorAll('.step').forEach(el => {
        el.classList.remove('active');
    });
    
    document.querySelector(`[data-step="${step}"]`).classList.add('active');
    document.querySelector(`.step[data-step="${step}"]`).classList.add('active');
}

async function handleUploadSubmit(e) {
    e.preventDefault();
    
    const imageFile = document.getElementById('imageFile').files[0];
    if (!imageFile) {
        alert('Please select an image');
        return;
    }

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('title', document.getElementById('imageTitle').value);
    formData.append('description', document.getElementById('imageDesc').value);
    formData.append('tags', document.getElementById('imageTags').value);
    formData.append('category', document.getElementById('imageCategory').value);
    formData.append('aiTool', document.getElementById('aiTool').value);
    formData.append('license', document.querySelector('input[name="license"]:checked').value);

    document.getElementById('uploadProgress').style.display = 'block';
    
    try {
        const response = await fetch(`${CONFIG.API_BASE}/github-upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Upload failed');

        document.getElementById('uploadForm').style.display = 'none';
        document.getElementById('uploadSuccess').style.display = 'flex';
        
        setTimeout(() => {
            window.location.href = '/';
        }, 3000);
    } catch (error) {
        console.error('Upload error:', error);
        alert('Upload failed. Please try again.');
        document.getElementById('uploadProgress').style.display = 'none';
    }
}

// Utility
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}