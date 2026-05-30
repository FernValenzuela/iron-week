import {useState} from "react";
import {makeCustomPlanId, makeCustomExerciseId, CUSTOM_PLAN_TAGS} from "./customPlans.js";

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

const inputStyle = {
  background:"#0B121A",border:"1px solid #2C3A4F",borderRadius:6,
  color:"#E6EDF3",padding:"7px 10px",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"
};

function makeBlankExercise(){
  return {id:makeCustomExerciseId(),name:"",sets:"3",reps:"8-12",note:"",sub:null,caution:null,bench:false};
}

function makeBlankPlan(){
  return {id:makeCustomPlanId(),name:"",tag:"PUSH",exercises:[makeBlankExercise()]};
}

function ExerciseRow({exercise,idx,total,onChange,onMove,onDelete}){
  const update = (field,value) => onChange(idx,{...exercise,[field]:value});
  return (
    <div style={{background:"#0B121A",border:"1px solid #223044",borderRadius:8,padding:"8px 10px",marginBottom:8}}>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        <input
          type="text"
          value={exercise.name}
          onChange={e=>update("name",e.target.value)}
          placeholder="Exercise name"
          style={{...inputStyle,flex:1,minWidth:0}}
        />
        <input
          type="text"
          value={exercise.sets}
          onChange={e=>update("sets",e.target.value)}
          placeholder="Sets"
          style={{...inputStyle,width:50,textAlign:"center",padding:"7px 6px"}}
        />
        <input
          type="text"
          value={exercise.reps}
          onChange={e=>update("reps",e.target.value)}
          placeholder="Reps"
          style={{...inputStyle,width:70,textAlign:"center",padding:"7px 6px"}}
        />
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",marginTop:6,gap:2}}>
        <IconBtn onClick={()=>onMove(idx,-1)} icon="ti-arrow-up" title="Move up" disabled={idx===0}/>
        <IconBtn onClick={()=>onMove(idx,1)}  icon="ti-arrow-down" title="Move down" disabled={idx===total-1}/>
        <IconBtn onClick={()=>onDelete(idx)}  icon="ti-x" title="Remove" color="cross"/>
      </div>
    </div>
  );
}

export default function PlansTab({planMode,setPlanMode,customPlans,setCustomPlans,showToast}){
  const [editingPlan,setEditingPlan] = useState(null);

  const inEditView = editingPlan !== null;
  const isNewPlan = inEditView && !customPlans.some(p=>p.id===editingPlan.id);

  const startNewPlan = () => setEditingPlan(makeBlankPlan());

  const startEditPlan = (plan) => setEditingPlan({
    id:plan.id,
    name:plan.name||"",
    tag:plan.tag||"PUSH",
    exercises:(plan.exercises||[]).map(ex=>({...ex})),
  });

  const cancelEdit = () => setEditingPlan(null);

  const saveEdit = () => {
    if(!editingPlan) return;
    const name = (editingPlan.name||"").trim();
    if(!name) return;
    if(!editingPlan.exercises || editingPlan.exercises.length===0) return;
    const toSave = {...editingPlan,name};
    setCustomPlans(prev => {
      const idx = prev.findIndex(p=>p.id===toSave.id);
      if(idx >= 0){
        const next = prev.slice();
        next[idx] = toSave;
        return next;
      }
      return [...prev,toSave];
    });
    showToast("Plan saved","success");
    setEditingPlan(null);
  };

  const updateExercise = (idx,next) => {
    setEditingPlan(prev => {
      if(!prev) return prev;
      const exercises = prev.exercises.slice();
      exercises[idx] = next;
      return {...prev,exercises};
    });
  };

  const addExercise = () => {
    setEditingPlan(prev => prev ? {...prev,exercises:[...prev.exercises,makeBlankExercise()]} : prev);
  };

  const moveExercise = (idx,direction) => {
    setEditingPlan(prev => {
      if(!prev) return prev;
      const target = idx + direction;
      if(target < 0 || target >= prev.exercises.length) return prev;
      const exercises = prev.exercises.slice();
      const [item] = exercises.splice(idx,1);
      exercises.splice(target,0,item);
      return {...prev,exercises};
    });
  };

  const deleteExercise = (idx) => {
    setEditingPlan(prev => {
      if(!prev) return prev;
      const exercises = prev.exercises.slice();
      exercises.splice(idx,1);
      return {...prev,exercises};
    });
  };

  if(inEditView){
    return (
      <div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <IconBtn onClick={cancelEdit} icon="ti-arrow-left" title="Back"/>
          <h3 style={{fontSize:16,fontWeight:800,margin:0,color:"#E6EDF3"}}>
            {isNewPlan ? "New plan" : "Edit plan"}
          </h3>
        </div>
        <Section label="Name">
          <input
            type="text"
            value={editingPlan.name}
            onChange={e=>setEditingPlan(prev=>({...prev,name:e.target.value}))}
            placeholder="e.g. My Push Day"
            style={{...inputStyle,width:"100%"}}
          />
        </Section>
        <Section label="Tag">
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {CUSTOM_PLAN_TAGS.map(t => {
              const active = editingPlan.tag === t;
              return (
                <button
                  key={t}
                  onClick={()=>setEditingPlan(prev=>({...prev,tag:t}))}
                  style={{
                    ...btnBase,
                    background:active?TAG_BG[t]:"transparent",
                    border:`1px solid ${active?TAG_FG[t]:"#2C3A4F"}`,
                    color:active?TAG_FG[t]:"#8A97A8",
                    borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:700,letterSpacing:0.5
                  }}
                >{t}</button>
              );
            })}
          </div>
        </Section>
        <Section label={`Exercises (${editingPlan.exercises.length})`}>
          {editingPlan.exercises.map((ex,idx)=>(
            <ExerciseRow
              key={ex.id}
              exercise={ex}
              idx={idx}
              total={editingPlan.exercises.length}
              onChange={updateExercise}
              onMove={moveExercise}
              onDelete={deleteExercise}
            />
          ))}
          <Btn onClick={addExercise} style={{width:"100%",padding:"9px 14px",fontWeight:600}}>
            <i className="ti ti-plus" style={{marginRight:6}} aria-hidden="true"></i>
            Add exercise
          </Btn>
        </Section>
        <div style={{display:"flex",gap:8,marginTop:16}}>
          <Btn onClick={cancelEdit} style={{flex:1,padding:"10px 14px",fontWeight:600}}>Cancel</Btn>
          <Btn onClick={saveEdit} color="primary"
               style={{flex:1,padding:"10px 14px",fontWeight:700}}>Save</Btn>
        </div>
      </div>
    );
  }

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
            <Btn onClick={startNewPlan} color="primary" style={{padding:"7px 12px",fontWeight:700}}>
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
                      <IconBtn onClick={()=>startEditPlan(plan)} icon="ti-pencil" title="Edit"/>
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
