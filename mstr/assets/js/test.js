document.addEventListener('DOMContentLoaded', () => {
    console.log('Script loaded, initializing map buttons');
    
    // Map button click handling
    const mapButtons = document.querySelectorAll('.map-button-header');
    mapButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const hotspot = button.parentElement;
            console.log('Button clicked:', hotspot);
            const link = hotspot.querySelector('.map-button-title a');
            if (link && link.href) {
                window.location.href = link.href; // Navigate to the link on click
            } else {
                console.warn('No valid link found for button:', hotspot);
            }
        });
    });

    // ====== MAP BUTTON POSITIONING FUNCTIONALITY ======
    class MapButtonPositioner {
        constructor() {
            this.mapElement = null;
            this.mapButtons = [];
            this.originalButtonData = new Map();
            this.resizeObserver = null;
            this.isInitialized = false;
            this.init();
        }

        init() {
            this.mapElement = document.getElementById('map');
            if (!this.mapElement) {
                console.warn('Map element not found for positioning');
                return;
            }

            this.mapButtons = Array.from(document.querySelectorAll('.map-button'));
            if (this.mapButtons.length === 0) {
                console.warn('No map buttons found for positioning');
                return;
            }

            console.log(`Found ${this.mapButtons.length} map buttons for positioning`);
            
            setTimeout(() => {
                this.storeOriginalButtonData();
                this.setupResizeObserver();
                this.positionButtons();
                this.isInitialized = true;
                console.log('Map button positioner initialized');
            }, 500); // Increased delay to ensure map image loads
        }

        storeOriginalButtonData() {
            this.mapButtons.forEach((button, index) => {
                const computedStyle = window.getComputedStyle(button);
                const inlineStyle = button.style;
                
                let leftPercent = null, topPercent = null;
                
                if (inlineStyle.left && inlineStyle.left.includes('%')) {
                    leftPercent = parseFloat(inlineStyle.left);
                } else if (computedStyle.left && computedStyle.left.includes('%')) {
                    leftPercent = parseFloat(computedStyle.left);
                }
                
                if (inlineStyle.top && inlineStyle.top.includes('%')) {
                    topPercent = parseFloat(inlineStyle.top);
                } else if (computedStyle.top && computedStyle.top.includes('%')) {
                    topPercent = parseFloat(computedStyle.top);
                }
                
                const buttonData = {
                    leftPercent: leftPercent || 0,
                    topPercent: topPercent || 0
                };

                console.log(`Button ${index} data:`, buttonData);
                this.originalButtonData.set(button, buttonData);
            });
        }

        async calculateMapPosition() {
            if (!this.mapElement) {
                return { offsetX: 0, offsetY: 0, renderedWidth: 0, renderedHeight: 0 };
            }

            const mapRect = this.mapElement.getBoundingClientRect();
            
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const naturalWidth = img.naturalWidth;
                    const naturalHeight = img.naturalHeight;
                    const naturalAspectRatio = naturalWidth / naturalHeight;
                    
                    let renderedWidth, renderedHeight;
                    const containerAspectRatio = mapRect.width / mapRect.height;
                    
                    if (containerAspectRatio > naturalAspectRatio) {
                        renderedHeight = mapRect.height;
                        renderedWidth = renderedHeight * naturalAspectRatio;
                    } else {
                        renderedWidth = mapRect.width;
                        renderedHeight = renderedWidth / naturalAspectRatio;
                    }
                    
                    const offsetX = (mapRect.width - renderedWidth) / 2;
                    const offsetY = (mapRect.height - renderedHeight) / 2;
                    
                    resolve({
                        offsetX: offsetX,
                        offsetY: offsetY,
                        renderedWidth: renderedWidth,
                        renderedHeight: renderedHeight
                    });
                };
                
                img.onerror = () => {
                    console.warn('Could not load map image, using fallback dimensions');
                    resolve({
                        offsetX: 0,
                        offsetY: 0,
                        renderedWidth: mapRect.width,
                        renderedHeight: mapRect.height
                    });
                };
                
                const mapStyle = window.getComputedStyle(this.mapElement);
                const urlMatch = mapStyle.backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
                img.src = urlMatch ? urlMatch[1] : '';
                if (!urlMatch) {
                    console.warn('No background image URL found for #map, using fallback dimensions');
                    resolve({
                        offsetX: 0,
                        offsetY: 0,
                        renderedWidth: mapRect.width,
                        renderedHeight: mapRect.height
                    });
                }
            });
        }

        async positionButtons() {
            if (!this.isInitialized) return;
            
            try {
                const positionData = await this.calculateMapPosition();
                const { offsetX, offsetY, renderedWidth, renderedHeight } = positionData;
                
                console.log('Position data:', positionData);
                
                this.mapButtons.forEach((button, index) => {
                    const originalData = this.originalButtonData.get(button);
                    if (!originalData) return;
                    
                    button.classList.add('positioning');
                    
                    // Calculate new position based on the rendered map image size
                    const newLeft = (originalData.leftPercent / 100) * renderedWidth + offsetX;
                    const newTop = (originalData.topPercent / 100) * renderedHeight + offsetY;
                    
                    // Apply position only, let CSS handle sizing
                    button.style.left = `${newLeft}px`;
                    button.style.top = `${newTop}px`;
                    
                    console.log(`Button ${index} positioned - Left: ${newLeft}px, Top: ${newTop}px`);
                    
                    setTimeout(() => {
                        button.classList.remove('positioning');
                    }, 50);
                });
            } catch (error) {
                console.error('Error positioning buttons:', error);
            }
        }

        setupResizeObserver() {
            if ('ResizeObserver' in window) {
                this.resizeObserver = new ResizeObserver(() => {
                    clearTimeout(this.resizeTimeout);
                    this.resizeTimeout = setTimeout(() => {
                        this.storeOriginalButtonData();
                        this.positionButtons();
                    }, 16);
                });
                
                this.resizeObserver.observe(this.mapElement);
            } else {
                window.addEventListener('resize', () => {
                    clearTimeout(this.resizeTimeout);
                    this.resizeTimeout = setTimeout(() => {
                        this.storeOriginalButtonData();
                        this.positionButtons();
                    }, 100);
                });
            }
        }

        addButton(buttonElement) {
            if (!this.mapButtons.includes(buttonElement)) {
                this.mapButtons.push(buttonElement);
                
                const computedStyle = window.getComputedStyle(buttonElement);
                const buttonData = {
                    leftPercent: computedStyle.left.includes('%') ? parseFloat(computedStyle.left) : 0,
                    topPercent: computedStyle.top.includes('%') ? parseFloat(computedStyle.top) : 0
                };

                this.originalButtonData.set(buttonElement, buttonData);
                this.positionButtons();
            }
        }

        destroy() {
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
            }
            this.originalButtonData.clear();
            this.mapButtons = [];
            this.isInitialized = false;
        }
    }

    const mapButtonPositioner = new MapButtonPositioner();
    window.mapButtonPositioner = mapButtonPositioner;
});