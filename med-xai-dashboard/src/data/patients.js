import { organFindingsDB } from './organEvidence.js';

export const ORGAN_NAMES = ['뇌', '심장', '폐', '위', '간', '신장'];

export const generateXaiPatientsData = (count) => {
  const names = ['김철수', '박영희', '이민수', '최지영', '정우진', '강다혜', '조은비', '윤성현', '장미경', '임재혁'];
  return Array.from({ length: count }).map((_, i) => {
    const score = Math.floor(Math.random() * 30) + 65;
    const sysBp = 140 + (i % 20);
    const diaBp = 80 + (i % 10);
    return {
      id: `1234-${String(i + 456).padStart(3, '0')}`,
      name: names[i % names.length],
      age: 50 + (i % 30),
      gender: i % 2 === 0 ? '여' : '남',
      score,
      predictedScore: Math.min(100, score + 10),
      targetOrgans: ORGAN_NAMES.map((name) => ({
        name,
        score: Math.floor(Math.random() * 40) + 55,
        trend: Array.from({ length: 12 }).map((_, j) => ({
          time: `${j * 2}h`,
          value: Number((65 + Math.random() * 30).toFixed(1)),
        })),
        finding: organFindingsDB[name] || '특이 소견 없음',
      })),
      diagnosis: '급성 심혈관 리스크 및 장기 부전 의증',
      vitals: { bp: `${sysBp}/${diaBp}`, pr: 78, spo2: 96, bt: '36.5' },
      checkTime: '14:30:45',
      xai: {
        riskFactors: [
          { name: 'Troponin-I', value: '0.45', type: 'up' },
          { name: 'NT-proBNP', value: '1,240', type: 'up' },
          { name: 'Creatinine', value: '2.1', type: 'up' },
        ],
        summary: 'AI 판독 결과, 심박출량 저하와 연동된 신장 기능의 급격한 악화가 예측됩니다. 최근 15분 사이 지표의 급변이 관찰되고 있습니다.',
        basisCurrent: '• Troponin-I: 0.45 ng/mL (최근 10분간 상승세)\n• 혈압: 140/80 mmHg (수축기 압력 불안정)\n• NT-proBNP: 1,240 pg/mL (급성 심부전 위험)',
        basisPrediction: '• 1시간 후 리스크 점수: 92% 예상\n• 전해질 불균형 가속화로 인한 부정맥 가능성\n• 3시간 내 소변량 추이 밀착 관찰 요망',
      },
      sbar: {
        situation: '김철수(M/52세) 환자, 현재 흉부 압박감 호소. 최근 10분 사이 혈압 12mmHg 상승함.',
        background: '심부전 기저질환자로 PCI 시술 후 안정화 단계였으나 최근 1시간 이내 바이탈 변동성 심화.',
        assessment: 'AI 리스크 지수가 최근 15분 사이 급등함. 급성 심부전 재발 가능성 농후.',
        recommend: '즉각적인 심초음파 검사 및 이뇨제 투여 검토 요망.',
      },
      soap: {
        subjective: '환자가 가슴 답답함 및 호흡 곤란을 반복적으로 호소함.',
        objective: '• BP: 140/80 mmHg (최근 5분 전 대비 5mmHg 상승)\n• Lab: Troponin-I 상승 중\n• ECG: ST 분절 변화 관찰',
        assessment: '급성 리스크 상승 단계. 다발성 장기 기능 저하 우려.',
        plan: '1. 5분 간격 밀착 바이탈 모니터링\n2. 긴급 전문의 호출 완료\n3. 전해질 및 산염기 균형 분석 재시행',
      },
    };
  });
};
