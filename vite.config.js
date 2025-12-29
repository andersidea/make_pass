import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteSingleFile(), // 단일 파일 빌드 플러그인 (CORS 문제 해결)
  ],
  // 로컬 파일로 직접 실행 가능하도록 상대 경로 사용
  base: './',
  build: {
    // 프로덕션 빌드 최적화
    // esbuild는 기본값이며 빠름 (console.drop은 지원하지 않지만, 코드에서 이미 조건부 처리)
    // terser를 사용하려면: npm install -D terser 필요
    minify: 'esbuild', // 빠른 빌드를 위해 esbuild 사용 (코드에서 이미 console.log 조건부 처리됨)
    // terser 사용 시 (더 작은 번들 크기):
    // minify: 'terser',
    // terserOptions: {
    //   compress: {
    //     drop_console: true,
    //     drop_debugger: true,
    //   },
    // },
    // 단일 파일 빌드 모드에서는 manualChunks 제거 (모든 코드가 하나로 합쳐짐)
    // rollupOptions: {
    //   output: {
    //     manualChunks: {
    //       // 벤더 라이브러리 분리
    //       'react-vendor': ['react', 'react-dom'],
    //       'crypto-vendor': ['crypto-js'],
    //       'excel-vendor': ['xlsx'],
    //       'ui-vendor': ['lucide-react', 'framer-motion'],
    //     },
    //   },
    // },
    // 청크 크기 경고 임계값 증가 (단일 파일이므로 크기가 큼)
    chunkSizeWarningLimit: 10000, // 10MB로 증가
    // 소스맵 (프로덕션에서는 false로 설정)
    sourcemap: false,
    // 모든 자산을 Base64로 인라인 처리 (100MB까지)
    assetsInlineLimit: 100000000, // 100MB - 모든 자산이 HTML에 인라인됨
  },
  // 환경 변수 프리픽스
  envPrefix: 'VITE_',
})
