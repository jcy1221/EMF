import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Factory, Truck, Clock, AlertTriangle, CheckCircle2, 
  Settings2, Plus, Trash2, Coffee, TrendingUp, Info, Zap, 
  Calendar, BarChart3, Activity, ShieldAlert, HelpCircle, X, LayoutTemplate,
  Table as TableIcon, Download, Upload, Share2, Cloud, Link
} from 'lucide-react';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc } from 'firebase/firestore';

// --- Firebase Initialization (Graceful Degradation) ---
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
// 🏢 [여기에 공장 리스트를 추가하세요!] 🏢
// ==========================================
// 양식: "공장이름": { bps: [{ id:1, capacity: 캐파 }, ...], ownTrucks: 보유자차, internalLoss: 공장로스, endTime: "라스트오더" }
const FACTORY_PRESETS = {
  "기본 (미설정)": {
    bps: [{ id: 1, capacity: 210 }],
    ownTrucks: 30,
    internalLoss: 5,
    endTime: "18:00"
  },
  "부천공장": {
    bps: [{ id: 1, capacity: 240 }, { id: 2, capacity: 240 }],
    ownTrucks: 70,
    internalLoss: 5,
    endTime: "17:00"
  },
  "강서공장": {
    bps: [{ id: 1, capacity: 240 }, { id: 2, capacity: 360 }],
    ownTrucks: 70,
    internalLoss: 5,
    endTime: "17:00"
  },
  "인천공장": {
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
  "송도공장": {
    bps: [{ id: 1, capacity: 240 }, { id: 2, capacity: 240 }],
    ownTrucks: 72,
    internalLoss: 5,
    endTime: "18:00"
  },
  "서서울공장": {
    bps: [{ id: 1, capacity: 240 }, { id: 2, capacity: 240 }, { id: 3, capacity: 210 }, { id: 4, capacity: 210 }],
    ownTrucks: 150,
    internalLoss: 5,
    endTime: "17:00"
  },
  "동서울공장": {
    bps: [{ id: 1, capacity: 360 }, { id: 2, capacity: 360 }],
    ownTrucks: 84,
    internalLoss: 5,
    endTime: "17:00"
  },
  "남양주공장": {
    bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }],
    ownTrucks: 24,
    internalLoss: 5,
    endTime: "17:00"
  },
  "동두천공장": {
    bps: [{ id: 1, capacity: 210 }],
    ownTrucks: 24,
    internalLoss: 5,
    endTime: "17:00"
  },
  "춘천공장": {
    bps: [{ id: 1, capacity: 210 }],
    ownTrucks: 12,
    internalLoss: 5,
    endTime: "17:00"
  },
  "수지공장": {
    bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }],
    ownTrucks: 52,
    internalLoss: 5,
    endTime: "17:00"
  },
  "광주공장": {
    bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }],
    ownTrucks: 40,
    internalLoss: 5,
    endTime: "17:00"
  },
  "안산공장": {
    bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }],
    ownTrucks: 60,
    internalLoss: 5,
    endTime: "17:00"
  },
  "수원공장": {
    bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }],
    ownTrucks: 49,
    internalLoss: 5,
    endTime: "17:00"
  },
  "지구공장": {
    bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }],
    ownTrucks: 16,
    internalLoss: 5,
    endTime: "17:00"
  },
  "평택공장": {
    bps: [{ id: 1, capacity: 240 }, { id: 2, capacity: 210 }],
    ownTrucks: 50,
    internalLoss: 5,
    endTime: "17:00"
  },
  "안성공장": {
    bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }],
    ownTrucks: 32,
    internalLoss: 5,
    endTime: "17:00"
  },
  "천안공장": {
    bps: [{ id: 1, capacity: 240 }, { id: 2, capacity: 240 }],
    ownTrucks: 40,
    internalLoss: 5,
    endTime: "17:00"
  },
  "세종공장": {
    bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }],
    ownTrucks: 32,
    internalLoss: 5,
    endTime: "17:00"
  },
  "당진공장": {
    bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }],
    ownTrucks: 13,
    internalLoss: 5,
    endTime: "17:00"
  },
  "K광주공장": {
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
  "군산공장": {
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
  },
  // 🔽 아래에 필요한 공장들을 똑같은 양식으로 쭉 추가하시면 됩니다!
  /*
  "인천공장": {
    bps: [{ id: 1, capacity: 210 }, { id: 2, capacity: 210 }],
    ownTrucks: 50,
    internalLoss: 5,
    endTime: "17:30"
  },
  */
};

