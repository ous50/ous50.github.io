/// Click to fullscreen lightbox for gallery images
function initImageLightbox() {
    const images = document.querySelectorAll('.content-gallery-image, .article-content img') as NodeListOf<HTMLImageElement>;
    if (images.length === 0) return;

    images.forEach((img) => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', (e) => {
            e.preventDefault();
            openLightbox(img);
        });
    });

    // Close lightbox on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
    });
}

function openLightbox(img: HTMLImageElement) {
    // Remove existing lightbox if any
    closeLightbox();

    const overlay = document.createElement('div');
    overlay.className = 'image-lightbox-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const wrapper = document.createElement('div');
    wrapper.className = 'image-lightbox-wrapper';

    const fullImg = document.createElement('img');
    fullImg.src = img.src;
    fullImg.alt = img.alt || '';
    fullImg.className = 'image-lightbox-img';

    // Use original dimensions if available, otherwise let browser decide
    if (img.naturalWidth) {
        fullImg.setAttribute('width', String(img.naturalWidth));
        fullImg.setAttribute('height', String(img.naturalHeight));
    }

    wrapper.appendChild(fullImg);
    overlay.appendChild(wrapper);
    document.body.appendChild(overlay);

    // Prevent background scrolling
    document.body.style.overflow = 'hidden';

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target === wrapper || e.target === fullImg) {
            closeLightbox();
        }
    });

    // Animate in
    requestAnimationFrame(() => {
        overlay.classList.add('active');
    });
}

function closeLightbox() {
    const overlay = document.querySelector('.image-lightbox-overlay');
    if (!overlay) return;

    overlay.classList.remove('active');
    setTimeout(() => {
        overlay.remove();
        document.body.style.overflow = '';
    }, 200);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initImageLightbox);
} else {
    initImageLightbox();
}
