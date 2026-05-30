import { useState, useEffect, useCallback } from "react";

// Constants
const DAYS_FULL = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const SUBS = {
  bench:    { label:"Bench alternatives",            options:["Machine chest press","Neutral-grip dumbbell press","Push-up handles","Cable chest press","Skip chest - triceps/delts only"] },
  rear_delt:{ label:"Rear delt alternatives",        options:["Reverse pec deck","Cable rear delt fly","Face pulls"] },
  oh_tri:   { label:"Overhead triceps alternatives", options:["Rope pushdown","Single-arm cable pushdown","Cross-body cable extension"] },
};

const PAUSED_EXERCISES = {
  pushBench: {id:"bench",  name:"Bench press rehab", sets:"3", reps:"5", bench:true, sub:"bench", caution:"red", note:"Controlled tempo. Default 155 lb. Stop if pain >= 3/10."},
  upperABench: {id:"bench3", name:"Bench press rehab", sets:"3", reps:"5", bench:true, sub:"bench", caution:"red", note:"155 lb default. Controlled tempo."},
};

const PLAN_4 = [
  { id:"push",  label:"Push A - DB Press + Delts", tag:"PUSH",
    exercises:[
      {id:"db_press",name:"Neutral-grip dumbbell press",            sets:"3",   reps:"8-12",   sub:"bench", note:"Shoulder-friendly primary press while barbell bench is paused"},
      {id:"db_fly",  name:"DB flyes",                               sets:"3",   reps:"10-15",  sub:"bench", note:"Secondary chest option. Keep shoulder blades set and range pain-free."},
      {id:"cab_lat", name:"Cable lateral raise",                    sets:"4",   reps:"12-20",  note:""},
      {id:"rope_pd", name:"Rope pushdown",                          sets:"3-4", reps:"10-15",  note:""},
      {id:"oh_tri",  name:"Overhead cable triceps extension",       sets:"2-3", reps:"12-15",  sub:"oh_tri",caution:"yellow",note:"Skip if any shoulder discomfort."},
      {id:"face_pull",name:"Face pulls / rear delt fly",            sets:"2-3", reps:"15-20",  sub:"rear_delt",note:"10 lb. Lead elbows, chest supported, no swing."},
    ]},
  { id:"pull",  label:"Pull A - Rows + Biceps", tag:"PULL",
    exercises:[
      {id:"cs_row",   name:"Chest-supported row",                   sets:"4",   reps:"8-12",  note:""},
      {id:"pulldown", name:"Neutral-grip pulldown / pull-ups",      sets:"3-4", reps:"8-12",  note:""},
      {id:"cab_row",  name:"Cable row",                             sets:"3",   reps:"10-12", note:""},
      {id:"rd_fly",   name:"Rear delt fly",                         sets:"3-4", reps:"15-20", sub:"rear_delt",note:"10 lb DBs. Form > weight. Progress at 20/20/18 clean."},
      {id:"ez_curl",  name:"EZ-bar curl",                           sets:"3",   reps:"8-12",  note:""},
      {id:"cab_curl", name:"Cable curl / preacher curl",            sets:"3",   reps:"10-15", note:""},
      {id:"hammer",   name:"Hammer curl",                           sets:"2-3", reps:"10-15", note:""},
    ]},
  { id:"legs",  label:"Legs A - Squat / Press", tag:"LEGS",
    exercises:[
      {id:"squat",    name:"Squat / hack squat / leg press",        sets:"3-4", reps:"6-10",  note:""},
      {id:"rdl",      name:"Romanian deadlift",                     sets:"3",   reps:"8-12",  note:""},
      {id:"lgcurl",   name:"Leg curl",                              sets:"3",   reps:"10-15", note:""},
      {id:"lgext",    name:"Leg extension",                         sets:"2-3", reps:"12-15", note:""},
      {id:"lat_legs", name:"Cable / machine lateral raise",         sets:"4",   reps:"12-20", note:""},
      {id:"calves",   name:"Calves or abs",                         sets:"3-4", reps:"-",     note:""},
    ]},
  { id:"upper", label:"Upper Arms - Shoulders + Pump", tag:"UPPER",
    exercises:[
      {id:"landmine", name:"Landmine press / neutral shoulder press",sets:"3",  reps:"8-12",  note:"Shoulder-friendly option."},
      {id:"pf_press", name:"Pain-free push-up / machine press",     sets:"3",   reps:"8-15",  note:""},
      {id:"pu_row",   name:"Lat pulldown or row",                   sets:"3",   reps:"10-12", note:""},
      {id:"lat_up",   name:"Lateral raise",                         sets:"4",   reps:"15-20", note:""},
      {id:"preacher", name:"Preacher curl / cable curl",            sets:"3",   reps:"10-15", note:""},
      {id:"inc_curl", name:"Incline curl / machine curl",           sets:"2-3", reps:"10-15", note:""},
      {id:"rope_up",  name:"Rope pushdown",                         sets:"3",   reps:"12-15", note:""},
      {id:"sing_tri", name:"Single-arm cable triceps extension",    sets:"2-3", reps:"12-15", note:""},
    ]},
];

const PLAN_3 = [
  { id:"upperA", label:"Upper A - DB Press + Back", tag:"UPPER A",
    exercises:[
      {id:"db_press3",name:"Neutral-grip dumbbell press",           sets:"3",   reps:"8-12",  sub:"bench",note:"Shoulder-friendly primary press while barbell bench is paused"},
      {id:"db_fly3",  name:"DB flyes",                              sets:"3",   reps:"10-15", sub:"bench",note:"Secondary chest option. Keep shoulder blades set and range pain-free."},
      {id:"row3",     name:"Chest-supported row",                   sets:"4",   reps:"8-12",  note:""},
      {id:"lat3",     name:"Neutral-grip pulldown",                 sets:"3",   reps:"8-12",  note:""},
      {id:"lateral3", name:"Cable lateral raise",                   sets:"4",   reps:"12-20", note:""},
      {id:"rope3",    name:"Rope pushdown",                         sets:"3",   reps:"12-15", note:""},
      {id:"ez3",      name:"EZ-bar curl",                           sets:"3",   reps:"8-12",  note:""},
    ]},
  { id:"lower3", label:"Lower A - Squat / Press", tag:"LEGS",
    exercises:[
      {id:"squat3",   name:"Squat / hack squat / leg press",        sets:"3-4", reps:"6-10",  note:""},
      {id:"rdl3",     name:"Romanian deadlift",                     sets:"3",   reps:"8-12",  note:""},
      {id:"lgcurl3",  name:"Leg curl",                              sets:"3",   reps:"10-15", note:""},
      {id:"lgext3",   name:"Leg extension",                         sets:"2-3", reps:"12-15", note:""},
      {id:"calves3",  name:"Calves or abs",                         sets:"3-4", reps:"-",     note:""},
    ]},
  { id:"upperB", label:"Upper B - Arms Focus", tag:"ARMS",
    exercises:[
      {id:"land3",    name:"Landmine / neutral shoulder press",     sets:"3",   reps:"8-12",  note:""},
      {id:"rd3",      name:"Rear delt fly",                         sets:"3-4", reps:"15-20", sub:"rear_delt",note:"10 lb. Lead elbows."},
      {id:"pre3",     name:"Preacher curl / cable curl",            sets:"3",   reps:"10-15", note:""},
      {id:"ham3",     name:"Hammer curl",                           sets:"2-3", reps:"10-15", note:""},
      {id:"rope3b",   name:"Rope pushdown",                         sets:"3",   reps:"12-15", note:""},
      {id:"sing3",    name:"Single-arm cable extension",            sets:"2-3", reps:"12-15", note:""},
    ]},
];

