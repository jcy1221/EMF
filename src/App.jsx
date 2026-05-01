import React, { useState, useMemo } from 'react';
import { 
  Factory, Truck, Clock, AlertTriangle, CheckCircle2, 
  Settings2, Plus, Trash2, Coffee, TrendingUp, Info, Zap, 
  Calendar, BarChart3, Activity, ShieldAlert, HelpCircle
} from 'lucide-react';

// --- Factory Preset Data ---
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
    bps: [{ id: 1, capacity: 300 }, { id: 2, capacity: 300 }],
    ownTrucks: 70,
    internalLoss: 5,
    endTime: "17:00"
  },
  "동서울공장": {
    bps: [{ id: 1, capacity: 360 }, { id: 2, capacity: 360 }],
    ownTrucks: 80,
    internalLoss: 5,
    endTime: "17:00"
  }
};

export default function App() {
  // --- 1. State Management ---
  const [selectedPreset, setSelectedPreset] = useState("기본 (미설정)");
  const [factoryConfig, setFactoryConfig] = useState({
    bps: [{ id: 1, capacity: 210 }],
    truckVolume: 6,       
    ownTrucks: 30,        
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
      name: "현장명 1",
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

  // --- 2. Utilities ---
  const timeToMinutes = (timeStr) => {
    const [hrs, mins] = timeStr.split(':').map(Number);
    return hrs * 60 + mins;
  };

  const minutesToTime = (totalMins) => {
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const handleTimeClick = (e) => {
    if (e.target.showPicker) {
      try { e.target.showPicker(); } catch (err) {}
    }
  };

  // --- 3. Core Simulation Logic ---
  const analysis = useMemo(() => {
    const totalCapaPerHour = factoryConfig.bps.reduce((sum, bp) => sum + bp.capacity, 0);
    const avgProductionInterval = totalCapaPerHour > 0 ? (6 / totalCapaPerHour) * 60 : 0;

    const startMin = timeToMinutes("07:00");
    const endMin = timeToMinutes("18:00");
    const lastOrderMin = timeToMinutes(factoryConfig.endTime);
    const timeSlots = [];
    for (let m = startMin; m <= endMin; m += 10) {
      timeSlots.push({ time: minutesToTime(m), netChange: 0, available: 0, dispatchCount: 0 });
    }

    let totalVolume = 0;
    let totalCapaWarning = false;

    const calculatedSites = sites.map(site => {
      const rt = site.toTime + site.unloadTime + site.backTime + factoryConfig.internalLoss;
      
      if (site.targetInterval <= 0 || site.volume <= 0) {
        return { ...site, rt, cycleTrucks: 0, totalTrucksForOrder: 0, isCapaShort: false };
      }

      const cycleTrucks = Math.ceil(rt / site.targetInterval);
      const totalTrucksForOrder = Math.ceil(site.volume / 6);
      totalVolume += Number(site.volume);
      const startMinutes = timeToMinutes(site.startTime);
      
      for (let i = 0; i < totalTrucksForOrder; i++) {
        const dispatchMin = startMinutes + (i * site.targetInterval);
        if (dispatchMin > lastOrderMin || dispatchMin > endMin) break;

        const dispatchIdx = Math.floor((dispatchMin - startMin) / 10);
        if (dispatchIdx >= 0 && dispatchIdx < timeSlots.length) {
          timeSlots[dispatchIdx].netChange -= 1;
          timeSlots[dispatchIdx].dispatchCount += 1;
        }

        let returnMin = dispatchMin + rt;
        const lunchStartMin = timeToMinutes(factoryConfig.lunchStart);
        const lunchEndMin = timeToMinutes(factoryConfig.lunchEnd);
        
        if (returnMin >= lunchStartMin && returnMin <= lunchEndMin) {
          returnMin += factoryConfig.lunchBreak;
        }

        const returnIdx = Math.floor((returnMin - startMin) / 10);
        if (returnIdx >= 0 && returnIdx < timeSlots.length) {
          timeSlots[returnIdx].netChange += 1;
        }
      }

      const siteSpecificInterval = avgProductionInterval + (site.isSpecial ? Number(site.specialTime) : 0);
      if (siteSpecificInterval > site.targetInterval) totalCapaWarning = true;

      return { 
        ...site, rt, cycleTrucks, totalTrucksForOrder, 
        isCapaShort: siteSpecificInterval > site.targetInterval 
      };
    });

    let currentAvailable = factoryConfig.ownTrucks;
    let maxShortage = 0;
    let peakUsedTrucks = 0;

    timeSlots.forEach(slot => {
      currentAvailable += slot.netChange;
      slot.available = currentAvailable;
      const usedNow = factoryConfig.ownTrucks - currentAvailable;
      peakUsedTrucks = Math.max(peakUsedTrucks, usedNow);
      if (currentAvailable < 0) {
        maxShortage = Math.max(maxShortage, Math.abs(currentAvailable));
      }
    });

    return { 
      calculatedSites, maxShortage, totalCapaWarning, 
      totalCapaPerHour, totalVolume, timeSlots, peakUsedTrucks 
    };
  }, [sites, factoryConfig]);

  // --- 4. Handlers ---
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
  
  const addSite = () => {
    const newName = `현장명 ${sites.length + 1}`;
    setSites([...sites, { id: Date.now(), name: newName, volume: 0, toTime: 0, unloadTime: 0, backTime: 0, startTime: "08:00", targetInterval: 0, isSpecial: false, specialTime: 0, strategy: "자차우선" }]);
  };
  const updateSite = (id, field, val) => setSites(sites.map(s => s.id === id ? { ...s, [field]: val } : s));
  const removeSite = (id) => setSites(sites.filter(s => s.id !== id));

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans text-slate-900 overflow-hidden select-none">
      <header className="bg-white border-b border-slate-200 px-8 py-3 flex justify-between items-center shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-900 p-2 rounded-xl shadow-lg shadow-indigo-100">
            <Zap className="text-yellow-400 fill-yellow-400" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-indigo-950 flex items-center gap-2 tracking-tight uppercase">
              Eugene Flow Optimizer
              <span className="text-[10px] bg-indigo-100 px-2 py-0.5 rounded text-indigo-600 uppercase font-black">v1.18</span>
            </h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Real-time RM Dispatch Simulator</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-6 py-2 rounded-xl border-2 transition-all ${analysis.maxShortage > 0 ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-sm' : 'bg-green-50 border-green-200 text-green-700 shadow-sm'}`}>
          <Truck size={16} />
          <span className="text-xs font-black uppercase tracking-tight">피크 부족: {analysis.maxShortage}대</span>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="w-[52%] overflow-y-auto p-6 space-y-6 border-r border-slate-200 custom-scrollbar bg-slate-50/50">
          <section className="bg-white p-6 rounded-[1.8rem] shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[11px] font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                <Settings2 size={16} /> 공장 자원 및 운용 정책
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">공장 선택</span>
                <select 
                  className="bg-indigo-50 text-indigo-700 text-[10px] font-black py-1.5 px-3 rounded-lg border border-indigo-100 outline-none cursor-pointer hover:bg-indigo-100 transition-colors"
                  value={selectedPreset}
                  onChange={handlePresetChange}
                >
                  {Object.keys(FACTORY_PRESETS).map(preset => (
                    <option key={preset} value={preset}>{preset}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">B/P Unit Capacity</p>
                  <button onClick={addBP} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors">
                    <Plus size={12} /> 추가
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                  {factoryConfig.bps.map((bp, index) => (
                    <div key={bp.id} className="group flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all">
                      <div className="bg-white px-2.5 py-1 rounded-lg text-[10px] font-black text-indigo-900 shadow-sm border border-slate-100 uppercase font-mono tracking-tighter">B/P {index + 1}</div>
                      <div className="flex-1 relative">
                        <input type="number" className="w-full bg-transparent text-sm font-black outline-none focus:text-indigo-600" value={bp.capacity} onChange={(e) => updateBP(bp.id, e.target.value)} />
                        <span className="absolute right-0 top-0.5 text-[9px] font-bold text-slate-300 uppercase">㎥/h</span>
                      </div>
                      <button onClick={() => removeBP(bp.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 relative group">
                  <div className="flex items-center gap-1.5 mb-2">
                    <label className="block text-[9px] font-black text-indigo-400 uppercase tracking-tight">보유 자차 (대)</label>
                    <div className="relative group/tooltip">
                      <HelpCircle size={10} className="text-indigo-300 cursor-help" />
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 shadow-xl pointer-events-none">
                        당일 가동 예정인 지입MT 및 직영MT 대수
                      </div>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <input type="number" className="w-full bg-transparent text-2xl font-black text-indigo-900 outline-none" value={factoryConfig.ownTrucks} onChange={e => setFactoryConfig({...factoryConfig, ownTrucks: Number(e.target.value)})}/>
                    <span className="text-sm font-bold text-indigo-300 uppercase">Units</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1 mb-1">
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">공장로스(분)</label>
                      <div className="relative group/tooltip">
                        <HelpCircle size={9} className="text-slate-300 cursor-help" />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 p-2 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 shadow-xl pointer-events-none">
                          타설복귀 후 다음 상차시까지의 딜레이타임. 단, 설정값과 별개로 점심시간은 30분 적용됩니다.
                        </div>
                      </div>
                    </div>
                    <input type="number" className="w-full bg-transparent text-base font-black text-slate-700 outline-none" value={factoryConfig.internalLoss} onChange={e => setFactoryConfig({...factoryConfig, internalLoss: Number(e.target.value)})}/>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 relative">
                    <div className="flex items-center gap-1 mb-1">
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">라스트오더</label>
                      <div className="relative group/tooltip">
                        <HelpCircle size={9} className="text-slate-300 cursor-help" />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-40 p-2 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 shadow-xl pointer-events-none">
                          마지막 상차 가능 시각
                        </div>
                      </div>
                    </div>
                    <input type="time" className="w-full bg-transparent text-base font-black text-slate-700 outline-none cursor-pointer p-0 h-[24px]" value={factoryConfig.endTime} onChange={e => setFactoryConfig({...factoryConfig, endTime: e.target.value})} onClick={handleTimeClick} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4 pb-12">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Calendar size={16} /> 현장 출하 대기열</h2>
              <button onClick={addSite} className="bg-indigo-950 text-white px-5 py-2 rounded-xl text-[10px] font-black hover:bg-black flex items-center gap-2 shadow-lg transition-all active:scale-95"><Plus size={14} /> 현장 추가</button>
            </div>

            {analysis.calculatedSites.map(site => (
              <div key={site.id} className="bg-white border border-slate-200 rounded-[1.8rem] overflow-hidden shadow-sm hover:shadow-md transition-all group">
                <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm" />
                    <input className="text-[14px] font-black bg-transparent border-none focus:ring-0 w-full p-0 text-slate-900" value={site.name} onChange={e => updateSite(site.id, 'name', e.target.value)} />
                  </div>
                  <button onClick={() => removeSite(site.id)} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
                <div className="grid grid-cols-12">
                  <div className="col-span-4 p-5 border-r border-slate-100 bg-slate-50/20 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-[8px] font-black text-slate-400 uppercase">주문량(㎥)</label>
                          <input type="number" className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-indigo-700 outline-none shadow-sm" value={site.volume === 0 ? '' : site.volume} placeholder="0" onChange={(e) => updateSite(site.id, 'volume', Number(e.target.value))} />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[8px] font-black text-slate-400 uppercase">개시시각</label>
                          <div className="relative h-[38px] flex items-center bg-white border border-slate-200 rounded-xl shadow-sm px-1">
                             <input type="time" className="w-full bg-transparent text-[11px] font-black text-slate-700 outline-none cursor-pointer h-full leading-none p-0 border-none ring-0 text-center" value={site.startTime} onChange={(e) => updateSite(site.id, 'startTime', e.target.value)} onClick={handleTimeClick} />
                          </div>
                        </div>
                    </div>
                    <select className={`text-[10px] font-black p-3 rounded-xl border-none ring-1 w-full transition-all appearance-none cursor-pointer ${site.strategy === '자차우선' ? 'bg-indigo-600 text-white ring-indigo-600' : site.strategy === '용차우선' ? 'bg-orange-500 text-white ring-orange-500' : 'bg-white text-slate-600 ring-slate-200'}`} value={site.strategy} onChange={e => updateSite(site.id, 'strategy', e.target.value)}><option value="자차우선">자차우선</option><option value="용차우선">용차우선</option><option value="무관">방식 무관</option></select>
                  </div>
                  <div className="col-span-8 p-5 space-y-5">
                    <div className="grid grid-cols-4 gap-3">
                      <div className="space-y-1.5"><label className="text-[7.5px] font-black text-slate-400 uppercase tracking-tighter">현장 이동(분)</label><input type="number" className="w-full p-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700" value={site.toTime === 0 ? '' : site.toTime} placeholder="0" onChange={e => updateSite(site.id, 'toTime', Number(e.target.value))} /></div>
                      <div className="space-y-1.5"><label className="text-[7.5px] font-black text-slate-400 uppercase tracking-tighter">타설 시간(분)</label><input type="number" className="w-full p-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700" value={site.unloadTime === 0 ? '' : site.unloadTime} placeholder="0" onChange={e => updateSite(site.id, 'unloadTime', Number(e.target.value))} /></div>
                      <div className="space-y-1.5"><label className="text-[7.5px] font-black text-slate-400 uppercase tracking-tighter">공장 복귀(분)</label><input type="number" className="w-full p-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700" value={site.backTime === 0 ? '' : site.backTime} placeholder="0" onChange={e => updateSite(site.id, 'backTime', Number(e.target.value))} /></div>
                      <div className="space-y-1.5"><label className="text-[7.5px] font-black text-indigo-500 uppercase tracking-tighter">요구 간격(분)</label><input type="number" className={`w-full p-2 border rounded-xl text-xs font-black transition-all ${site.isCapaShort ? 'bg-red-50 border-red-200 text-red-600' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`} value={site.targetInterval === 0 ? '' : site.targetInterval} placeholder="0" onChange={e => updateSite(site.id, 'targetInterval', Number(e.target.value))} /></div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer group"><input type="checkbox" className="w-4 h-4 rounded-md text-indigo-600 border-slate-300 focus:ring-indigo-500" checked={site.isSpecial} onChange={e => updateSite(site.id, 'isSpecial', e.target.checked)} /><span className="text-[10px] font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">특수배합</span></label>
                        {site.isSpecial && <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 border border-amber-100 rounded-lg text-[9px] font-black text-amber-700"><span className="italic">Add:</span><input type="number" className="w-6 bg-transparent outline-none text-center" value={site.specialTime} onChange={e => updateSite(site.id, 'specialTime', Number(e.target.value))} /><span>min</span></div>}
                      </div>
                      <div className="flex gap-3 text-[10px] font-black"><div className="text-slate-300"><span className="text-slate-500 uppercase">왕복시간</span> {site.rt}분</div><div className="text-slate-300"><span className="text-indigo-500 uppercase">필요대수</span> {site.cycleTrucks}대</div></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        </div>

        <div className="w-[48%] bg-white border-l border-slate-200 flex flex-col z-20 overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-6">
            <section className="bg-indigo-950 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] mb-8 flex items-center gap-2"><Activity size={14} /> Operation Live Feed</h3>
                <div className="grid grid-cols-2 gap-10">
                  <div><p className="text-[10px] text-indigo-300 font-bold mb-1 uppercase tracking-tighter">Peak Demand (총 필요 대수)</p><div className="flex items-baseline gap-2"><span className="text-5xl font-black tracking-tighter">{analysis.peakUsedTrucks}</span><span className="text-xl font-bold text-indigo-500">대</span></div></div>
                  <div className="text-right"><p className="text-[10px] text-indigo-300 font-bold mb-1 uppercase tracking-tighter">Total Volume (총 출하량)</p><div className="flex items-baseline gap-2 justify-end"><span className="text-4xl font-black tracking-tighter">{analysis.totalVolume}</span><span className="text-lg font-bold text-indigo-500">㎥</span></div></div>
                </div>
                <div className="mt-10 pt-6 border-t border-indigo-900 grid grid-cols-2 gap-4">
                  <div className="bg-indigo-900/40 p-4 rounded-2xl border border-indigo-800/50"><p className="text-[9px] text-indigo-400 font-bold uppercase mb-1">운용 가능 자차</p><p className="text-xl font-black text-white leading-none tracking-tight">총 {factoryConfig.ownTrucks}대 보유</p></div>
                  <div className={`p-4 rounded-2xl border transition-all ${analysis.maxShortage > 0 ? 'bg-orange-500 border-orange-400 shadow-lg shadow-orange-950/20' : 'bg-indigo-900/40 border-indigo-800/50'}`}><p className={`text-[9px] font-bold uppercase mb-1 ${analysis.maxShortage > 0 ? 'text-white' : 'text-indigo-400'}`}>부족분 (용차 필요)</p><p className={`text-3xl font-black leading-none ${analysis.maxShortage > 0 ? 'text-white' : 'text-indigo-500'}`}>+{analysis.maxShortage}<span className="text-sm ml-1 font-bold">대</span></p></div>
                </div>
              </div>
              <Truck size={240} className="absolute -right-20 -bottom-20 opacity-[0.04] pointer-events-none rotate-12" />
            </section>

            <section className="bg-slate-50 p-6 rounded-[2.2rem] border border-slate-100 shadow-inner">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><BarChart3 size={18} className="text-indigo-600" /> 시간대별 차량 수급 흐름</h3>
                <div className="flex gap-4"><div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase"><div className="w-2.5 h-2.5 bg-indigo-600 rounded-sm" /> 가용 (Safe)</div><div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase"><div className="w-2.5 h-2.5 bg-red-500 rounded-sm shadow-sm" /> 부족 (Short)</div></div>
              </div>
              <div className="relative h-44 flex items-end gap-[2px] px-2 border-b-2 border-slate-200 mb-10">
                {analysis.timeSlots.map((slot, i) => {
                  const isShortage = slot.available < 0;
                  const displayValue = Math.abs(slot.available);
                  const heightPercentage = Math.min(100, (displayValue / (factoryConfig.ownTrucks || 1)) * 100);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      <div className="absolute bottom-full mb-3 hidden group-hover:block z-40 bg-slate-900 text-white p-2.5 rounded-xl whitespace-nowrap shadow-2xl scale-90 origin-bottom"><p className="text-[10px] font-black text-indigo-400 mb-0.5">{slot.time}</p><p className="text-xs font-bold">{isShortage ? `차량 부족: ${Math.abs(slot.available)}대` : `공장 가동: ${slot.available}대`}</p></div>
                      <div style={{ height: `${Math.max(4, heightPercentage)}%` }} className={`w-full rounded-t-md transition-all duration-500 transform group-hover:scale-x-125 origin-bottom ${isShortage ? 'bg-red-500 hover:bg-red-400' : 'bg-indigo-600 hover:bg-indigo-500'}`} />
                      {slot.time.endsWith(':00') && (
                        <div className="absolute top-full mt-3 flex flex-col items-center"><div className="w-[1px] h-2 bg-slate-300 mb-1" /><span className="text-[10px] font-black text-slate-400 tracking-tighter whitespace-nowrap">{slot.time.split(':')[0]}시</span></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] px-2 flex items-center gap-2"><ShieldAlert size={16} className="text-indigo-600" /> Diagnostic Report</h3>
              <div className="grid grid-cols-1 gap-4 pb-12">
                <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-start gap-4"><div className="bg-indigo-50 p-3 rounded-2xl shrink-0"><Factory size={22} className="text-indigo-600" /></div><div className="flex-1"><div className="flex justify-between items-center mb-1"><p className="text-[11px] font-black text-slate-900 uppercase">공장 생산 캐파</p><span className="text-sm font-black text-indigo-600">{analysis.totalCapaPerHour} ㎥/hr</span></div><p className="text-[10px] text-slate-500 leading-relaxed font-bold">B/P 1, 2 등의 전체 생산 합계입니다. 현장들의 시간당 배차 간격 합계가 이 수치를 넘지 않도록 관리하십시오.</p></div></div>
                {analysis.totalCapaWarning && <div className="p-5 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4 border-l-4 border-l-red-500 animate-pulse"><div className="bg-red-500 p-3 rounded-2xl shrink-0 shadow-lg shadow-red-100"><AlertTriangle className="text-white" size={22} /></div><div className="flex-1"><p className="text-[11px] text-red-900 font-black uppercase mb-1">출하 병목(BottleNeck) 감지됨</p><p className="text-[10px] text-red-700 leading-relaxed font-bold">B/P 생산 속도가 현장의 물리적 요구 간격을 따라가지 못합니다. 현장 간격 조정 또는 생산 유닛 추가 배정이 필요합니다.</p></div></div>}
                <div className="p-5 bg-slate-900 rounded-3xl flex items-start gap-4"><div className="bg-indigo-600 p-3 rounded-2xl shrink-0 shadow-lg shadow-indigo-900/20"><Info size={22} className="text-white" /></div><div className="flex-1"><p className="text-[11px] text-indigo-300 font-black uppercase mb-1">전략적 인사이트</p><p className="text-[10px] text-slate-400 leading-relaxed">오늘 최대 동시 가동 차량은 <strong>{analysis.peakUsedTrucks}대</strong>입니다. {factoryConfig.ownTrucks - analysis.peakUsedTrucks > 0 ? `여유분 ${factoryConfig.ownTrucks - analysis.peakUsedTrucks}대는 휴차 또는 타 공장 지원 배정이 가능합니다.` : `보유 자차를 초과하는 피크 타임에는 용차를 선제 배치하십시오.`}</p></div></div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; border: 2px solid transparent; background-clip: content-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; background-clip: content-box; }
        input[type="time"] { position: relative; -webkit-appearance: none; appearance: none; display: flex; align-items: center; justify-content: center; }
        input[type="time"]::-webkit-calendar-picker-indicator { background: transparent; bottom: 0; color: transparent; cursor: pointer; height: auto; left: 0; position: absolute; right: 0; top: 0; width: auto; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .85; transform: scale(0.995); } }
        .animate-pulse { animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}</style>
    </div>
  );
}