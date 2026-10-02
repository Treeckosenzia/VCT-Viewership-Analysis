// Team roster & event baselines backing the VCT Viewership Predictor.
// p = brand-strength weight (1.0 = average tier-1 team). Judgment-calibrated
// from publicly reported Esports Charts aggregates (team/event/match average
// & peak concurrent viewers), not a live data pull. Edit freely to retune.
const teams = [
  {n:"Sentinels",r:"Americas",p:1.35},{n:"NRG",r:"Americas",p:1.5},{n:"LOUD",r:"Americas",p:1.5},
  {n:"G2 Esports",r:"Americas",p:1.4},{n:"100 Thieves",r:"Americas",p:1.1},{n:"Cloud9",r:"Americas",p:1.0},
  {n:"Evil Geniuses",r:"Americas",p:1.0},{n:"FURIA",r:"Americas",p:1.0},{n:"MIBR",r:"Americas",p:1.0},
  {n:"Leviatan",r:"Americas",p:1.0},{n:"KRU Esports",r:"Americas",p:0.9},{n:"ENVY",r:"Americas",p:0.75},

  {n:"Fnatic",r:"EMEA",p:1.5},{n:"Team Vitality",r:"EMEA",p:1.3},{n:"Team Heretics",r:"EMEA",p:1.25},
  {n:"KOI",r:"EMEA",p:1.2},{n:"Karmine Corp",r:"EMEA",p:1.2},{n:"BBL Esports",r:"EMEA",p:1.15},
  {n:"Team Liquid",r:"EMEA",p:1.05},{n:"Natus Vincere",r:"EMEA",p:1.0},{n:"FUT Esports",r:"EMEA",p:0.9},
  {n:"GIANTX",r:"EMEA",p:0.9},{n:"Gentle Mates",r:"EMEA",p:0.8},{n:"PCFIC Esports",r:"EMEA",p:0.72},
  {n:"ULF Esports",r:"EMEA",p:0.7},{n:"Eternal Fire",r:"EMEA",p:0.7},

  {n:"Paper Rex",r:"Pacific",p:1.5},{n:"T1",r:"Pacific",p:1.4},{n:"DRX",r:"Pacific",p:1.3},
  {n:"ZETA DIVISION",r:"Pacific",p:1.3},{n:"Gen.G",r:"Pacific",p:1.2},{n:"Rex Regum Qeon",r:"Pacific",p:1.15},
  {n:"Nongshim RedForce",r:"Pacific",p:1.1},{n:"FULL SENSE",r:"Pacific",p:1.0},{n:"Global Esports",r:"Pacific",p:0.9},
  {n:"Detonation FocusMe",r:"Pacific",p:0.9},{n:"Team Secret",r:"Pacific",p:0.85},{n:"VARREL",r:"Pacific",p:0.75},

  {n:"EDward Gaming",r:"China",p:1.3},{n:"Bilibili Gaming",r:"China",p:1.15},{n:"FunPlus Phoenix",r:"China",p:1.1},
  {n:"JD Gaming",r:"China",p:1.05},{n:"TYLOO",r:"China",p:1.0},{n:"Trace Esports",r:"China",p:0.95},
  {n:"Titan Esports Club",r:"China",p:0.9},{n:"Nova Esports",r:"China",p:0.9},{n:"All Gamers",r:"China",p:0.85},
  {n:"Wolves Esports",r:"China",p:0.8},{n:"Dragon Ranger Gaming",r:"China",p:0.75},{n:"Xi Lai Gaming",r:"China",p:0.72}
];

const events = [
  {name:"VCT Champions \u2014 Group Stage", avg:300000, peakR:1.6, intl:true},
  {name:"VCT Champions \u2014 Playoffs/Final", avg:600000, peakR:2.1, intl:true},
  {name:"VCT Masters \u2014 Group Stage", avg:200000, peakR:1.7, intl:true},
  {name:"VCT Masters \u2014 Playoffs/Final", avg:420000, peakR:2.0, intl:true},
  {name:"VCT Kickoff", avg:70000, peakR:1.6, intl:true},
  {name:"Regional League \u2014 Americas", avg:90000, peakR:1.6, intl:false},
  {name:"Regional League \u2014 Pacific", avg:95000, peakR:1.6, intl:false},
  {name:"Regional League \u2014 EMEA", avg:70000, peakR:1.6, intl:false},
  {name:"Regional League \u2014 China", avg:12000, peakR:1.8, intl:false},
  {name:"VALORANT Game Changers Championship", avg:15000, peakR:1.8, intl:true}
];

const regionHue = {Americas:[28,46], EMEA:[212,258], Pacific:[160,188], China:[344,8]};

function hashStr(s){let h=0;for(let i=0;i<s.length;i++){h=(h*31+s.charCodeAt(i))>>>0;}return h;}
function teamColor(t){
  const [a,b]=regionHue[t.r];
  const span = b>=a ? b-a : (360-a)+b;
  const hue = (a + (hashStr(t.n)%Math.max(span,1))) % 360;
  return `hsl(${hue} 70% 55%)`;
}
function initials(name){
  const compact=["T1","KOI","G2","BBL","FUT","JD","NRG","DRX","XLG"];
  const clean=name.replace(/Esports|Gaming|Division|Club|division/gi,"").trim();
  if(compact.includes(name)) return name;
  const words=clean.split(/\s+/).filter(Boolean);
  if(words.length===1) return words[0].slice(0,2).toUpperCase();
  return (words[0][0]+words[1][0]).toUpperCase();
}
function logoEl(t, big){
  const d=document.createElement('div');
  d.className='logo'+(big?' logo-big':'');
  d.style.background=teamColor(t);
  d.textContent=initials(t.n);
  return d;
}
