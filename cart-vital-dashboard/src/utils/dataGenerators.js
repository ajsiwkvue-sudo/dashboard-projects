/**
 * dataGenerators.js
 * -----------------------------------------------
 * 환자 바이탈 데이터, 기기 자산 데이터를 생성하는 유틸리티 모듈
 * - 실시간 모니터링 시뮬레이션용 더미 데이터 생성
 * - 시나리오별 이상 징후 패턴 적용 (고혈압, 저산소증, 발열, 빈맥)
 */

// ──────────────────────────────────────────────
// 이상 징후 구간 랜덤 생성
// ──────────────────────────────────────────────
export const generateAnomalyIntervals = () => {
  const intervals = [];
  if (Math.random() > 0.4) {
    const start1 = Math.floor(Math.random() * 10) + 2;
    intervals.push({ start: start1, end: start1 + 2 });
  }
  return intervals;
};

// ──────────────────────────────────────────────
// 24시간 바이탈 데이터 생성
// scenario: 'hypertension' | 'hypoxia' | 'fever' | 'tachycardia' | 'normal'
// ──────────────────────────────────────────────
export const generate24HourData = (anomalies, scenario) => {
  return Array.from({ length: 24 }).map((_, i) => {
    const isAbnormal = anomalies.some(
      (interval) => i >= interval.start && i < interval.end
    );

    // 정상 범위 기본값
    let bpSys = 110 + Math.random() * 20;
    let bpDia = 70 + Math.random() * 15;
    let pr = 65 + Math.random() * 20;
    let spo2 = 96 + Math.random() * 3;
    let rr = 14 + Math.random() * 4;
    let bodyTemp = 36.5 + Math.random() * 0.5;

    // 이상 구간: 시나리오별 비정상 수치 적용
    if (isAbnormal) {
      switch (scenario) {
        case "hypertension":
          bpSys = 160 + Math.random() * 30;
          bpDia = 100 + Math.random() * 20;
          break;
        case "hypoxia":
          spo2 = 85 + Math.random() * 7;
          rr = 24 + Math.random() * 8;
          pr += 20;
          break;
        case "fever":
          bodyTemp = 38.2 + Math.random() * 1.5;
          pr += 30;
          rr += 4;
          break;
        case "tachycardia":
          pr = 120 + Math.random() * 30;
          break;
        default:
          bpSys += 20;
      }
    }

    return {
      time: `${String(i).padStart(2, "0")}:00`,
      bpSys,
      bpDia,
      pr,
      spo2,
      rr,
      bodyTemp: Number(bodyTemp.toFixed(1)),
      isAbnormal,
    };
  });
};

// ──────────────────────────────────────────────
// 실시간 신호 패턴 업데이트용 단일 데이터 포인트 생성
// ──────────────────────────────────────────────
export const generateNextDataPoint = (status) => {
  let base = status === "warning" ? 60 : 50;
  let noise = Math.random() * 20 - 10;
  return { value: base + noise };
};

