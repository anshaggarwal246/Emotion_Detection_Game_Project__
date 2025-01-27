
const CACHE_NAME = 'face-api-cache-v1';
const urlsToCache = [
    'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights/tiny_face_detector_model-weights_manifest.json',
    'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights/face_expression_model-weights_manifest.json',
    'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights/age_gender_model-weights_manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});