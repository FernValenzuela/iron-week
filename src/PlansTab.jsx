import {useState} from "react";

const TAG_BG = {PUSH:"#351519",PULL:"#0C1E31",LEGS:"#0F2A22",UPPER:"#261A0A",ARMS:"#1B1733"};
const TAG_FG = {PUSH:"#F87171",PULL:"#60A5FA",LEGS:"#57D39A",UPPER:"#F4B350",ARMS:"#A99CFF"};

const btnBase = {cursor:"pointer",transition:"filter 0.15s, transform 0.1s"};

const useHover = () => {
  const [h,setH] = useState(false);
  return [h, {onMouseEnter:()=>setH(true),onMouseLeave:()=>setH(false),onTouchStart:()=>setH(true),onTouchEnd:()=>setH(false)}];
};

function Btn({onClick,children,style={},disabled=false,color="default"}){
  const [h,hProps] = useHover();
  const palettes = {
    default: {bg:"transparent",     border:"#2C3A4F",     fg:"#E6EDF3"},
    primary: {bg:"#1D9E75",         border:"#1D9E75",     fg:"#101923"},
    danger:  {bg:"#351519",         border:"#E53E3E",     fg:"#F87171"},
    warning: {bg:"#261A0A",         border:"#D69E2E",     fg:"#F4B350"},
    success: {bg:"#0F2A22",         border:"#38A169",     fg:"#57D39A"},
    ghost:   {bg:"transparent",     border:"transparent", fg:"#8A97A8"},
    muted:   {bg:"#0B121A",         border:"#2C3A4F",     fg:"#8A97A8"},
  };
  const p = palettes[color]||palettes.default;
  return (
    <button {...hProps} onClick={onClick} disabled={disabled} style={{
      ...btnBase,background:p.bg,border:`1px solid ${p.border}`,color:p.fg,
      borderRadius:8,padding:"7px 14px",fontSize:13,fontWeight:500,
      filter:h&&!disabled?"brightness(0.92)":"none",
      transform:h&&!disabled?"scale(0.98)":"scale(1)",
      opacity:disabled?0.5:1,...style
    }}>{children}</button>
  );
}

function IconBtn({onClick,icon,title,color="default",style={},disabled=false}){
  const [h,hProps] = useHover();
  const colors = {default:"#8A97A8",check:"#57D39A",cross:"#F87171"};
  return (
    <button {...hProps} onClick={onClick} title={title} disabled={disabled} style={{
      ...btnBase,background:"none",border:"none",padding:4,cursor:disabled?"not-allowed":"pointer",
      color:colors[color]||colors.default,
      filter:h&&!disabled?"brightness(0.75)":"none",
      transform:h&&!disabled?"scale(1.15)":"scale(1)",
      opacity:disabled?0.35:1,
      ...style
    }}>
      <i className={`ti ${icon}`} style={{fontSize:18}} aria-hidden="true"></i>
    </button>
  );
}

function Section({label,children}){
  return <div style={{marginBottom:"1rem"}}><p style={{fontSize:13,color:"#C8D4E3",margin:"0 0 6px",fontWeight:500}}>{label}</p>{children}</div>;
}

function SegControl({options,value,onChange}){
  return (
    <div style={{display:"flex",gap:6}}>
      {options.map(o=>(
        <Btn key={String(o.v)} onClick={()=>onChange(o.v)} color={value===o.v?"primary":"default"}
          style={{flex:1,padding:"8px 4px",fontSize:12,fontWeight:600}}>{o.l}</Btn>
      ))}
    </div>
  );
}

const MODE_OPTIONS = [
  {v:"planA",  l:"Plan A 4-day"},
  {v:"planB",  l:"Plan B 3-day"},
  {v:"custom", l:"Custom"},
];

export default function PlansTab({planMode,setPlanMode,customPlans,setCustomPlans,showToast}){
  return (
    <div>
      <Section label="Active plan">
        <SegControl
          options={MODE_OPTIONS}
          value={planMode}
          onChange={setPlanMode}
        />
        {planMode !== "custom" && (
          <p style={{margin:"8px 0 0",fontSize:12,color:"#8A97A8",lineHeight:1.5}}>
            Switch to Custom to build your own plan.
          </p>
        )}
      </Section>

      {planMode === "custom" && (
        <div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <h3 style={{fontSize:16,fontWeight:800,margin:0,color:"#E6EDF3"}}>Custom plans</h3>
            <Btn onClick={()=>{}} color="primary" style={{padding:"7px 12px",fontWeight:700}}>
              <i className="ti ti-plus" style={{marginRight:4}} aria-hidden="true"></i>
              New plan
            </Btn>
          </div>

          {customPlans.length === 0 ? (
            <div style={{background:"#0B121A",border:"1px solid #223044",borderRadius:10,padding:"16px 14px",textAlign:"center"}}>
              <p style={{margin:0,fontSize:13,color:"#8A97A8",lineHeight:1.5}}>
                No custom plans yet. Tap New plan to start.
              </p>
            </div>
          ) : (
            <div>
              {customPlans.map(plan => {
                const tag = plan.tag || "PUSH";
                const bg  = TAG_BG[tag] || "#1B1733";
                const fg  = TAG_FG[tag] || "#A99CFF";
                const exCount = (plan.exercises||[]).length;
                return (
                  <div key={plan.id}
                       style={{background:"#0B121A",border:"1px solid #223044",borderRadius:10,padding:"10px 12px",marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                          <p style={{margin:0,fontSize:14,fontWeight:700,color:"#E6EDF3",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                            {plan.name || "(unnamed)"}
                          </p>
                          <span style={{
                            background:bg,color:fg,fontSize:10,fontWeight:700,letterSpacing:0.5,
                            padding:"2px 6px",borderRadius:4
                          }}>{tag}</span>
                        </div>
                        <p style={{margin:0,fontSize:12,color:"#8A97A8"}}>
                          {exCount} exercise{exCount===1?"":"s"}
                        </p>
                      </div>
                      <IconBtn onClick={()=>{}} icon="ti-pencil" title="Edit"/>
                      <IconBtn onClick={()=>{}} icon="ti-trash" title="Delete" color="cross"/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
