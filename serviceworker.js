'use strict';

var version = 'v1::';
var offlineKitten = 'https://i.imgur.com/6oxPj8i.jpg';

self.addEventListener('install', function installer (e) {
  e.waitUntil(caches.open(version).then(function prefill (cache) {
    return cache.addAll(['/', offlineKitten]);
  }));
});

self.addEventListener('fetch', function fetcher (e) {
  var request = e.request;
  if (request.method !== 'GET') {
    return;
  }

  var url = new URL(request.url);

  e.respondWith(caches.match(request).then(queriedCache));

  function queriedCache (cached) {
    var networked = fetch(request)
      .then(fetchedFromNetwork, unableToResolve)
      .catch(unableToResolve);
    return cached || networked;

    function fetchedFromNetwork (response) {
      var cacheCopy = response.clone();
      caches.open(version).then(function add (cache) {
        cache.put(request, cacheCopy);
      });
      return response;
    }
  }

  function unableToResolve () {
    if (url.host.endsWith('.staticflickr.com')) {
      return caches.match(offlineKitten);
    }
    return offlineResponse();
  }

  function offlineResponse () {
    return new Response('', { status: 503, statusText: 'Service Unavailable' });
  }
});

self.addEventListener('activate', function activator (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys
        .filter(function (key) {
          return key.indexOf(version) !== 0;
        })
        .map(function (key) {
          return caches.delete(key);
        })
      );
    })
  );
});