const WORKOUT_VARIANTS = {
  push: [
    {variantId:"push_b", variantName:"Push B", summary:"Machine press + flyes", label:"Push B - Machine Chest + Triceps", tag:"PUSH",
      exercises:[
        {id:"mach_press_b",name:"Machine chest press",                    sets:"3",   reps:"8-12",  sub:"bench",note:"Pain-free controlled reps. Shoulder blades set."},
        {id:"cable_fly_b", name:"Cable fly / pec deck",                   sets:"3",   reps:"10-15", sub:"bench",note:"Smooth stretch, no shoulder pressure."},
        {id:"seated_lat_b",name:"Seated machine lateral raise",           sets:"4",   reps:"12-20", note:"Own the top, slow lower."},
        {id:"rope_pd_b",   name:"Rope pushdown",                          sets:"3-4", reps:"10-15", note:""},
        {id:"cross_tri_b", name:"Cross-body cable triceps extension",     sets:"2-3", reps:"12-15", note:"Shoulder-friendly triceps slot."},
        {id:"face_pull_b", name:"Face pulls",                             sets:"2-3", reps:"15-20", sub:"rear_delt",note:"Light, elbows high, clean reps."},
      ]},
    {variantId:"push_30", variantName:"30 min", summary:"Fast chest/delts/tris", label:"Push 30 - Chest + Delts + Triceps", tag:"PUSH",
      exercises:[
        {id:"mach_press_30",name:"Machine chest press",                   sets:"2-3", reps:"8-12",  sub:"bench",note:"Pain-free reps only."},
        {id:"lat_30",       name:"Cable lateral raise",                   sets:"3",   reps:"12-20", note:"Short rests, clean form."},
        {id:"rope_30",      name:"Rope pushdown",                         sets:"3",   reps:"10-15", note:""},
        {id:"rear_30",      name:"Face pulls / rear delt fly",            sets:"2",   reps:"15-20", sub:"rear_delt",note:"Light and controlled."},
      ]},
  ],
  pull: [
    {variantId:"pull_b", variantName:"Pull B", summary:"Pulldown + rear delts", label:"Pull B - Lats + Rear Delts", tag:"PULL",
      exercises:[
        {id:"pulldown_b", name:"Neutral-grip pulldown",                   sets:"4",   reps:"8-12",  note:"Drive elbows down, full stretch."},
        {id:"one_arm_row_b",name:"One-arm cable row",                     sets:"3",   reps:"10-12", note:"Control torso, squeeze hard."},
        {id:"reverse_pec_b",name:"Reverse pec deck / rear delt fly",      sets:"4",   reps:"12-20", sub:"rear_delt",note:"10-15 lb mindset. Lead with elbows."},
        {id:"incl_curl_b", name:"Incline DB curl",                        sets:"3",   reps:"10-15", note:"Long head stretch, no shoulder crank."},
        {id:"hammer_b",    name:"Rope hammer curl",                       sets:"2-3", reps:"12-15", note:""},
        {id:"curl_fin_b",  name:"Cable curl finisher",                    sets:"2",   reps:"15-20", note:"Pump work, controlled."},
      ]},
    {variantId:"pull_30", variantName:"30 min", summary:"Back + biceps fast", label:"Pull 30 - Back + Biceps", tag:"PULL",
      exercises:[
        {id:"pulldown_30",name:"Neutral-grip pulldown",                   sets:"3",   reps:"8-12",  note:""},
        {id:"row_30",     name:"Chest-supported row",                     sets:"3",   reps:"8-12",  note:""},
        {id:"rear_30_pull",name:"Rear delt fly",                          sets:"2-3", reps:"15-20", sub:"rear_delt",note:"Light, clean, no swing."},
        {id:"curl_30",    name:"Cable curl / preacher curl",              sets:"3",   reps:"10-15", note:""},
      ]},
  ],
  legs: [
    {variantId:"legs_b", variantName:"Legs B", summary:"Hinge + hamstrings", label:"Legs B - Hinge + Hamstrings", tag:"LEGS",
      exercises:[
        {id:"rdl_b",      name:"Romanian deadlift",                       sets:"4",   reps:"8-12",  note:"Hips back, controlled stretch."},
        {id:"lgcurl_b",   name:"Seated / lying leg curl",                 sets:"3-4", reps:"10-15", note:"Pause the squeeze."},
        {id:"split_b",    name:"Bulgarian split squat / leg press",       sets:"3",   reps:"8-12",  note:"Pick the joint-friendly option."},
        {id:"lgext_b",    name:"Leg extension",                           sets:"2-3", reps:"12-15", note:"Smooth reps, no knee slam."},
        {id:"calves_b",   name:"Calves",                                  sets:"3-4", reps:"10-15", note:"Full stretch and pause."},
        {id:"lat_legs_b", name:"Cable / machine lateral raise",           sets:"3",   reps:"12-20", note:"Optional delt touch."},
      ]},
    {variantId:"legs_30", variantName:"30 min", summary:"Lower body minimum", label:"Legs 30 - Lower Body Minimum", tag:"LEGS",
      exercises:[
        {id:"leg_press_30",name:"Leg press / hack squat",                 sets:"3",   reps:"8-12",  note:"Hard but controlled."},
        {id:"curl_legs_30",name:"Leg curl",                               sets:"3",   reps:"10-15", note:""},
        {id:"ext_legs_30", name:"Leg extension",                          sets:"2",   reps:"12-15", note:""},
        {id:"calves_30",   name:"Calves or abs",                          sets:"3",   reps:"10-15", note:""},
      ]},
  ],
  upper: [
    {variantId:"upper_b", variantName:"Arms B", summary:"Shoulders + arms pump", label:"Upper Arms B - Pump Focus", tag:"ARMS",
      exercises:[
        {id:"neutral_press_b",name:"Neutral shoulder press machine",      sets:"3",   reps:"8-12",  note:"Only if shoulder feels clean."},
        {id:"lat_pump_b",    name:"Lateral raise",                        sets:"4",   reps:"15-20", note:"Reps and control over load."},
        {id:"rear_pump_b",   name:"Rear delt fly",                        sets:"3",   reps:"15-20", sub:"rear_delt",note:"10-15 lb. Chest supported."},
        {id:"preacher_b",    name:"Preacher curl",                        sets:"3",   reps:"10-15", note:""},
        {id:"cable_curl_b",  name:"Cable curl",                           sets:"2-3", reps:"12-15", note:""},
        {id:"rope_pump_b",   name:"Rope pushdown",                        sets:"3",   reps:"12-15", note:""},
        {id:"single_tri_b",  name:"Single-arm cable triceps extension",   sets:"2-3", reps:"12-15", note:""},
      ]},
    {variantId:"upper_30", variantName:"30 min", summary:"Shoulders + arms fast", label:"Upper 30 - Shoulders + Arms", tag:"ARMS",
      exercises:[
        {id:"lat_upper_30", name:"Lateral raise",                         sets:"3",   reps:"15-20", note:""},
        {id:"row_upper_30", name:"Lat pulldown or row",                   sets:"3",   reps:"10-12", note:""},
        {id:"curl_upper_30",name:"Cable curl / preacher curl",            sets:"3",   reps:"10-15", note:""},
        {id:"tri_upper_30", name:"Rope pushdown",                         sets:"3",   reps:"12-15", note:""},
      ]},
  ],
  upperA: [
    {variantId:"upperA_b", variantName:"Upper A B", summary:"Machine press + row", label:"Upper A B - Machine Press + Row", tag:"UPPER A",
      exercises:[
        {id:"mach_upper_a_b",name:"Machine chest press",                  sets:"3",   reps:"8-12",  sub:"bench",note:"Pain-free chest work while barbell bench is paused."},
        {id:"cable_fly_a_b", name:"Cable fly / pec deck",                 sets:"2-3", reps:"10-15", sub:"bench",note:"Secondary chest option."},
        {id:"row_a_b",       name:"Chest-supported row",                  sets:"3-4", reps:"8-12",  note:""},
        {id:"pulldown_a_b",  name:"Neutral-grip pulldown",                sets:"3",   reps:"8-12",  note:""},
        {id:"lateral_a_b",   name:"Cable lateral raise",                  sets:"3",   reps:"12-20", note:""},
        {id:"rope_a_b",      name:"Rope pushdown",                        sets:"2-3", reps:"12-15", note:""},
        {id:"curl_a_b",      name:"EZ-bar curl / cable curl",             sets:"2-3", reps:"8-12",  note:""},
      ]},
    {variantId:"upperA_30", variantName:"30 min", summary:"Upper fallback", label:"Upper A 30 - Press + Pull", tag:"UPPER A",
      exercises:[
        {id:"press_a_30",   name:"Neutral-grip DB / machine press",       sets:"3",   reps:"8-12",  sub:"bench",note:"Shoulder-friendly primary press."},
        {id:"row_a_30",     name:"Chest-supported row",                   sets:"3",   reps:"8-12",  note:""},
        {id:"lat_a_30",     name:"Cable lateral raise",                   sets:"3",   reps:"12-20", note:""},
        {id:"arms_a_30",    name:"Rope pushdown or cable curl",           sets:"3",   reps:"10-15", note:"Pick the one you care about today."},
      ]},
  ],
  lower3: [
    {variantId:"lower_b", variantName:"Lower B", summary:"Hinge + hamstrings", label:"Lower B - Hinge + Hamstrings", tag:"LEGS",
      exercises:[
        {id:"rdl_lower_b",    name:"Romanian deadlift",                   sets:"4",   reps:"8-12",  note:""},
        {id:"curl_lower_b",   name:"Seated / lying leg curl",             sets:"3-4", reps:"10-15", note:""},
        {id:"press_lower_b",  name:"Leg press / split squat",             sets:"3",   reps:"8-12",  note:""},
        {id:"ext_lower_b",    name:"Leg extension",                       sets:"2-3", reps:"12-15", note:""},
        {id:"calves_lower_b", name:"Calves or abs",                       sets:"3-4", reps:"10-15", note:""},
      ]},
    {variantId:"lower_30", variantName:"30 min", summary:"Lower minimum", label:"Lower 30 - Minimum Effective Dose", tag:"LEGS",
      exercises:[
        {id:"press_lower_30", name:"Leg press / hack squat",              sets:"3",   reps:"8-12",  note:""},
        {id:"curl_lower_30",  name:"Leg curl",                            sets:"3",   reps:"10-15", note:""},
        {id:"ext_lower_30",   name:"Leg extension",                       sets:"2",   reps:"12-15", note:""},
        {id:"calves_lower_30",name:"Calves or abs",                       sets:"3",   reps:"10-15", note:""},
      ]},
  ],
  upperB: [
    {variantId:"upperB_b", variantName:"Arms Pump", summary:"Delts + biceps/triceps", label:"Upper B Pump - Delts + Arms", tag:"ARMS",
      exercises:[
        {id:"lat_upper_b", name:"Lateral raise",                          sets:"4",   reps:"15-20", note:""},
        {id:"rear_upper_b",name:"Rear delt fly",                          sets:"3-4", reps:"15-20", sub:"rear_delt",note:"10-15 lb. Lead elbows."},
        {id:"pre_upper_b", name:"Preacher curl",                          sets:"3",   reps:"10-15", note:""},
        {id:"ham_upper_b", name:"Hammer curl",                            sets:"2-3", reps:"10-15", note:""},
        {id:"rope_upper_b",name:"Rope pushdown",                          sets:"3",   reps:"12-15", note:""},
        {id:"tri_upper_b", name:"Single-arm cable triceps extension",     sets:"2-3", reps:"12-15", note:""},
      ]},
    {variantId:"upperB_30", variantName:"30 min", summary:"Arms quick hit", label:"Upper B 30 - Arms Quick Hit", tag:"ARMS",
      exercises:[
        {id:"rear_b_30",  name:"Rear delt fly",                           sets:"3",   reps:"15-20", sub:"rear_delt",note:"Light, strict reps."},
        {id:"curl_b_30",  name:"Preacher curl / cable curl",               sets:"3",   reps:"10-15", note:""},
        {id:"hammer_b_30",name:"Hammer curl",                              sets:"2",   reps:"10-15", note:""},
        {id:"tri_b_30",   name:"Rope pushdown",                            sets:"3",   reps:"12-15", note:""},
      ]},
  ],
};

