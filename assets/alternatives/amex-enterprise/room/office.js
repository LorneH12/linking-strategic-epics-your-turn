import * as THREE from 'three';

// A real adjoining floorplate, not a backdrop. Doorway clear opening: z2.2–3.6.
export function buildOffice({root,box,plane,area,materials}){
 const white=materials['Warm white painted plaster'],oak=materials['Oak joinery'],floor=materials['Scanned oak flooring / pale finish'],metal=materials['Satin anodised aluminium'],trim=materials['Warm powder coat'],blue=materials['Blue architectural lacquer'],fabric=materials['Blue woven upholstery'],ink=materials['Graphite device polymer'],stone=materials['Honed ivory mineral surface'];
 const glazing=materials['Office transparent safety glass']=new THREE.MeshPhysicalMaterial({color:'#dcecf3',transparent:true,opacity:.13,roughness:.08,metalness:.05,side:THREE.DoubleSide,depthWrite:false,envMapIntensity:.25});
 const frost=materials['Office safety manifestation']=new THREE.MeshStandardMaterial({color:'#e1edf1',transparent:true,opacity:.48,roughness:.8,side:THREE.DoubleSide,depthWrite:false});
 const g=new THREE.Group();g.name='Adjoining office and building shell';root.add(g);
 const b=(n,s,p,m,r=.008)=>box(n,s,p,m,g,r);
 const pane=(n,w,h,p,rotation=0)=>{const o=plane(n,w,h,p,glazing,g);o.rotation.y=rotation;o.castShadow=false;return o;};
 b('Adjoining office floor slab',[8,.12,8],[8,-.06,.5],floor,0);
 const ceiling=b('Adjoining office ceiling',[8,.12,8],[8,3.46,.5],white,0);ceiling.castShadow=false;
 b('Building rear perimeter wall',[8,3.4,.18],[8,1.7,4.58],white,0);
 b('Building front perimeter wall',[8,3.4,.18],[8,1.7,-3.55],white,0);
 // Partition panels stop at the actual doorway; no invisible full-width collision plane.
 for(const [a,z] of [[-3.5,-1.6],[-1.6,.3],[.3,2.2],[3.6,4.5]]){
  const mid=(a+z)/2,w=z-a;
  pane('Office glass partition panel',w-.055,3.25,[4.08,1.7,mid],Math.PI/2);
  b('Partition top rail',[.06,.07,w],[4.08,3.35,mid],metal);
  b('Partition bottom shoe',[.06,.055,w],[4.08,.028,mid],metal);
  for(const y of [1.12,1.28]){const p=plane('Glass safety stripe',w-.07,.032,[4.074,y,mid],frost,g);p.rotation.y=Math.PI/2;p.castShadow=false;}
 }
 for(const z of [-3.5,-1.6,.3,2.2,3.6,4.5])b('Glazed wall structural frame',[.065,3.4,.055],[4.08,1.7,z],metal);
 b('Door lintel',[.12,.1,1.46],[4.08,2.67,2.9],metal);
 pane('Door transom glazing',1.34,.59,[4.08,3.02,2.9],Math.PI/2);
 // Door is held open ninety degrees, leaving a continuous, step-free route.
 pane('Open glass door leaf',1.32,2.52,[4.77,1.32,3.6]);
 for(const x of [4.12,5.42])b('Open door vertical stile',[.035,2.57,.04],[x,1.32,3.6],metal);
 for(const y of [.05,2.59])b('Open door horizontal stile',[1.34,.045,.045],[4.77,y,3.6],metal);
 for(const z of [3.54,3.66])b('Door pull handle',[.025,.36,.025],[5.27,1.12,z],metal);
 for(const y of [.35,2.25])b('Door hinge',[.09,.11,.08],[4.1,y,3.6],metal);
 b('Door closer',[.22,.045,.06],[4.22,2.58,3.6],metal);
 // The office belongs to a building: columns, continuous beams, window reveals.
 for(const z of [-3.3,.5,4.3])b('Perimeter concrete column',[.3,3.4,.3],[11.82,1.7,z],white,.015);
 b('East perimeter window sill',[.2,.38,8],[12,.19,.5],white,0);
 b('East perimeter beam',[.28,.26,8],[12,3.27,.5],white,0);
 for(const z of [-3.4,-1.45,.5,2.45,4.4])b('East window mullion',[.1,2.85,.065],[11.98,1.8,z],metal);
 for(let i=0;i<4;i++)pane('East exterior glazing',1.86,2.72,[12.015,1.78,-2.43+i*1.95],Math.PI/2);
 for(const z of [-3.3,4.3])b('Office ceiling perimeter beam',[7.7,.22,.24],[8,3.28,z],white,0);
 // Four authored workstations leave a 1.8m circulation aisle beside the glass.
 for(const x of [7.3,10.1])for(const z of [-1.75,1.0]){
  b('Office workstation oak top',[1.8,.055,.8],[x,.76,z],oak,.018);
  for(const dx of [-.73,.73])b('Office desk leg',[.055,.72,.65],[x+dx,.36,z],trim);
  b('Office monitor stand',[.035,.18,.035],[x,.88,z-.17],metal);
  b('Office monitor foot',[.23,.014,.16],[x,.797,z-.17],metal);
  b('Office monitor housing',[.61,.36,.035],[x,1.12,z-.18],ink);
  b('Office monitor idle display',[.57,.32,.003],[x,1.12,z-.16],blue,.002);
  b('Office keyboard',[.34,.018,.12],[x,.8,z+.16],trim,.005);
  b('Office task seat',[.48,.09,.46],[x,.46,z+.66],fabric,.035);
  b('Office task back',[.48,.49,.07],[x,.73,z+.88],fabric,.035);
  b('Office chair column',[.04,.39,.04],[x,.21,z+.66],metal);
  for(const axis of [0,1])b('Office chair base',axis?[.05,.04,.52]:[.52,.04,.05],[x,.045,z+.66],metal);
 }
 b('Office shared storage',[2.4,.78,.42],[8.8,.39,4.2],oak,.015);
 for(const x of [7.9,8.5,9.1,9.7])b('Office storage door',[.58,.68,.025],[x,.4,3.975],trim,.004);
 b('Office shared storage top',[2.45,.025,.45],[8.8,.795,4.2],stone);
 const diffuser=materials['Opal light diffuser'];
 for(const x of [6.2,9.6])for(const z of [-1.7,1.7])b('Office recessed light',[1.7,.015,.22],[x,3.386,z],diffuser,.005);
 // Existing environment supplies office fill; visible diffusers do not imply baked GI.
 return {root:g,doorway:{center:new THREE.Vector3(4.08,1.3,2.9),clearWidth:1.4,clearHeight:2.62},bounds:{min:[-4.2,0,-3.7],max:[12.3,3.5,4.8]}};
}
