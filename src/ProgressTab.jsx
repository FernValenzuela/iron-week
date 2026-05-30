import {useState,useEffect,useMemo} from "react";

const CARD = {background:"#0B121A",border:"1px solid #223044",borderRadius:12,padding:"12px 14px",marginBottom:12};
const SECTION_TITLE = {fontSize:13,fontWeight:800,color:"#E6EDF3",margin:"0 0 4px"};
const SECTION_SUB   = {fontSize:11,color:"#8A97A8",margin:"0 0 10px"};
const EMPTY_MSG     = {fontSize:12,color:"#8A97A8",margin:0,padding:"24px 8px",textAlign:"center",lineHeight:1.5};
const SKELETON      = {height:200,background:"#101923",borderRadius:8};
const CHART_BOX     = {height:200};
const AXIS_STYLE    = {fontSize:10,fill:"#8A97A8"};
const TOOLTIP_STYLE = {background:"#101923",border:"1px solid #223044",borderRadius:6,fontSize:12,color:"#E6EDF3"};
const TOOLTIP_LABEL = {color:"#8A97A8",fontSize:11};
const SELECT_STYLE  = {
  width:"100%",padding:"7px 10px",fontSize:13,marginBottom:10,
  background:"#101923",color:"#E6EDF3",border:"1px solid #223044",borderRadius:8,
  appearance:"none",cursor:"pointer",fontWeight:600,
};

const humanizeId = id => {
  if(!id) return "";
  return String(id).replace(/_/g," ").replace(/\b\w/g, c=>c.toUpperCase());
};

const numericWeight = raw => {
  if(raw == null) return null;
  const n = parseFloat(String(raw));
  return Number.isFinite(n) && n > 0 ? n : null;
};