const getWorkoutOptions = workout => {
  const baseName = workout.label.split(" - ")[0];
  return [
    {
      variantId:"base",
      variantName:baseName,
      summary:"Main template",
      label:workout.label,
      tag:workout.tag,
      exercises:workout.exercises,
    },
    ...(WORKOUT_VARIANTS[workout.id]||[]),
  ];
};

const selectWorkoutVariant = (workout, variantId) => {
  const options = getWorkoutOptions(workout);
  const selected = options.find(o=>o.variantId===(variantId||"base")) || options[0];
  return {
    ...workout,
    label:selected.label,
    tag:selected.tag||workout.tag,
    exercises:selected.exercises,
    baseId:workout.id,
    variantId:selected.variantId,
    variantName:selected.variantName,
    variantSummary:selected.summary,
    options,
  };
};

const workoutLogKey = (weekKey, workout) => {
  const id = workout.baseId || workout.id;
  return workout.variantId && workout.variantId !== "base" ? `${weekKey}_${id}_${workout.variantId}` : `${weekKey}_${id}`;
};

const TAG_BG   = {PUSH:"#351519",PULL:"#0C1E31",LEGS:"#0F2A22",UPPER:"#261A0A","UPPER A":"#261A0A","UPPER B":"#261A0A",ARMS:"#1B1733"};
const TAG_FG   = {PUSH:"#F87171",PULL:"#60A5FA",LEGS:"#57D39A",UPPER:"#F4B350","UPPER A":"#F4B350","UPPER B":"#F4B350",ARMS:"#A99CFF"};

const ls = {
  get:(k,d)=>{ try{ const v=localStorage.getItem(k); return v!=null?JSON.parse(v):d; }catch{ return d; }},
  set:(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch{} }
};
const isoWeek = () => { const t=new Date(); t.setHours(0,0,0,0); t.setDate(t.getDate()-t.getDay()); return t.toISOString().slice(0,10); };
const emptyMacroFactor = {importedAt:null,fileName:"",rows:[],summary:null};

// v2 -> v3 migration: usePlanA boolean -> planMode enum, seed iw_custom_plans.
// Idempotent: re-running on a v3 state is a no-op.
function migrateSchema(){
  const version = ls.get("iw_schema_version", 1);
  if(version < 3){
    if(ls.get("planMode", null) == null){
      const usePlanA = ls.get("usePlanA", true);
      ls.set("planMode", usePlanA ? "planA" : "planB");
    }
    if(ls.get("iw_custom_plans", null) == null){
      ls.set("iw_custom_plans", []);
    }
    ls.set("iw_schema_version", 3);
  }
}
migrateSchema();

