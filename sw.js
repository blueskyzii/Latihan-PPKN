const CACHE_NAME = 'cbt-app-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './exam.html',
    './style.css',
    './dashboard.js',
    './exam.js',
    './quizzes.json',
    './questions_ppkn_v1.json',
    './questions_contoh.json',
    './manifest.json'
];

// Install Event: Cache files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('SW: Caching Assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Activate Event: Clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('SW: Clearing Old Cache', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Fetch Event: Serve from Cache, Fallback to Network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached response if found
                if (response) {
                    return response;
                }
                // Otherwise fetch from network
                return fetch(event.request);
            })
    );
});
