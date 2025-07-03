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
                window.location.href = link.href;
            } else {
                console.warn('No valid link found for button:', hotspot);
            }
        });
    });

    // ====== IMPROVED MAP BUTTON POSITIONING FUNCTIONALITY ======
    class MapButtonPositioner {
        constructor() {
            this.mapElement = null;
            this.mapButtons = [];
            this.buttonPositions = new Map(); // Store normalized positions (0-1)
            this.resizeObserver = null;
            this.isInitialized = false;
            this.imageCache = new Map();
            this.debounceTimer = null;
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
            
            // Wait for map image to load, then initialize
            this.waitForMapImage().then(() => {
                this.extractButtonPositions();
                this.setupResizeObserver();
                this.positionButtons();
                this.isInitialized = true;
                console.log('Map button positioner initialized');
            }).catch(error => {
                console.error('Failed to initialize map positioning:', error);
            });
        }

        async waitForMapImage() {
            const mapStyle = window.getComputedStyle(this.mapElement);
            const urlMatch = mapStyle.backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
            
            if (!urlMatch) {
                console.warn('No background image URL found for #map');
                return Promise.resolve();
            }

            const imageUrl = urlMatch[1];
            
            // Check cache first
            if (this.imageCache.has(imageUrl)) {
                return this.imageCache.get(imageUrl);
            }

            // Load image and cache the promise
            const imagePromise = new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    console.log('Map image loaded successfully');
                    resolve({
                        naturalWidth: img.naturalWidth,
                        naturalHeight: img.naturalHeight,
                        aspectRatio: img.naturalWidth / img.naturalHeight
                    });
                };
                img.onerror = () => {
                    console.warn('Could not load map image');
                    reject(new Error('Failed to load map image'));
                };
                img.src = imageUrl;
            });

            this.imageCache.set(imageUrl, imagePromise);
            return imagePromise;
        }

        extractButtonPositions() {
            this.mapButtons.forEach((button, index) => {
                // Try to extract position from data attributes first (most reliable)
                const leftPercent = this.getPositionValue(button, 'left');
                const topPercent = this.getPositionValue(button, 'top');
                
                // Store as normalized coordinates (0-1 range)
                const position = {
                    x: leftPercent / 100,
                    y: topPercent / 100,
                    element: button
                };

                this.buttonPositions.set(button, position);
                console.log(`Button ${index} position extracted: ${leftPercent}%, ${topPercent}%`);
            });
        }

        getPositionValue(element, property) {
            // Priority order: data attributes > inline styles > computed styles
            const dataAttr = element.getAttribute(`data-${property}-percent`);
            if (dataAttr !== null) {
                return parseFloat(dataAttr);
            }

            const inlineStyle = element.style[property];
            if (inlineStyle && inlineStyle.includes('%')) {
                return parseFloat(inlineStyle);
            }

            const computedStyle = window.getComputedStyle(element)[property];
            if (computedStyle && computedStyle.includes('%')) {
                return parseFloat(computedStyle);
            }

            // Fallback: try to extract from CSS classes or default to 0
            return 0;
        }

        async calculateMapBounds() {
            try {
                const imageData = await this.waitForMapImage();
                const mapRect = this.mapElement.getBoundingClientRect();
                
                if (!imageData) {
                    // Fallback if image data unavailable
                    return {
                        left: 0,
                        top: 0,
                        width: mapRect.width,
                        height: mapRect.height
                    };
                }

                const containerAspectRatio = mapRect.width / mapRect.height;
                const imageAspectRatio = imageData.aspectRatio;
                
                let renderedWidth, renderedHeight, offsetX, offsetY;
                
                if (containerAspectRatio > imageAspectRatio) {
                    // Container is wider than image - image is constrained by height
                    renderedHeight = mapRect.height;
                    renderedWidth = renderedHeight * imageAspectRatio;
                    offsetX = (mapRect.width - renderedWidth) / 2;
                    offsetY = 0;
                } else {
                    // Container is taller than image - image is constrained by width
                    renderedWidth = mapRect.width;
                    renderedHeight = renderedWidth / imageAspectRatio;
                    offsetX = 0;
                    offsetY = (mapRect.height - renderedHeight) / 2;
                }
                
                return {
                    left: offsetX,
                    top: offsetY,
                    width: renderedWidth,
                    height: renderedHeight
                };
            } catch (error) {
                console.error('Error calculating map bounds:', error);
                const mapRect = this.mapElement.getBoundingClientRect();
                return {
                    left: 0,
                    top: 0,
                    width: mapRect.width,
                    height: mapRect.height
                };
            }
        }

        async positionButtons() {
            if (!this.isInitialized && this.buttonPositions.size === 0) return;
            
            try {
                const mapBounds = await this.calculateMapBounds();
                
                this.buttonPositions.forEach((position, button) => {
                    // Calculate absolute position from normalized coordinates
                    const absoluteX = mapBounds.left + (position.x * mapBounds.width);
                    const absoluteY = mapBounds.top + (position.y * mapBounds.height);
                    
                    // Apply position using transform for better performance
                    button.style.transform = `translate(${absoluteX}px, ${absoluteY}px)`;
                    
                    // Clear any old positioning styles
                    button.style.left = '';
                    button.style.top = '';
                });
                
                console.log('Buttons repositioned successfully');
            } catch (error) {
                console.error('Error positioning buttons:', error);
            }
        }

        setupResizeObserver() {
            const debouncedReposition = () => {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => {
                    this.positionButtons();
                }, 16); // ~60fps
            };

            if ('ResizeObserver' in window) {
                this.resizeObserver = new ResizeObserver(debouncedReposition);
                this.resizeObserver.observe(this.mapElement);
                
                // Also observe the document body for viewport changes
                this.resizeObserver.observe(document.body);
            } else {
                // Fallback for older browsers
                window.addEventListener('resize', debouncedReposition);
                window.addEventListener('orientationchange', debouncedReposition);
            }
        }

        // Public API methods
        addButton(buttonElement, xPercent = 0, yPercent = 0) {
            if (this.buttonPositions.has(buttonElement)) {
                console.warn('Button already exists in positioner');
                return;
            }

            // Store position data as data attributes for persistence
            buttonElement.setAttribute('data-left-percent', xPercent);
            buttonElement.setAttribute('data-top-percent', yPercent);

            const position = {
                x: xPercent / 100,
                y: yPercent / 100,
                element: buttonElement
            };

            this.buttonPositions.set(buttonElement, position);
            this.mapButtons.push(buttonElement);
            
            if (this.isInitialized) {
                this.positionButtons();
            }
        }

        removeButton(buttonElement) {
            if (this.buttonPositions.has(buttonElement)) {
                this.buttonPositions.delete(buttonElement);
                const index = this.mapButtons.indexOf(buttonElement);
                if (index > -1) {
                    this.mapButtons.splice(index, 1);
                }
                console.log('Button removed from positioner');
            }
        }

        updateButtonPosition(buttonElement, xPercent, yPercent) {
            if (!this.buttonPositions.has(buttonElement)) {
                console.warn('Button not found in positioner');
                return;
            }

            // Update data attributes
            buttonElement.setAttribute('data-left-percent', xPercent);
            buttonElement.setAttribute('data-top-percent', yPercent);

            // Update stored position
            const position = this.buttonPositions.get(buttonElement);
            position.x = xPercent / 100;
            position.y = yPercent / 100;

            if (this.isInitialized) {
                this.positionButtons();
            }
        }

        // Get current button positions as percentages
        getButtonPositions() {
            const positions = new Map();
            this.buttonPositions.forEach((position, button) => {
                positions.set(button, {
                    xPercent: position.x * 100,
                    yPercent: position.y * 100
                });
            });
            return positions;
        }

        // Force refresh (useful after dynamic content changes)
        refresh() {
            this.extractButtonPositions();
            this.positionButtons();
        }

        destroy() {
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
            }
            
            clearTimeout(this.debounceTimer);
            
            // Clear transforms from buttons
            this.buttonPositions.forEach((position, button) => {
                button.style.transform = '';
            });
            
            this.buttonPositions.clear();
            this.mapButtons = [];
            this.imageCache.clear();
            this.isInitialized = false;
            
            console.log('Map button positioner destroyed');
        }
    }

    const mapButtonPositioner = new MapButtonPositioner();
    window.mapButtonPositioner = mapButtonPositioner;
});