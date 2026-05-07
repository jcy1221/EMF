import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Factory, Truck, Clock, AlertTriangle, CheckCircle2, 
  Settings2, Plus, Trash2, Coffee, TrendingUp, Info, Zap, 
  Calendar, BarChart3, Activity, ShieldAlert, HelpCircle, X, LayoutTemplate,
  Table as TableIcon, Download, Upload, Share2, Cloud, Link, Laptop
} from 'lucide-react';

// --- Firebase Imports ---
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
    console.warn("⚠️ Firebase(클라우드) 설정이 없습니다. Vercel/로컬 환경에서는 클라우드 공유 기능이 제한됩니다.");
  }
} catch (error) {
  console.error("Firebase 초기화 오류:", error);
}

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// ==========================================
// 🏢 [공장 리스트 (하드코딩 영역)] 🏢
// ==========================================
const FACTORY_PRESETS = {
  "기본 (미설정)": {
    bps: [{ id: 1, capacity: 210 }],
    ownTrucks: 30,
    internalLoss: 5,
    endTime: "18:00"
  },
  "부천레미콘": {
    bps: [{ id: 1, capacity: 240 }, { id: 2, capacity: 240 }],
    ownTrucks: 70,
    internalLoss: 5,
    endTime: "17:00"
  },
  "강서레미콘": {
    bps: [{ id: 1, capacity: 240 }, { id: 2, capacity: 360 }],
    ownTrucks: 70,
    internalLoss: 5,
    endTime: "17:00"
  },
  "인천레미콘": {
    bps: [{ id: 1, capacity: 240 }, { id: 2, capacity: 360 }],
    ownTrucks: 55,
    internalLoss: 5,
    endTime: "17:00"
  },
  "서인천공장": {
    bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }],
    ownTrucks: 55,
    internalLoss: 5,
    endTime: "17:00"
  },
  "송도레미콘": {
    bps: [{ id: 1, capacity: 240 }, { id: 2, capacity: 240 }],
    ownTrucks: 72,
    internalLoss: 5,
    endTime: "18:00"
  },
  "서서울레미콘": {
    bps: [{ id: 1, capacity: 240 }, { id: 2, capacity: 240 }, { id: 3, capacity: 210 }, { id: 4, capacity: 210 }],
    ownTrucks: 150,
    internalLoss: 5,
    endTime: "17:00"
  },
  "동서울레미콘": {
    bps: [{ id: 1, capacity: 360 }, { id: 2, capacity: 360 }],
    ownTrucks: 84,
    internalLoss: 5,
    endTime: "17:00"
  },
  "이순R 남양주": {
    bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }],
    ownTrucks: 24,
    internalLoss: 5,
    endTime: "17:00"
  },
  "이순R 동두천": {
    bps: [{ id: 1, capacity: 210 }],
    ownTrucks: 24,
    internalLoss: 5,
    endTime: "17:00"
  },
  "춘천레미콘": {
    bps: [{ id: 1, capacity: 210 }],
    ownTrucks: 12,
    internalLoss: 5,
    endTime: "17:00"
  },
  "수지레미콘": {
    bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }],
    ownTrucks: 52,
    internalLoss: 5,
    endTime: "17:00"
  },
  "광주레미콘": {
    bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }],
    ownTrucks: 40,
    internalLoss: 5,
    endTime: "17:00"
  },
  "안산레미콘": {
    bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }],
    ownTrucks: 60,
    internalLoss: 5,
    endTime: "17:00"
  },
  "수원레미콘": {
    bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }],
    ownTrucks: 49,
    internalLoss: 5,
    endTime: "17:00"
  },
  "지구레미콘": {
    bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }],
    ownTrucks: 16,
    internalLoss: 5,
    endTime: "17:00"
  },
  "평택레미콘": {
    bps: [{ id: 1, capacity: 240 }, { id: 2, capacity: 210 }],
    ownTrucks: 50,
    internalLoss: 5,
    endTime: "17:00"
  },
  "안성레미콘": {
    bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }],
    ownTrucks: 32,
    internalLoss: 5,
    endTime: "17:00"
  },
  "천안레미콘": {
    bps: [{ id: 1, capacity: 240 }, { id: 2, capacity: 240 }],
    ownTrucks: 40,
    internalLoss: 5,
    endTime: "17:00"
  },
  "세종레미콘": {
    bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }],
    ownTrucks: 32,
    internalLoss: 5,
    endTime: "17:00"
  },
  "당진레미콘": {
    bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }],
    ownTrucks: 13,
    internalLoss: 5,
    endTime: "17:00"
  },
  "광주공장": {
    bps: [{ id: 1, capacity: 240 }],
    ownTrucks: 28,
    internalLoss: 5,
    endTime: "17:00"
  },
  "나주공장": {
    bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }],
    ownTrucks: 23,
    internalLoss: 5,
    endTime: "17:00"
  },
  "군산레미콘": {
    bps: [{ id: 1, capacity: 210 }],
    ownTrucks: 12,
    internalLoss: 5,
    endTime: "17:00"
  },
  "김해공장": {
    bps: [{ id: 1, capacity: 210 }],
    ownTrucks: 22,
    internalLoss: 5,
    endTime: "16:00"
  }
};

