document.addEventListener('DOMContentLoaded', () => {
    console.log('Script loaded, initializing map buttons');
    
    // Map button click handling
    const mapButtons = document.querySelectorAll('.map-button-header');
    mapButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const hotspot = button.parentElement;
            console.log('Button clicked:', hotspot);
            document.querySelectorAll('.map-button').forEach(h => h.classList.remove('visible'));
            hotspot.classList.add('visible');
        });
    });

    // ====== MAP BUTTON SCALING FUNCTIONALITY ======
    class MapButtonScaler {
        constructor() {
            this.mapElement = null;
            this.mapContainer = null;
            this.mapButtons = [];
            this.originalButtonData = new Map();
            this.resizeObserver = null;
            this.isInitialized = false;
            this.init();
        }

        init() {
            this.mapElement = document.getElementById('map');
            this.mapContainer = document.getElementById('map-container');
            if (!this.mapElement || !this.mapContainer) {
                console.warn('Map or container element not found for scaling');
                return;
            }

            this.mapButtons = Array.from(document.querySelectorAll('.map-button'));
            if (this.mapButtons.length === 0) {
                console.warn('No map buttons found for scaling');
                return;
            }

            console.log(`Found ${this.mapButtons.length} map buttons for scaling`);
            
            setTimeout(() => {
                this.storeOriginalButtonData();
                this.setupResizeObserver();
                this.scaleButtons();
                this.isInitialized = true;
                console.log('Map button scaler initialized and scaled');
            }, 100);
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
                    topPercent: topPercent || 0,
                    width: parseFloat(computedStyle.width) || 40,
                    height: parseFloat(computedStyle.height) || 40,
                    fontSize: parseFloat(computedStyle.fontSize) || 16,
                };

                console.log(`Button ${index} data:`, buttonData);
                this.originalButtonData.set(button, buttonData);
            });
        }

        async calculateMapScale() {
            if (!this.mapElement || !this.mapContainer) {
                return { scale: 1, offsetX: 0, offsetY: 0, renderedWidth: 0, renderedHeight: 0 };
            }

            const containerRect = this.mapContainer.getBoundingClientRect();
            
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const naturalWidth = img.naturalWidth;
                    const naturalHeight = img.naturalHeight;
                    const naturalAspectRatio = naturalWidth / naturalHeight;
                    
                    let renderedWidth, renderedHeight;
                    const containerAspectRatio = containerRect.width / containerRect.height;
                    
                    if (containerAspectRatio > naturalAspectRatio) {
                        renderedHeight = containerRect.height;
                        renderedWidth = renderedHeight * naturalAspectRatio;
                    } else {
                        renderedWidth = containerRect.width;
                        renderedHeight = renderedWidth / naturalAspectRatio;
                    }
                    
                    const scale = Math.min(renderedWidth / naturalWidth, renderedHeight / naturalHeight);
                    const offsetX = (containerRect.width - renderedWidth) / 2;
                    const offsetY = (containerRect.height - renderedHeight) / 2;
                    
                    resolve({
                        scale: scale,
                        offsetX: offsetX,
                        offsetY: offsetY,
                        renderedWidth: renderedWidth,
                        renderedHeight: renderedHeight
                    });
                };
                
                img.onerror = () => {
                    console.warn('Could not load map image for scaling calculation');
                    resolve({
                        scale: 1,
                        offsetX: 0,
                        offsetY: 0,
                        renderedWidth: containerRect.width,
                        renderedHeight: containerRect.height
                    });
                };
                
                const mapStyle = window.getComputedStyle(this.mapElement);
                const urlMatch = mapStyle.backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
                img.src = urlMatch ? urlMatch[1] : '';
            });
        }

        async scaleButtons() {
            if (!this.isInitialized) return;
            
            try {
                const scaleData = await this.calculateMapScale();
                const { scale, offsetX, offsetY, renderedWidth, renderedHeight } = scaleData;
                
                console.log('Scale data:', scaleData);
                
                this.mapButtons.forEach((button, index) => {
                    const originalData = this.originalButtonData.get(button);
                    if (!originalData) return;
                    
                    button.classList.add('scaling');
                    
                    // Calculate new position based on the rendered map size
                    const newLeft = (originalData.leftPercent / 100) * renderedWidth + offsetX;
                    const newTop = (originalData.topPercent / 100) * renderedHeight + offsetY;
                    
                    // Calculate scaled dimensions
                    const newWidth = originalData.width * scale;
                    const newHeight = originalData.height * scale;
                    const newFontSize = originalData.fontSize * scale;
                    const newHeaderWidth = originalData.headerWidth * scale;
                    const newHeaderHeight = originalData.headerHeight * scale;
                    const newIconWrapperWidth = originalData.iconWrapperWidth * scale;
                    const newIconWrapperHeight = originalData.iconWrapperHeight * scale;
                    const newTitleWrapperLeft = originalData.titleWrapperLeft * scale;
                    const newTitleWrapperHeight = originalData.titleWrapperHeight * scale;
                    
                    // Apply styles to button
                    button.style.left = `${newLeft}px`;
                    button.style.top = `${newTop}px`;
                    button.style.width = `${newWidth}px`;
                    button.style.height = `${newHeight}px`;
                    button.style.fontSize = `${newFontSize}px`;
                    
                    // Update child elements
                    const header = button.querySelector('.map-button-header');
                    const iconWrapper = button.querySelector('.map-button-icon-wrapper');
                    const titleWrapper = button.querySelector('.map-button-title-wrapper');
                    
                    if (header) {
                        header.style.width = `${newHeaderWidth}px`;
                        header.style.height = `${newHeaderHeight}px`;
                        header.style.borderRadius = `${newHeaderHeight / 2}px`;
                    }
                    
                    if (iconWrapper) {
                        iconWrapper.style.width = `${newIconWrapperWidth}px`;
                        iconWrapper.style.height = `${newIconWrapperHeight}px`;
                    }
                    
                    if (titleWrapper) {
                        titleWrapper.style.left = `${newTitleWrapperLeft}px`;
                        titleWrapper.style.height = `${newTitleWrapperHeight}px`;
                    }
                    
                    console.log(`Button ${index} scaled - Left: ${newLeft}px, Top: ${newTop}px, Scale: ${scale}`);
                    
                    setTimeout(() => {
                        button.classList.remove('scaling');
                    }, 50);
                });
            } catch (error) {
                console.error('Error scaling buttons:', error);
            }
        }

        setupResizeObserver() {
            if ('ResizeObserver' in window) {
                this.resizeObserver = new ResizeObserver(() => {
                    clearTimeout(this.resizeTimeout);
                    this.resizeTimeout = setTimeout(() => {
                        this.scaleButtons();
                    }, 16);
                });
                
                this.resizeObserver.observe(this.mapContainer);
            } else {
                window.addEventListener('resize', () => {
                    clearTimeout(this.resizeTimeout);
                    this.resizeTimeout = setTimeout(() => {
                        this.scaleButtons();
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
                    topPercent: computedStyle.top.includes('%') ? parseFloat(computedStyle.top) : 0,
                    width: parseFloat(computedStyle.width) || 40,
                    height: parseFloat(computedStyle.height) || 40,
                    fontSize: parseFloat(computedStyle.fontSize) || 16,
                    headerWidth: 400,
                    headerHeight: 40,
                    iconWrapperWidth: 40,
                    iconWrapperHeight: 40,
                    titleWrapperLeft: 40,
                    titleWrapperHeight: 40
                };

                if (window.innerWidth <= 768) {
                    buttonData.headerWidth = 50;
                    buttonData.headerHeight = 50;
                    buttonData.iconWrapperWidth = 50;
                    buttonData.iconWrapperHeight = 50;
                    buttonData.titleWrapperLeft = 50;
                    buttonData.titleWrapperHeight = 50;
                }

                this.originalButtonData.set(buttonElement, buttonData);
                this.scaleButtons();
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

    const mapButtonScaler = new MapButtonScaler();
    window.mapButtonScaler = mapButtonScaler;
});