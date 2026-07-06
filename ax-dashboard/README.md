# AX 추진 대시보드 (일산병원 AI 플랫폼병원 전환)

AI 플랫폼병원 전환 추진전략 실시간 공용 대시보드 (PWA).

## 실행
- 로컬: `index.html`을 브라우저로 열기 (인터넷 연결 시 Supabase 공용 DB 실시간 동기화)
- 앱 설치(PWA)·오프라인: https 호스팅 필요 (GitHub Pages 등)

## GitHub Pages
Settings → Pages → Source: `main` / root 로 설정 후:
`https://<user>.github.io/dashboard-projects/ax-dashboard/`

## 구성 파일
- `index.html` — 대시보드 본체
- `manifest.json`, `sw.js`, `icon.svg` — PWA 구성
