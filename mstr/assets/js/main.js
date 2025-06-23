document.addEventListener('DOMContentLoaded', () => {
    // Prevent default link behavior for map buttons and handle navigation
    document.querySelectorAll('.map-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const href = button.getAttribute('href');
            if (href && href.startsWith('#')) {
                // Post message to parent window for iframe communication
                window.parent.postMessage({ type: 'navigate', href: href }, '*');
            }
        });
    });
});