// ──────────────────────────────────────────────
// 환자 목록 생성 (count명)
// - 절반은 이상 징후가 있는 환자로 설정
// - 각 환자에게 24시간 바이탈 히스토리 부여
// ──────────────────────────────────────────────
export const generatePatients = (count) => {
  const names = [
    "김철수", "이영희", "박철수", "최지혜", "정우성",
    "강동원", "한지민", "송혜교", "장동건", "원빈",
    "유재석", "강호동", "신동엽", "이경규", "김구라",
    "박명수", "정준하", "노홍철", "하동훈", "길성준",
  ];
  const depts = ["IM", "GS", "NR", "OS", "FM"];

  return Array.from({ length: count }).map((_, i) => {
    const forceIssue = i < count / 2;
    let scenario = "normal";

    if (forceIssue) {
      if (i % 5 === 0) scenario = "hypertension";
      else if (i % 5 === 1) scenario = "tachycardia";
      else if (i % 5 === 2) scenario = "hypoxia";
      else if (i % 5 === 3) scenario = "fever";
      else scenario = "hypoxia";
    }

    const anomalies = forceIssue ? [{ start: 20, end: 24 }] : [];
    const history = generate24HourData(anomalies, scenario);

    // 마지막 시간대(현재)에 명확한 이상 수치 강제 적용
    if (scenario === "hypertension") { history[23].bpSys = 160; history[23].isAbnormal = true; }
    if (scenario === "tachycardia") { history[23].pr = 120; history[23].isAbnormal = true; }
    if (scenario === "hypoxia") { history[23].spo2 = 88; history[23].rr = 25; history[23].isAbnormal = true; }
    if (scenario === "fever") { history[23].bodyTemp = 38.5; history[23].isAbnormal = true; }

    const current = history[23];
    const isDisconnected = i > count - 3;

    // 경고 판단 기준
    const isHighBp = current.bpSys >= 150;
    const isTachy = current.pr >= 110;
    const isLowSpo2 = current.spo2 < 90;
    const isFever = current.bodyTemp >= 37.5;
    const isWarning = isHighBp || isTachy || isLowSpo2 || isFever;

    let status = "normal";
    let event = "Stable";
    if (isDisconnected) { status = "disconnected"; event = "Disconnected"; }
    else if (isWarning) { status = "warning"; event = "Check Required"; }

    return {
      id: `71-${String(i + 1).padStart(4, "0")}`,
      name: names[i % names.length],
      maskedName: names[i % names.length][0] + "*" + names[i % names.length][2],
      ward: "71병동",
      dept: depts[i % depts.length],
      doctor: i % 2 === 0 ? "김닥터" : "이교수",
      bpSys: Math.floor(current.bpSys),
      bpDia: Math.floor(current.bpDia),
      pr: Math.floor(current.pr),
      spo2: Math.floor(current.spo2),
      rr: Math.floor(current.rr),
      bodyTemp: current.bodyTemp.toFixed(1),
      status,
      event,
      battery: isDisconnected ? 0 : Math.floor(Math.random() * 60 + 40),
      signalPattern: Array.from({ length: 40 }).map(() => ({ value: 50 + Math.random() * 10 })),
      history24h: history,
      isFever,
      isHighBp,
      isLowSpo2,
      isTachy,
    };
  });
};

// ──────────────────────────────────────────────
// 기기 자산 목록 생성 (물류 관리용)
// - 상태: STORAGE / DISPATCH / DELIVERED / IN_USE / RETURN / CLEANING / REPAIR
// ──────────────────────────────────────────────
export const generateAssets = (count) => {
  const pTypes = ["입원", "외래", "지역사회"];
  const names = ["김철수", "이영희", "박민수", "최지혜", "정우성", "강동원", "한지민"];

  return Array.from({ length: count }).map((_, i) => {
    const pType = pTypes[i % pTypes.length];
    const rand = Math.random();
    let status = "STORAGE";

    // 환자 유형별 상태 분포 설정
    if (pType === "입원") {
      if (rand < 0.7) status = "IN_USE";
      else if (rand < 0.8) status = "CLEANING_REPAIR";
      else if (rand < 0.9) status = "STORAGE";
      else status = "CLEANING_REPAIR";
    } else {
      if (rand < 0.1) status = "STORAGE";
      else if (rand < 0.2) status = "DISPATCH";
      else if (rand < 0.25) status = "DELIVERED";
      else if (rand < 0.75) status = "IN_USE";
      else if (rand < 0.85) status = "RETURN";
      else status = "CLEANING_REPAIR";
    }

    const hasUser = ["IN_USE", "DISPATCH", "DELIVERED", "RETURN"].includes(status);
    const wornDate = hasUser
      ? new Date(Date.now() - Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000))
          .toISOString().split("T")[0]
      : "-";

    const roomLoc = Math.floor(Math.random() * 4) + 1;
    const roomType = 4;
    const roomNum = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
    const internalLocCode = `${roomLoc}${roomType}${roomNum}`;

    return {
      id: `CR-${String(i + 1).padStart(4, "0")}`,
      status,
      battery: Math.floor(Math.random() * 100),
      lastSync: new Date(Date.now() - Math.floor(Math.random() * 10000000)).toLocaleString(),
      patientName: hasUser ? names[i % names.length] : "-",
      patientType: pType,
      wornDate,
      locationLabel: hasUser
        ? pType === "입원" ? `71-${internalLocCode}` : `재택-${i % 5}`
        : status === "STORAGE" ? "제1보관소" : "AS센터",
    };
  });
};
