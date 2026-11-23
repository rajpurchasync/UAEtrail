# Performance benchmark results

Run against a live API and Vite preview:

```bash
# API (requires Mongo + Redis + npm run dev:api)
npm run perf:api -- --label before
# … after optimizations …
npm run perf:api -- --label after
npm run perf:api:compare

# UI transfer sizes (requires build + preview)
npm run build
npx vite preview --port 4173
npm run perf:ui -- --label before
npm run perf:ui -- --label after
npm run perf:ui:compare
```

Optional signed-in probes: `P5_SMOKE_EMAIL`, `P5_SMOKE_PASSWORD`.
