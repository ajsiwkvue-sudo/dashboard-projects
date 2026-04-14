import { HeartPulse, Wind, Brain as BrainIcon, Activity, Utensils, Droplets } from 'lucide-react';

export const organFindingsDB = {
  '심장': 'Troponin 수치 0.45ng/mL로 임계값 초과. ECG 상 ST 분절 변화 관찰됨.',
  '폐': 'SpO2 지속 하락(94% 미만). 폐부종 징후 포착 및 빈호흡 양상.',
  '뇌': '뇌혈류 속도 변화 감지. 의식 수준 저하 가능성 주의 필요.',
  '위': '복부 팽만 및 장운동 저하 소견. 스트레스성 궤양 위험성 증폭.',
  '간': 'AST/ALT 효소 수치 상승세. 빌리루빈 수치 변화 주의 관찰.',
  '신장': 'Creatinine 2.1mg/dL 상승. 전해질(K+) 불균형 심화 단계.',
};

export const organEvidenceDB = {
  '심장': {
    title: '심장',
    summary: '급성 심근 손상 및 관류 저하 징후 포착.',
    tags: ['#STEMI 의증', '#심박출량 저하', '#심근 허혈'],
    eventCard: {
      type: 'Cardiac Event', status: 'HIGH RISK',
      mainValue: 'Troponin 0.45 ↑', subValue: 'BP 90/60 | HR 110 (Tachy)',
      icon: HeartPulse, color: 'rose',
    },
    metrics: [
      { label: 'TROPONIN-I', value: '0.45 ng/mL', status: 'critical' },
      { label: 'CK-MB', value: '12.4 ng/mL', status: 'warning' },
      { label: 'EF (EJECTION FRACTION)', value: '42%', status: 'warning' },
      { label: 'ST SEGMENT', value: '2mm Elevation', status: 'critical' },
      { label: 'BNP', value: '450 pg/mL', status: 'warning' },
      { label: 'HRV', value: 'Low', status: 'critical' },
    ],
  },
  '폐': {
    title: '폐',
    summary: '폐부종 및 가스 교환 장애 진행 중.',
    tags: ['#폐부종', '#가스교환 장애', '#ARDS STAGE 1'],
    eventCard: {
      type: 'Respiratory Trend', status: 'NORMAL',
      mainValue: '94%', subValue: 'RR 24 / FiO2 40%',
      icon: Wind, color: 'blue',
    },
    metrics: [
      { label: 'P/F RATIO', value: '185', status: 'critical' },
      { label: 'FIO2', value: '45%', status: 'normal' },
      { label: 'LUNG COMPLIANCE', value: '28 mL/cmH2O', status: 'warning' },
      { label: 'CXR OPACITY', value: 'Bilateral Diffuse', status: 'critical' },
      { label: 'ETCO2', value: '32 mmHg', status: 'warning' },
      { label: 'PEEP', value: '10 cmH2O', status: 'normal' },
    ],
    imageUrl: 'https://search.pstatic.net/common/?src=http%3A%2F%2Fimgnews.naver.net%2Fimage%2F366%2F2020%2F12%2F03%2F0000629328_001_20201203113155268.png&type=a340',
    imageType: 'X-ray',
  },
  '뇌': {
    title: '뇌',
    summary: '뇌압 상승 및 혈류 속도 비정상 패턴.',
    tags: ['#뇌압 상승(IICP)', '#관류압 저하', '#의식 수준 저하'],
    eventCard: {
      type: 'Neuro Dynamics', status: 'CRITICAL',
      mainValue: 'GCS 11 | ICP 22 ↑', subValue: 'CPP: 58 mmHg (Low)',
      icon: BrainIcon, color: 'rose',
    },
    metrics: [
      { label: 'ICP (뇌압)', value: '22 mmHg', status: 'critical' },
      { label: 'CPP (뇌관류압)', value: '58 mmHg', status: 'warning' },
      { label: 'GCS SCORE', value: '11 (E3 V3 M5)', status: 'warning' },
      { label: 'MCA VELOCITY', value: '110 cm/s', status: 'warning' },
      { label: 'PUPILLARY REF.', value: 'Sluggish', status: 'critical' },
      { label: 'EEG ALPHA/THETA', value: 'Low Ratio', status: 'warning' },
    ],
    imageUrl: 'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyMTA4MjZfMTY0%2FMDAxNjI5OTYyMTA4Mzk4.ElAmbJzFh67oUcEoT61J2Uxx1N1Rdf3efRnlbPQiOyUg.4ikB7CmQt3aumGe4fqty9RA0JVPTjCS4gkIz6mGCzj0g.JPEG.scys001%2F210826_%25B8%25B6%25C6%25F7_%25BD%25C5%25B0%25E6%25B0%25FA_%25B3%25FA_CT%252C_MRI%252C_MRA4.JPG&type=l340_165',
    imageType: 'MRI',
  },
  '간': {
    title: '간',
    summary: '급성 간세포 손상 및 합성 기능 저하.',
    tags: ['#간세포 손상', '#황달 초기', '#합성 기능 저하'],
    eventCard: {
      type: 'Hepatic Marker', status: 'WARNING',
      mainValue: 'AST 240 / ALT 310 ↑', subValue: 'Total Bilirubin: 2.8 mg/dL',
      icon: Activity, color: 'amber',
    },
    metrics: [
      { label: 'AST / ALT', value: '240 / 310', status: 'critical' },
      { label: 'TOTAL BILIRUBIN', value: '2.8 mg/dL', status: 'warning' },
      { label: 'INR (응고수치)', value: '1.8', status: 'warning' },
      { label: 'ALBUMIN', value: '2.9 g/dL', status: 'warning' },
      { label: 'AMMONIA', value: '85 µmol/L', status: 'critical' },
      { label: 'PTT', value: '42s', status: 'warning' },
    ],
  },
  '위': {
    title: '위',
    summary: '소화관 관류 저하 및 스트레스성 병변.',
    tags: ['#장관 허혈 의증', '#잠혈 반응 주의', '#대사성 산증'],
    eventCard: {
      type: 'GI Integrity', status: 'HYPOPERFUSION',
      mainValue: 'Lactate 3.8', subValue: 'Bowel movement: Poor',
      icon: Utensils, color: 'amber',
    },
    metrics: [
      { label: 'GASTRIC PH', value: '3.2', status: 'normal' },
      { label: 'LACTATE', value: '3.8 mmol/L', status: 'critical' },
      { label: 'HB CHANGE', value: '-2.1 g/dL', status: 'warning' },
      { label: 'BOWEL SOUND', value: 'Hypoactive', status: 'warning' },
      { label: 'NPO DURATION', value: '48h', status: 'warning' },
      { label: 'PORTAL FLOW', value: 'Reduced', status: 'warning' },
    ],
  },
  '신장': {
    title: '신장',
    summary: '급성 신손상(AKI) 및 전해질 불균형.',
    tags: ['#AKI STAGE 2', '#고칼륨혈증', '#질소혈증'],
    eventCard: {
      type: 'Renal Filtering', status: 'CRITICAL',
      mainValue: 'Cr 2.1 ↑', subValue: 'Oliguria: 20 mL/h',
      icon: Droplets, color: 'rose',
    },
    metrics: [
      { label: 'CREATININE', value: '2.4 mg/dL', status: 'critical' },
      { label: 'BUN', value: '45 mg/dL', status: 'warning' },
      { label: 'EGFR', value: '32 mL/min', status: 'critical' },
      { label: 'POTASSIUM (K+)', value: '5.8 mEq/L', status: 'critical' },
      { label: 'URINE OUTPUT', value: '0.3 mL/kg/h', status: 'critical' },
      { label: 'FRACTIONAL EXCRETION', value: '1.2%', status: 'normal' },
    ],
  },
};
