importScripts("/stockfish.js"); // Loads from public folder

const engine = Stockfish(); // Ensure Stockfish is correctly referenced

self.onmessage = function (e) {
    engine.postMessage(e.data);
};

engine.onmessage = function (e) {
    self.postMessage(e.data);
};
