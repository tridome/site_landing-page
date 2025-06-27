document.addEventListener('DOMContentLoaded', () => {
    console.log('Script loaded, initializing map hotspots');
    const mapHotspots = document.querySelectorAll('.map-hotspot-header');
    const infoPanel = document.getElementById('map-info');
    const infoContent = document.getElementById('info-content');
    const closeButton = document.getElementById('close-info');

    if (!infoPanel || !infoContent || !closeButton) {
        console.error('Required elements missing:', {
            infoPanel: !!infoPanel,
            infoContent: !!infoContent,
            closeButton: !!closeButton
        });
        return;
    }

    const contentMap = {
        'one-bed': '<h3>One-Bedroom Unit</h3><p>Details about the one-bedroom unit layout and features.</p>',
        'two-bed': '<h3>Two-Bedroom Unit</h3><p>Details about the two-bedroom unit layout and features.</p>',
        'com-space': '<h3>Community Space</h3><p>Information about the shared community area.</p>'
    };

    mapHotspots.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const target = button.getAttribute('data-target');
            const hotspot = button.parentElement;
            console.log('Hotspot clicked, target:', target);
            // Toggle .visible for header
            document.querySelectorAll('.map-hotspot').forEach(h => h.classList.remove('visible'));
            hotspot.classList.add('visible');
            // Show info panel
            if (contentMap[target]) {
                infoContent.innerHTML = contentMap[target];
                infoPanel.classList.add('visible');
            } else {
                console.warn('No content found for target:', target);
                infoContent.innerHTML = '<p>No information available.</p>';
                infoPanel.classList.add('visible');
            }
        });
    });

    closeButton.addEventListener('click', () => {
        console.log('Close button clicked');
        infoPanel.classList.remove('visible');
        document.querySelectorAll('.map-hotspot').forEach(h => h.classList.remove('visible'));
    });

    infoPanel.addEventListener('click', (e) => {
        if (e.target === infoPanel) {
            console.log('Clicked outside info panel');
            infoPanel.classList.remove('visible');
            document.querySelectorAll('.map-hotspot').forEach(h => h.classList.remove('visible'));
        }
    });
});