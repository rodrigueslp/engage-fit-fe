var _a, _b;
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    preview: {
        port: 4173,
        proxy: {
            '/api': (_a = process.env.VITE_DEV_API_PROXY_TARGET) !== null && _a !== void 0 ? _a : 'http://localhost:8080',
        },
    },
    server: {
        port: 5173,
        proxy: {
            '/api': (_b = process.env.VITE_DEV_API_PROXY_TARGET) !== null && _b !== void 0 ? _b : 'http://localhost:8080',
        },
    },
});
