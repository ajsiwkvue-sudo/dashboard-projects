# 📊 Dashboard Projects

데이터 시각화 및 모니터링 대시보드 프로젝트 모음입니다.

## 📂 프로젝트 목록

### 🏥 CART VITAL - 환자 바이탈 모니터링 대시보드
> `cart-vital-dashboard/`

병원 환자의 생체신호(혈압, 맥박, SpO2, 호흡수, 체온)를 실시간으로 모니터링하고,
기기 물류까지 통합 관리하는 대시보드

- **기술 스택**: React 18, Vite, Recharts, Tailwind CSS, Lucide React
- **주요 기능**: 실시간 바이탈 모니터링, 24시간 추이 차트, 기기 물류 관리, AI 분석 리포트
- **라이브 데모**: [GitHub Pages 링크] ← 배포 후 교체

### 🧠 Med XAI - 다발성 장기부전 예측 대시보드
> `med-xai-dashboard/`

다발성 장기 부전(MOF) 위험을 실시간 시각화하고, AI 판독 근거(XAI)와
임상 표준 보고서(SBAR/SOAP)를 한 화면에서 제공하는 멀티모달 의료 대시보드

- **기술 스택**: React 18, Vite 5, Recharts, Tailwind CSS 3, Lucide React
- **주요 기능**: 6개 장기별 위험도 모니터링, 인체 해부도 인터랙션, Clinical Evidence 패널, X-ray/MRI 영상 뷰어, SBAR/SOAP 자동 생성
- **라이브 데모**: [GitHub Pages 링크] ← 배포 후 교체

### 🏢 Smart Solution - 병동 민원 관리 대시보드
> `smart-solution-dashboard/`

병원 병동별 솔루션 관련 민원을 접수하고, 실시간으로 현황을 모니터링하는
관리자/간호사용 웹 대시보드

- **기술 스택**: Flask, SQLite, Jinja2, Chart.js
- **주요 기능**: 민원 접수/처리, 병동/솔루션별 통계, 실시간 폴링, 역할별 접근 제어

## 기술 스택

| 기술 | 용도 |
|------|------|
| React 18 | UI 컴포넌트 (CART VITAL, Med XAI) |
| Vite 5 | 빌드 도구 (Med XAI) |
| Recharts | 차트 시각화 (CART VITAL, Med XAI) |
| Tailwind CSS | 스타일링 (CART VITAL, Med XAI) |
| Flask | 백엔드 프레임워크 (Smart Solution) |
| SQLite | 데이터베이스 (Smart Solution) |
| GitHub Actions | CI/CD (Med XAI) |
| GitHub Pages | 배포 |