export default function App() {
  // --- 1. State Management ---
  const [isMobile, setIsMobile] = useState(false);
  
  // URL을 확인하여 공유된 뷰(모바일 허용)인지 파악하는 상태 추가
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
      travelTime: 0, // GPS 기준 총 왕복 이동시간 (가는시간+오는시간)
      unloadTime: 0, // GPS 기준 현장 체류시간 (타설+대기)
      startTime: "08:00",
      targetInterval: 0,
      isSpecial: false,
      specialTime: 0,
      strategy: "기본 배차" 
    }
  ]);

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
      } catch (err) {
        console.error("인증 실패:", err);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, setUser);

    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('resize', handleResizeOrDetect);
    };
  }, []);

  // --- 3. Load Shared Cloud Data ---
  useEffect(() => {
    const loadSharedData = async () => {
      const params = new URLSearchParams(window.location.search);
      
      const legacyShareData = params.get('share');
      if (legacyShareData) {
        setIsSharedView(true);
        try {
          const decoded = JSON.parse(decodeURIComponent(atob(legacyShareData)));
          if (decoded.factoryConfig) setFactoryConfig(decoded.factoryConfig);
          
          if (decoded.sites) {
            setSites(decoded.sites.map(s => ({
              ...s,
              // 과거 버전 하위 호환성: toTime과 backTime이 있으면 travelTime으로 합산
              travelTime: s.travelTime !== undefined ? s.travelTime : (Number(s.toTime) || 0) + (Number(s.backTime) || 0),
              strategy: (s.strategy === "자차우선" || s.strategy === "무관") ? "기본 배차" : (s.strategy === "용차우선" ? "용차 우선" : s.strategy)
            })));
          }
          if (decoded.selectedPreset) setSelectedPreset(decoded.selectedPreset);
        } catch (e) { console.error(e); }
        return;
      }

      if (!db || !user) return; 

      const shareId = params.get('id');
      if (shareId) {
        setIsSharedView(true);
        try {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'shares', shareId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.factoryConfig) setFactoryConfig(data.factoryConfig);
            if (data.sites) {
              setSites(data.sites.map(s => ({
                ...s,
                travelTime: s.travelTime !== undefined ? s.travelTime : (Number(s.toTime) || 0) + (Number(s.backTime) || 0),
                strategy: (s.strategy === "자차우선" || s.strategy === "무관") ? "기본 배차" : (s.strategy === "용차우선" ? "용차 우선" : s.strategy)
              })));
            }
            if (data.selectedPreset) setSelectedPreset(data.selectedPreset);
            
            setToastMsg('☁️ 공유된 설정 데이터를 모두 불러왔습니다!');
            setTimeout(() => setToastMsg(''), 3500);
          }
        } catch (e) {
          console.error("클라우드 데이터 로딩 실패", e);
        }
      }
    };
    
    loadSharedData();
  }, [user]);

  // --- 4. Utilities ---
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
    if (num === null || num === undefined || num === "N/A") return num;
    return Number(num).toLocaleString();
  };

  // --- 5. Share Handlers ---
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
      setToastMsg('링크 생성에 실패했습니다. (데이터가 너무 많을 수 있습니다)');
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  const handleShare = async () => {
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
      const stateToShare = { 
        factoryConfig, 
        sites, 
        selectedPreset,
        createdAt: new Date().toISOString()
      };
      
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

  const downloadTemplate = () => {
    const bom = "\uFEFF";
    const headers = "현장명,주문량(㎥),개시시각(HH:MM),왕복이동시간(분),현장체류시간(분),요구간격(분),특수배합(O/X),특수추가시간(분),배차방식(기본 배차/용차 우선/자차 전용)\n";
    const sample1 = "A아파트 1공구,120,08:00,60,40,10,X,0,기본 배차\n";
    const sample2 = "B상가 신축,60,09:30,40,30,0,O,5,용차 우선\n";
    
    const blob = new Blob([bom + headers + sample1 + sample2], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "현장업로드_표준양식_v1.57.csv";
    link.click();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target.result;
      const lines = csvText.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length <= 1) {
        alert("데이터가 없거나 잘못된 형식입니다.");
        return;
      }

      const newSites = lines.slice(1).map((line, index) => {
        const cols = line.split(',');
        let parsedStrategy = cols[8]?.trim() || "기본 배차";
        if (parsedStrategy === "자차우선" || parsedStrategy === "무관") parsedStrategy = "기본 배차";
        else if (parsedStrategy === "용차우선") parsedStrategy = "용차 우선";

        return {
          id: Date.now() + index,
          name: cols[0]?.trim() || `업로드 현장 ${index + 1}`,
          volume: Number(cols[1]) || 0,
          startTime: cols[2]?.trim() || "08:00",
          travelTime: Number(cols[3]) || 0,
          unloadTime: Number(cols[4]) || 0,
          targetInterval: Number(cols[5]) || 0,
          isSpecial: cols[6]?.trim().toUpperCase() === 'O',
          specialTime: Number(cols[7]) || 0,
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
      // 왕복 이동시간 + 현장 체류시간(타설) + 공장 내부 로스
      const rt = site.travelTime + site.unloadTime + factoryConfig.internalLoss;
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

      if (validTrucks.length === 0) return; // 자차 전용인데 자차가 아예 세팅 안된 경우 등 스킵

      // 도착 시간이 빠르고, 도착 시간이 같다면 회전수가 적은 차량 우선 정렬
      let earliestOwn = validTrucks.filter(t => t.type === 'own').sort((a,b) => a.availableAt === b.availableAt ? a.trips - b.trips : a.availableAt - b.availableAt)[0];
      let earliestExt = validTrucks.filter(t => t.type === 'ext').sort((a,b) => a.availableAt === b.availableAt ? a.trips - b.trips : a.availableAt - b.availableAt)[0];

      let ownDelay = earliestOwn ? Math.max(0, earliestOwn.availableAt - actualT) : Infinity;
      let extDelay = earliestExt ? Math.max(0, earliestExt.availableAt - actualT) : Infinity;

      let selectedTruck = null;

      // 현재 시점의 자차 평균 회전수 계산 (용차 상한 브레이크용)
      let currentTotalOwnTrips = trucks.filter(t => t.type === 'own').reduce((sum, t) => sum + t.trips, 0);
      let avgOwnTrips = factoryConfig.ownTrucks > 0 ? currentTotalOwnTrips / factoryConfig.ownTrucks : 0;

      if (reqStrategy === "자차 전용") {
        selectedTruck = earliestOwn;
      } 
      else if (reqStrategy === "기본 배차") {
        // 자차 우선 배차 (마당에 자차와 용차가 함께 있으면 자차 먼저 띄움)
        if (ownDelay === 0 && extDelay === 0) selectedTruck = earliestOwn;
        else if (ownDelay === 0) selectedTruck = earliestOwn;
        else if (extDelay === 0) selectedTruck = earliestExt;
        else selectedTruck = ownDelay <= extDelay ? earliestOwn : earliestExt;
      }
      else if (reqStrategy === "용차 우선") {
        // [RULE 1] 용차 상한(Cap) 브레이크: 배차될 용차의 회전수가 자차 평균 회전수 이상이면 우선권 박탈
        let isExtCapped = earliestExt && (earliestExt.trips >= avgOwnTrips);
        
        if (isExtCapped || !earliestExt) {
            // 강제로 '기본 배차(자차 우선)' 로직으로 Fallback
            if (ownDelay === 0 && extDelay === 0) selectedTruck = earliestOwn;
            else if (ownDelay === 0) selectedTruck = earliestOwn;
            else if (extDelay === 0) selectedTruck = earliestExt;
            else selectedTruck = ownDelay <= extDelay ? earliestOwn : earliestExt;
        } else {
            // [RULE 2] 10분 지연 초과 방지: 용차가 오려면 10분 이상 지연되고, 자차가 용차보다 일찍 오면 뺏어서 배차
            if (extDelay >= 10 && ownDelay < extDelay) {
                selectedTruck = earliestOwn;
            } else {
                // 정상적으로 용차 우선 배차
                selectedTruck = earliestExt;
            }
        }
      }

      if (!selectedTruck) return;

      actualT = Math.max(actualT, selectedTruck.availableAt);
      if (actualT > lastOrderMin) return;

      let totalDelay = actualT - req.reqTime;
      if (totalDelay > 0) {
        delayLogs.push({ siteName: req.siteName, reqTime: req.reqTime, delayMins: totalDelay });
      }

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
        if (selectedTruck.type === 'own') {
          actualOwnInUse[k]++;
        } else {
          actualExtInUse[k]++;
        }
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
      
      timeSlots.push({ 
        time: minutesToTime(m), 
        available, 
        availableOwn,
        availableExt,
        shortage
      });
    }

    const siteDelaySummary = {};
    delayLogs.forEach(log => {
      const name = log.siteName || "미입력 현장";
      if (!siteDelaySummary[name]) {
        siteDelaySummary[name] = { minTime: log.reqTime, maxTime: log.reqTime, maxDelay: log.delayMins, count: 0 };
      }
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
      sensitivityData.push({
        trucks: k,
        own: Math.min(k, factoryConfig.ownTrucks),
        ext: Math.max(0, k - factoryConfig.ownTrucks),
        expectedOutput: simulateDetailedVolume(k).expectedVol
      });
    }

    const optimalHourlyVols = maxPossibleSim.hourlyVols;

    let maxHour = Math.floor(endMin / 60);
    for(let h = maxHour; h >= 7; h--) {
       if((currentHourlyVols[h] || 0) > 0 || (optimalHourlyVols[h] || 0) > 0) {
          maxHour = h;
          break;
       }
    }
    
    const hourlyTableData = [];
    let sumOpt = 0;
    let sumCur = 0;
    for(let h = 7; h <= maxHour; h++) {
       const opt = optimalHourlyVols[h] || 0;
       const cur = currentHourlyVols[h] || 0;
       sumOpt += opt;
       sumCur += cur;
       hourlyTableData.push({
         hour: h,
         label: `${h}시`,
         optimal: opt,
         current: cur,
         gap: cur - opt
       });
    }

    return { 
      calculatedSites, totalPlannedVolume, expectedOutput, unmetVolume,
      idealPeakTrucks: trueIdealPeakTrucks,
      minRequiredTrucks, isBPBottleneck,
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
      setFactoryConfig({ 
        ...factoryConfig, 
        ...FACTORY_PRESETS[presetName], 
        bps: JSON.parse(JSON.stringify(FACTORY_PRESETS[presetName].bps)) 
      });
    }
  };

  const addBP = () => setFactoryConfig({ ...factoryConfig, bps: [...factoryConfig.bps, { id: Date.now(), capacity: 210 }] });
  const removeBP = (id) => factoryConfig.bps.length > 1 && setFactoryConfig({ ...factoryConfig, bps: factoryConfig.bps.filter(bp => bp.id !== id) });
  const updateBP = (id, cap) => setFactoryConfig({ ...factoryConfig, bps: factoryConfig.bps.map(bp => bp.id === id ? { ...bp, capacity: Number(cap) } : bp) });
  
  const addSite = () => setSites([...sites, { id: Date.now(), name: "", volume: 0, travelTime: 0, unloadTime: 0, startTime: "08:00", targetInterval: 0, isSpecial: false, specialTime: 0, strategy: "기본 배차" }]);
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
              <span className="hidden sm:inline-block text-[10px] md:text-xs bg-indigo-100 px-1.5 py-0.5 md:px-2 rounded text-indigo-600 uppercase font-black shrink-0">v1.57</span>
            </h1>
            <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest hidden md:block mt-0.5 truncate">MT Dispatch Reality Simulator</p>
          </div>
        </div>
        
        <div className="flex gap-1.5 md:gap-3 shrink-0">
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
                            <div className="relative group/tooltip flex items-center">
                              <HelpCircle size={14} className="text-indigo-300 cursor-help" />
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 p-3 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 shadow-xl pointer-events-none text-center leading-relaxed">
                                당일 가동 예정인 지입MT 및 직영MT 대수
                              </div>
                            </div>
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
                            <div className="relative group/tooltip flex items-center">
                              <HelpCircle size={14} className="text-orange-300 cursor-help" />
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 p-3 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 shadow-xl pointer-events-none text-center leading-relaxed">
                                실제 호출하여 운용할 용차 대수. 이 값에 따라 예상 출하량과 회전수가 달라집니다.
                              </div>
                            </div>
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
                            <div className="relative group/tooltip flex items-center">
                              <HelpCircle size={12} className="text-slate-400 cursor-help" />
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 p-3 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 shadow-xl pointer-events-none text-center leading-relaxed">
                                타설복귀 후 다음 상차시까지의 딜레이타임. (점심시간 30분 별도 적용)
                              </div>
                            </div>
                          </div>
                          <input type="number" className="w-full bg-transparent text-lg font-black text-slate-700 outline-none" value={factoryConfig.internalLoss === 0 ? '' : factoryConfig.internalLoss} placeholder="0" onChange={e => setFactoryConfig({...factoryConfig, internalLoss: Number(e.target.value)})}/>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <label className="block text-xs font-bold text-slate-500 uppercase">라스트오더</label>
                            <div className="relative group/tooltip flex items-center">
                              <HelpCircle size={12} className="text-slate-400 cursor-help" />
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-40 p-3 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 shadow-xl pointer-events-none text-center">
                                마지막 상차 가능 시각
                              </div>
                            </div>
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
                        <div className="col-span-4 p-6 border-r border-slate-100 bg-slate-50/20 space-y-5">
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

                        <div className="col-span-8 p-6 space-y-6">
                          <div className="grid grid-cols-3 gap-4">
                            {/* [v1.57 수정] 가는시간, 오는시간을 합쳐서 "총 왕복 이동"으로 변경. 타설시간은 "현장 체류"로 명칭 변경 */}
                            <div>
                              <label className="text-[11px] font-black text-slate-400 uppercase tracking-tighter mb-2.5 block">총 왕복 이동(분)</label>
                              <input type="number" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700" value={site.travelTime === 0 ? '' : site.travelTime} placeholder="0" onChange={e => updateSite(site.id, 'travelTime', Number(e.target.value))} />
                            </div>
                            <div>
                              <label className="text-[11px] font-black text-slate-400 uppercase tracking-tighter mb-2.5 block">현장 체류(분)</label>
                              <input type="number" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700" value={site.unloadTime === 0 ? '' : site.unloadTime} placeholder="0" onChange={e => updateSite(site.id, 'unloadTime', Number(e.target.value))} />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 mb-2.5">
                                <label className="text-[11px] font-black text-indigo-500 uppercase tracking-tighter">요구 간격(분)</label>
                                <div className="relative group/tooltip flex items-center">
                                  <HelpCircle size={12} className="text-indigo-400 cursor-help" />
                                  <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 shadow-xl pointer-events-none text-center leading-relaxed">
                                    현장의 원활한 타설(버퍼)을 위해 첫 10대(60㎥)는 간격을 무시하고 공장 최고 속도로 연속 배차되며, 11대째부터 이 간격이 적용됩니다.
                                  </div>
                                </div>
                              </div>
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
                              {site.isSpecial && <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-100 rounded-lg text-xs font-black text-