const downloadJsonFile = (payload, fileName) => {
  const blob = new Blob([JSON.stringify(payload,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

const parseCsv = text => {
  const out = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for(let i=0;i<text.length;i++){
    const ch = text[i];
    const next = text[i+1];
    if(ch === "\""){
      if(inQuotes && next === "\""){
        cell += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if(ch === "," && !inQuotes){
      row.push(cell);
      cell = "";
    } else if((ch === "\n" || ch === "\r") && !inQuotes){
      if(ch === "\r" && next === "\n") i += 1;
      row.push(cell);
      if(row.some(v=>String(v).trim() !== "")) out.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }

  row.push(cell);
  if(row.some(v=>String(v).trim() !== "")) out.push(row);
  if(out.length < 2) return [];

  const headers = out[0].map(h=>String(h).trim());
  return out.slice(1).map(cells => headers.reduce((acc,h,i)=>({...acc,[h]:cells[i] ?? ""}),{}));
};

const normalizeHeader = value => String(value||"").toLowerCase().replace(/[^a-z0-9]/g,"");
const findField = (row, names) => {
  const indexed = Object.keys(row).reduce((acc,key)=>({...acc,[normalizeHeader(key)]:row[key]}),{});
  for(const name of names){
    const exact = normalizeHeader(name);
    if(indexed[exact] != null) return indexed[exact];
  }
  for(const key of Object.keys(indexed)){
    if(names.some(name=>key.includes(normalizeHeader(name)))) return indexed[key];
  }
  return "";
};
const toNumber = value => {
  const cleaned = String(value ?? "").replace(/[^0-9.-]/g,"");
  if(!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};
const avg = values => {
  const xs = values.filter(v=>Number.isFinite(v));
  return xs.length ? Math.round((xs.reduce((sum,v)=>sum+v,0)/xs.length)*10)/10 : null;
};
const parseMacroFactorCsv = (text, fileName="MacroFactor CSV") => {
  const rows = parseCsv(text).map(row => ({
    date:String(findField(row,["date","day","start date"])).trim(),
    calories:toNumber(findField(row,["calories","calorie intake","energy","kcal"])),
    protein:toNumber(findField(row,["protein","protein g","protein grams"])),
    carbs:toNumber(findField(row,["carbs","carbohydrates","carbs g","carbohydrate grams"])),
    fat:toNumber(findField(row,["fat","fat g","fat grams","total fat"])),
    scaleWeight:toNumber(findField(row,["scale weight","weight","bodyweight","body weight"])),
    weightTrend:toNumber(findField(row,["weight trend","trend weight"])),
    expenditure:toNumber(findField(row,["expenditure","energy expenditure","tdee"])),
    raw:row,
  })).filter(row => row.date || ["calories","protein","carbs","fat","scaleWeight","weightTrend","expenditure"].some(k=>Number.isFinite(row[k])));

  const dated = rows.filter(r=>r.date);
  const latest = [...rows].reverse().find(Boolean) || null;
  return {
    importedAt:new Date().toISOString(),
    fileName,
    rows,
    summary:{
      rowCount:rows.length,
      dateRange:{
        start:dated[0]?.date || null,
        end:dated[dated.length-1]?.date || null,
      },
      averages:{
        calories:avg(rows.map(r=>r.calories)),
        protein:avg(rows.map(r=>r.protein)),
        carbs:avg(rows.map(r=>r.carbs)),
        fat:avg(rows.map(r=>r.fat)),
        scaleWeight:avg(rows.map(r=>r.scaleWeight)),
        weightTrend:avg(rows.map(r=>r.weightTrend)),
        expenditure:avg(rows.map(r=>r.expenditure)),
      },
      latest:latest ? {
        date:latest.date || null,
        calories:latest.calories,
        protein:latest.protein,
        carbs:latest.carbs,
        fat:latest.fat,
        scaleWeight:latest.scaleWeight,
        weightTrend:latest.weightTrend,
        expenditure:latest.expenditure,
      } : null,
    },
  };
};

// Shared button style helper
const btnBase = {cursor:"pointer",transition:"filter 0.15s, transform 0.1s"};
const useHover = () => {
  const [h,setH] = useState(false);
  return [h, {onMouseEnter:()=>setH(true),onMouseLeave:()=>setH(false),onTouchStart:()=>setH(true),onTouchEnd:()=>setH(false)}];
};

function Btn({onClick,children,style={},disabled=false,color="default"}){
  const [h,hProps] = useHover();
  const palettes = {
    default:  {bg:"transparent",        border:"#2C3A4F",        fg:"#E6EDF3"},
    primary:  {bg:"#1D9E75",            border:"#1D9E75",        fg:"#101923"},
    danger:   {bg:"#351519",            border:"#E53E3E",        fg:"#F87171"},
    warning:  {bg:"#261A0A",            border:"#D69E2E",        fg:"#F4B350"},
    success:  {bg:"#0F2A22",            border:"#38A169",        fg:"#57D39A"},
    ghost:    {bg:"transparent",        border:"transparent",    fg:"#8A97A8"},
    muted:    {bg:"#0B121A",            border:"#2C3A4F",        fg:"#8A97A8"},
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

function IconBtn({onClick,icon,title,color="default",style={}}){
  const [h,hProps] = useHover();
  const colors = {
    default:"#8A97A8",check:"#57D39A",cross:"#F87171",
  };
  return (
    <button {...hProps} onClick={onClick} title={title} style={{
      ...btnBase,background:"none",border:"none",padding:4,cursor:"pointer",
      color:colors[color]||colors.default,
      filter:h?"brightness(0.75)":"none",
      transform:h?"scale(1.15)":"scale(1)",
      ...style
    }}>
      <i className={`ti ${icon}`} style={{fontSize:18}} aria-hidden="true"></i>
    </button>
  );
}

// App
export default function App(){
  const [tab,setTab]               = useState("today");
  const [toast,setToast]           = useState(null);
  const [benchWeight,setBenchWeight]       = useState(()=>ls.get("benchWeight",155));
  const [nextWorkoutIdx,setNextWorkoutIdx] = useState(()=>ls.get("nextWorkoutIdx",0));
  const [planMode,setPlanMode]             = useState(()=>ls.get("planMode","planA"));
  const [customPlans,setCustomPlans]       = useState(()=>ls.get("iw_custom_plans",[]));
  const [volumeMod,setVolumeMod]           = useState(()=>ls.get("volumeMod","normal"));
  const [workoutVariants,setWorkoutVariants] = useState(()=>ls.get("workoutVariants",{}));
  const [logs,setLogs]                     = useState(()=>ls.get("logs",{}));
  const [checkin,setCheckin]               = useState(()=>ls.get("checkin",{bw:"",cals:"",protein:"",sleep:5,notes:""}));
  const [review,setReview]                 = useState(()=>ls.get("review",null));
  const [macroFactor,setMacroFactor]       = useState(()=>ls.get("macroFactor",emptyMacroFactor));
  const weekKey = isoWeek();

  useEffect(()=>ls.set("benchWeight",benchWeight),[benchWeight]);
  useEffect(()=>ls.set("nextWorkoutIdx",nextWorkoutIdx),[nextWorkoutIdx]);
  useEffect(()=>ls.set("planMode",planMode),[planMode]);
  useEffect(()=>ls.set("iw_custom_plans",customPlans),[customPlans]);
  useEffect(()=>ls.set("volumeMod",volumeMod),[volumeMod]);
  useEffect(()=>ls.set("workoutVariants",workoutVariants),[workoutVariants]);
  useEffect(()=>ls.set("logs",logs),[logs]);
  useEffect(()=>ls.set("checkin",checkin),[checkin]);
  useEffect(()=>ls.set("review",review),[review]);
  useEffect(()=>ls.set("macroFactor",macroFactor),[macroFactor]);

  const showToast = useCallback((msg,type="info")=>{
    setToast({msg,type}); setTimeout(()=>setToast(null),3000);
  },[]);

  const setWorkoutVariant = useCallback((workoutId, variantId) => {
    setWorkoutVariants(prev => {
      const next = {...prev};
      if(variantId === "base") delete next[workoutId];
      else next[workoutId] = variantId;
      return next;
    });
    showToast("Variation set","info");
  },[showToast]);

  const restoreBackup = useCallback(backup => {
    const data = backup?.data || backup;
    if(!data || typeof data !== "object") throw new Error("Invalid backup");
    if(data.benchWeight != null) setBenchWeight(data.benchWeight);
    if(data.nextWorkoutIdx != null) setNextWorkoutIdx(data.nextWorkoutIdx);
    if(data.usePlanA != null) setUsePlanA(!!data.usePlanA);
    if(data.volumeMod) setVolumeMod(data.volumeMod);
    if(data.workoutVariants && typeof data.workoutVariants === "object") setWorkoutVariants(data.workoutVariants);
    if(data.logs && typeof data.logs === "object") setLogs(data.logs);
    if(data.checkin && typeof data.checkin === "object") setCheckin(data.checkin);
    if("review" in data) setReview(data.review);
    if(data.macroFactor && typeof data.macroFactor === "object") setMacroFactor(data.macroFactor);
    showToast("Backup restored","success");
  },[showToast]);

  const basePlan = planMode==="custom"
    ? customPlans.map(cp=>({id:cp.id, label:cp.name, tag:cp.tag, exercises:cp.exercises||[]}))
    : planMode==="planB" ? PLAN_3 : PLAN_4;
  const plan = basePlan.map(w=>selectWorkoutVariant(w, workoutVariants[w.id]));
  const currentWorkout = plan.length ? plan[nextWorkoutIdx % plan.length] : null;
  const logKey = currentWorkout ? workoutLogKey(weekKey,currentWorkout) : "";
  const wlog   = logs[logKey]||{completed:[],skipped:[],sets:{}};

  // Bridge for existing tab props that still take usePlanA; T03/T04 migrate them off.
  const usePlanA = planMode==="planA";
  const setUsePlanA = useCallback(v=>setPlanMode(v?"planA":"planB"),[]);

  const completeWorkout = () => { setNextWorkoutIdx(i=>i+1); showToast("Workout logged. Rest up!","success"); };
  const undoWorkout     = () => { setNextWorkoutIdx(i=>Math.max(0,i-1)); showToast("Stepped back one workout.","info"); };

  const TABS = [
    {id:"today",   icon:"ti-player-play",   label:"Today",    ac:"#57D39A", bg:"#0F2A22"},
    {id:"week",    icon:"ti-calendar",      label:"Week",     ac:"#60A5FA", bg:"#0C1E31"},
    {id:"review",  icon:"ti-clipboard-list",label:"Review",   ac:"#F4B350", bg:"#261A0A"},
    {id:"checkin", icon:"ti-chart-line",    label:"Check-in", ac:"#A99CFF", bg:"#1B1733"},
  ];

  return (
    <div style={{fontFamily:"system-ui,sans-serif",maxWidth:440,margin:"0 auto",paddingBottom:80,background:"#101923",minHeight:"100vh",color:"#E6EDF3"}}>
      <div style={{padding:"1rem 1rem 0.25rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <h2 style={{fontSize:19,fontWeight:800,margin:0,color:"#F8FAFC"}}>Iron Week</h2>
        <span style={{fontSize:11,color:"#8A97A8",background:"#0B121A",padding:"3px 8px",borderRadius:6,border:"1px solid #223044"}}>
          {usePlanA?"Plan A · 4-day":"Plan B · 3-day"}
        </span>
      </div>

      {/* Tab bar */}
      <div style={{display:"flex",borderBottom:"1px solid #223044",padding:"0 0.5rem",gap:2,marginBottom:"0.75rem"}}>
        {TABS.map(t=>{
          const active = tab===t.id;
          return (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              flex:1,padding:"7px 2px",border:"none",cursor:"pointer",
              borderBottom:`2px solid ${active?t.ac:"transparent"}`,
              background:active?t.bg:"transparent",
              color:active?t.ac:"#8A97A8",
              fontSize:10,fontWeight:active?700:400,
              display:"flex",flexDirection:"column",alignItems:"center",gap:2,
              borderRadius:active?"6px 6px 0 0":0,
              transition:"background 0.15s, color 0.15s"
            }}>
              <i className={`ti ${t.icon}`} style={{fontSize:18}} aria-hidden="true"></i>{t.label}
            </button>
          );
        })}
      </div>

      <div style={{padding:"0 1rem"}}>
        {tab==="today"   && <TodayTab workout={currentWorkout} wlog={wlog} logs={logs} setLogs={setLogs}
          benchWeight={benchWeight} weekKey={weekKey} logKey={logKey}
          setWorkoutVariant={setWorkoutVariant}
          completeWorkout={completeWorkout} undoWorkout={undoWorkout} showToast={showToast}
          volumeMod={volumeMod} plan={plan} nextIdx={nextWorkoutIdx} />}
        {tab==="week"    && <WeekTab plan={plan} nextIdx={nextWorkoutIdx} logs={logs} weekKey={weekKey}
          setWorkoutVariant={setWorkoutVariant}
          setNextWorkoutIdx={setNextWorkoutIdx} setTab={setTab} showToast={showToast} />}
        {tab==="review"  && <ReviewTab benchWeight={benchWeight} setBenchWeight={setBenchWeight}
          usePlanA={usePlanA} setUsePlanA={setUsePlanA} volumeMod={volumeMod} setVolumeMod={setVolumeMod}
          review={review} setReview={setReview} showToast={showToast}
          nextWorkoutIdx={nextWorkoutIdx} plan={plan} logs={logs} weekKey={weekKey} />}
        {tab==="checkin" && <CheckinTab checkin={checkin} setCheckin={setCheckin} showToast={showToast}
          logs={logs} review={review} benchWeight={benchWeight} usePlanA={usePlanA}
          volumeMod={volumeMod} workoutVariants={workoutVariants} plan={plan}
          nextWorkoutIdx={nextWorkoutIdx} weekKey={weekKey}
          macroFactor={macroFactor} setMacroFactor={setMacroFactor} restoreBackup={restoreBackup} />}
      </div>

      {toast && (
        <div style={{
          position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",zIndex:999,
          background:toast.type==="success"?"#0F2A22":toast.type==="danger"?"#351519":"#1A2533",
          color:toast.type==="success"?"#1A7A4A":toast.type==="danger"?"#C53030":"#E6EDF3",
          border:`1px solid ${toast.type==="success"?"#1D9E75":toast.type==="danger"?"#E53E3E":"#2C3A4F"}`,
          borderRadius:8,padding:"10px 20px",fontSize:13,maxWidth:300,textAlign:"center",boxShadow:"0 4px 12px rgba(0,0,0,0.1)"
        }}>{toast.msg}</div>
      )}
    </div>
  );
}

function VariantPicker({workout,onSelect,compact=false}){
  if(!workout.options || workout.options.length<=1) return null;
  return (
    <div style={{marginTop:compact?8:10}}>
      {!compact && <p style={{margin:"0 0 6px",fontSize:11,color:"#8A97A8",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em"}}>Variation</p>}
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {workout.options.map(o=>{
          const active = workout.variantId===o.variantId;
          return (
            <Btn key={o.variantId} onClick={()=>onSelect(workout.baseId||workout.id,o.variantId)}
              color={active?"primary":"default"}
              style={{
                flex:compact?"0 0 auto":"1 1 96px",
                minWidth:compact?0:92,
                padding:compact?"4px 8px":"7px 8px",
                textAlign:"left",
                borderColor:active?"#1D9E75":"#2C3A4F",
              }}>
              <span style={{display:"block",fontSize:compact?11:12,fontWeight:800,lineHeight:1.15}}>{o.variantName}</span>
              {!compact && <span style={{display:"block",fontSize:10,opacity:0.82,lineHeight:1.25,marginTop:2}}>{o.summary}</span>}
            </Btn>
          );
        })}
      </div>
    </div>
  );
}

// Today Tab
function TodayTab({workout,wlog,logs,setLogs,benchWeight,weekKey,logKey,setWorkoutVariant,completeWorkout,undoWorkout,showToast,volumeMod,plan,nextIdx}){
  const [openEx,setOpenEx]   = useState(null);
  const [showSub,setShowSub] = useState(null);

  useEffect(()=>{
    setOpenEx(null);
    setShowSub(null);
  },[workout.baseId,workout.variantId]);

  const done    = wlog.completed||[];
  const skipped = wlog.skipped||[];
  const active  = workout.exercises.filter(e=>!skipped.includes(e.id));
  const pct     = active.length ? Math.round((done.filter(id=>active.find(e=>e.id===id)).length/active.length)*100) : 100;

  const updateLog = upd => setLogs(prev=>({...prev,[logKey]:{...wlog,...upd}}));

  const toggleDone = id => {
    const c = done;
    const s = skipped.filter(x=>x!==id);
    updateLog({completed:c.includes(id)?c.filter(x=>x!==id):[...c,id], skipped:s});
  };

  const toggleSkip = (id,e) => {
    e.stopPropagation();
    const s = skipped;
    const c = done.filter(x=>x!==id);
    updateLog({skipped:s.includes(id)?s.filter(x=>x!==id):[...s,id], completed:c});
    if(!skipped.includes(id)) setOpenEx(null);
  };

  const updateSet = (id,field,val) =>
    updateLog({sets:{...wlog.sets,[id]:{...(wlog.sets[id]||{}),[field]:val}}});

  const queue = [0,1,2].map(i=>plan[(nextIdx+i)%plan.length]);

  return (
    <div>
      {/* Header */}
      <div style={{background:"#0B121A",border:"1px solid #223044",borderRadius:12,padding:"1rem 1.25rem",marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div>
            <p style={{margin:0,fontSize:11,color:"#8A97A8",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.05em"}}>Up next</p>
            <p style={{margin:"3px 0 0",fontSize:17,fontWeight:700,color:"#E6EDF3"}}>{workout.label}</p>
            <p style={{margin:"3px 0 0",fontSize:12,color:"#8A97A8"}}>{workout.variantSummary}</p>
          </div>
          <span style={{fontSize:11,padding:"3px 9px",borderRadius:6,background:TAG_BG[workout.tag]||"#1A2533",
            color:TAG_FG[workout.tag]||"#8A97A8",fontWeight:700,flexShrink:0,border:`1px solid ${TAG_FG[workout.tag]||"#2C3A4F"}22`}}>
            {workout.tag}
          </span>
        </div>
        {volumeMod==="reduced" && <p style={{margin:"0 0 6px",fontSize:12,color:"#B06A0A",background:"#261A0A",borderRadius:6,padding:"4px 8px"}}>Reduced-volume week - drop last set per exercise</p>}
        <div style={{height:6,background:"#223044",borderRadius:3,marginBottom:6}}>
          <div style={{height:6,borderRadius:3,width:`${pct}%`,
            background:pct===100?"#38A169":pct>0?"#D69E2E":"transparent",transition:"width 0.3s"}} />
        </div>
        <p style={{margin:0,fontSize:12,color:"#8A97A8"}}>{done.filter(id=>active.find(e=>e.id===id)).length}/{active.length} exercises complete {skipped.length>0&&`· ${skipped.length} skipped`}</p>
        <VariantPicker workout={workout} onSelect={setWorkoutVariant} />
      </div>

      {/* Exercises */}
      {workout.exercises.map(ex=>{
        const isOpen  = openEx===ex.id;
        const isDone  = done.includes(ex.id);
        const isSkip  = skipped.includes(ex.id);
        const exLog   = wlog.sets?.[ex.id]||{};
        const pain    = +exLog.pain||0;
        const painFg  = pain>=5?"#C53030":pain>=3?"#B06A0A":"#1A7A4A";
        const hasPain = pain>=3;

        const cardBg    = isSkip?"#2A1115":isDone?"#0F2A22":"#101923";
        const cardBorder= isSkip?"#E53E3E":isDone?"#1D9E75":"#223044";

        return (
          <div key={ex.id} style={{background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:10,marginBottom:8,overflow:"hidden",
            transition:"border-color 0.2s, background 0.2s"}}>

            {/* Row */}
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 10px 10px 12px",cursor:"pointer",opacity:isSkip?0.5:1}}
              onClick={()=>!isSkip&&setOpenEx(isOpen?null:ex.id)}>

              {/* Check button */}
              <button onClick={e=>{e.stopPropagation();if(!isSkip)toggleDone(ex.id);}} style={{
                width:26,height:26,borderRadius:"50%",flexShrink:0,cursor:isSkip?"not-allowed":"pointer",
                background:isDone?"#38A169":"transparent",
                border:`2px solid ${isDone?"#38A169":"#2C3A4F"}`,
                display:"flex",alignItems:"center",justifyContent:"center",padding:0,
                transition:"background 0.15s, border-color 0.15s",
                transform:"scale(1)", filter:"none",
              }}>
                {isDone && <i className="ti ti-check" style={{fontSize:13,color:"#101923"}} aria-hidden="true"></i>}
              </button>

              <div style={{flex:1,minWidth:0}}>
                <p style={{margin:0,fontSize:14,fontWeight:600,color:isSkip?"#64748B":isDone?"#A7F3D0":"#E6EDF3",
                  whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                  {ex.bench && <i className="ti ti-alert-circle" style={{fontSize:13,marginRight:4,color:"#E53E3E"}} aria-hidden="true"></i>}
                  {isSkip && <span style={{marginRight:4}}>x</span>}
                  {ex.name}
                </p>
                {/* Sets x Reps recommended */}
                <div style={{display:"flex",gap:6,marginTop:2,flexWrap:"wrap"}}>
                  <span style={{fontSize:11,background:"#1A2533",color:"#C8D4E3",borderRadius:4,padding:"1px 6px",fontWeight:500}}>
                    {ex.sets} sets
                  </span>
                  <span style={{fontSize:11,background:"#1A2533",color:"#C8D4E3",borderRadius:4,padding:"1px 6px",fontWeight:500}}>
                    {ex.reps} reps
                  </span>
                  {ex.bench && <span style={{fontSize:11,background:"#261A0A",color:"#B06A0A",borderRadius:4,padding:"1px 6px",fontWeight:500}}>{benchWeight} lb</span>}
                  {exLog.weight && <span style={{fontSize:11,background:"#0F2A22",color:"#A7F3D0",borderRadius:4,padding:"1px 6px",fontWeight:500}}>✓ {exLog.weight} lb</span>}
                  {pain>0 && <span style={{fontSize:11,background:pain>=3?"#351519":"#0F2A22",color:painFg,borderRadius:4,padding:"1px 6px",fontWeight:500}}>pain {pain}/10</span>}
                </div>
              </div>

              {/* Skip / expand controls */}
              <div style={{display:"flex",gap:2,alignItems:"center",flexShrink:0}}>
                <IconBtn onClick={e=>toggleSkip(ex.id,e)} icon={isSkip?"ti-refresh":"ti-x"} title={isSkip?"Restore exercise":"Skip this exercise"} color={isSkip?"check":"cross"} />
                {!isSkip && <i className={`ti ${isOpen?"ti-chevron-up":"ti-chevron-down"}`} style={{fontSize:14,color:"#64748B"}} aria-hidden="true"></i>}
              </div>
            </div>

            {/* Expanded log */}
            {isOpen && !isSkip && (
              <div style={{borderTop:"1px solid #223044",padding:"12px",background:"#0B121A"}}>
                {ex.note && <p style={{fontSize:12,color:"#C8D4E3",margin:"0 0 8px",lineHeight:1.6,borderLeft:"3px solid #2C3A4F",paddingLeft:8}}>{ex.note}</p>}
                {ex.caution==="red"    && <p style={{fontSize:12,color:"#C53030",margin:"0 0 8px",background:"#2A1115",borderRadius:6,padding:"5px 8px"}}>Shoulder caution - stop at pain {">="} 3/10</p>}
                {ex.caution==="yellow" && <p style={{fontSize:12,color:"#B06A0A",margin:"0 0 8px",background:"#261A0A",borderRadius:6,padding:"5px 8px"}}>Skip if any shoulder discomfort</p>}

                {/* Weight */}
                <div style={{marginBottom:10}}>
                  <label style={{fontSize:11,color:"#8A97A8",fontWeight:500}}>Weight (lb)</label>
                  <input type="number" value={exLog.weight||""} placeholder={ex.bench?benchWeight:"-"}
                    onChange={e=>updateSet(ex.id,"weight",e.target.value)}
                    style={{display:"block",width:"100%",marginTop:3,boxSizing:"border-box",
                      border:"1px solid #2C3A4F",borderRadius:6,padding:"7px 10px",fontSize:14,background:"#101923"}} />
                </div>

                {/* Per-set reps */}
                <div style={{marginBottom:10}}>
                  <label style={{fontSize:11,color:"#8A97A8",fontWeight:500,display:"block",marginBottom:4}}>
                    Reps per set <span style={{color:"#64748B",fontWeight:400}}>(target: {ex.reps})</span>
                  </label>
                  <SetRepsInput exLog={exLog} ex={ex} updateSet={updateSet} />
                </div>

                {/* Pain slider */}
                <div style={{marginBottom:10}}>
                  <label style={{fontSize:11,color:"#8A97A8",fontWeight:500}}>Pain: <span style={{color:painFg,fontWeight:700}}>{pain}/10</span></label>
                  <input type="range" min="0" max="10" step="1" value={pain}
                    onChange={e=>updateSet(ex.id,"pain",+e.target.value)}
                    style={{width:"100%",margin:"4px 0",accentColor:pain>=5?"#E53E3E":pain>=3?"#D69E2E":"#38A169"}} />
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#64748B"}}>
                    <span style={{color:"#38A169"}}>0 None</span><span style={{color:"#D69E2E"}}>5 Moderate</span><span style={{color:"#E53E3E"}}>10 Severe</span>
                  </div>
                  {hasPain && <p style={{margin:"4px 0 0",fontSize:12,color:painFg,background:pain>=5?"#2A1115":"#261A0A",borderRadius:5,padding:"4px 7px"}}>
                    {pain>=5?"Reduce load or swap this exercise next session.":"Consider reducing load or reviewing form next time."}
                  </p>}
                </div>

                {/* Notes */}
                <div style={{marginBottom:ex.sub?10:0}}>
                  <label style={{fontSize:11,color:"#8A97A8",fontWeight:500}}>Notes</label>
                  <textarea value={exLog.note||""} onChange={e=>updateSet(ex.id,"note",e.target.value)}
                    placeholder="Feel, form, cues..." rows={2}
                    style={{display:"block",width:"100%",marginTop:3,boxSizing:"border-box",resize:"vertical",
                      fontFamily:"inherit",fontSize:13,border:"1px solid #2C3A4F",borderRadius:6,padding:"7px 10px",background:"#101923"}} />
                </div>

                {/* Subs */}
                {ex.sub && (
                  <div>
                    <Btn onClick={()=>setShowSub(showSub===ex.id?null:ex.id)} color="muted" style={{fontSize:12,padding:"5px 10px"}}>
                      <i className="ti ti-arrows-exchange" aria-hidden="true" style={{marginRight:4}}></i>Substitutions
                    </Btn>
                    {showSub===ex.id && (
                      <div style={{marginTop:6,background:"#101923",border:"1px solid #223044",borderRadius:8,padding:"8px 10px"}}>
                        <p style={{margin:"0 0 6px",fontSize:11,fontWeight:600,color:"#C8D4E3"}}>{SUBS[ex.sub].label}</p>
                        {SUBS[ex.sub].options.map((o,i)=>(
                          <p key={i} style={{margin:"3px 0",fontSize:12,color:"#E6EDF3",paddingLeft:10}}>· {o}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Action buttons */}
      <div style={{display:"flex",gap:8,marginTop:10}}>
        <Btn onClick={completeWorkout} color="primary" style={{flex:1,padding:"11px",fontSize:15,fontWeight:700}}>
          <i className="ti ti-check" aria-hidden="true" style={{marginRight:6}}></i>Complete
        </Btn>
        <Btn onClick={()=>{
          const reason = "Life happened - keeping the habit alive.";
          setLogs(prev=>({...prev,[logKey]:{...wlog,skippedDay:true,skippedReason:reason}}));
          completeWorkout();
        }} color="warning" style={{flex:1,padding:"11px",fontSize:14,fontWeight:700}}>
          <i className="ti ti-calendar-off" aria-hidden="true" style={{marginRight:6}}></i>Skip day
        </Btn>
        {nextIdx>0 && (
          <Btn onClick={undoWorkout} color="muted" style={{padding:"11px 14px"}}>
            <i className="ti ti-arrow-back-up" aria-hidden="true"></i>
          </Btn>
        )}
      </div>
      <p style={{margin:"8px 0 0",fontSize:11,color:"#8A97A8",textAlign:"center",lineHeight:1.5}}>
        Life happens. Skip day advances the queue and notes the miss - no shame, habit stays alive.
      </p>

      {/* Queue */}
      <div style={{marginTop:16}}>
        <p style={{fontSize:11,color:"#8A97A8",margin:"0 0 6px",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>Coming up</p>
        {queue.slice(1).map((w,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
            padding:"7px 10px",borderRadius:8,background:"#0B121A",border:"1px solid #223044",marginBottom:4}}>
            <span style={{fontSize:13,color:"#C8D4E3"}}>+{i+1}: {w.label}</span>
            <span style={{fontSize:10,padding:"2px 7px",borderRadius:5,background:TAG_BG[w.tag]||"",
              color:TAG_FG[w.tag]||"",fontWeight:600,border:`1px solid ${TAG_FG[w.tag]||"#2C3A4F"}22`}}>{w.tag}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Per-set reps input row
function SetRepsInput({exLog,ex,updateSet}){
  const raw = ex.sets||"3";
  const maxSets = parseInt(raw.split("-")[1]||raw)||3;
  const rows = Array.from({length:maxSets},(_,i)=>i);
  const setReps = exLog.setReps||{};
  return (
    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
      {rows.map(i=>(
        <div key={i} style={{textAlign:"center"}}>
          <label style={{fontSize:10,color:"#64748B",display:"block",marginBottom:2}}>Set {i+1}</label>
          <input type="number" value={setReps[i]||""} placeholder="-"
            onChange={e=>{
              const updated={...setReps,[i]:e.target.value};
              updateSet(ex.id,"setReps",updated);
            }}
            style={{width:48,border:"1px solid #2C3A4F",borderRadius:6,padding:"6px 4px",
              fontSize:14,textAlign:"center",background:"#101923"}} />
        </div>
      ))}
    </div>
  );
}

// Week Tab
function WeekTab({plan,nextIdx,logs,weekKey,setWorkoutVariant,setNextWorkoutIdx,setTab,showToast}){
  const slots = plan.map((w,i)=>{
    const lk  = workoutLogKey(weekKey,w);
    const wl  = logs[lk]||{completed:[],skipped:[],sets:{}};
    const act = w.exercises.filter(e=>!(wl.skipped||[]).includes(e.id));
    const pct = act.length?Math.round(((wl.completed||[]).filter(id=>act.find(e=>e.id===id)).length/act.length)*100):0;
    return {w,pct,isCurrent:(nextIdx%plan.length)===i,idx:i};
  });
  const completedCount = slots.filter(s=>s.pct===100).length;

  return (
    <div>
      <div style={{background:"#0B121A",border:"1px solid #223044",borderRadius:12,padding:"12px",marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div>
            <p style={{margin:0,fontSize:11,color:"#8A97A8",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em"}}>Training calendar</p>
            <p style={{margin:"2px 0 0",fontSize:13,color:"#C8D4E3"}}>{completedCount}/{plan.length} sessions complete</p>
          </div>
          <span style={{fontSize:11,color:"#57D39A",background:"#0F2A22",border:"1px solid #1D9E75",borderRadius:999,padding:"4px 9px",fontWeight:800}}>
            {weekKey}
          </span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${plan.length}, minmax(0, 1fr))`,gap:7}}>
          {slots.map(({w,pct,isCurrent,idx})=>(
            <button key={w.id} onClick={()=>{setNextWorkoutIdx(idx);setTab("today");showToast("Queue updated","info");}}
              style={{
                ...btnBase,
                minHeight:74,
                padding:"8px 6px",
                borderRadius:10,
                border:`1px solid ${isCurrent?"#57D39A":pct===100?"#1D9E75":"#223044"}`,
                background:isCurrent?"#102A24":pct===100?"#0F2A22":"#101923",
                color:"#E6EDF3",
                textAlign:"left",
                boxShadow:isCurrent?"0 0 0 2px #57D39A22":"none",
              }}>
              <span style={{display:"block",fontSize:10,color:isCurrent?"#57D39A":"#8A97A8",fontWeight:800}}>#{idx+1}</span>
              <span style={{display:"block",fontSize:11,fontWeight:800,lineHeight:1.2,marginTop:3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{w.variantName}</span>
              <span style={{display:"block",height:4,background:"#1A2533",borderRadius:2,marginTop:8,overflow:"hidden"}}>
                <span style={{display:"block",height:4,width:`${pct}%`,background:pct===100?"#57D39A":pct>0?"#F4B350":"transparent"}} />
              </span>
            </button>
          ))}
        </div>
      </div>
      <p style={{fontSize:13,color:"#8A97A8",margin:"0 0 1rem"}}>
        {completedCount===0?"Start your first workout.":completedCount<plan.length?`${completedCount}/${plan.length} workouts done this cycle.`:"Full cycle complete. Great work."}
      </p>
      {slots.map(({w,pct,isCurrent,idx})=>(
        <div key={w.id} style={{background:"#101923",border:`1px solid ${isCurrent?"#1D9E75":pct===100?"#1D9E75":"#223044"}`,
          borderRadius:10,padding:"0.9rem 1.1rem",marginBottom:10,
          boxShadow:isCurrent?"0 0 0 2px #1D9E7522":"none"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div>
              {isCurrent && <span style={{fontSize:10,fontWeight:700,color:"#1D9E75",background:"#0F2A22",
                padding:"2px 7px",borderRadius:5,marginBottom:3,display:"inline-block"}}>Current</span>}
              <p style={{margin:0,fontWeight:600,fontSize:14,color:"#E6EDF3"}}>{w.label}</p>
              <p style={{margin:"2px 0 0",fontSize:11,color:"#8A97A8"}}>{w.variantSummary}</p>
            </div>
            <span style={{fontSize:10,padding:"3px 8px",borderRadius:6,background:TAG_BG[w.tag]||"",
              color:TAG_FG[w.tag]||"",fontWeight:700,border:`1px solid ${TAG_FG[w.tag]||"#2C3A4F"}22`,flexShrink:0}}>
              {w.tag}
            </span>
          </div>
          <div style={{height:4,background:"#1A2533",borderRadius:2,marginBottom:6}}>
            <div style={{height:4,borderRadius:2,width:`${pct}%`,
              background:pct===100?"#38A169":pct>0?"#D69E2E":"transparent",transition:"width 0.3s"}} />
          </div>
          <VariantPicker workout={w} onSelect={setWorkoutVariant} compact />
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:11,color:pct===100?"#1A7A4A":"#8A97A8"}}>{pct===100?"Done ✓":`${pct}% complete`}</span>
            <div style={{display:"flex",gap:6}}>
              {isCurrent && <Btn onClick={()=>setTab("today")} color="primary" style={{fontSize:12,padding:"4px 12px"}}>Go →</Btn>}
              {!isCurrent&&pct<100 && (
                <Btn onClick={()=>{setNextWorkoutIdx(idx);setTab("today");showToast("Queue updated","info");}}
                  color="muted" style={{fontSize:11,padding:"3px 10px"}}>Jump to</Btn>
              )}
            </div>
          </div>
        </div>
      ))}
      <div style={{marginTop:8,background:"#0B121A",borderRadius:8,padding:"10px 14px",border:"1px solid #223044"}}>
        <p style={{margin:0,fontSize:12,color:"#8A97A8",lineHeight:1.6}}>
          Miss a day? The queue holds your place. Pick up wherever you left off - no resets.
        </p>
      </div>
    </div>
  );
}

// Review Tab
function ReviewTab({benchWeight,setBenchWeight,usePlanA,setUsePlanA,volumeMod,setVolumeMod,review,setReview,showToast,nextWorkoutIdx,plan}){
  const [form,setForm] = useState({
    completed:  review?.form?.completed   ?? 0,
    benchPain:  review?.form?.benchPain   ?? 0,
    nightPain:  review?.form?.nightPain   ?? false,
    nextDayPain:review?.form?.nextDayPain ?? false,
    bwTrend:    review?.form?.bwTrend     ?? "flat",
    hitProtein: review?.form?.hitProtein  ?? false,
    recovery:   review?.form?.recovery    ?? "okay",
  });
  const [recs,setRecs]     = useState(review?.recs||null);
  const [applied,setApplied] = useState(review?.applied||false);
  const upd = (k,v) => setForm(f=>({...f,[k]:v}));

  const generate = () => {
    const f=form;
    let benchRec,benchNew=benchWeight;
    if(f.benchPain>=5||f.nightPain||f.nextDayPain){ benchRec="reduce"; benchNew=Math.max(45,benchWeight-15); }
    else if(f.benchPain>=3){ benchRec="repeat"; benchNew=benchWeight; }
    else{ benchRec="increase"; benchNew=benchWeight+5; }

    const planRec = f.completed>=4?"plan_a":"plan_b";
    const volRec  = f.recovery==="poor"||f.completed<=2?"reduced":f.recovery==="okay"&&f.completed===3?"maintain":"normal";
    const missedMsg = f.completed<plan.length
      ? `You hit ${f.completed}/${plan.length} workouts - habit stays alive. Next week picks up from the queue.`
      : "Full cycle. Strong week.";
    const r = {benchRec,benchNew,planRec,volRec,missedMsg};
    setRecs(r); setReview({form,recs:r,applied:false}); setApplied(false);
  };

  const apply = () => {
    if(!recs) return;
    setBenchWeight(recs.benchNew); setUsePlanA(recs.planRec==="plan_a"); setVolumeMod(recs.volRec);
    setApplied(true); setReview(r=>({...r,applied:true}));
    showToast("Applied for next week!","success");
  };

  const benchColors = {increase:"#1A7A4A",repeat:"#B06A0A",reduce:"#C53030"};
  const benchLabels = {increase:`+5 lb -> ${recs?.benchNew} lb`,repeat:`Same -> ${recs?.benchNew} lb`,reduce:`-15 lb -> ${recs?.benchNew} lb`};

  return (
    <div>
      <p style={{fontSize:13,color:"#8A97A8",margin:"0 0 1rem",lineHeight:1.5}}>Sunday check-in - takes 60 seconds. Sets up next week automatically.</p>

      <Section label="Workouts completed this cycle">
        <div style={{display:"flex",gap:6}}>
          {[0,1,2,3,4].map(n=>(
            <Btn key={n} onClick={()=>upd("completed",n)} color={form.completed===n?"primary":"default"}
              style={{flex:1,padding:"8px 4px",fontSize:15,fontWeight:700}}>{n}</Btn>
          ))}
        </div>
      </Section>

      <Section label={`Bench pain during lift: ${form.benchPain}/10`}>
        <input type="range" min="0" max="10" step="1" value={form.benchPain}
          onChange={e=>upd("benchPain",+e.target.value)}
          style={{width:"100%",margin:"4px 0",accentColor:form.benchPain>=5?"#E53E3E":form.benchPain>=3?"#D69E2E":"#38A169"}} />
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#64748B"}}>
          <span style={{color:"#38A169"}}>0 None</span><span style={{color:"#D69E2E"}}>5 Moderate</span><span style={{color:"#E53E3E"}}>10 Severe</span>
        </div>
      </Section>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:"1rem"}}>
        {[["nightPain","Night soreness"],["nextDayPain","Next-day soreness"]].map(([k,l])=>(
          <Btn key={k} onClick={()=>upd(k,!form[k])} color={form[k]?"danger":"default"}
            style={{padding:"10px 8px",textAlign:"left",width:"100%",borderRadius:8}}>
            <p style={{margin:0,fontSize:12,fontWeight:600}}>{l}</p>
            <p style={{margin:"2px 0 0",fontSize:11,opacity:0.8}}>{form[k]?"Yes - flagged":"No"}</p>
          </Btn>
        ))}
      </div>

      <Section label="Bodyweight trend">
        <SegControl options={[{v:"up",l:"Up"},{v:"flat",l:"Flat"},{v:"down",l:"Down"}]}
          value={form.bwTrend} onChange={v=>upd("bwTrend",v)} />
      </Section>
      <Section label="Hit protein?">
        <SegControl options={[{v:true,l:"Yes"},{v:false,l:"No"}]} value={form.hitProtein} onChange={v=>upd("hitProtein",v)} />
      </Section>
      <Section label="Recovery this week">
        <SegControl options={[{v:"poor",l:"Poor"},{v:"okay",l:"Okay"},{v:"good",l:"Good"}]} value={form.recovery} onChange={v=>upd("recovery",v)} />
      </Section>

      <Btn onClick={generate} color="primary" style={{width:"100%",padding:"11px",fontSize:14,fontWeight:700,marginBottom:"1rem"}}>
        Generate next week ↗
      </Btn>

      {recs && (
        <div style={{background:"#101923",border:"1px solid #223044",borderRadius:12,padding:"1rem 1.25rem",marginBottom:"1rem"}}>
          <p style={{margin:"0 0 10px",fontWeight:700,fontSize:15}}>Next week plan</p>
          <RecRow icon="ti-barbell" label="Bench" value={benchLabels[recs.benchRec]} color={benchColors[recs.benchRec]} />
          <RecRow icon="ti-calendar" label="Plan" value={recs.planRec==="plan_a"?"Plan A - 4 day":"Plan B - 3 day"} color="#185FA5" />
          <RecRow icon="ti-chart-bar" label="Volume" value={recs.volRec==="reduced"?"Reduced 20%":recs.volRec==="maintain"?"Maintain":"Normal"} color={recs.volRec==="reduced"?"#B06A0A":"#1A7A4A"} />
          <div style={{background:"#0B121A",borderRadius:8,padding:"10px 12px",margin:"10px 0 12px",border:"1px solid #223044"}}>
            <p style={{margin:0,fontSize:13,color:"#C8D4E3",lineHeight:1.6}}>{recs.missedMsg}</p>
          </div>
          <Btn onClick={apply} disabled={applied} color={applied?"success":"primary"} style={{width:"100%",padding:"10px",fontSize:14,fontWeight:700}}>
            {applied?"Applied ✓":"Apply to next week"}
          </Btn>
        </div>
      )}
    </div>
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
function RecRow({icon,label,value,color}){
  return (
    <div style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:8}}>
      <i className={`ti ${icon}`} style={{fontSize:16,color:"#64748B",flexShrink:0,marginTop:2}} aria-hidden="true"></i>
      <div><p style={{margin:0,fontSize:11,color:"#8A97A8"}}>{label}</p><p style={{margin:0,fontSize:13,fontWeight:700,color}}>{value}</p></div>
    </div>
  );
}

function buildBackup({checkin,logs,review,benchWeight,nextWorkoutIdx,usePlanA,volumeMod,workoutVariants,macroFactor}){
  return {
    app:"Iron Week",
    schemaVersion:2,
    exportedAt:new Date().toISOString(),
    data:{
      benchWeight,
      nextWorkoutIdx,
      usePlanA,
      volumeMod,
      workoutVariants,
      logs,
      checkin,
      review,
      macroFactor,
    },
  };
}

function buildAiExport({checkin,logs,review,benchWeight,usePlanA,volumeMod,workoutVariants,plan,nextWorkoutIdx,weekKey,macroFactor}){
  return {
    app:"Iron Week",
    exportedAt:new Date().toISOString(),
    currentWeek:weekKey,
    state:{
      benchWeight,
      activePlan:usePlanA?"Plan A - 4 day":"Plan B - 3 day",
      volumeMod,
      nextWorkoutIdx,
      workoutVariants,
    },
    activeWorkoutQueue:plan.map((w,i)=>({
      queueIndex:i,
      id:w.baseId||w.id,
      variantId:w.variantId,
      label:w.label,
      tag:w.tag,
      exercises:w.exercises.map(ex=>({
        id:ex.id,
        name:ex.name,
        sets:ex.sets,
        reps:ex.reps,
        note:ex.note||"",
        substitutionGroup:ex.sub||null,
        caution:ex.caution||null,
        bench:!!ex.bench,
      })),
    })),
    logs,
    checkin,
    macroFactor,
    review,
    notesForAi:[
      "Logs are stored locally in this browser only.",
      "Each log key maps to a week/workout/variation and includes completed exercise ids, skipped exercise ids, per-exercise weight, per-set reps, pain, and notes.",
      "Barbell bench rehab data is paused in the active templates; bench progression logic remains in Review for future return.",
      "MacroFactor data is manually imported from the MacroFactor CSV export when present.",
    ],
  };
}

// Check-in Tab
function CheckinTab({checkin,setCheckin,showToast,logs,review,benchWeight,usePlanA,volumeMod,workoutVariants,plan,nextWorkoutIdx,weekKey,macroFactor,setMacroFactor,restoreBackup}){
  const [macroPaste,setMacroPaste] = useState("");
  const upd = (k,v)=>setCheckin(c=>({...c,[k]:v}));
  const pColor = checkin.protein>=180?"#57D39A":checkin.protein>0?"#F4B350":"#64748B";
  const sColor = checkin.sleep>=7?"#57D39A":checkin.sleep>=5?"#F4B350":"#F87171";
  const backupPayload = () => buildBackup({
    checkin, logs, review, benchWeight, nextWorkoutIdx, usePlanA, volumeMod, workoutVariants, macroFactor,
  });
  const exportPayload = () => JSON.stringify(buildAiExport({
    checkin, logs, review, benchWeight, usePlanA, volumeMod, workoutVariants, plan, nextWorkoutIdx, weekKey, macroFactor,
  }), null, 2);
  const copyAiExport = async () => {
    try {
      await navigator.clipboard.writeText(exportPayload());
      showToast("AI export copied","success");
    } catch {
      showToast("Clipboard blocked - use download","info");
    }
  };
  const downloadAiExport = () => {
    downloadJsonFile(JSON.parse(exportPayload()), `iron-week-ai-${weekKey}.json`);
    showToast("AI export downloaded","success");
  };
  const downloadBackup = () => {
    downloadJsonFile(backupPayload(), `iron-week-backup-${weekKey}.json`);
    showToast("Backup downloaded","success");
  };
  const importBackupFile = async event => {
    const file = event.target.files?.[0];
    if(!file) return;
    try {
      restoreBackup(JSON.parse(await file.text()));
    } catch {
      showToast("Could not restore backup","danger");
    } finally {
      event.target.value = "";
    }
  };
  const importMacroFactorText = (text, fileName="Pasted MacroFactor CSV") => {
    try {
      const parsed = parseMacroFactorCsv(text, fileName);
      if(!parsed.rows.length){
        showToast("No MacroFactor rows found","danger");
        return;
      }
      setMacroFactor(parsed);
      setMacroPaste("");
      showToast(`Imported ${parsed.rows.length} MacroFactor rows`,"success");
    } catch {
      showToast("Could not read MacroFactor CSV","danger");
    }
  };
  const importMacroFactorFile = async event => {
    const file = event.target.files?.[0];
    if(!file) return;
    importMacroFactorText(await file.text(), file.name);
    event.target.value = "";
  };
  const macroSummary = macroFactor?.summary;
  return (
    <div>
      <h3 style={{fontSize:16,fontWeight:700,margin:"0 0 1rem"}}>Weekly check-in</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:"1rem"}}>
        {[["bw","Bodyweight (lb)","178"],["cals","Calories target","2800"]].map(([k,l,ph])=>(
          <div key={k}>
            <label style={{fontSize:12,color:"#8A97A8",fontWeight:500}}>{l}</label>
            <input type="number" value={checkin[k]} onChange={e=>upd(k,e.target.value)} placeholder={ph}
              style={{display:"block",width:"100%",marginTop:4,boxSizing:"border-box",border:"1px solid #2C3A4F",borderRadius:6,padding:"7px 10px",fontSize:14}} />
          </div>
        ))}
      </div>
      <div style={{marginBottom:"1rem"}}>
        <label style={{fontSize:12,color:"#8A97A8",fontWeight:500}}>Avg protein (g)</label>
        <input type="number" value={checkin.protein} onChange={e=>upd("protein",e.target.value)} placeholder="175"
          style={{display:"block",width:"100%",marginTop:4,boxSizing:"border-box",border:"1px solid #2C3A4F",borderRadius:6,padding:"7px 10px",fontSize:14}} />
        <p style={{margin:"4px 0 0",fontSize:11,color:pColor}}>{checkin.protein>=180?"✓ On target":"Target: ~180g/day"}</p>
      </div>
      <div style={{marginBottom:"1rem"}}>
        <label style={{fontSize:12,color:"#8A97A8",fontWeight:500}}>Sleep / recovery: {checkin.sleep}/10</label>
        <input type="range" min="1" max="10" step="1" value={checkin.sleep}
          onChange={e=>upd("sleep",+e.target.value)}
          style={{width:"100%",margin:"6px 0",accentColor:sColor}} />
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#64748B"}}>
          <span>1 Rough</span><span>5 OK</span><span>10 Great</span>
        </div>
        {checkin.sleep<=4&&<p style={{margin:"4px 0 0",fontSize:12,color:"#B06A0A",background:"#261A0A",borderRadius:5,padding:"4px 7px"}}>Low recovery - consider a lighter week.</p>}
      </div>
      <div style={{marginBottom:"1rem"}}>
        <label style={{fontSize:12,color:"#8A97A8",fontWeight:500}}>Notes</label>
        <textarea value={checkin.notes} onChange={e=>upd("notes",e.target.value)}
          placeholder="Schedule, newborn nights, anything to flag..." rows={3}
          style={{display:"block",width:"100%",marginTop:4,boxSizing:"border-box",resize:"vertical",fontFamily:"inherit",fontSize:13,border:"1px solid #2C3A4F",borderRadius:6,padding:"7px 10px"}} />
      </div>
      {(checkin.bw||checkin.cals||checkin.protein)&&(
        <div style={{background:"#0B121A",borderRadius:8,padding:"12px 14px",marginBottom:"1rem",display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,border:"1px solid #223044"}}>
          {checkin.bw&&<Stat label="Bodyweight" value={`${checkin.bw} lb`}/>}
          {checkin.cals&&<Stat label="Calories" value={`${Number(checkin.cals).toLocaleString()} kcal`}/>}
          {checkin.protein&&<Stat label="Protein" value={`${checkin.protein}g`} color={pColor}/>}
          <Stat label="Recovery" value={`${checkin.sleep}/10`} color={sColor}/>
        </div>
      )}
      <Btn onClick={()=>showToast("Saved!","success")} color="primary" style={{width:"100%",padding:"10px",fontSize:14,fontWeight:700}}>
        <i className="ti ti-device-floppy" aria-hidden="true" style={{marginRight:6}}></i>Save check-in
      </Btn>
      <div style={{marginTop:14,background:"#0B121A",border:"1px solid #223044",borderRadius:12,padding:"12px 14px"}}>
        <p style={{margin:"0 0 4px",fontSize:13,fontWeight:800,color:"#E6EDF3"}}>Backup / restore</p>
        <p style={{margin:"0 0 10px",fontSize:12,color:"#8A97A8",lineHeight:1.5}}>
          Saves your full Iron Week state from this browser: workouts, logs, notes, pain, check-ins, review, variations, and MacroFactor import.
        </p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <Btn onClick={downloadBackup} color="primary" style={{padding:"9px 8px",fontWeight:700}}>
            <i className="ti ti-database-export" aria-hidden="true" style={{marginRight:5}}></i>Backup
          </Btn>
          <label style={{display:"block"}}>
            <input type="file" accept="application/json,.json" onChange={importBackupFile} style={{display:"none"}} />
            <span style={{
              display:"block",textAlign:"center",cursor:"pointer",border:"1px solid #2C3A4F",
              background:"#101923",color:"#E6EDF3",borderRadius:8,padding:"9px 8px",fontSize:13,fontWeight:700,
            }}>
              <i className="ti ti-database-import" aria-hidden="true" style={{marginRight:5}}></i>Restore
            </span>
          </label>
        </div>
      </div>
      <div style={{marginTop:14,background:"#0B121A",border:"1px solid #223044",borderRadius:12,padding:"12px 14px"}}>
        <p style={{margin:"0 0 4px",fontSize:13,fontWeight:800,color:"#E6EDF3"}}>MacroFactor import</p>
        <p style={{margin:"0 0 10px",fontSize:12,color:"#8A97A8",lineHeight:1.5}}>
          Export CSV from MacroFactor, then upload or paste it here. Iron Week stores it locally and includes it in backups and AI analysis.
        </p>
        {macroSummary?.rowCount > 0 && (
          <div style={{background:"#101923",border:"1px solid #223044",borderRadius:8,padding:"10px 12px",marginBottom:10}}>
            <p style={{margin:"0 0 6px",fontSize:12,fontWeight:800,color:"#A99CFF"}}>
              {macroSummary.rowCount} rows imported{macroFactor.fileName?` from ${macroFactor.fileName}`:""}
            </p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <Stat label="Range" value={`${macroSummary.dateRange?.start || "?"} - ${macroSummary.dateRange?.end || "?"}`} />
              {macroSummary.averages?.calories != null && <Stat label="Avg calories" value={`${macroSummary.averages.calories} kcal`} />}
              {macroSummary.averages?.protein != null && <Stat label="Avg protein" value={`${macroSummary.averages.protein}g`} color={macroSummary.averages.protein>=180?"#57D39A":"#F4B350"} />}
              {macroSummary.latest?.scaleWeight != null && <Stat label="Latest weight" value={`${macroSummary.latest.scaleWeight} lb`} />}
            </div>
          </div>
        )}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <label style={{display:"block"}}>
            <input type="file" accept=".csv,text/csv" onChange={importMacroFactorFile} style={{display:"none"}} />
            <span style={{
              display:"block",textAlign:"center",cursor:"pointer",border:"1px solid #2C3A4F",
              background:"#101923",color:"#E6EDF3",borderRadius:8,padding:"9px 8px",fontSize:13,fontWeight:700,
            }}>
              <i className="ti ti-file-upload" aria-hidden="true" style={{marginRight:5}}></i>Upload CSV
            </span>
          </label>
          <Btn onClick={()=>setMacroFactor(emptyMacroFactor)} color="muted" style={{padding:"9px 8px",fontWeight:700}}>
            <i className="ti ti-trash" aria-hidden="true" style={{marginRight:5}}></i>Clear
          </Btn>
        </div>
        <textarea value={macroPaste} onChange={e=>setMacroPaste(e.target.value)}
          placeholder="Paste MacroFactor CSV here..." rows={4}
          style={{display:"block",width:"100%",boxSizing:"border-box",resize:"vertical",fontFamily:"inherit",fontSize:12,border:"1px solid #2C3A4F",borderRadius:8,padding:"8px 10px",marginBottom:8}} />
        <Btn onClick={()=>importMacroFactorText(macroPaste)} disabled={!macroPaste.trim()} color="muted" style={{width:"100%",padding:"9px 8px",fontWeight:700}}>
          <i className="ti ti-table-import" aria-hidden="true" style={{marginRight:5}}></i>Import pasted CSV
        </Btn>
      </div>
      <div style={{marginTop:14,background:"#0B121A",border:"1px solid #223044",borderRadius:12,padding:"12px 14px"}}>
        <p style={{margin:"0 0 4px",fontSize:13,fontWeight:800,color:"#E6EDF3"}}>AI analysis export</p>
        <p style={{margin:"0 0 10px",fontSize:12,color:"#8A97A8",lineHeight:1.5}}>
          Includes check-ins, MacroFactor import, review answers, plan settings, selected variations, skipped work, pain, notes, weight, and per-set reps from this browser.
        </p>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={copyAiExport} color="muted" style={{flex:1,padding:"9px 8px",fontWeight:700}}>
            <i className="ti ti-copy" aria-hidden="true" style={{marginRight:5}}></i>Copy
          </Btn>
          <Btn onClick={downloadAiExport} color="primary" style={{flex:1,padding:"9px 8px",fontWeight:700}}>
            <i className="ti ti-download" aria-hidden="true" style={{marginRight:5}}></i>Download
          </Btn>
        </div>
      </div>
    </div>
  );
}
function Stat({label,value,color}){
  return (
    <div style={{background:"#101923",borderRadius:8,padding:"8px 10px",border:"1px solid #223044"}}>
      <p style={{margin:0,fontSize:11,color:"#8A97A8"}}>{label}</p>
      <p style={{margin:"2px 0 0",fontSize:15,fontWeight:700,color:color||"#E6EDF3"}}>{value}</p>
    </div>
  );
}
