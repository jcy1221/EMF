import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Factory, Truck, Clock, AlertTriangle, CheckCircle2, 
  Settings2, Plus, Trash2, Coffee, TrendingUp, Info, Zap, 
  Calendar, BarChart3, Activity, ShieldAlert, HelpCircle, X, LayoutTemplate,
  Table as TableIcon, Download, Upload, Share2, Cloud, Link, Laptop, Database
} from 'lucide-react';

// --- Firebase Imports (현재 미사용 / 하위 호환성 유지) ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc } from 'firebase/firestore';

// --- Firebase Initialization ---
let app, auth, db;
try {
  const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
  if (firebaseConfig && Object.keys(firebaseConfig).length > 0) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } else {
    console.warn("⚠️ Firebase 설정 없음. 클라우드 공유 제한.");
  }
} catch (error) {
  console.error("Firebase 초기화 오류:", error);
}

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// ==========================================
// 🏢 [공장 리스트 (하드코딩 영역)]
// ==========================================
const FACTORY_PRESETS = {
  "기본 (미설정)": { bps: [{ id: 1, capacity: 210 }], ownTrucks: 30, internalLoss: 5, endTime: "18:00" },
  "부천레미콘": { bps: [{ id: 1, capacity: 240 }, { id: 2, capacity: 240 }], ownTrucks: 70, internalLoss: 5, endTime: "17:00" },
  "강서레미콘": { bps: [{ id: 1, capacity: 240 }, { id: 2, capacity: 360 }], ownTrucks: 70, internalLoss: 5, endTime: "17:00" },
  "인천레미콘": { bps: [{ id: 1, capacity: 240 }, { id: 2, capacity: 360 }], ownTrucks: 55, internalLoss: 5, endTime: "17:00" },
  "서인천공장": { bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }], ownTrucks: 55, internalLoss: 5, endTime: "17:00" },
  "송도레미콘": { bps: [{ id: 1, capacity: 240 }, { id: 2, capacity: 240 }], ownTrucks: 72, internalLoss: 5, endTime: "18:00" },
  "서서울레미콘": { bps: [{ id: 1, capacity: 240 }, { id: 2, capacity: 240 }, { id: 3, capacity: 210 }, { id: 4, capacity: 210 }], ownTrucks: 150, internalLoss: 5, endTime: "17:00" },
  "동서울레미콘": { bps: [{ id: 1, capacity: 360 }, { id: 2, capacity: 360 }], ownTrucks: 84, internalLoss: 5, endTime: "17:00" },
  "이순R 남양주": { bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }], ownTrucks: 24, internalLoss: 5, endTime: "17:00" },
  "이순R 동두천": { bps: [{ id: 1, capacity: 210 }], ownTrucks: 24, internalLoss: 5, endTime: "17:00" },
  "춘천레미콘": { bps: [{ id: 1, capacity: 210 }], ownTrucks: 12, internalLoss: 5, endTime: "17:00" },
  "수지레미콘": { bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }], ownTrucks: 52, internalLoss: 5, endTime: "17:00" },
  "광주레미콘": { bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }], ownTrucks: 40, internalLoss: 5, endTime: "17:00" },
  "안산레미콘": { bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }], ownTrucks: 60, internalLoss: 5, endTime: "17:00" },
  "수원레미콘": { bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }], ownTrucks: 49, internalLoss: 5, endTime: "17:00" },
  "지구레미콘": { bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }], ownTrucks: 16, internalLoss: 5, endTime: "17:00" },
  "평택레미콘": { bps: [{ id: 1, capacity: 240 }, { id: 2, capacity: 210 }], ownTrucks: 50, internalLoss: 5, endTime: "17:00" },
  "안성레미콘": { bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }], ownTrucks: 32, internalLoss: 5, endTime: "17:00" },
  "천안레미콘": { bps: [{ id: 1, capacity: 240 }, { id: 2, capacity: 240 }], ownTrucks: 40, internalLoss: 5, endTime: "17:00" },
  "세종레미콘": { bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }], ownTrucks: 32, internalLoss: 5, endTime: "17:00" },
  "당진레미콘": { bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }], ownTrucks: 13, internalLoss: 5, endTime: "17:00" },
  "광주공장": { bps: [{ id: 1, capacity: 240 }], ownTrucks: 28, internalLoss: 5, endTime: "17:00" },
  "나주공장": { bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }], ownTrucks: 23, internalLoss: 5, endTime: "17:00" },
  "군산레미콘": { bps: [{ id: 1, capacity: 210 }], ownTrucks: 12, internalLoss: 5, endTime: "17:00" },
  "김해공장": { bps: [{ id: 1, capacity: 210 }], ownTrucks: 22, internalLoss: 5, endTime: "16:00" }
};

