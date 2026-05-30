export default function PlansTab({planMode,setPlanMode,customPlans,setCustomPlans,showToast}){
  return (
    <div>
      <h3 style={{fontSize:16,fontWeight:800,margin:"0 0 6px",color:"#E6EDF3"}}>Custom plans</h3>
      <p style={{margin:"0 0 12px",fontSize:13,color:"#8A97A8",lineHeight:1.5}}>
        Plan 02 will build this. The schema and tab are wired up so the builder can drop in without touching App.jsx.
      </p>
      <div style={{background:"#0B121A",border:"1px solid #223044",borderRadius:10,padding:"12px 14px"}}>
        <p style={{margin:0,fontSize:12,color:"#8A97A8"}}>
          Plan mode: <span style={{color:"#E6EDF3",fontWeight:700}}>{planMode}</span>
        </p>
        <p style={{margin:"4px 0 0",fontSize:12,color:"#8A97A8"}}>
          Custom plans saved: <span style={{color:"#E6EDF3",fontWeight:700}}>{customPlans.length}</span>
        </p>
      </div>
    </div>
  );
}
