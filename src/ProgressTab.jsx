export default function ProgressTab({logs,checkin,macroFactor,weekKey}){
  const logCount = Object.keys(logs||{}).length;
  return (
    <div>
      <h3 style={{fontSize:16,fontWeight:800,margin:"0 0 6px",color:"#E6EDF3"}}>Progress charts</h3>
      <p style={{margin:"0 0 12px",fontSize:13,color:"#8A97A8",lineHeight:1.5}}>
        Plan 03 will build this. Hooks for logs, check-in, MacroFactor, and the current week are already in place.
      </p>
      <div style={{background:"#0B121A",border:"1px solid #223044",borderRadius:10,padding:"12px 14px"}}>
        <p style={{margin:0,fontSize:12,color:"#8A97A8"}}>
          Week: <span style={{color:"#E6EDF3",fontWeight:700}}>{weekKey}</span>
        </p>
        <p style={{margin:"4px 0 0",fontSize:12,color:"#8A97A8"}}>
          Logged sessions: <span style={{color:"#E6EDF3",fontWeight:700}}>{logCount}</span>
        </p>
      </div>
    </div>
  );
}