export default function App() {
  // --- 1. State Management ---
  const [isMobile, setIsMobile] = useState(false);
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
      toTime: 0,
      unloadTime: 0,
      backTime: 0,
      startTime: "08:00",
      targetInterval: 0,
      isSpecial: false,
      specialTime: 0,
      strategy: "자차우선" 
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
        try {
          const decoded = JSON.parse(decodeURIComponent(atob(legacyShareData)));
          if (decoded.factoryConfig) setFactoryConfig(decoded.factoryConfig);
          if (decoded.sites) setSites(decoded.sites);
          if (decoded.selectedPreset) setSelectedPreset(decoded.selectedPreset);
        } catch (e) { console.error(e); }
        return;
      }

      if (!db || !user) return; 

      const shareId = params.get('id');
      if (shareId) {
        try {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'shares', shareId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.factoryConfig) setFactoryConfig(data.factoryConfig);
            if (data.sites) setSites(data.sites);
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
      setToastMsg('⚠️ 외부 서버(Vercel 등)에서는 자체 DB를 연결해야 클라우드 기능을 쓸 수 있습니다.');
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

  // --- CSV Import / Export Handlers ---
  const downloadTemplate = () => {
    const bom = "\uFEFF";
    const headers = "현장명,주문량(㎥),개시시각(HH:MM),이동시간(분),타설시간(분),복귀시간(분),요구간격(분),특수배합(O/X),특수추가시간(분),배차방식(자차우선/용차우선/무관)\n";
    const sample1 = "A아파트 1공구,120,08:00,30,40,30,10,X,0,자차우선\n";
    const sample2 = "B상가 신축,60,09:30,20,30,20,0,O,5,용차우선\n";
    
    const blob = new Blob([bom + headers + sample1 + sample2], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "현장업로드_표준양식.csv";
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
        return {
          id: Date.now() + index,
          name: cols[0]?.trim() || `업로드 현장 ${index + 1}`,
          volume: Number(cols[1]) || 0,
          startTime: cols[2]?.trim() || "08:00",
          toTime: Number(cols[3]) || 0,
          unloadTime: Number(cols[4]) || 0,
          backTime: Number(cols[5]) || 0,
          targetInterval: Number(cols[6]) || 0,
          isSpecial: cols[7]?.trim().toUpperCase() === 'O',
          specialTime: Number(cols[8]) || 0,
          strategy: cols[9]?.trim() || "자차우선"
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
    let idealEvents = [];
    let allRequests = [];

    const calculatedSites = sites.map(site => {
      const rt = site.toTime + site.unloadTime + site.backTime + factoryConfig.internalLoss;
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

        if (currentReqTime <= lastOrderMin) {
          idealEvents.push({ time: currentReqTime, type: 1 });
          let returnMin = currentReqTime + rt;
          if (returnMin >= lunchStartMin && returnMin <= lunchEndMin) returnMin += factoryConfig.lunchBreak;
          idealEvents.push({ time: returnMin, type: -1 });
        }
        
        if (i < 9) {
          currentReqTime += siteBpInterval; 
        } else {
          currentReqTime += effectiveInterval;
        }
      }

      const isCapaShort = siteBpInterval > site.targetInterval && site.targetInterval > 0;
      return { ...site, rt, cycleTrucks, totalTrucksForOrder, isCapaShort, effectiveInterval };
    });

    idealEvents.sort((a, b) => a.time === b.time ? a.type - b.type : a.time - b.time);
    let idealPeakTrucks = 0, currentActive = 0;
    idealEvents.forEach(e => {
      currentActive += e.type;
      if (currentActive > idealPeakTrucks) idealPeakTrucks = currentActive;
    });

    allRequests.sort((a, b) => a.reqTime - b.reqTime);
    
    const simulateDetailedVolume = (poolSize) => {
      let truckAvailTimes = Array(poolSize).fill(startMin);
      let expectedVol = 0;
      let bpAvailableAt = startMin;
      let hourlyVols = {};

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

        const bpInterval = avgProductionInterval + (req.isSpecial ? Number(req.specialTime) : 0);
        bpAvailableAt = actualT + bpInterval;
      }
      return { expectedVol, hourlyVols };
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
    let minRequiredTrucks = "N/A";
    let isBPBottleneck = (maxPossibleVol < totalPlannedVolume) && (maxPossibleVol < timeLimitOnlyVolume);
    
    if (maxPossibleVol >= totalPlannedVolume && totalPlannedVolume > 0) {
      for (let k = 1; k <= idealPeakTrucks; k++) {
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

    allRequests.forEach(req => {
      let bpReadyT = Math.max(req.reqTime, bpAvailableAt);
      if (bpReadyT > lastOrderMin) return;

      let actualT = bpReadyT;
      let availableTrucks = trucks.filter(t => t.availableAt <= actualT);
      let selectedTruck = null;

      if (availableTrucks.length === 0) {
        const minAvailTime = Math.min(...trucks.map(t => t.availableAt));
        actualT = Math.max(actualT, minAvailTime);
        if (actualT > lastOrderMin) return;
        availableTrucks = trucks.filter(t => t.availableAt <= actualT);
      }

      if (availableTrucks.length > 0) {
        if (req.strategy === "자차우선") selectedTruck = availableTrucks.find(t => t.type === 'own') || availableTrucks[0];
        else if (req.strategy === "용차우선") selectedTruck = availableTrucks.find(t => t.type === 'ext') || availableTrucks[0];
        else selectedTruck = availableTrucks[0];
      }
      if (!selectedTruck) return;

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
    });

    const expectedOutput = Math.min(totalPlannedVolume, expectedVolume);
    const unmetVolume = Math.max(0, totalPlannedVolume - expectedOutput);

    let reqTrucksAtMin = new Array(endMin - startMin + 1).fill(0);
    allRequests.forEach(req => {
      if (req.reqTime <= lastOrderMin) {
        let returnTime = req.reqTime + req.rt;
        if (returnTime >= lunchStartMin && returnTime <= lunchEndMin) {
          returnTime += factoryConfig.lunchBreak;
        }
        
        const startIdx = Math.max(0, req.reqTime - startMin);
        const endIdx = Math.min(returnTime - startMin, reqTrucksAtMin.length - 1);
        
        for (let k = startIdx; k < endIdx; k++) {
          reqTrucksAtMin[k]++;
        }
      }
    });

    const totalTrucks = factoryConfig.ownTrucks + factoryConfig.plannedExtTrucks;
    const timeSlots = [];
    let absoluteMaxShortage = 0; 

    for (let m = startMin; m <= endMin; m += 10) {
      const idx = m - startMin;
      const required = reqTrucksAtMin[idx] || 0; 
      
      const usedOwn = Math.min(required, factoryConfig.ownTrucks);
      const usedExt = Math.max(0, required - factoryConfig.ownTrucks);
      
      const availableOwn = Math.max(0, factoryConfig.ownTrucks - usedOwn);
      const availableExt = Math.max(0, factoryConfig.plannedExtTrucks - usedExt);
      
      const diff = totalTrucks - required;
      const available = Math.max(0, diff); 
      const shortage = Math.max(0, -diff); 
      
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

    const optimalSim = simulateDetailedVolume(idealPeakTrucks > 0 ? idealPeakTrucks : 999);
    const optimalHourlyVols = optimalSim.hourlyVols;

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
      idealPeakTrucks, minRequiredTrucks, isBPBottleneck,
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
      // 선택한 하드코딩된 프리셋으로 팩토리 설정 덮어쓰기
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
  
  const addSite = () => setSites([...sites, { id: Date.now(), name: "", volume: 0, toTime: 0, unloadTime: 0, backTime: 0, startTime: "08:00", targetInterval: 0, isSpecial: false, specialTime: 0, strategy: "자차우선" }]);
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
              <span className="hidden sm:inline-block text-[10px] md:text-xs bg-indigo-100 px-1.5 py-0.5 md:px-2 rounded text-indigo-600 uppercase font-black shrink-0">v1.49</span>
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
            <span className="text-[10px] md:text-sm font-black uppercase tracking-tight whitespace-nowrap">{analysis.unmetVolume > 0 ? `손실: ${analysis.unmetVolume} ㎥` : '100% 소화'}</span>
          </div>
        </div>
      </header>

      <main className={`flex-1 flex overflow-hidden ${isMobile ? 'flex-col' : ''}`}>
        
        {/* Left Panel (Inputs) */}
        {!isMobile && (
          <div className="w-[52%] overflow-y-auto p-6 space-y-6 border-r border-slate-200 custom-scrollbar bg-slate-50/50">
            <section className="bg-white p-5 md:p-6 rounded-[1.8rem] shadow-sm border border-slate-200">
              <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-sm font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                  <Settings2 size={18} /> 공장 자원 및 운용 정책
                </h2>
                
                {/* 간소화된 공장 선택 드롭다운 (하드코딩 연동) */}
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
                      <select className={`text-xs font-black p-4 rounded-xl border-none ring-1 w-full outline-none cursor-pointer ${site.strategy === '자차우선' ? 'bg-indigo-600 text-white ring-indigo-600' : site.strategy === '용차우선' ? 'bg-orange-500 text-white ring-orange-500' : 'bg-white text-slate-600 ring-slate-200'}`} value={site.strategy} onChange={e => updateSite(site.id, 'strategy', e.target.value)}>
                        <option value="자차우선">자차우선</option><option value="용차우선">용차우선</option><option value="무관">방식 무관</option>
                      </select>
                    </div>

                    <div className="col-span-8 p-6 space-y-6">
                      <div className="grid grid-cols-4 gap-4">
                        <div><label className="text-[11px] font-black text-slate-400 uppercase tracking-tighter mb-2.5 block">현장 이동(분)</label><input type="number" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700" value={site.toTime === 0 ? '' : site.toTime} placeholder="0" onChange={e => updateSite(site.id, 'toTime', Number(e.target.value))} /></div>
                        <div><label className="text-[11px] font-black text-slate-400 uppercase tracking-tighter mb-2.5 block">타설 시간(분)</label><input type="number" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700" value={site.unloadTime === 0 ? '' : site.unloadTime} placeholder="0" onChange={e => updateSite(site.id, 'unloadTime', Number(e.target.value))} /></div>
                        <div><label className="text-[11px] font-black text-slate-400 uppercase tracking-tighter mb-2.5 block">공장 복귀(분)</label><input type="number" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700" value={site.backTime === 0 ? '' : site.backTime} placeholder="0" onChange={e => updateSite(site.id, 'backTime', Number(e.target.value))} /></div>
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
                          {site.isSpecial && <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-100 rounded-lg text-xs font-black text-amber-700"><span className="italic">Add:</span><input type="number" className="w-8 bg-transparent outline-none text-center" value={site.specialTime} onChange={e => updateSite(site.id, 'specialTime', Number(e.target.value))} /><span>min</span></div>}
                        </div>
                        <div className="flex gap-3 text-xs font-black"><div className="text-slate-400"><span className="text-slate-500 uppercase mr-1">왕복시간</span> {site.rt}분</div></div>
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
                    <div className="flex items-baseline gap-2"><span className="text-3xl md:text-5xl font-black tracking-tighter">{analysis.totalPlannedVolume}</span><span className="text-sm md:text-lg font-bold text-indigo-500">㎥</span></div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-indigo-300 font-bold mb-1.5 uppercase tracking-tighter">예상 출하량 (Expected Output)</p>
                    <div className="flex items-baseline gap-2 justify-end">
                      <span className={`text-3xl md:text-5xl font-black tracking-tighter ${analysis.unmetVolume > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{analysis.expectedOutput}</span>
                      <span className="text-sm md:text-lg font-bold text-indigo-500">㎥</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4 mb-5">
                  <div className="bg-indigo-900/40 p-4 md:p-5 rounded-2xl border border-indigo-800/50 relative overflow-visible flex flex-col">
                     <div className="absolute top-0 right-0 w-8 h-8 md:w-12 md:h-12 bg-indigo-500/20 rounded-bl-full" />
                     <div className="flex items-center gap-2 mb-1.5 relative">
                       <p className="text-[11px] md:text-xs text-indigo-400 font-bold uppercase flex items-center gap-1.5"><CheckCircle2 size={14} /> 지연 제로 대수</p>
                     </div>
                     <div className="flex items-end gap-2 mb-3 mt-1">
                       <p className="text-2xl md:text-3xl font-black text-white">{analysis.idealPeakTrucks}<span className="text-xs md:text-sm ml-1.5 font-bold text-indigo-300">대</span></p>
                     </div>
                     <div className="bg-indigo-950/60 p-2.5 md:p-3 rounded-xl mt-auto border border-indigo-800/30">
                       <p className="text-[10px] md:text-xs text-indigo-200 font-bold flex items-center justify-between">
                         <span>필요 용차:</span>
                         <span className="text-sm md:text-base font-black text-white">{Math.max(0, analysis.idealPeakTrucks - factoryConfig.ownTrucks)}<span className="text-[10px] md:text-xs font-normal ml-1 text-indigo-300">대</span></span>
                       </p>
                     </div>
                  </div>
                  <div className="bg-orange-900/20 p-4 md:p-5 rounded-2xl border border-orange-900/50 relative overflow-visible flex flex-col">
                     <div className="absolute top-0 right-0 w-8 h-8 md:w-12 md:h-12 bg-orange-500/10 rounded-bl-full" />
                     <div className="flex items-center gap-2 mb-1.5 relative">
                       <p className="text-[11px] md:text-xs text-orange-400 font-bold uppercase flex items-center gap-1.5"><AlertTriangle size={14} /> 물량 소화 최소 대수</p>
                     </div>
                     <div className="flex items-end gap-2 mb-3 mt-1">
                       <p className="text-2xl md:text-3xl font-black text-white">{analysis.minRequiredTrucks}{analysis.minRequiredTrucks !== "N/A" && <span className="text-xs md:text-sm ml-1.5 font-bold text-orange-300">대</span>}</p>
                     </div>
                     <div className="bg-orange-950/40 p-2.5 md:p-3 rounded-xl mt-auto border border-orange-800/30">
                       <p className="text-[10px] md:text-xs text-orange-200 font-bold flex items-center justify-between">
                         <span>필요 용차:</span>
                         <span className="text-sm md:text-base font-black text-white">
                           {analysis.minRequiredTrucks === "N/A" ? "-" : Math.max(0, analysis.minRequiredTrucks - factoryConfig.ownTrucks)}
                           {analysis.minRequiredTrucks !== "N/A" && <span className="text-[10px] md:text-xs font-normal ml-1 text-orange-300">대</span>}
                         </span>
                       </p>
                     </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center text-xs font-black bg-white/5 p-3.5 md:p-4 rounded-xl">
                    <span className="text-slate-400">계획된 투입: <span className="text-white text-sm md:text-base ml-1.5">{analysis.totalActualTrucks}대</span></span>
                    <span className="text-indigo-300">자차 {factoryConfig.ownTrucks}대 + 용차 {factoryConfig.plannedExtTrucks}대</span>
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
                          현재 투입 대수로는 라스트오더 시간 내에 <strong>{analysis.unmetVolume}㎥</strong>의 물량을 소화할 수 없습니다. 
                          {analysis.minRequiredTrucks === "N/A" 
                            ? (analysis.isBPBottleneck 
                                ? " (B/P 생산 속도 자체가 부족합니다. 현장과 협의하여 출하를 포기하거나 연장해야 합니다.)" 
                                : " (조업시간 내 출하할 수 없습니다. 현장과 협의하여 출하를 포기하거나 연장해야 합니다.)")
                            : ` 최소 ${analysis.minRequiredTrucks}대 이상으로 차량을 증차하십시오.`}
                        </p>
                      </div>
                    </div>
                    {analysis.delayReport && analysis.delayReport.length > 0 && (
                      <div className="w-full mt-3 bg-red-100/50 rounded-2xl p-3 md:p-4">
                        <p className="text-xs font-black text-red-900 border-b border-red-200 pb-2 mb-2.5">예상 지연 현장 상세</p>
                        <div className="space-y-1.5">
                          {analysis.delayReport.map((rpt, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs bg-white/60 px-3 py-2.5 rounded-xl">
                              <span className="font-bold text-red-900 truncate w-[40%] md:w-[45%]">{rpt.siteName}</span>
                              <span className="text-red-700 font-medium tracking-tighter">{rpt.timeRange}</span>
                              <span className="text-red-600 font-black bg-red-100 px-2 py-0.5 rounded-md text-[10px] md:text-xs">최대 {rpt.maxDelay}분 지연</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : analysis.totalActualTrucks >= analysis.idealPeakTrucks ? (
                  <div className="p-4 md:p-5 bg-indigo-50 border border-indigo-100 rounded-[1.5rem] md:rounded-3xl flex items-start gap-4 md:gap-5 border-l-4 border-l-indigo-500">
                    <div className="bg-indigo-500 p-2.5 md:p-3 rounded-2xl shrink-0"><CheckCircle2 className="text-white" size={20} /></div>
                    <div className="flex-1">
                      <p className="text-sm md:text-base text-indigo-900 font-black uppercase mb-1.5">전 현장 대응 가능</p>
                      <p className="text-xs md:text-sm text-indigo-700 leading-relaxed font-bold">
                        모든 현장의 요구 물량과 간격을 100% 충족하며 지연 없이 출하가 가능합니다.
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
                    {analysis.delayReport && analysis.delayReport.length > 0 && (
                      <div className="w-full mt-3 bg-orange-100/50 rounded-2xl p-3 md:p-4">
                        <p className="text-xs font-black text-orange-900 border-b border-orange-200 pb-2 mb-2.5">예상 지연 현장 상세</p>
                        <div className="space-y-1.5">
                          {analysis.delayReport.map((rpt, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs bg-white/60 px-3 py-2.5 rounded-xl">
                              <span className="font-bold text-orange-900 truncate w-[40%] md:w-[45%]">{rpt.siteName}</span>
                              <span className="text-orange-700 font-medium tracking-tighter">{rpt.timeRange}</span>
                              <span className="text-red-500 font-black bg-orange-100 px-2 py-0.5 rounded-md text-[10px] md:text-xs">최대 {rpt.maxDelay}분 지연</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
      </main>

      {/* Dynamic Modal Popups */}
      {activeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 md:p-8" onClick={() => setActiveModal(null)}>

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
                                  {isShortage ? `부족대수: ${slot.shortage}대` : `대기: 자차 ${slot.availableOwn}대 + 용차 ${slot.availableExt}대`}
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
                    <p className="text-sm text-slate-500 font-bold text-center bg-slate-50 py-4 rounded-xl border border-slate-100 mt-4">
                      현재 입력된 총 <strong className="text-indigo-600">{analysis.totalActualTrucks}대</strong> 기준 흐름입니다.
                    </p>
                  </section>
                )}

                {activeModal === 'sensitivity' && (
                  <section className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm flex flex-col min-w-[600px] overflow-x-auto">
                    <div className="flex items-center justify-between mb-10">
                      <h3 className="text-base font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp size={20} className="text-indigo-600" /> 차량 증감(±10대)에 따른 출하량 변화
                      </h3>
                      <div className="flex items-center gap-3 text-xs font-black text-slate-500 uppercase">
                        <div className="w-8 border-t-2 border-dashed border-emerald-500" /> 예정량 ({analysis.totalPlannedVolume}㎥)
                      </div>
                    </div>
                    
                    <div className="pb-12">
                      <div className="relative h-80 flex items-end gap-2 px-6 border-b-2 border-slate-200 mt-4">
                        {analysis.totalPlannedVolume > 0 && (
                          <div 
                            className="absolute left-0 right-0 border-b-2 border-dashed border-emerald-500 z-10 pointer-events-none"
                            style={{ bottom: `${(analysis.totalPlannedVolume / Math.max(analysis.maxPossibleVol, analysis.totalPlannedVolume, 1)) * 100}%` }}
                          >
                            <span className="absolute bottom-full left-4 mb-2 text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded shadow-sm whitespace-nowrap">
                              예정량: {analysis.totalPlannedVolume}㎥
                            </span>
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
                                <p className="text-sm font-black text-indigo-400 mb-2 border-b border-slate-700 pb-1.5">총 {d.trucks}대 투입 시</p>
                                <div className="space-y-1.5">
                                  <p className="text-sm font-bold">출하 가능: <strong className={isMeetingTarget ? "text-emerald-400 text-lg" : "text-orange-400 text-lg"}>{d.expectedOutput} ㎥</strong></p>
                                  {d.expectedOutput < analysis.totalPlannedVolume && (
                                    <p className="text-xs text-red-400 bg-red-950/50 px-2 py-1 rounded-lg">{-1 * (analysis.totalPlannedVolume - d.expectedOutput)} ㎥ 손실</p>
                                  )}
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

                              <div className="absolute top-full mt-3 text-center w-full flex flex-col items-center">
                                <p className={`text-sm font-black leading-tight ${isCurrent ? 'text-indigo-600' : 'text-slate-600'}`}>{d.trucks}</p>
                                <p className={`text-[11px] font-black tracking-tighter mt-0.5 ${isCurrent ? 'text-orange-600' : 'text-slate-400'}`}>
                                  {d.ext > 0 ? `+${d.ext}` : '-'}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-5">
                      <p className="text-sm text-slate-500 font-bold bg-slate-50 py-3 px-6 rounded-xl border border-slate-100 flex items-center gap-6">
                        <span><span className="text-orange-500 font-black">■</span> 물량 손실</span>
                        <span><span className="text-emerald-500 font-black">■</span> 목표 달성</span>
                        <span><span className="text-slate-400 font-black">■</span> 공장(B/P) 한계</span>
                      </p>
                      <p className="text-xs text-slate-400 font-bold pr-2 tracking-tight">
                        ※ X축 표기: 총 투입 대수 / (+추가 용차 대수)
                      </p>
                    </div>
                  </section>
                )}

                {activeModal === 'hourlyTable' && (
                  <section className="bg-white p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
                      <h3 className="text-base font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <TableIcon size={20} className="text-indigo-600" /> 시간대별 최적 vs 현재 출하량 비교
                      </h3>
                      <div className="bg-slate-50 px-4 md:px-5 py-3 rounded-xl border border-slate-200 flex gap-4 text-sm font-black w-fit">
                        <div className="text-slate-500">예정량 <span className="text-slate-800">{analysis.totalPlannedVolume}㎥</span></div>
                      </div>
                    </div>

                    {/* PC View: Table Layout */}
                    <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 shadow-sm custom-scrollbar">
                      <table className="w-full text-center border-collapse whitespace-nowrap min-w-[800px]">
                        <thead>
                          <tr className="bg-indigo-950 border-b border-indigo-900">
                            <th className="p-4 text-[13px] font-black text-indigo-200 w-36 border-r border-indigo-900/50 sticky left-0 bg-indigo-950 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.1)]">구분 (단위: ㎥)</th>
                            {analysis.hourlyTableData.filter(d => d.hour !== 'total').map(d => (
                              <th key={d.hour} className="p-4 text-[13px] font-black text-white">{d.label}</th>
                            ))}
                            <th className="p-4 text-[13px] font-black text-emerald-300 border-l border-indigo-900/50">합계 (Total)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-100 bg-white hover:bg-slate-50 transition-colors">
                            <td className="p-4 text-[13px] font-black text-slate-500 bg-slate-50/90 border-r border-slate-100 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">최적 배차시<br/><span className="text-[11px] text-slate-400 font-normal">({analysis.idealPeakTrucks > 0 ? analysis.idealPeakTrucks : 'B/P최대'}대)</span></td>
                            {analysis.hourlyTableData.filter(d => d.hour !== 'total').map(d => (
                              <td key={d.hour} className="p-4 text-[15px] font-bold text-slate-700">{d.optimal || '-'}</td>
                            ))}
                            <td className="p-4 text-[16px] font-black text-slate-800 border-l border-slate-100 bg-slate-50/50">{analysis.sumOpt}</td>
                          </tr>
                          <tr className="border-b border-slate-200 bg-indigo-50/30 hover:bg-indigo-50 transition-colors">
                            <td className="p-4 text-[13px] font-black text-indigo-700 bg-indigo-50/90 border-r border-indigo-100/50 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">현재 배차시<br/><span className="text-[11px] text-indigo-400 font-normal">({analysis.totalActualTrucks}대)</span></td>
                            {analysis.hourlyTableData.filter(d => d.hour !== 'total').map(d => (
                              <td key={d.hour} className="p-4 text-[15px] font-black text-indigo-900">{d.current || '-'}</td>
                            ))}
                            <td className="p-4 text-[16px] font-black text-indigo-700 border-l border-indigo-100/50 bg-indigo-50/50">{analysis.sumCur}</td>
                          </tr>
                          <tr className="bg-slate-100/80">
                            <td className="p-4 text-[13px] font-black text-slate-600 border-r border-slate-200 bg-slate-100/90 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">GAP<br/><span className="text-[11px] text-slate-400 font-normal">(현재 - 최적)</span></td>
                            {analysis.hourlyTableData.filter(d => d.hour !== 'total').map(d => (
                              <td key={d.hour} className={`p-4 text-[15px] font-black ${d.gap > 0 ? 'text-emerald-600' : d.gap < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                {d.gap > 0 ? `+${d.gap}` : (d.gap === 0 ? '-' : d.gap)}
                              </td>
                            ))}
                            <td className={`p-4 text-[16px] font-black border-l border-slate-200 bg-slate-200/50 ${analysis.sumCur - analysis.sumOpt >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                              {analysis.sumCur - analysis.sumOpt > 0 ? `+${analysis.sumCur - analysis.sumOpt}` : analysis.sumCur - analysis.sumOpt}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile View: Vertical Card Layout */}
                    <div className="md:hidden space-y-3">
                      {/* Total Summary Card */}
                      <div className="bg-slate-800 p-4 rounded-[1rem] flex justify-between items-center text-white shadow-md">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-400">Total Sum</span>
                          <span className="text-base font-black">전체 합계 비교</span>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-bold text-slate-300">최적 <strong className="text-white">{analysis.sumOpt}</strong> / 현재 <strong className="text-indigo-300">{analysis.sumCur}</strong></p>
                          <p className={`text-lg font-black mt-0.5 ${analysis.sumCur - analysis.sumOpt >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            GAP: {analysis.sumCur - analysis.sumOpt > 0 ? '+' : ''}{analysis.sumCur - analysis.sumOpt} ㎥
                          </p>
                        </div>
                      </div>

                      {/* Hourly Cards */}
                      {analysis.hourlyTableData.filter(d => d.hour !== 'total').map(d => (
                        <div key={d.hour} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-2">
                          <div className="border-b border-slate-100 pb-2 mb-1 flex justify-between items-center">
                            <span className="font-black text-indigo-900 text-sm">{d.label}</span>
                            <span className={`text-[11px] font-black px-2 py-1 rounded-md ${d.gap > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : d.gap < 0 ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                              GAP: {d.gap > 0 ? `+${d.gap}` : (d.gap === 0 ? '-' : d.gap)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-bold text-xs">최적 배차 기준</span>
                            <span className="font-black text-slate-700">{d.optimal || '-'} <span className="text-[10px] font-normal text-slate-400">㎥</span></span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-indigo-500 font-bold text-xs">현재 차량 기준</span>
                            <span className="font-black text-indigo-700">{d.current || '-'} <span className="text-[10px] font-normal text-indigo-300">㎥</span></span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-end mt-6">
                      <p className="text-sm font-bold text-slate-500 flex items-center gap-2 bg-slate-50 px-5 py-3 rounded-xl border border-slate-100 w-full md:w-auto justify-between md:justify-start">
                        <span className="text-slate-400 text-xs md:text-sm">최종 예정량 차이:</span>
                        <span className={`font-black ${analysis.sumCur - analysis.totalPlannedVolume < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {analysis.sumCur - analysis.totalPlannedVolume < 0 
                            ? `${analysis.sumCur - analysis.totalPlannedVolume} ㎥ (미달)` 
                            : '100% 소화 가능'}
                        </span>
                      </p>
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