export default function ProgressTab({logs,checkin,macroFactor,weekKey}){
  const [rc,setRc] = useState(null);
  const [selectedExerciseId,setSelectedExerciseId] = useState(null);

  useEffect(()=>{
    let cancelled = false;
    import("recharts").then(mod => { if(!cancelled) setRc(mod); }).catch(()=>{});
    return ()=>{ cancelled = true; };
  },[]);

  const weightSeriesByExercise = useMemo(()=>{
    const out = {};
    const entries = Object.entries(logs||{});
    for(const [logKey,log] of entries){
      if(!log || typeof log !== "object") continue;
      const date = logKey.slice(0,10);
      const sets = log.sets;
      if(!sets || typeof sets !== "object") continue;
      for(const [exId,set] of Object.entries(sets)){
        const w = numericWeight(set?.weight);
        if(w == null) continue;
        if(!out[exId]) out[exId] = [];
        out[exId].push({date, weight:w});
      }
    }
    for(const exId of Object.keys(out)){
      out[exId].sort((a,b)=> a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
    }
    return out;
  },[logs]);

  const exerciseOptions = useMemo(()=>{
    return Object.entries(weightSeriesByExercise)
      .filter(([,series])=>{
        const distinctWeeks = new Set(series.map(p=>p.date));
        return distinctWeeks.size >= 3;
      })
      .map(([id,series])=>({id, count:series.length, name:humanizeId(id)}))
      .sort((a,b)=> b.count - a.count);
  },[weightSeriesByExercise]);

  useEffect(()=>{
    if(exerciseOptions.length === 0){
      if(selectedExerciseId !== null) setSelectedExerciseId(null);
      return;
    }
    const exists = exerciseOptions.some(o=>o.id === selectedExerciseId);
    if(!exists) setSelectedExerciseId(exerciseOptions[0].id);
  },[exerciseOptions,selectedExerciseId]);

  const weightSeries = useMemo(()=>{
    if(!selectedExerciseId) return [];
    return weightSeriesByExercise[selectedExerciseId] || [];
  },[selectedExerciseId,weightSeriesByExercise]);

  const weeklyCompletion = useMemo(()=>{
    const byWeek = {};
    const entries = Object.entries(logs||{});
    for(const [logKey,log] of entries){
      if(!log || typeof log !== "object") continue;
      const date = logKey.slice(0,10);
      const rest = logKey.slice(11);
      if(!rest) continue;
      const baseId = rest.split("_")[0];
      if(!byWeek[date]) byWeek[date] = {logged:new Set(), skipped:new Set()};
      byWeek[date].logged.add(baseId);
      if(log.skippedDay === true) byWeek[date].skipped.add(baseId);
    }
    return Object.entries(byWeek)
      .map(([date,{logged,skipped}])=>{
        const total = logged.size;
        const skip  = skipped.size;
        const completion = total > 0 ? Math.round(((total - skip) / total) * 100) : 0;
        return {date, completion};
      })
      .sort((a,b)=> a.date < b.date ? -1 : a.date > b.date ? 1 : 0)
      .slice(-8);
  },[logs]);

  const loaded = rc !== null;

  return (
    <div>
      <div style={CARD}>
        <h3 style={SECTION_TITLE}>Weight progression</h3>
        <p style={SECTION_SUB}>Top set weight per exercise over time.</p>

        {exerciseOptions.length === 0 ? (
          <p style={EMPTY_MSG}>Log 3+ weeks of an exercise to see progression.</p>
        ) : (
          <>
            <select
              value={selectedExerciseId || ""}
              onChange={e=>setSelectedExerciseId(e.target.value)}
              style={SELECT_STYLE}
            >
              {exerciseOptions.map(o=>(
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
            <div style={CHART_BOX}>
              {loaded ? (
                <rc.ResponsiveContainer width="100%" height={200}>
                  <rc.LineChart data={weightSeries} margin={{top:8,right:8,left:-12,bottom:0}}>
                    <rc.CartesianGrid stroke="#1A2533" strokeDasharray="3 3" />
                    <rc.XAxis dataKey="date" tick={AXIS_STYLE} stroke="#2C3A4F" />
                    <rc.YAxis tick={AXIS_STYLE} stroke="#2C3A4F" domain={["auto","auto"]} />
                    <rc.Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      labelStyle={TOOLTIP_LABEL}
                      itemStyle={{color:"#E6EDF3"}}
                      formatter={v=>[`${v} lb`,"Weight"]}
                    />
                    <rc.Line type="monotone" dataKey="weight" stroke="#F87171" strokeWidth={2} dot={{r:3,fill:"#F87171"}} activeDot={{r:5}} />
                  </rc.LineChart>
                </rc.ResponsiveContainer>
              ) : (
                <div style={SKELETON} />
              )}
            </div>
          </>
        )}
      </div>

      <div style={CARD}>
        <h3 style={SECTION_TITLE}>Weekly completion</h3>
        <p style={SECTION_SUB}>Share of sessions completed (not skipped), last 8 weeks.</p>

        {weeklyCompletion.length === 0 ? (
          <p style={EMPTY_MSG}>Complete a workout to start your streak.</p>
        ) : (
          <div style={CHART_BOX}>
            {loaded ? (
              <rc.ResponsiveContainer width="100%" height={200}>
                <rc.BarChart data={weeklyCompletion} margin={{top:8,right:8,left:-12,bottom:0}}>
                  <rc.CartesianGrid stroke="#1A2533" strokeDasharray="3 3" />
                  <rc.XAxis dataKey="date" tick={AXIS_STYLE} stroke="#2C3A4F" />
                  <rc.YAxis tick={AXIS_STYLE} stroke="#2C3A4F" domain={[0,100]} />
                  <rc.Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    labelStyle={TOOLTIP_LABEL}
                    itemStyle={{color:"#E6EDF3"}}
                    formatter={v=>[`${v}%`,"Completion"]}
                  />
                  <rc.Bar dataKey="completion" fill="#57D39A" radius={[4,4,0,0]} />
                </rc.BarChart>
              </rc.ResponsiveContainer>
            ) : (
              <div style={SKELETON} />
            )}
          </div>
        )}
      </div>

      <div style={CARD}>
        <h3 style={SECTION_TITLE}>Bodyweight trend</h3>
        <p style={SECTION_SUB}>Daily scale weight (solid) and smoothed trend (dashed).</p>
        <div style={SKELETON} />
      </div>
    </div>
  );
}
