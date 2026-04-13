#!/bin/bash
# =========================================
#  CART VITAL Dashboard - GitHub 설정 스크립트
# =========================================

echo "========================================="
echo "  CART VITAL Dashboard → GitHub 업로드"
echo "========================================="
echo ""

cd ~/Documents/DataScience_Study/cart-vital-dashboard || { echo "❌ 폴더를 찾을 수 없습니다."; exit 1; }

# 1. npm 의존성 설치
echo "[1/5] npm 의존성 설치 중..."
npm install
echo ""

# 2. 빌드 테스트
echo "[2/5] 빌드 테스트..."
npm run build
if [ $? -eq 0 ]; then
    echo "  ✅ 빌드 성공"
else
    echo "  ⚠️  빌드 실패 - GitHub에는 소스코드만 올립니다"
fi
echo ""

# 3. Git 초기화
echo "[3/5] Git 초기화..."
if [ -d ".git" ]; then
    echo "  ⏭️  이미 Git이 초기화되어 있습니다"
else
    git init
    echo "  ✅ Git 초기화 완료"
fi
echo ""

# 4. GitHub 레포 생성
echo "[4/5] GitHub 레포 생성..."
gh repo create cart-vital-dashboard --public --description "Hospital Patient Vital Signs Real-time Monitoring Dashboard (React + Recharts + Tailwind)" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "  ✅ GitHub 레포 생성 완료"
else
    echo "  ⏭️  이미 존재하는 레포이거나 생성 실패"
fi
echo ""

# 5. 커밋 & 푸시
echo "[5/5] 커밋 및 푸시..."
git add -A
git commit -m "feat: CART VITAL 환자 바이탈 모니터링 대시보드

- 대시보드 홈: 전체 환자 현황, 경고 분포, 실시간 모니터링
- 환자 관리: 목록/상세 뷰, 24시간 바이탈 추이 차트
- 물류 관리: 기기 자산 라이프사이클, 배송 추적
- 설정: 바이탈 경고 임계값 커스터마이징
- AI 분석 리포트 모달

Tech Stack: React 18, Vite, Recharts, Tailwind CSS, Lucide React"

git branch -M main
git remote add origin https://github.com/$(gh api user --jq '.login')/cart-vital-dashboard.git 2>/dev/null
git push -u origin main --force

echo ""
echo "========================================="
echo "  ✅ 완료!"
echo "========================================="
echo ""
echo "🔗 GitHub: https://github.com/$(gh api user --jq '.login')/cart-vital-dashboard"
echo ""
echo "📌 GitHub Pages 배포 방법:"
echo "   1. GitHub 레포 → Settings → Pages"
echo "   2. Source: GitHub Actions 선택"
echo "   3. 또는 아래 명령어로 배포:"
echo "      npm run build && npx gh-pages -d dist"
echo ""
