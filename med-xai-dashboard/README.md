# Med XAI Dashboard

비대면 진료기술개발사업의 **멀티모달 XAI 대시보드** 프로토타입입니다. 다발성 장기 부전(MOF) 위험을 실시간으로 시각화하고, AI 판독 근거(XAI)와 임상 표준 보고서(SBAR/SOAP)를 한 화면에서 제공합니다.

[![CI](https://github.com/<OWNER>/dashboard_project/actions/workflows/ci.yml/badge.svg)](https://github.com/<OWNER>/dashboard_project/actions/workflows/ci.yml)
[![Deploy](https://github.com/<OWNER>/dashboard_project/actions/workflows/deploy.yml/badge.svg)](https://github.com/<OWNER>/dashboard_project/actions/workflows/deploy.yml)

---

## 🔬 프로젝트 개요

| 항목 | 내용 |
|---|---|
| **사업명** | 비대면 진료기술개발사업 |
| **목적** | 다발성 장기 부전 예측 + XAI 근거 시각화 |
| **사용자** | 의료진(중환자실 / 심장내과) |
| **요청자** | 실장님 (요구사항 PPTX 기반) |
| **상태** | ✅ 컨펌 완료 (v1.0) |

---

## ✨ 주요 기능

- **장비 관제 대시보드** — 보관/사용/회수/충전/수리 라이프사이클, 제조사별 KPI(회전율·평균 사용시간), 가동률 게이지
- **환자 모니터링 테이블** — 현재/예측 위험도 점수, 6개 장기별 위험도(뇌·심장·폐·위·간·신장), 바이탈 요약
- **장기별 정밀 진단** — 인체 해부도 위 장기 노드, 위험 시 글로우 효과, 시간별 추이 곡선
- **Clinical Evidence 패널** — 장기별 특화 지표(ICP/CPP, Troponin, P/F Ratio, Cr/eGFR 등)
- **영상 뷰어** — X-ray/MRI 풀스크린 모달, AI 판독 인사이트 오버레이
- **표준 임상 보고서** — SBAR / SOAP 자동 생성

---

## 🛠 기술 스택

- **React 18** + **Vite 5** — 빠른 HMR과 빌드
- **Tailwind CSS 3** — 유틸리티 기반 스타일링 (다크 패널 + 라이트 콘텐츠 혼용)
- **Recharts** — 시계열 추이 곡선
- **lucide-react** — 일관된 아이콘 시스템
- **GitHub Actions** — CI(lint+build) + GitHub Pages 자동 배포

---

## 📁 프로젝트 구조

```
dashboard_project/
├── .github/workflows/
│   ├── ci.yml             # 푸시·PR 시 lint + build
│   └── deploy.yml         # main 푸시 시 GitHub Pages 배포
├── src/
│   ├── components/
│   │   ├── shared/        # OrganIcon, ReportBox
│   │   ├── monitoring/    # HumanBodyOrganMap, OrganTopMonitoring, EvidencePanel
│   │   ├── dashboard/     # DeviceDashboard
│   │   └── patient/       # PatientMonitoring, PatientDetail
│   ├── data/              # devices, patients, organEvidence
│   ├── styles/            # index.css (Tailwind + 커스텀 keyframes)
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

---

## 🚀 시작하기

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 실행 (http://localhost:5173)
npm run dev

# 3. 프로덕션 빌드
npm run build

# 4. 빌드 미리보기
npm run preview
```

---

## 🎨 디자인 컨셉

- **다크 관제 + 라이트 진료 영역의 이중 테마** — 사이드/대시보드는 다크(`#0b1121`, `#0f172a`), 환자 디테일은 라이트로 임상 차트의 가독성 확보
- **위험 신호 글로우** — 위험도 85% 초과 시 `organ-icon-danger` 클래스로 rose 색상 + drop-shadow 펄스
- **임상 표준 양식 통합** — SBAR(Situation/Background/Assessment/Recommend), SOAP(Subjective/Objective/Assessment/Plan)

---

## ⚙️ GitHub Actions

| 워크플로 | 트리거 | 동작 |
|---|---|---|
| `ci.yml` | push, PR | npm ci → lint → build → 빌드 산출물 업로드 |
| `deploy.yml` | main push, manual | GitHub Pages로 자동 배포 |

> **GitHub Pages 배포 활성화**: 레포 `Settings → Pages → Source: GitHub Actions` 선택 시 동작합니다.

---

## 📋 요구사항 반영 매트릭스

| 슬라이드 | 요구사항 | 구현 위치 | 상태 |
|---|---|---|---|
| 2~3 | 비대면 로지스틱 화면 재구성 | `PatientMonitoring` | ✅ |
| 3 | [사용중] Sub-category로 [위험], [위험예측] 추가 | `현재/예측` 컬럼 | ✅ |
| 3 | 대상 Organ을 개별 탭으로 처리 | 6개 장기 컬럼 분리 | ✅ |
| 3 | 주요 위험인자, 판별근거 환자별 화면 이전 | `PatientDetail / 정밀진단(AI)` | ✅ |
| 5 | 인체 그림에 위험 장기 red flag | `HumanBodyOrganMap` 글로우 | ✅ |
| 5 | 장기별 위험도 시간별 추이 곡선 | `OrganTopMonitoring` (Recharts) | ✅ |
| 5 | XAI 검사결과 표시 | `EvidencePanel` | ✅ |
| 7 | SBAR / SOAP 양식 | `ReportBox` (탭 구조) | ✅ |

---

## 🗒 라이선스

내부 R&D 프로토타입. 외부 배포 전 의료기기 SW 인증·임상시험 절차를 별도로 진행해야 합니다.
