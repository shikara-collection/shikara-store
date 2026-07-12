// --- GLOBAL FUNCTIONS ---

window.swapImage = function(src) {
    document.getElementById('main-detail-image').src = src;
};

// Homepage grid variant swapper
window.changeCardVariant = function(groupId, imgUrl, productId) {
    document.getElementById('card-img-' + groupId).src = './static/' + imgUrl;
    document.getElementById('card-link-' + groupId).href = 'product.html?id=' + productId;
    document.getElementById('quick-view-' + groupId).href = 'product.html?id=' + productId;
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
                width: 100%; height: 100%; background-color: rgba(13, 17, 29, 0.98);
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
            .lightbox-thumbnails img.active, .lightbox-thumbnails img:hover { opacity: 1; border-color: #c5a059; }
            @media (max-width: 768px) { .lightbox-nav { display: none; } }
        </style>`;

        // Removed ondblclick zoom trigger entirely
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
        const allProducts = results.data.filter(item => item.ID); 
        
        // --- JOB 1: THE GRID ---
        const gridContainer = document.getElementById('catalog-container');
        if (gridContainer) {
            const groupedProducts = {};
            allProducts.forEach(p => {
                if (!groupedProducts[p.GroupID]) groupedProducts[p.GroupID] = [];
                groupedProducts[p.GroupID].push(p);
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
                        circlesHtml += `<img src="./static/${variant.ColorThumb}" class="color-circle" onmouseover="changeCardVariant('${defaultItem.GroupID}', '${variant.Image1}', '${variant.ID}')" onclick="changeCardVariant('${defaultItem.GroupID}', '${variant.Image1}', '${variant.ID}')">`;
                    });
                }

                html += `
                <div class="product-card">
                    <div class="image-container">
                        <a href="product.html?id=${defaultItem.ID}" id="card-link-${defaultItem.GroupID}">
                            <img src="./static/${defaultItem.Image1}" alt="${defaultItem.Item}" class="product-image" id="card-img-${defaultItem.GroupID}">
                        </a>
                        <div class="quick-view">
                            <a href="product.html?id=${defaultItem.ID}" id="quick-view-${defaultItem.GroupID}">View Details</a>
                        </div>
                    </div>
                    <div class="product-info">
                        <div class="color-options">${circlesHtml}</div>
                        <h3>${defaultItem.Item.split('-')[0]}</h3>
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
            const product = allProducts.find(item => item.ID === targetId);

            if (product) {
                const siblings = allProducts.filter(item => item.GroupID === product.GroupID);
                
                let colorsHtml = '';
                if (siblings.length > 1) {
                    colorsHtml += `<span class="color-label">Available Colors</span><div class="color-options product-detail-colors">`;
                    siblings.forEach(sib => {
                        const activeClass = sib.ID === product.ID ? 'active' : '';
                        colorsHtml += `<a href="product.html?id=${sib.ID}">
                                        <img src="./static/${sib.ColorThumb}" class="color-circle ${activeClass}" title="${sib.Item}">
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
                                <div class="floating-share" onclick="shareProduct('${product.Item}')" title="Share">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                </div>
                                <img src="./static/${product.Image1}" alt="${product.Item}" class="full-size-image" id="main-detail-image" onclick="openLightbox()" style="cursor: pointer;">
                            </div>
                            <div class="thumbnail-gallery">${galleryHtml}</div>
                        </div>
                        
                        <div class="detail-info-box">
                            <h1>${product.Item}</h1>
                            <div class="detail-price">₹${product.Price}</div>
                            
                            ${colorsHtml}
                            
                            <p class="detail-description">${product.Description}</p>
                            <div class="detail-sizes">Available Sizes: <strong>${product.Size}</strong></div>
                            
                            <a href="https://wa.me/918697430937?text=Hi Shikara! I want to buy the ${product.Item} (ID: ${product.ID})." class="buy-now-btn" target="_blank">
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