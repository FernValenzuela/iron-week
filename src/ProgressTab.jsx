import {useState,useEffect} from "react";

const CARD = {background:"#0B121A",border:"1px solid #223044",borderRadius:12,padding:"12px 14px",marginBottom:12};
const SECTION_TITLE = {fontSize:13,fontWeight:800,color:"#E6EDF3",margin:"0 0 4px"};
const SECTION_SUB   = {fontSize:11,color:"#8A97A8",margin:"0 0 10px"};
const SKELETON      = {height:200,background:"#101923",borderRadius:8};

export default function ProgressTab({logs,checkin,macroFactor,weekKey}){
  const [rc,setRc] = useState(null);

  useEffect(()=>{
    let cancelled = false;
    import("recharts").then(mod => { if(!cancelled) setRc(mod); }).catch(()=>{});
    return ()=>{ cancelled = true; };
  },[]);

  return (
    <div>
      <div style={CARD}>
        <h3 style={SECTION_TITLE}>Weight progression</h3>
        <p style={SECTION_SUB}>Top set weight per exercise over time.</p>
        <div style={SKELETON} />
      </div>

      <div style={CARD}>
        <h3 style={SECTION_TITLE}>Weekly completion</h3>
        <p style={SECTION_SUB}>Share of sessions completed (not skipped), last 8 weeks.</p>
        <div style={SKELETON} />
      </div>

      <div style={CARD}>
        <h3 style={SECTION_TITLE}>Bodyweight trend</h3>
        <p style={SECTION_SUB}>Daily scale weight (solid) and smoothed trend (dashed).</p>
        <div style={SKELETON} />
      </div>
    </div>
  );
}