export default function App() {
  // --- 1. State Management ---
  const [isMobile, setIsMobile] = useState(false);
  const [isSharedView, setIsSharedView] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return !!params.get('share') || !!params.get('id');
    }
    return false;
  });

  const [toastMsg, setToastMsg] = useState('');
  const [user, setUser] = useState(null);
  
  const [activeModal, setActiveModal] = useState(null); 
  const fileInputRef = useRef(null);
  const dataFactoryInputRef = useRef(null);
  
  const [selectedPreset, setSelectedPreset] = useState("기본 (미설정)");

  const [factoryConfig, setFactoryConfig] = useState({
    bps: [{ id: 1, capacity: 210 }],
    truckVolume: 6,       
    ownTrucks: 30,
    plannedExtTrucks: 0, 
    lunchStart: "11:30",
    lunchEnd: "13:00",
    lunchBreak: 30,       
    startTime: "07:00",   
    endTime: "18:00",     
    internalLoss: 5       
  });

  const [sites, setSites] = useState([
    {
      id: 1,
      name: "",
      volume: 0,        
      travelTime: 0, 
      startTime: "08:00",
      targetInterval: 0,
      isSpecial: false,
      specialTime: 0,
      strategy: "기본 배차" 
    }
  ]);

  // --- Data Factory States ---
  const [dfStatus, setDfStatus] = useState('idle'); // idle, processing, done
  const [dfStats, setDfStats] = useState(null);
  const [dfSiteSummary, setDfSiteSummary] = useState(null);
  const [dfWeightSummary, setDfWeightSummary] = useState(null);

  // --- 2. Auth & Mobile Detect ---
  useEffect(() => {
    const handleResizeOrDetect = () => {
      const ua = typeof window.navigator !== "undefined" ? navigator.userAgent : "";
      const isRealMobileOS = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      const isExtremelyNarrow = window.innerWidth < 768;
      setIsMobile(isRealMobileOS || isExtremelyNarrow);
    };
    handleResizeOrDetect();
    window.addEventListener('resize', handleResizeOrDetect);

    if (!auth) return;

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {}
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('resize', handleResizeOrDetect);
    };
  }, []);

  // --- 3. Utilities ---
  const timeToMinutes = (timeStr) => {
    if (!timeStr || !timeStr.includes(':')) return 0;
    const [hrs, mins] = timeStr.split(':').map(Number);
    return (hrs || 0) * 60 + (mins || 0);
  };

  const minutesToTime = (totalMins) => {
    const roundedMins = Math.round(totalMins);
    const hrs = Math.floor(roundedMins / 60);
    const mins = roundedMins % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const handleTimeClick = (e) => {
    if (e.target.showPicker) {
      try { e.target.showPicker(); } catch (err) {}
    }
  };

  const fmt = (num) => {
    if (num === null || num === undefined || num === "N/A" || isNaN(num)) return num;
    return Number(num).toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  // --- 4. DATA FACTORY LOGIC (30만건 파싱 및 아웃라이어 정제) ---
  const handleDataFactoryUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setDfStatus('processing');
    setDfStats(null);
    setDfSiteSummary(null);
    setDfWeightSummary(null);

    // 브라우저 멈춤을 방지하기 위해 setTimeout으로 렌더링 틈을 줍니다.
    setTimeout(() => {
      const reader = new FileReader();
      // EUC-KR 인코딩 엑셀 CSV 대응
      reader.readAsText(file, 'euc-kr');
      
      reader.onload = (event) => {
        let csvText = event.target.result;
        // 인코딩이 깨졌다면 UTF-8로 다시 시도
        if (csvText.includes('')) {
            const readerUtf8 = new FileReader();
            readerUtf8.readAsText(file, 'utf-8');
            readerUtf8.onload = (ev) => processDataFactoryText(ev.target.result);
            return;
        }
        processDataFactoryText(csvText);
      };
    }, 100);
  };

  const processDataFactoryText = (csvText) => {
    const lines = csvText.split('\n');
    let totalRows = 0;
    let validRows = 0;
    let outlierRows = 0;

    // 데이터 구조화
    // { siteCode: { name, plant, trips: [], hourlyTrips: { "08": [], ... } } }
    const siteData = {};

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      totalRows++;

      // 쉼표 분리 (따옴표로 묶인 쉼표 처리 무시 - 심플 버전)
      const cols = line.split(',');
      if (cols.length < 5) continue;

      const plant = cols[0].trim();
      const siteCode = cols[1].trim();
      const siteName = cols[2].trim();
      const timeStr = cols[3].trim(); // HH:mm:ss
      const travelTime = parseFloat(cols[4].trim());

      if (!plant || !siteCode || isNaN(travelTime) || travelTime <= 0) {
        outlierRows++;
        continue;
      }

      let hour = timeStr.split(':')[0];
      if (hour && hour.length === 1) hour = `0${hour}`; // 8 -> 08

      if (!siteData[siteCode]) {
        siteData[siteCode] = { siteCode, siteName, plant, trips: [], hourlyTrips: {} };
      }

      siteData[siteCode].trips.push(travelTime);
      if (!siteData[siteCode].hourlyTrips[hour]) siteData[siteCode].hourlyTrips[hour] = [];
      siteData[siteCode].hourlyTrips[hour].push(travelTime);
    }

    // 1단계: 현장별 아웃라이어 제거 (IQR 기법 적용) 및 평균 산출
    const siteSummaries = [];
    
    // 2단계 가중치 계산을 위한 준비: 현장별 시간대 평균 저장
    // { plantName: { hour1: [ratio1, ratio2...], hour2: ... } }
    const plantHourlyRatios = {};

    Object.values(siteData).forEach(site => {
      // trips가 5개 미만인 현장은 IQR 대신 단순 평균(혹은 제외) 처리
      const sortedTrips = [...site.trips].sort((a, b) => a - b);
      let validTrips = sortedTrips;

      if (sortedTrips.length >= 5) {
        const q1 = sortedTrips[Math.floor(sortedTrips.length * 0.25)];
        const q3 = sortedTrips[Math.floor(sortedTrips.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = Math.max(1, q1 - 1.5 * iqr); // 최소 1분
        const upperBound = q3 + 1.5 * iqr;

        validTrips = sortedTrips.filter(t => t >= lowerBound && t <= upperBound);
        outlierRows += (sortedTrips.length - validTrips.length);
      }

      validRows += validTrips.length;

      if (validTrips.length === 0) return;

      const overallAvg = validTrips.reduce((a, b) => a + b, 0) / validTrips.length;

      // 시간대별 평균 산출 및 공장 가중치 비율 계산
      const hourlyAvg = {};
      Object.keys(site.hourlyTrips).forEach(hr => {
        // 해당 시간대의 trip들도 아웃라이어 필터링 적용된 validTrips 범위 내에 있는지 체크
        const validHrTrips = site.hourlyTrips[hr].filter(t => validTrips.includes(t));
        if (validHrTrips.length > 0) {
          const hrAvg = validHrTrips.reduce((a, b) => a + b, 0) / validHrTrips.length;
          hourlyAvg[hr] = hrAvg;

          // 공장 가중치를 위해 비율 저장 (이 시간대 평균 / 전체 평균)
          if (!plantHourlyRatios[site.plant]) plantHourlyRatios[site.plant] = {};
          if (!plantHourlyRatios[site.plant][hr]) plantHourlyRatios[site.plant][hr] = [];
          
          plantHourlyRatios[site.plant][hr].push(hrAvg / overallAvg);
        }
      });

      siteSummaries.push({
        plant: site.plant,
        siteCode: site.siteCode,
        siteName: site.siteName,
        dataCount: validTrips.length,
        avgTime: Math.round(overallAvg),
        hourlyAvg: hourlyAvg
      });
    });

    // 2단계: 공장별 시간대 가중치 산출
    const weightSummaries = [];
    Object.keys(plantHourlyRatios).forEach(plant => {
      Object.keys(plantHourlyRatios[plant]).forEach(hr => {
        const ratios = plantHourlyRatios[plant][hr];
        const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
        weightSummaries.push({
          plant: plant,
          hour: hr,
          weight: Number(avgRatio.toFixed(3)),
          dataPoints: ratios.length // 산출에 사용된 현장 개수
        });
      });
    });

    setDfStats({ totalRows, validRows, outlierRows, siteCount: siteSummaries.length });
    setDfSiteSummary(siteSummaries);
    setDfWeightSummary(weightSummaries.sort((a, b) => a.plant.localeCompare(b.plant) || a.hour.localeCompare(b.hour)));
    setDfStatus('done');
  };

  const downloadDataFactoryCsv = (type) => {
    const bom = "\uFEFF";
    let headers = "";
    let csvContent = "";

    if (type === 'site') {
      headers = "플랜트,현장코드,현장명,유효데이터수,평균왕복시간(분)\n";
      csvContent = dfSiteSummary.map(s => `${s.plant},${s.siteCode},"${s.siteName}",${s.dataCount},${s.avgTime}`).join("\n");
    } else {
      headers = "플랜트,시간대,가중치,산출기반_현장수\n";
      csvContent = dfWeightSummary.map(w => `${w.plant},${w.hour}시,${w.weight},${w.dataPoints}`).join("\n");
    }

    const blob = new Blob([bom + headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = type === 'site' ? "1_현장별_평균왕복시간_요약.csv" : "2_공장별_시간대가중치_요약.csv";
    link.click();
  };

  // --- 5. Share Handlers ---
  const handleShare = async () => { /* (기존 코드와 동일) 생략하지 않고 유지 */
    if (!db || !auth) {
      setToastMsg('⚠️ 외부 서버(Vercel 등)에서는 자체 DB 연결해야 클라우드 기능을 쓸 수 있습니다.');
      setTimeout(() => setToastMsg(''), 3500);
      return;
    }
    if (!user) {
      setToastMsg('시스템에 연결 중입니다. 잠시 후 다시 시도해주세요.');
      setTimeout(() => setToastMsg(''), 3000);
      return;
    }
    try {
      const shareId = crypto.randomUUID().split('-')[0];
      const stateToShare = { factoryConfig, sites, selectedPreset, createdAt: new Date().toISOString() };
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'shares', shareId);
      await setDoc(docRef, stateToShare);
      const url = new URL(window.location.href);
      url.searchParams.delete('share');
      url.searchParams.set('id', shareId);
      const tempInput = document.createElement('input');
      tempInput.value = url.toString();
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      setToastMsg('클라우드에 저장하고 공유 링크를 복사했어요! ☁️🔗');
      setTimeout(() => setToastMsg(''), 3500);
    } catch (err) {
      setToastMsg('링크 생성에 실패했습니다. 다시 시도해주세요.');
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  const handleLegacyShare = () => {
    try {
      const stateToShare = { factoryConfig, sites, selectedPreset }; 
      const encodedState = btoa(encodeURIComponent(JSON.stringify(stateToShare)));
      const url = new URL(window.location.href);
      url.searchParams.delete('id');
      url.searchParams.set('share', encodedState);
      const tempInput = document.createElement('input');
      tempInput.value = url.toString();
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      setToastMsg('링크가 복사되었습니다! 🔗');
      setTimeout(() => setToastMsg(''), 3500);
    } catch (err) {
      setToastMsg('링크 생성에 실패했습니다.');
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  const downloadTemplate = () => {
    const bom = "\uFEFF";
    const headers = "현장명,주문량(㎥),개시시각(HH:MM),총왕복시간(분),요구간격(분),특수배합(O/X),특수추가시간(분),배차방식(기본 배차/용차 우선/자차 전용)\n";
    const sample1 = "A아파트 1공구,120,08:00,60,10,X,0,기본 배차\n";
    const sample2 = "B상가 신축,60,09:30,40,0,O,5,용차 우선\n";
    const blob = new Blob([bom + headers + sample1 + sample2], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "현장업로드_표준양식_v1.59.csv";
    link.click();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target.result;
      const lines = csvText.split('\n').filter(line => line.trim() !== '');
      if (lines.length <= 1) { alert("데이터가 없거나 잘못된 형식입니다."); return; }

      const defaultTime = (selectedPreset === "송도레미콘" || selectedPreset === "김해공장") ? "07:00" : "08:00";

      const newSites = lines.slice(1).map((line, index) => {
        const cols = line.split(',');
        let parsedStrategy = cols[7]?.trim() || "기본 배차";
        if (parsedStrategy === "자차우선" || parsedStrategy === "무관") parsedStrategy = "기본 배차";
        else if (parsedStrategy === "용차우선") parsedStrategy = "용차 우선";

        return {
          id: Date.now() + index,
          name: cols[0]?.trim() || `업로드 현장 ${index + 1}`,
          volume: Number(cols[1]) || 0,
          startTime: cols[2]?.trim() || defaultTime,
          travelTime: Number(cols[3]) || 0,
          targetInterval: Number(cols[4]) || 0,
          isSpecial: cols[5]?.trim().toUpperCase() === 'O',
          specialTime: Number(cols[6]) || 0,
          strategy: parsedStrategy
        };
      });

      setSites(prev => {
        const filteredPrev = prev.filter(s => s.name.trim() !== "" || s.volume > 0);
        return [...filteredPrev, ...newSites];
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // --- 6. Core Simulation Logic ---
  const analysis = useMemo(() => {
    const totalCapaPerHour = factoryConfig.bps.reduce((sum, bp) => sum + bp.capacity, 0);
    const avgProductionInterval = totalCapaPerHour > 0 ? (6 / totalCapaPerHour) * 60 : 0;

    const startMin = timeToMinutes("07:00");
    const lastOrderMin = timeToMinutes(factoryConfig.endTime);
    const lunchStartMin = timeToMinutes(factoryConfig.lunchStart);
    const lunchEndMin = timeToMinutes(factoryConfig.lunchEnd);
    
    const endMin = Math.max(timeToMinutes("18:00"), lastOrderMin + 120);

    let totalPlannedVolume = 0;
    let allRequests = [];

    const calculatedSites = sites.map(site => {
      // 총 왕복시간 + 공장 내부 로스
      const rt = site.travelTime + factoryConfig.internalLoss;
      const effectiveInterval = site.targetInterval > 0 ? Math.max(avgProductionInterval, site.targetInterval) : (avgProductionInterval || 10);
      const siteBpInterval = avgProductionInterval + (site.isSpecial ? Number(site.specialTime) : 0);

      if (site.volume <= 0) {
        return { ...site, rt, cycleTrucks: 0, totalTrucksForOrder: 0, isCapaShort: false, effectiveInterval };
      }

      const cycleTrucks = Math.ceil(rt / effectiveInterval);
      const totalTrucksForOrder = Math.ceil(site.volume / 6);
      totalPlannedVolume += Number(site.volume);
      const startMinutes = timeToMinutes(site.startTime);
      
      let currentReqTime = startMinutes;

      for (let i = 0; i < totalTrucksForOrder; i++) {
        allRequests.push({ reqTime: currentReqTime, rt, isSpecial: site.isSpecial, specialTime: site.specialTime, strategy: site.strategy, siteName: site.name });
        
        if (i < 9) {
          currentReqTime += siteBpInterval; 
        } else {
          currentReqTime += effectiveInterval;
        }
      }

      const isCapaShort = siteBpInterval > site.targetInterval && site.targetInterval > 0;
      return { ...site, rt, cycleTrucks, totalTrucksForOrder, isCapaShort, effectiveInterval };
    });

    allRequests.sort((a, b) => a.reqTime - b.reqTime);
    
    const simulateDetailedVolume = (poolSize) => {
      let truckAvailTimes = Array(poolSize).fill(startMin);
      let expectedVol = 0;
      let bpAvailableAt = startMin;
      let hourlyVols = {};
      let activeEvents = []; 
      let activeTrucksAtMin = new Array(endMin - startMin + 1).fill(0);

      for (let i = 0; i < allRequests.length; i++) {
        const req = allRequests[i];
        let actualT = Math.max(req.reqTime, bpAvailableAt);
        if (actualT > lastOrderMin) continue;

        let minAvailTime = truckAvailTimes[0];
        let selectedIdx = 0;
        for (let j = 1; j < truckAvailTimes.length; j++) {
          if (truckAvailTimes[j] < minAvailTime) {
            minAvailTime = truckAvailTimes[j];
            selectedIdx = j;
          }
        }

        if (minAvailTime > actualT) actualT = minAvailTime;
        if (actualT > lastOrderMin) continue;

        expectedVol += 6;
        let hr = Math.floor(actualT / 60);
        hourlyVols[hr] = (hourlyVols[hr] || 0) + 6;

        let returnTime = actualT + req.rt;
        if (returnTime >= lunchStartMin && returnTime <= lunchEndMin) returnTime += factoryConfig.lunchBreak;
        truckAvailTimes[selectedIdx] = returnTime;

        activeEvents.push({ time: actualT, type: 1 });
        activeEvents.push({ time: returnTime, type: -1 });

        const sIdx = Math.floor(Math.max(0, actualT - startMin));
        const eIdx = Math.floor(Math.min(returnTime - startMin, activeTrucksAtMin.length - 1));
        for (let k = sIdx; k < eIdx; k++) {
          activeTrucksAtMin[k]++;
        }

        const bpInterval = avgProductionInterval + (req.isSpecial ? Number(req.specialTime) : 0);
        bpAvailableAt = actualT + bpInterval;
      }

      activeEvents.sort((a, b) => a.time === b.time ? a.type - b.type : a.time - b.time);
      let peakActive = 0, currentActive = 0;
      activeEvents.forEach(e => {
        currentActive += e.type;
        if (currentActive > peakActive) peakActive = currentActive;
      });

      return { expectedVol, hourlyVols, peakActive, activeTrucksAtMin };
    };

    let timeLimitOnlyVolume = 0;
    sites.forEach(site => {
      if (site.volume <= 0) return;
      const totalTrips = Math.ceil(site.volume / 6);
      let reqT = timeToMinutes(site.startTime);
      for(let i=0; i<totalTrips; i++) {
        if (reqT <= lastOrderMin) {
          timeLimitOnlyVolume += 6;
        }
        if (i < 9) {
          reqT += site.isSpecial ? Number(site.specialTime) : 1;
        } else {
          reqT += site.targetInterval > 0 ? site.targetInterval : 1;
        }
      }
    });

    const maxPossibleSim = simulateDetailedVolume(999);
    const maxPossibleVol = maxPossibleSim.expectedVol;
    const trueIdealPeakTrucks = maxPossibleSim.peakActive; 
    const idealTrucksInUseAtMin = maxPossibleSim.activeTrucksAtMin;
    
    let minRequiredTrucks = "N/A";
    let isBPBottleneck = (maxPossibleVol < totalPlannedVolume) && (maxPossibleVol < timeLimitOnlyVolume);
    
    if (maxPossibleVol >= totalPlannedVolume && totalPlannedVolume > 0) {
      for (let k = 1; k <= trueIdealPeakTrucks; k++) {
        if (simulateDetailedVolume(k).expectedVol >= totalPlannedVolume) {
          minRequiredTrucks = k;
          break;
        }
      }
    }

    let trucks = [];
    for(let i=0; i<factoryConfig.ownTrucks; i++) trucks.push({ id: `o_${i}`, type: 'own', availableAt: startMin, trips: 0 });
    for(let i=0; i<factoryConfig.plannedExtTrucks; i++) trucks.push({ id: `e_${i}`, type: 'ext', availableAt: startMin, trips: 0 });

    let bpAvailableAt = startMin;
    let expectedVolume = 0;
    let currentHourlyVols = {};
    let delayLogs = []; 

    let actualOwnInUse = new Array(endMin - startMin + 1).fill(0);
    let actualExtInUse = new Array(endMin - startMin + 1).fill(0);

    // 현실적인 배차 알고리즘 적용 루프
    allRequests.forEach(req => {
      let bpReadyT = Math.max(req.reqTime, bpAvailableAt);
      if (bpReadyT > lastOrderMin) return;

      let actualT = bpReadyT;
      let reqStrategy = req.strategy;
      if (reqStrategy === "자차우선" || reqStrategy === "무관") reqStrategy = "기본 배차";
      if (reqStrategy === "용차우선") reqStrategy = "용차 우선";

      let validTrucks = trucks;
      if (reqStrategy === "자차 전용") {
        validTrucks = trucks.filter(t => t.type === 'own');
      }

      if (validTrucks.length === 0) return; 

      let earliestOwn = validTrucks.filter(t => t.type === 'own').sort((a,b) => a.availableAt === b.availableAt ? a.trips - b.trips : a.availableAt - b.availableAt)[0];
      let earliestExt = validTrucks.filter(t => t.type === 'ext').sort((a,b) => a.availableAt === b.availableAt ? a.trips - b.trips : a.availableAt - b.availableAt)[0];

      let ownDelay = earliestOwn ? Math.max(0, earliestOwn.availableAt - actualT) : Infinity;
      let extDelay = earliestExt ? Math.max(0, earliestExt.availableAt - actualT) : Infinity;

      let selectedTruck = null;

      let currentTotalOwnTrips = trucks.filter(t => t.type === 'own').reduce((sum, t) => sum + t.trips, 0);
      let avgOwnTrips = factoryConfig.ownTrucks > 0 ? currentTotalOwnTrips / factoryConfig.ownTrucks : 0;

      if (reqStrategy === "자차 전용") {
        selectedTruck = earliestOwn;
      } 
      else if (reqStrategy === "기본 배차") {
        if (ownDelay === 0 && extDelay === 0) selectedTruck = earliestOwn;
        else if (ownDelay === 0) selectedTruck = earliestOwn;
        else if (extDelay === 0) selectedTruck = earliestExt;
        else selectedTruck = ownDelay <= extDelay ? earliestOwn : earliestExt;
      }
      else if (reqStrategy === "용차 우선") {
        let isExtCapped = earliestExt && (earliestExt.trips >= avgOwnTrips);
        
        if (isExtCapped || !earliestExt) {
            if (ownDelay === 0 && extDelay === 0) selectedTruck = earliestOwn;
            else if (ownDelay === 0) selectedTruck = earliestOwn;
            else if (extDelay === 0) selectedTruck = earliestExt;
            else selectedTruck = ownDelay <= extDelay ? earliestOwn : earliestExt;
        } else {
            if (extDelay >= 10 && ownDelay < extDelay) selectedTruck = earliestOwn;
            else selectedTruck = earliestExt;
        }
      }

      if (!selectedTruck) return;

      actualT = Math.max(actualT, selectedTruck.availableAt);
      if (actualT > lastOrderMin) return;

      let totalDelay = actualT - req.reqTime;
      if (totalDelay > 0) delayLogs.push({ siteName: req.siteName, reqTime: req.reqTime, delayMins: totalDelay });

      expectedVolume += 6;
      selectedTruck.trips += 1;
      
      let hr = Math.floor(actualT / 60);
      currentHourlyVols[hr] = (currentHourlyVols[hr] || 0) + 6;

      let returnTime = actualT + req.rt;
      if (returnTime >= lunchStartMin && returnTime <= lunchEndMin) returnTime += factoryConfig.lunchBreak;
      selectedTruck.availableAt = returnTime;

      const bpInterval = avgProductionInterval + (req.isSpecial ? Number(req.specialTime) : 0);
      bpAvailableAt = actualT + bpInterval;

      const startIdx = Math.floor(Math.max(0, actualT - startMin));
      const endIdx = Math.floor(Math.min(returnTime - startMin, actualOwnInUse.length - 1));

      for (let k = startIdx; k < endIdx; k++) {
        if (selectedTruck.type === 'own') actualOwnInUse[k]++;
        else actualExtInUse[k]++;
      }
    });

    const expectedOutput = Math.min(totalPlannedVolume, expectedVolume);
    const unmetVolume = Math.max(0, totalPlannedVolume - expectedOutput);

    const totalTrucks = factoryConfig.ownTrucks + factoryConfig.plannedExtTrucks;
    const timeSlots = [];
    let absoluteMaxShortage = 0; 

    for (let m = startMin; m <= endMin; m += 10) {
      const idx = m - startMin;
      const usedOwn = actualOwnInUse[idx] || 0; 
      const usedExt = actualExtInUse[idx] || 0;
      const idealRequired = idealTrucksInUseAtMin[idx] || 0;
      const shortage = Math.max(0, idealRequired - totalTrucks); 
      const availableOwn = Math.max(0, factoryConfig.ownTrucks - usedOwn);
      const availableExt = Math.max(0, factoryConfig.plannedExtTrucks - usedExt);
      const available = availableOwn + availableExt; 
      if (shortage > absoluteMaxShortage) absoluteMaxShortage = shortage;
      timeSlots.push({ time: minutesToTime(m), available, availableOwn, availableExt, shortage });
    }

    const siteDelaySummary = {};
    delayLogs.forEach(log => {
      const name = log.siteName || "미입력 현장";
      if (!siteDelaySummary[name]) siteDelaySummary[name] = { minTime: log.reqTime, maxTime: log.reqTime, maxDelay: log.delayMins, count: 0 };
      siteDelaySummary[name].minTime = Math.min(siteDelaySummary[name].minTime, log.reqTime);
      siteDelaySummary[name].maxTime = Math.max(siteDelaySummary[name].maxTime, log.reqTime);
      siteDelaySummary[name].maxDelay = Math.max(siteDelaySummary[name].maxDelay, log.delayMins);
      siteDelaySummary[name].count += 1;
    });

    const delayReport = Object.keys(siteDelaySummary).map(name => ({
      siteName: name,
      timeRange: siteDelaySummary[name].minTime === siteDelaySummary[name].maxTime 
                 ? minutesToTime(siteDelaySummary[name].minTime)
                 : `${minutesToTime(siteDelaySummary[name].minTime)} ~ ${minutesToTime(siteDelaySummary[name].maxTime)}`,
      maxDelay: Math.round(siteDelaySummary[name].maxDelay),
      count: siteDelaySummary[name].count
    }));

    const totalTripsOwn = trucks.filter(t => t.type === 'own').reduce((sum, t) => sum + t.trips, 0);
    const totalTripsExt = trucks.filter(t => t.type === 'ext').reduce((sum, t) => sum + t.trips, 0);
    const avgTripsOwn = factoryConfig.ownTrucks > 0 ? (totalTripsOwn / factoryConfig.ownTrucks).toFixed(1) : '0.0';
    const avgTripsExt = factoryConfig.plannedExtTrucks > 0 ? (totalTripsExt / factoryConfig.plannedExtTrucks).toFixed(1) : '0.0';

    const sensitivityData = [];
    const chartStartK = Math.max(1, totalTrucks - 10);
    const chartEndK = totalTrucks + 10;
    for (let k = chartStartK; k <= chartEndK; k++) {
      sensitivityData.push({ trucks: k, own: Math.min(k, factoryConfig.ownTrucks), ext: Math.max(0, k - factoryConfig.ownTrucks), expectedOutput: simulateDetailedVolume(k).expectedVol });
    }

    const optimalHourlyVols = maxPossibleSim.hourlyVols;

    let maxHour = Math.floor(endMin / 60);
    for(let h = maxHour; h >= 7; h--) {
       if((currentHourlyVols[h] || 0) > 0 || (optimalHourlyVols[h] || 0) > 0) {
          maxHour = h; break;
       }
    }
    
    const hourlyTableData = [];
    let sumOpt = 0; let sumCur = 0;
    for(let h = 7; h <= maxHour; h++) {
       const opt = optimalHourlyVols[h] || 0;
       const cur = currentHourlyVols[h] || 0;
       sumOpt += opt; sumCur += cur;
       hourlyTableData.push({ hour: h, label: `${h}시`, optimal: opt, current: cur, gap: cur - opt });
    }

    return { 
      calculatedSites, totalPlannedVolume, expectedOutput, unmetVolume,
      idealPeakTrucks: trueIdealPeakTrucks, minRequiredTrucks, isBPBottleneck,
      avgTripsOwn, avgTripsExt, timeSlots, totalCapaPerHour, totalActualTrucks: totalTrucks,
      avgProductionInterval, delayReport, sensitivityData, maxPossibleVol, absoluteMaxShortage,
      hourlyTableData, sumOpt, sumCur
    };
  }, [sites, factoryConfig]);

  // --- 7. Additional Handlers ---
  const handlePresetChange = (e) => {
    const presetName = e.target.value;
    setSelectedPreset(presetName);
    if (FACTORY_PRESETS[presetName]) {
      setFactoryConfig({ ...factoryConfig, ...FACTORY_PRESETS[presetName], bps: JSON.parse(JSON.stringify(FACTORY_PRESETS[presetName].bps)) });
    }
    const newDefaultTime = (presetName === "송도레미콘" || presetName === "김해공장") ? "07:00" : "08:00";
    setSites(prevSites => prevSites.map(site => {
      if (site.name === "" && site.volume === 0 && (site.startTime === "08:00" || site.startTime === "07:00")) {
        return { ...site, startTime: newDefaultTime };
      }
      return site;
    }));
  };

  const addBP = () => setFactoryConfig({ ...factoryConfig, bps: [...factoryConfig.bps, { id: Date.now(), capacity: 210 }] });
  const removeBP = (id) => factoryConfig.bps.length > 1 && setFactoryConfig({ ...factoryConfig, bps: factoryConfig.bps.filter(bp => bp.id !== id) });
  const updateBP = (id, cap) => setFactoryConfig({ ...factoryConfig, bps: factoryConfig.bps.map(bp => bp.id === id ? { ...bp, capacity: Number(cap) } : bp) });
  
  const addSite = () => {
    const defaultTime = (selectedPreset === "송도레미콘" || selectedPreset === "김해공장") ? "07:00" : "08:00";
    setSites([...sites, { id: Date.now(), name: "", volume: 0, travelTime: 0, startTime: defaultTime, targetInterval: 0, isSpecial: false, specialTime: 0, strategy: "기본 배차" }]);
  };
  const updateSite = (id, field, val) => setSites(sites.map(s => s.id === id ? { ...s, [field]: val } : s));
  const removeSite = (id) => setSites(sites.filter(s => s.id !== id));

  // --- Main UI Rendering ---
  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans text-slate-900 overflow-hidden select-none relative">
      <header className="bg-white border-b border-slate-200 px-3 md:px-8 py-2.5 md:py-3 flex justify-between items-center shrink-0 z-30 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-2 md:gap-4 min-w-0 pr-2">
          <div className="bg-indigo-900 p-2 md:p-2.5 rounded-xl shadow-lg shadow-indigo-100 hidden sm:block shrink-0">
            <Zap className="text-yellow-400 fill-yellow-400" size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[13px] sm:text-base md:text-xl font-black text-indigo-950 flex items-center gap-1.5 md:gap-2 tracking-tight uppercase truncate">
              <span className="truncate">Eugene MT Flow Optimizer</span>
              <span className="hidden sm:inline-block text-[10px] md:text-xs bg-indigo-100 px-1.5 py-0.5 md:px-2 rounded text-indigo-600 uppercase font-black shrink-0">v1.59</span>
            </h1>
            <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest hidden md:block mt-0.5 truncate">MT Dispatch Reality Simulator</p>
          </div>
        </div>
        
        <div className="flex gap-1.5 md:gap-3 shrink-0">
          <button onClick={() => setActiveModal('dataFactory')} className="flex items-center justify-center gap-1.5 md:gap-2 w-9 h-9 md:w-auto md:h-auto md:px-5 md:py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200 transition-colors shadow-sm active:scale-95 group shrink-0">
            <Database size={16} className="group-hover:text-emerald-600" />
            <span className="hidden md:inline text-xs md:text-sm font-black uppercase">데이터 정제소</span>
          </button>
          
          <div className="w-[1px] h-6 bg-slate-200 self-center hidden md:block mx-1"></div>

          <button onClick={handleLegacyShare} className="flex items-center justify-center gap-1.5 md:gap-2 w-9 h-9 md:w-auto md:h-auto md:px-5 md:py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors shadow-sm active:scale-95 group shrink-0">
            <Link size={16} className="group-hover:text-slate-800" />
            <span className="hidden md:inline text-xs md:text-sm font-black uppercase">일반 공유</span>
          </button>

          <button onClick={handleShare} className="flex items-center justify-center gap-1.5 md:gap-2 w-9 h-9 md:w-auto md:h-auto md:px-5 md:py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200 transition-colors shadow-sm active:scale-95 group shrink-0">
            <Share2 size={16} className="group-hover:text-indigo-600" />
            <span className="hidden md:inline text-xs md:text-sm font-black uppercase">클라우드 공유</span>
          </button>

          <div className={`flex items-center gap-1 md:gap-2 px-2.5 py-1.5 md:px-6 md:py-2.5 rounded-xl border-2 transition-all shrink-0 ${analysis.unmetVolume > 0 ? 'bg-red-50 border-red-200 text-red-700 shadow-sm' : 'bg-green-50 border-green-200 text-green-700 shadow-sm'}`}>
            <AlertTriangle size={14} className={`md:w-4 md:h-4 ${analysis.unmetVolume > 0 ? 'animate-pulse' : ''}`} />
            <span className="text-[10px] md:text-sm font-black uppercase tracking-tight whitespace-nowrap">{analysis.unmetVolume > 0 ? `손실: ${fmt(analysis.unmetVolume)} ㎥` : '100% 소화'}</span>
          </div>
        </div>
      </header>

      <main className={`flex-1 flex overflow-hidden ${isMobile && !isSharedView ? 'justify-center items-center bg-slate-100' : isMobile ? 'flex-col' : ''}`}>
        
        {isMobile && !isSharedView ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 w-full h-full bg-slate-50">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl max-w-sm border border-slate-200 text-center w-full animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
                <Laptop size={32} />
              </div>
              <h2 className="text-xl font-black text-slate-800 mb-3 tracking-tight">PC 환경 권장</h2>
              <p className="text-sm text-slate-500 leading-relaxed font-medium mb-6">
                MT Flow Optimizer는 데이터 입력과 차트 분석을 위해 <strong className="text-indigo-600 font-bold">PC(데스크탑/노트북) 해상도</strong>에 최적화되어 있습니다.<br/><br/>
                원활한 시뮬레이션 세팅을 위해 화면이 넓은 기기를 이용하시거나, 브라우저 창 크기를 늘려주세요.
              </p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-[11px] text-slate-500 font-bold flex items-start gap-2 text-left">
                  <Info size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                  <span>누군가가 공유해준 결과 링크를 통해 접속하셨다면, 모바일에서도 시뮬레이션 결과를 확인할 수 있습니다.</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Left Panel (Inputs) */}
            {!isMobile && (
              <div className="w-[52%] overflow-y-auto p-6 space-y-6 border-r border-slate-200 custom-scrollbar bg-slate-50/50">
                <section className="bg-white p-5 md:p-6 rounded-[1.8rem] shadow-sm border border-slate-200">
                  <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                    <h2 className="text-sm font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                      <Settings2 size={18} /> 공장 자원 및 운용 정책
                    </h2>
                    
                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-tight pl-2 hidden 2xl:inline">공장 선택</span>
                      <select 
                        className="bg-indigo-50 text-indigo-700 text-xs font-black py-2 px-3 rounded-lg border border-indigo-100 outline-none cursor-pointer max-w-[150px] lg:max-w-[180px] truncate" 
                        value={selectedPreset} 
                        onChange={handlePresetChange}
                      >
                        {Object.keys(FACTORY_PRESETS).map(preset => <option key={preset} value={preset}>{preset}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-tighter">B/P Unit Capacity</p>
                        <button onClick={addBP} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"><Plus size={16} /> 추가</button>
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                        {factoryConfig.bps.map((bp, index) => (
                          <div key={bp.id} className="group flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all">
                            <div className="bg-white px-3 py-1.5 rounded-lg text-xs font-black text-indigo-900 shadow-sm border border-slate-100 uppercase font-mono tracking-tighter">B/P {index + 1}</div>
                            <div className="flex-1 relative">
                              <input type="number" className="w-full bg-transparent text-base font-black outline-none focus:text-indigo-600" value={bp.capacity} onChange={(e) => updateBP(bp.id, e.target.value)} />
                              <span className="absolute right-0 top-0.5 text-[11px] font-bold text-slate-400 uppercase">㎥/h</span>
                            </div>
                            <button onClick={() => removeBP(bp.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 relative">
                          <div className="flex items-center gap-1.5 mb-2">
                            <label className="block text-xs font-black text-indigo-500 uppercase tracking-tight">보유 자차 (대)</label>
                          </div>
                          <input 
                            type="number" 
                            className="w-full bg-transparent text-2xl font-black text-indigo-900 outline-none" 
                            value={factoryConfig.ownTrucks === 0 ? '' : factoryConfig.ownTrucks} 
                            placeholder="0"
                            onChange={e => setFactoryConfig({...factoryConfig, ownTrucks: Number(e.target.value)})} 
                          />
                        </div>
                        <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 relative">
                          <div className="flex items-center gap-1.5 mb-2">
                            <label className="block text-xs font-black text-orange-500 uppercase tracking-tight">용차 투입예정(대)</label>
                          </div>
                          <input 
                            type="number" 
                            className="w-full bg-transparent text-2xl font-black text-orange-600 outline-none" 
                            value={factoryConfig.plannedExtTrucks === 0 ? '' : factoryConfig.plannedExtTrucks} 
                            placeholder="0"
                            onChange={e => setFactoryConfig({...factoryConfig, plannedExtTrucks: Number(e.target.value)})} 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <label className="block text-xs font-bold text-slate-500 uppercase">공장로스(분)</label>
                          </div>
                          <input type="number" className="w-full bg-transparent text-lg font-black text-slate-700 outline-none" value={factoryConfig.internalLoss === 0 ? '' : factoryConfig.internalLoss} placeholder="0" onChange={e => setFactoryConfig({...factoryConfig, internalLoss: Number(e.target.value)})}/>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <label className="block text-xs font-bold text-slate-500 uppercase">라스트오더</label>
                          </div>
                          <input type="time" className="w-full bg-transparent text-lg font-black text-slate-700 outline-none cursor-pointer p-0 h-[28px]" value={factoryConfig.endTime} onChange={e => setFactoryConfig({...factoryConfig, endTime: e.target.value})} onClick={handleTimeClick} />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-4 pb-12">
                  <div className="flex justify-between items-center px-2">
                    <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={18} /> 현장 출하 대기열
                    </h2>
                    
                    <div className="flex items-center gap-2">
                      <button onClick={downloadTemplate} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors border border-slate-200">
                        <Download size={16} /> 양식 다운
                      </button>
                      <label className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer active:scale-95">
                        <Upload size={16} /> CSV 업로드
                        <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} ref={fileInputRef} />
                      </label>
                      <div className="w-[1px] h-5 bg-slate-300 mx-2"></div>
                      <button onClick={addSite} className="bg-indigo-950 text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-black flex items-center gap-2 shadow-lg active:scale-95">
                        <Plus size={16} /> 수동 추가
                      </button>
                    </div>
                  </div>

                  {analysis.calculatedSites.map(site => (
                    <div key={site.id} className="bg-white border border-slate-200 rounded-[1.8rem] overflow-hidden shadow-sm hover:shadow-md transition-all">
                      <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-sm" />
                          <input className="text-base md:text-lg font-black bg-transparent border-none focus:ring-0 w-full p-0 text-slate-900 placeholder-slate-300" placeholder="현장명 입력" value={site.name} onChange={e => updateSite(site.id, 'name', e.target.value)} />
                        </div>
                        <button onClick={() => removeSite(site.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
                      </div>
                      
                      <div className="grid grid-cols-12">
                        {/* 🌟 좌측 영역 (비율을 4 -> 6으로 늘려서 50% 차지) */}
                        <div className="col-span-6 p-6 border-r border-slate-100 bg-slate-50/20 space-y-5">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-black text-slate-400 uppercase mb-2">주문량(㎥)</label>
                              <input type="number" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-black text-indigo-700 outline-none shadow-sm" value={site.volume === 0 ? '' : site.volume} placeholder="0" onChange={(e) => updateSite(site.id, 'volume', Number(e.target.value))} />
                            </div>
                            <div>
                              <label className="block text-xs font-black text-slate-400 uppercase mb-2">개시시각</label>
                              <div className="h-[46px] bg-white border border-slate-200 rounded-xl shadow-sm px-1 flex items-center">
                                <input type="time" className="w-full bg-transparent text-sm font-black text-slate-700 outline-none cursor-pointer text-center" value={site.startTime} onChange={(e) => updateSite(site.id, 'startTime', e.target.value)} onClick={handleTimeClick} />
                              </div>
                            </div>
                          </div>
                          <select className={`text-xs font-black p-4 rounded-xl border-none ring-1 w-full outline-none cursor-pointer ${site.strategy === '기본 배차' || site.strategy === '자차우선' ? 'bg-indigo-600 text-white ring-indigo-600' : site.strategy === '용차 우선' || site.strategy === '용차우선' ? 'bg-orange-500 text-white ring-orange-500' : 'bg-slate-700 text-white ring-slate-700'}`} value={site.strategy} onChange={e => updateSite(site.id, 'strategy', e.target.value)}>
                            <option value="기본 배차">기본 배차</option>
                            <option value="용차 우선">용차 우선</option>
                            <option value="자차 전용">자차 전용</option>
                          </select>
                        </div>

                        {/* 🌟 우측 영역 (비율을 8 -> 6으로 줄여서 50% 차지, 좌우 완벽 밸런스) */}
                        <div className="col-span-6 p-6 space-y-5">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[11px] font-black text-slate-400 uppercase tracking-tighter mb-2.5 block">총 왕복시간(분)</label>
                              <input type="number" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700" value={site.travelTime === 0 ? '' : site.travelTime} placeholder="0" onChange={e => updateSite(site.id, 'travelTime', Number(e.target.value))} />
                            </div>
                            <div>
                              <label className="text-[11px] font-black text-indigo-500 uppercase tracking-tighter mb-2.5 block">요구 간격(분)</label>
                              <input 
                                type="number" 
                                className={`w-full p-3 border rounded-xl text-sm font-black outline-none ${site.isCapaShort ? 'bg-red-50 border-red-200 text-red-600' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`} 
                                value={site.targetInterval === 0 ? '' : site.targetInterval} 
                                placeholder={`자동(${Math.round(analysis.avgProductionInterval || 10)})`}
                                onChange={e => updateSite(site.id, 'targetInterval', Number(e.target.value))} 
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                            <div className="flex gap-4 items-center">
                              <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="w-4 h-4 rounded-md text-indigo-600" checked={site.isSpecial} onChange={e => updateSite(site.id, 'isSpecial', e.target.checked)} />
                                <span className="text-xs font-bold text-slate-500">특수배합</span>
                              </label>
                              {site.isSpecial && <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-100 rounded-lg text-xs font-black text-amber-700"><span className="italic">Add:</span><input type="number" className="w-8 bg-transparent outline-none text-center" value={site.specialTime} onChange={e => updateSite(site.id, 'specialTime', Number(e.target.value))} /><span>min</span></div>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </section>
              </div>
            )}

            {/* Right Panel (Dashboard) */}
            <div className={`${isMobile ? 'w-full p-4' : 'w-[48%] p-6 border-l border-slate-200'} bg-white flex flex-col z-20 overflow-y-auto custom-scrollbar`}>
              <div className="space-y-4 md:space-y-5">
                
                <section className="bg-indigo-950 text-white p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                  <div className="relative z-10">
                    <h3 className="text-indigo-400 text-xs font-black uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                      <Activity size={18} /> Operation Live Feed
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3 md:gap-4 mb-5 pb-5 border-b border-indigo-900/50">
                      <div>
                        <p className="text-xs text-indigo-300 font-bold mb-1.5 uppercase tracking-tighter">예정량 (Total Demand)</p>
                        <div className="flex items-baseline gap-2"><span className="text-3xl md:text-5xl font-black tracking-tighter">{fmt(analysis.totalPlannedVolume)}</span><span className="text-sm md:text-lg font-bold text-indigo-500">㎥</span></div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-indigo-300 font-bold mb-1.5 uppercase tracking-tighter">예상 출하량 (Expected Output)</p>
                        <div className="flex items-baseline gap-2 justify-end">
                          <span className={`text-3xl md:text-5xl font-black tracking-tighter ${analysis.unmetVolume > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{fmt(analysis.expectedOutput)}</span>
                          <span className="text-sm md:text-lg font-bold text-indigo-500">㎥</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:gap-4 mb-5">
                      <div className="bg-indigo-900/40 p-4 md:p-5 rounded-2xl border border-indigo-800/50 relative overflow-visible flex flex-col">
                         <div className="flex items-center gap-2 mb-1.5 relative">
                           <p className="text-[11px] md:text-xs text-indigo-400 font-bold uppercase flex items-center gap-1.5"><CheckCircle2 size={14} /> 최대 효율 운용 대수</p>
                         </div>
                         <div className="flex items-end gap-2 mb-0.5 mt-1">
                           <p className="text-2xl md:text-3xl font-black text-white">{fmt(analysis.idealPeakTrucks)}<span className="text-xs md:text-sm ml-1.5 font-bold text-indigo-300">대</span></p>
                         </div>
                         <p className="text-[10px] text-indigo-300/60 font-bold mb-3 tracking-tight">* 초과 투입 시 마당 대기만 발생</p>
                         <div className="bg-indigo-950/60 p-2.5 md:p-3 rounded-xl mt-auto border border-indigo-800/30">
                           <p className="text-[10px] md:text-xs text-indigo-200 font-bold flex items-center justify-between">
                             <span>최대 효율 위해 필요한 용차:</span>
                             <span className="text-sm md:text-base font-black text-white">
                               {fmt(Math.max(0, analysis.idealPeakTrucks - factoryConfig.ownTrucks))}<span className="text-[10px] md:text-xs font-normal ml-1 text-indigo-300">대</span>
                             </span>
                           </p>
                         </div>
                      </div>
                      <div className="bg-orange-900/20 p-4 md:p-5 rounded-2xl border border-orange-900/50 relative overflow-visible flex flex-col">
                         <div className="flex items-center gap-2 mb-1.5 relative">
                           <p className="text-[11px] md:text-xs text-orange-400 font-bold uppercase flex items-center gap-1.5"><AlertTriangle size={14} /> 물량 소화 최소 대수</p>
                         </div>
                         <div className="flex items-end gap-2 mb-0.5 mt-1">
                           <p className="text-2xl md:text-3xl font-black text-white">{fmt(analysis.minRequiredTrucks)}{analysis.minRequiredTrucks !== "N/A" && <span className="text-xs md:text-sm ml-1.5 font-bold text-orange-300">대</span>}</p>
                         </div>
                         <p className="text-[10px] text-orange-300/60 font-bold mb-3 tracking-tight">* 물량을 전부 소화하기 위한 최소값</p>
                         <div className="bg-orange-950/40 p-2.5 md:p-3 rounded-xl mt-auto border border-orange-800/30">
                           <p className="text-[10px] md:text-xs text-orange-200 font-bold flex items-center justify-between">
                             <span>물량 소화를 위해 필요한 용차:</span>
                             <span className="text-sm md:text-base font-black text-white">
                               {analysis.minRequiredTrucks === "N/A" ? "-" : fmt(Math.max(0, analysis.minRequiredTrucks - factoryConfig.ownTrucks))}
                               {analysis.minRequiredTrucks !== "N/A" && <span className="text-[10px] md:text-xs font-normal ml-1 text-orange-300">대</span>}
                             </span>
                           </p>
                         </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center text-xs font-black bg-white/5 p-3.5 md:p-4 rounded-xl">
                        <span className="text-slate-400">계획된 총 투입 대수: <span className="text-white text-sm md:text-base ml-1.5">{fmt(analysis.totalActualTrucks)}대</span></span>
                        <span className="text-indigo-300">자차 {fmt(factoryConfig.ownTrucks)}대 + 용차 {fmt(factoryConfig.plannedExtTrucks)}대</span>
                      </div>
                      <div className="flex bg-indigo-900/40 rounded-xl border border-indigo-800/50 divide-x divide-indigo-800/50 overflow-hidden">
                        <div className="flex-1 p-2.5 md:p-3 flex justify-between items-center">
                          <span className="text-xs text-indigo-400 font-bold uppercase">자차 회전수</span>
                          <span className="text-sm md:text-base font-black text-white">{analysis.avgTripsOwn}<span className="text-[10px] md:text-xs ml-1 text-indigo-300">회전</span></span>
                        </div>
                        <div className="flex-1 p-2.5 md:p-3 flex justify-between items-center">
                          <span className="text-xs text-orange-400 font-bold uppercase">용차 회전수</span>
                          <span className="text-sm md:text-base font-black text-orange-400">{analysis.avgTripsExt}<span className="text-[10px] md:text-xs ml-1 text-orange-300">회전</span></span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                        <button onClick={() => setActiveModal('supply')} className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs md:text-sm py-3 md:py-3.5 rounded-xl flex items-center justify-center gap-1.5 md:gap-2 transition-all shadow-lg active:scale-95">
                          <BarChart3 size={16} /> 수급 흐름
                        </button>
                        <button onClick={() => setActiveModal('sensitivity')} className="bg-orange-600 hover:bg-orange-500 text-white font-black text-xs md:text-sm py-3 md:py-3.5 rounded-xl flex items-center justify-center gap-1.5 md:gap-2 transition-all shadow-lg active:scale-95">
                          <TrendingUp size={16} /> 증감 시뮬레이터
                        </button>
                        <button onClick={() => setActiveModal('hourlyTable')} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs md:text-sm py-3 md:py-3.5 rounded-xl flex items-center justify-center gap-1.5 md:gap-2 transition-all shadow-lg active:scale-95">
                          <TableIcon size={16} /> 출하표 비교
                        </button>
                      </div>
                    </div>

                  </div>
                  <Truck size={300} className="absolute -right-20 -bottom-20 opacity-[0.04] pointer-events-none rotate-12 transition-transform group-hover:scale-110 duration-1000" />
                </section>

                <section className="space-y-4 pb-12">
                  <h3 className="text-sm md:text-[15px] font-black text-slate-500 uppercase tracking-[0.25em] px-2 flex items-center gap-2">
                    <ShieldAlert size={20} className="text-indigo-600" /> Diagnostic Report
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {analysis.minRequiredTrucks === "N/A" || analysis.unmetVolume > 0 ? (
                      <div className="p-4 md:p-5 bg-red-50 border border-red-100 rounded-[1.5rem] md:rounded-3xl flex items-start gap-4 md:gap-5 border-l-4 border-l-red-500 animate-pulse flex-col">
                        <div className="flex gap-3 md:gap-4 w-full items-start">
                          <div className="bg-red-500 p-2.5 md:p-3 rounded-2xl shrink-0"><AlertTriangle className="text-white" size={20} /></div>
                          <div className="flex-1">
                            <p className="text-sm md:text-base text-red-900 font-black uppercase mb-1.5">물량 손실 발생 (위험)</p>
                            <p className="text-xs md:text-sm text-red-700 leading-relaxed font-bold">
                              현재 투입 대수로는 라스트오더 시간 내에 <strong>{fmt(analysis.unmetVolume)}㎥</strong>의 물량을 소화할 수 없습니다. 
                              {analysis.minRequiredTrucks === "N/A" 
                                ? (analysis.isBPBottleneck 
                                    ? " (B/P 생산 속도 자체가 부족합니다. 현장과 협의하여 출하를 포기하거나 연장해야 합니다.)" 
                                    : " (조업시간 내 출하할 수 없습니다. 현장과 협의하여 출하를 포기하거나 연장해야 합니다.)")
                                : ` 최소 ${fmt(analysis.minRequiredTrucks)}대 이상으로 차량을 증차하십시오.`}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : analysis.totalActualTrucks >= analysis.idealPeakTrucks ? (
                      <div className="p-4 md:p-5 bg-indigo-50 border border-indigo-100 rounded-[1.5rem] md:rounded-3xl flex items-start gap-4 md:gap-5 border-l-4 border-l-indigo-500">
                        <div className="bg-indigo-500 p-2.5 md:p-3 rounded-2xl shrink-0"><CheckCircle2 className="text-white" size={20} /></div>
                        <div className="flex-1">
                          <p className="text-sm md:text-base text-indigo-900 font-black uppercase mb-1.5">전 현장 대응 가능</p>
                          <p className="text-xs md:text-sm text-indigo-700 leading-relaxed font-bold">
                            모든 현장의 요구 물량과 간격을 B/P 한계 내에서 100% 충족하며 지연 없이 출하가 가능합니다. 추가 투입 시 불필요한 대기만 늘어납니다.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 md:p-5 bg-orange-50 border border-orange-100 rounded-[1.5rem] md:rounded-3xl flex items-start gap-4 md:gap-5 border-l-4 border-l-orange-500 flex-col">
                        <div className="flex gap-3 md:gap-4 w-full items-start">
                          <div className="bg-orange-500 p-2.5 md:p-3 rounded-2xl shrink-0"><TrendingUp className="text-white" size={20} /></div>
                          <div className="flex-1">
                            <p className="text-sm md:text-base text-orange-900 font-black uppercase mb-1.5">일부 지연 발생</p>
                            <p className="text-xs md:text-sm text-orange-700 leading-relaxed font-bold">
                              물량은 100% 소화하지만 피크타임에 현장 배차 간격이 약간 지연될 수 있습니다. 전체적인 운송 효율은 양호한 편이나, 현장에서 타설 끊김 클레임이 발생할 수 있으니 유의가 필요합니다.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {(factoryConfig.plannedExtTrucks > 0 && Number(analysis.avgTripsExt) <= Number(analysis.avgTripsOwn) * 0.7) && (
                      <div className="p-4 md:p-5 bg-slate-900 border border-slate-800 rounded-[1.5rem] md:rounded-3xl flex items-start gap-4 md:gap-5">
                        <div className="bg-slate-700 p-2.5 md:p-3 rounded-2xl shrink-0"><Info className="text-white" size={20} /></div>
                        <div className="flex-1">
                          <p className="text-sm md:text-base text-slate-300 font-black uppercase mb-1.5">용차 운용 효율 저하</p>
                          <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-bold">
                            용차의 평균 회전수({analysis.avgTripsExt}회)가 자차({analysis.avgTripsOwn}회) 대비 70% 이하로 매우 낮습니다. 불필요하게 많은 용차가 투입되었거나 특정 시간에만 몰려있습니다.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

              </div>
            </div>
          </>
        )}
      </main>

      {/* Dynamic Modal Popups */}
      {activeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 md:p-8" onClick={() => setActiveModal(null)}>

          {/* Data Factory Modal */}
          {activeModal === 'dataFactory' && (
            <div className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="bg-emerald-950 px-6 py-5 flex justify-between items-center shrink-0">
                <h2 className="text-white font-black flex items-center gap-2.5 tracking-tight text-lg">
                  <Database className="text-emerald-400" size={20} /> Data Factory (아웃라이어 정제소)
                </h2>
                <button onClick={() => setActiveModal(null)} className="text-emerald-400 hover:text-white transition-colors bg-emerald-900 p-2.5 rounded-full">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto max-h-[80vh] custom-scrollbar flex flex-col gap-6 bg-slate-50">
                <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex gap-4 items-start">
                  <Info size={24} className="text-emerald-600 shrink-0" />
                  <div className="text-sm text-emerald-900 font-medium leading-relaxed">
                    <p className="font-black mb-1">대용량 Raw 데이터를 브라우저 내에서 즉시 가공합니다.</p>
                    <p>1. 현장별 이상치(0 이하, GPS 오류 등)를 IQR 통계 기법으로 자동 제거합니다.<br/>
                    2. 현장별 평균 왕복 시간을 산출합니다.<br/>
                    3. 동일 공장 내의 시간대별 평균 지연 비율을 추적하여 <strong className="font-black text-emerald-700">시간대별 가중치</strong>를 도출합니다.</p>
                  </div>
                </div>

                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center bg-white hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors">
                  <Upload size={40} className="text-slate-400 mb-4" />
                  <p className="text-sm font-black text-slate-700 mb-2">Raw Data (CSV) 업로드</p>
                  <p className="text-xs text-slate-400 font-medium mb-6">A열: 플랜트명 | B열: 현장코드 | C열: 현장명 | D열: 출하시간(HH:mm) | E열: 주행시간</p>
                  
                  <label className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl text-sm font-black transition-colors shadow-sm cursor-pointer active:scale-95">
                    CSV 파일 선택
                    <input type="file" accept=".csv" className="hidden" onChange={handleDataFactoryUpload} ref={dataFactoryInputRef} />
                  </label>
                </div>

                {dfStatus === 'processing' && (
                  <div className="p-6 text-center animate-pulse">
                    <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm font-black text-slate-600">대용량 데이터를 분석하고 아웃라이어를 제거 중입니다...</p>
                  </div>
                )}

                {dfStatus === 'done' && dfStats && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="text-sm font-black text-slate-800 mb-4 border-b border-slate-100 pb-3">분석 결과 요약</h3>
                    
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div className="bg-slate-50 p-4 rounded-xl text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase mb-1">총 스캔된 행(Row)</p>
                        <p className="text-lg font-black text-slate-800">{fmt(dfStats.totalRows)}</p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-xl text-center border border-red-100">
                        <p className="text-[10px] font-black text-red-500 uppercase mb-1">제거된 이상치</p>
                        <p className="text-lg font-black text-red-600">{fmt(dfStats.outlierRows)}</p>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-xl text-center border border-emerald-100">
                        <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">유효 분석 데이터</p>
                        <p className="text-lg font-black text-emerald-700">{fmt(dfStats.validRows)}</p>
                      </div>
                      <div className="bg-indigo-50 p-4 rounded-xl text-center border border-indigo-100">
                        <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">도출된 현장 수</p>
                        <p className="text-lg font-black text-indigo-700">{fmt(dfStats.siteCount)}</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button onClick={() => downloadDataFactoryCsv('site')} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-3 rounded-xl flex justify-center items-center gap-2 shadow-md">
                        <Download size={18} /> 현장별 평균시간 다운로드
                      </button>
                      <button onClick={() => downloadDataFactoryCsv('weight')} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-xl flex justify-center items-center gap-2 shadow-md">
                        <Download size={18} /> 공장별 시간대 가중치 다운로드
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 기존 모달들 (Supply, Sensitivity, HourlyTable) */}
          {['supply', 'sensitivity', 'hourlyTable'].includes(activeModal) && (
            <div className="bg-slate-50 w-full max-w-5xl rounded-[2rem] md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="bg-indigo-950 px-6 md:px-8 py-5 flex justify-between items-center shrink-0">
                <h2 className="text-white font-black flex items-center gap-2.5 tracking-tight text-lg md:text-xl">
                  <LayoutTemplate className="text-indigo-400" size={20} />
                  {activeModal === 'supply' && '시간대별 차량 수급 흐름'}
                  {activeModal === 'sensitivity' && '차량 증감에 따른 출하량 시뮬레이터'}
                  {activeModal === 'hourlyTable' && '시간대별 출하표 비교'}
                </h2>
                <button onClick={() => setActiveModal(null)} className="text-indigo-400 hover:text-white transition-colors bg-indigo-900 p-2.5 rounded-full">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-5 md:p-8 overflow-y-auto max-h-[80vh] custom-scrollbar">
                
                {activeModal === 'supply' && (
                  <section className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm flex flex-col min-w-[600px] overflow-x-auto">
                    <div className="flex items-center justify-between mb-10">
                      <h3 className="text-base font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={20} className="text-indigo-600" /> 전체 시간대 차량 흐름 모니터링
                      </h3>
                      <div className="flex gap-6">
                        <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase">
                          <div className="w-4 h-4 bg-indigo-500 rounded-sm shadow-sm" /> 대기 자차
                        </div>
                        <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase">
                          <div className="w-4 h-4 bg-sky-400 rounded-sm shadow-sm" /> 대기 용차
                        </div>
                        <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase">
                          <div className="w-4 h-4 bg-red-500 rounded-sm shadow-sm" /> 부족 대수
                        </div>
                      </div>
                    </div>
                    
                    <div className="pb-12">
                      <div className="relative h-80 flex items-end gap-[3px] px-2 border-b-2 border-slate-200 mt-4">
                        {analysis.timeSlots.map((slot, i) => {
                          const isShortage = slot.shortage > 0;
                          const displayValue = isShortage ? slot.shortage : slot.available;
                          const maxScale = Math.max(analysis.totalActualTrucks, analysis.absoluteMaxShortage, 10);
                          const heightPercentage = Math.min(100, (displayValue / maxScale) * 100);
                          
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                              <div className="absolute bottom-full mb-3 hidden group-hover:block z-40 bg-slate-900 text-white p-4 rounded-xl whitespace-nowrap shadow-xl scale-95 origin-bottom transition-all">
                                <p className="text-sm font-black text-indigo-400 mb-1.5">{slot.time}</p>
                                <p className="text-base font-bold">
                                  {isShortage ? `차량 부족 (출하 대기 중): ${fmt(slot.shortage)}대` : `공장 대기: 자차 ${fmt(slot.availableOwn)}대 + 용차 ${fmt(slot.availableExt)}대`}
                                </p>
                              </div>
                              
                              {isShortage ? (
                                <div 
                                  style={{ height: `${Math.max(2, heightPercentage)}%` }} 
                                  className="w-full rounded-t-sm transition-all bg-red-500 hover:bg-red-400" 
                                />
                              ) : (
                                <div 
                                  style={{ height: `${Math.max(2, heightPercentage)}%` }} 
                                  className="w-full flex flex-col-reverse justify-start transition-all rounded-t-sm overflow-hidden"
                                >
                                   <div style={{ height: `${(slot.availableOwn / (slot.availableOwn + slot.availableExt || 1)) * 100}%` }} className="w-full bg-indigo-500 hover:bg-indigo-400 transition-colors" />
                                   {slot.availableExt > 0 && (
                                     <div style={{ height: `${(slot.availableExt / (slot.availableOwn + slot.availableExt)) * 100}%` }} className="w-full bg-sky-400 hover:bg-sky-300 transition-colors border-b border-indigo-900/10" />
                                   )}
                                </div>
                              )}
                              
                              {slot.time.endsWith(':00') && (
                                <div className="absolute top-full mt-2.5 flex flex-col items-center">
                                  <div className="w-[1px] h-3 bg-slate-300 mb-1" /><span className="text-[11px] font-black text-slate-500 tracking-tighter">{slot.time.split(':')[0]}시</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                )}

                {activeModal === 'sensitivity' && (
                  <section className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm flex flex-col min-w-[600px] overflow-x-auto">
                    <div className="flex items-center justify-between mb-10">
                      <h3 className="text-base font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp size={20} className="text-indigo-600" /> 차량 증감(±10대)에 따른 출하량 변화
                      </h3>
                    </div>
                    
                    <div className="pb-12">
                      <div className="relative h-80 flex items-end gap-2 px-6 border-b-2 border-slate-200 mt-4">
                        {analysis.totalPlannedVolume > 0 && (
                          <div 
                            className="absolute left-0 right-0 border-b-2 border-dashed border-emerald-500 z-10 pointer-events-none"
                            style={{ bottom: `${(analysis.totalPlannedVolume / Math.max(analysis.maxPossibleVol, analysis.totalPlannedVolume, 1)) * 100}%` }}
                          >
                          </div>
                        )}

                        {analysis.sensitivityData.map(d => {
                          const chartMaxVol = Math.max(analysis.maxPossibleVol, analysis.totalPlannedVolume, 1);
                          const heightPct = (d.expectedOutput / chartMaxVol) * 100;
                          const isCurrent = d.trucks === analysis.totalActualTrucks;
                          const isMeetingTarget = d.expectedOutput >= analysis.totalPlannedVolume;
                          const isBPMax = d.expectedOutput === analysis.maxPossibleVol && analysis.maxPossibleVol < analysis.totalPlannedVolume;

                          return (
                            <div key={d.trucks} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                              <div className="absolute bottom-full mb-4 hidden group-hover:block z-40 bg-slate-900 text-white p-4 rounded-xl whitespace-nowrap shadow-xl scale-95 origin-bottom">
                                <p className="text-sm font-black text-indigo-400 mb-2 border-b border-slate-700 pb-1.5">총 {fmt(d.trucks)}대 투입 시</p>
                                <div className="space-y-1.5">
                                  <p className="text-sm font-bold">출하 가능: <strong className={isMeetingTarget ? "text-emerald-400 text-lg" : "text-orange-400 text-lg"}>{fmt(d.expectedOutput)} ㎥</strong></p>
                                </div>
                              </div>

                              <div 
                                style={{ height: `${Math.max(2, heightPct)}%` }} 
                                className={`w-full max-w-[40px] rounded-t-lg transition-all duration-300 relative ${
                                  isCurrent ? 'ring-2 ring-indigo-500 ring-offset-2 opacity-100 z-20' : 'opacity-60 hover:opacity-100 z-0'
                                } ${isMeetingTarget ? 'bg-emerald-500' : isBPMax ? 'bg-slate-400' : 'bg-orange-400'}`}
                              >
                                {isCurrent && <div className="absolute -top-9 left-1/2 -translate-x-1/2 text-[11px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200 shadow-sm">현재</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                )}

                {activeModal === 'hourlyTable' && (
                  <section className="bg-white p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
                      <h3 className="text-base font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <TableIcon size={20} className="text-indigo-600" /> 시간대별 최적 vs 현재 출하량 비교
                      </h3>
                    </div>

                    <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 shadow-sm custom-scrollbar">
                      <table className="w-full text-center border-collapse whitespace-nowrap min-w-[800px]">
                        <thead>
                          <tr className="bg-indigo-950 border-b border-indigo-900">
                            <th className="p-4 text-[13px] font-black text-indigo-200 w-36 border-r border-indigo-900/50 sticky left-0 bg-indigo-950 z-10">구분 (단위: ㎥)</th>
                            {analysis.hourlyTableData.filter(d => d.hour !== 'total').map(d => (
                              <th key={d.hour} className="p-4 text-[13px] font-black text-white">{d.label}</th>
                            ))}
                            <th className="p-4 text-[13px] font-black text-emerald-300 border-l border-indigo-900/50">합계 (Total)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-100 bg-white hover:bg-slate-50 transition-colors">
                            <td className="p-4 text-[13px] font-black text-slate-500 bg-slate-50/90 border-r border-slate-100 sticky left-0 z-10">최적 배차시</td>
                            {analysis.hourlyTableData.filter(d => d.hour !== 'total').map(d => (
                              <td key={d.hour} className="p-4 text-[15px] font-bold text-slate-700">{d.optimal ? fmt(d.optimal) : '-'}</td>
                            ))}
                            <td className="p-4 text-[16px] font-black text-slate-800 border-l border-slate-100 bg-slate-50/50">{fmt(analysis.sumOpt)}</td>
                          </tr>
                          <tr className="border-b border-slate-200 bg-indigo-50/30 hover:bg-indigo-50 transition-colors">
                            <td className="p-4 text-[13px] font-black text-indigo-700 bg-indigo-50/90 border-r border-indigo-100/50 sticky left-0 z-10">현재 배차시</td>
                            {analysis.hourlyTableData.filter(d => d.hour !== 'total').map(d => (
                              <td key={d.hour} className="p-4 text-[15px] font-black text-indigo-900">{d.current ? fmt(d.current) : '-'}</td>
                            ))}
                            <td className="p-4 text-[16px] font-black text-indigo-700 border-l border-indigo-100/50 bg-indigo-50/50">{fmt(analysis.sumCur)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

              </div>
            </div>
          )}
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 z-[100] animate-in slide-in-from-bottom-5 w-max max-w-[90vw]">
          {toastMsg.includes('☁️') ? <Cloud size={20} className="text-sky-400 shrink-0" /> : <Info size={20} className="text-indigo-400 shrink-0" />}
          <span className="text-sm md:text-base font-bold tracking-tight truncate">{toastMsg}</span>
        </div>
      )}

      <style>{`
        @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        
        * { font-family: 'Pretendard', 'Inter', sans-serif !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        input[type="time"] { position: relative; -webkit-appearance: none; appearance: none; display: flex; align-items: center; justify-content: center; }
        input[type="time"]::-webkit-calendar-picker-indicator { background: transparent; bottom: 0; color: transparent; cursor: pointer; height: auto; left: 0; position: absolute; right: 0; top: 0; width: auto; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .85; transform: scale(0.995); } }
        .animate-pulse { animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}</style>
    </div>
  );
}
