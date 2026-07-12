// --- GLOBAL FUNCTIONS ---

window.swapImage = function(src) {
    document.getElementById('main-detail-image').src = src;
};

// Homepage grid variant swapper (Updated for StyleCode and ColorCode)
window.changeCardVariant = function(styleCode, imgUrl, colorCode) {
    document.getElementById('card-img-' + styleCode).src = './static/' + imgUrl;
    document.getElementById('card-link-' + styleCode).href = 'product.html?id=' + colorCode;
    document.getElementById('quick-view-' + styleCode).href = 'product.html?id=' + colorCode;
};

window.shareProduct = function(title) {
    if (navigator.share) {
        navigator.share({
            title: 'Shikara Collection',
            text: 'Check out this ' + title + ' from Shikara!',
            url: window.location.href
        }).catch(console.error);
    } else {
        alert("Copy this link to share: " + window.location.href);
    }
};

// --- AUTO-INJECT LIGHTBOX HTML & CSS ---
function ensureLightboxExists() {
    if (!document.getElementById('lightbox-modal')) {
        const styleHtml = `
        <style>
            #lightbox-modal {
                display: none; position: fixed; z-index: 999999; left: 0; top: 0;
                width: 100%; height: 100%; background-color: rgba(42, 40, 37, 0.98); /* Updated to Charcoal */
                flex-direction: column; justify-content: center; align-items: center; padding: 40px 0; box-sizing: border-box;
            }
            .close-lightbox {
                position: absolute; top: 20px; right: 30px; color: white;
                font-size: 40px; cursor: pointer; z-index: 1000000; font-weight: 300;
            }
            .lightbox-content {
                width: 100%; max-width: 600px; height: 70vh;
                display: flex; justify-content: center; align-items: center; overflow: hidden;
            }
            .lightbox-content img {
                width: 100%; height: 100%; object-fit: contain;
            }
            .lightbox-nav {
                position: absolute; top: 50%; transform: translateY(-50%);
                color: white; font-size: 40px; cursor: pointer; padding: 20px; z-index: 1000000; user-select: none;
            }
            .nav-left { left: 10px; }
            .nav-right { right: 10px; }
            .lightbox-thumbnails { display: flex; gap: 15px; margin-top: 20px; }
            .lightbox-thumbnails img {
                width: 60px; height: 80px; object-fit: cover; cursor: pointer;
                opacity: 0.6; border: 2px solid transparent; transition: opacity 0.3s;
            }
            .lightbox-thumbnails img.active, .lightbox-thumbnails img:hover { opacity: 1; border-color: var(--copper); }
            @media (max-width: 768px) { .lightbox-nav { display: none; } }
        </style>`;

        const modalHtml = `
        <div id="lightbox-modal">
            <span class="close-lightbox" onclick="closeLightbox()">&times;</span>
            <div class="lightbox-nav nav-left" onclick="changeLightboxImage(-1)">&#10094;</div>
            <div class="lightbox-nav nav-right" onclick="changeLightboxImage(1)">&#10095;</div>
            <div class="lightbox-content" ontouchstart="handleTouchStart(event)" ontouchend="handleTouchEnd(event)">
                <img id="lightbox-main-img" src="" alt="Full Screen Product">
            </div>
            <div class="lightbox-thumbnails" id="lightbox-thumb-container"></div>
        </div>`;
        
        document.head.insertAdjacentHTML('beforeend', styleHtml);
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
}

// --- LIGHTBOX ENGINE ---
let galleryImages = [];
let currentIndex = 0;

window.openLightbox = function() {
    ensureLightboxExists(); 

    const modal = document.getElementById('lightbox-modal');
    const mainImg = document.getElementById('lightbox-main-img');
    const currentSrc = document.getElementById('main-detail-image').src;
    
    const thumbs = document.querySelectorAll('.thumbnail-gallery .thumbnail');
    
    if (thumbs.length > 0) {
        galleryImages = Array.from(thumbs).map(t => t.src);
    } else {
        galleryImages = [currentSrc];
    }
    
    currentIndex = galleryImages.indexOf(currentSrc) !== -1 ? galleryImages.indexOf(currentSrc) : 0;

    mainImg.src = galleryImages[currentIndex];

    const thumbContainer = document.getElementById('lightbox-thumb-container');
    thumbContainer.innerHTML = '';
    
    if (galleryImages.length > 1) {
        galleryImages.forEach((src, index) => {
            const img = document.createElement('img');
            img.src = src;
            img.className = index === currentIndex ? 'active' : '';
            img.onclick = () => { currentIndex = index; updateLightboxImage(); };
            thumbContainer.appendChild(img);
        });
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; 
};

window.closeLightbox = function() {
    document.getElementById('lightbox-modal').style.display = 'none';
    document.body.style.overflow = 'auto'; 
};

window.changeLightboxImage = function(direction) {
    currentIndex += direction;
    if (currentIndex >= galleryImages.length) currentIndex = 0;
    if (currentIndex < 0) currentIndex = galleryImages.length - 1;
    updateLightboxImage();
};

function updateLightboxImage() {
    const mainImg = document.getElementById('lightbox-main-img');
    mainImg.src = galleryImages[currentIndex];
    
    const thumbs = document.getElementById('lightbox-thumb-container').querySelectorAll('img');
    thumbs.forEach((t, i) => t.className = (i === currentIndex) ? 'active' : '');
}

// Mobile Swiping Variables
let touchStartX = 0;
window.handleTouchStart = (e) => touchStartX = e.changedTouches[0].screenX;
window.handleTouchEnd = (e) => {
    let touchEndX = e.changedTouches[0].screenX;
    if (touchEndX < touchStartX - 40) changeLightboxImage(1);
    if (touchEndX > touchStartX + 40) changeLightboxImage(-1);
};

// --- THE CORE PARSER ---
Papa.parse("./catalog.csv", {
    download: true,
    header: true,
    complete: function(results) {
        // Changed item.ID to item.ColorCode
        const allProducts = results.data.filter(item => item.ColorCode); 
        
        // --- JOB 1: THE GRID ---
        const gridContainer = document.getElementById('catalog-container');
        if (gridContainer) {
            const groupedProducts = {};
            allProducts.forEach(p => {
                // Changed GroupID to StyleCode
                if (!groupedProducts[p.StyleCode]) groupedProducts[p.StyleCode] = [];
                groupedProducts[p.StyleCode].push(p);
            });

            const limit = gridContainer.getAttribute('data-limit');
            const groupsArray = Object.values(groupedProducts);
            const displayGroups = limit ? groupsArray.slice(0, parseInt(limit)) : groupsArray;

            let html = '';
            displayGroups.forEach(group => {
                const defaultItem = group[0]; 
                
                let circlesHtml = '';
                if (group.length > 1) {
                    group.forEach(variant => {
                        circlesHtml += `<img src="./static/${variant.ColorThumb}" class="color-circle" onmouseover="changeCardVariant('${defaultItem.StyleCode}', '${variant.Image1}', '${variant.ColorCode}')" onclick="changeCardVariant('${defaultItem.StyleCode}', '${variant.Image1}', '${variant.ColorCode}')">`;
                    });
                }

                html += `
                <div class="product-card">
                    <div class="image-container">
                        <a href="product.html?id=${defaultItem.ColorCode}" id="card-link-${defaultItem.StyleCode}">
                            <img src="./static/${defaultItem.Image1}" alt="${defaultItem.Name}" class="product-image" id="card-img-${defaultItem.StyleCode}">
                        </a>
                        <div class="quick-view">
                            <a href="product.html?id=${defaultItem.ColorCode}" id="quick-view-${defaultItem.StyleCode}">View Details</a>
                        </div>
                    </div>
                    <div class="product-info">
                        <div class="color-options">${circlesHtml}</div>
                        <!-- Changed Item to Name -->
                        <h3>${defaultItem.Name.split('-')[0]}</h3>
                        <div class="price">₹${defaultItem.Price}</div>
                    </div>
                </div>
                `;
            });
            gridContainer.innerHTML = html;
        }

        // --- JOB 2: THE PRODUCT PAGE ---
        const detailContainer = document.getElementById('product-detail-container');
        if (detailContainer) {
            const urlParams = new URLSearchParams(window.location.search);
            const targetId = urlParams.get('id');
            // Changed ID to ColorCode
            const product = allProducts.find(item => item.ColorCode === targetId);

            if (product) {
                // Changed GroupID to StyleCode
                const siblings = allProducts.filter(item => item.StyleCode === product.StyleCode);
                
                let colorsHtml = '';
                if (siblings.length > 1) {
                    colorsHtml += `<span class="color-label">Available Colors</span><div class="color-options product-detail-colors">`;
                    siblings.forEach(sib => {
                        // Changed ID to ColorCode and Item to Name
                        const activeClass = sib.ColorCode === product.ColorCode ? 'active' : '';
                        colorsHtml += `<a href="product.html?id=${sib.ColorCode}">
                                        <img src="./static/${sib.ColorThumb}" class="color-circle ${activeClass}" title="${sib.Name}">
                                       </a>`;
                    });
                    colorsHtml += `</div>`;
                }

                let galleryHtml = '';
                if (product.Image1) galleryHtml += `<img src="./static/${product.Image1}" class="thumbnail" onclick="swapImage(this.src)">`;
                if (product.Image2) galleryHtml += `<img src="./static/${product.Image2}" class="thumbnail" onclick="swapImage(this.src)">`;
                if (product.Image3) galleryHtml += `<img src="./static/${product.Image3}" class="thumbnail" onclick="swapImage(this.src)">`;
                if (product.Image4) galleryHtml += `<img src="./static/${product.Image4}" class="thumbnail" onclick="swapImage(this.src)">`;

                detailContainer.innerHTML = `
                    <div class="product-detail-layout">
                        <div class="detail-image-box">
                            <div class="main-image-container" style="position: relative;">
                                <div class="floating-share" onclick="shareProduct('${product.Name}')" title="Share">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                </div>
                                <img src="./static/${product.Image1}" alt="${product.Name}" class="full-size-image" id="main-detail-image" onclick="openLightbox()" style="cursor: pointer;">
                            </div>
                            <div class="thumbnail-gallery">${galleryHtml}</div>
                        </div>
                        
                        <div class="detail-info-box">
                            <!-- Changed Item to Name -->
                            <h1>${product.Name}</h1>
                            <div class="detail-price">₹${product.Price}</div>
                            
                            ${colorsHtml}
                            
                            <p class="detail-description">${product.Description}</p>
                            <div class="detail-sizes">Available Sizes: <strong>${product.Size}</strong></div>
                            
                            <a href="https://wa.me/919038850577?text=Hi Shikara! I want to buy the ${product.Name} (ID: ${product.ColorCode})." class="buy-now-btn" target="_blank">
                                Buy via WhatsApp
                            </a>
                        </div>
                    </div>
                `;
            } else {
                detailContainer.innerHTML = `<h2>Product not found.</h2>`;
            }
        }

        const loader = document.getElementById('loader-container');
        if (loader) loader.style.display = 'none';
    }
});