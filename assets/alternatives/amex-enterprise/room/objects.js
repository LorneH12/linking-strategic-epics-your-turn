import * as THREE from 'three';

// Original replacement objects. No production GLBs or scanned props are loaded.
export async function buildObjects({root,box,cyl,mesh,plane,area,label,materials,texture,asset,anchors}){
 const { 'Satin anodised aluminium':alu,'Graphite device polymer':ink,'Warm powder coat':white,'Honed ivory mineral surface':stone,'Blue architectural lacquer':blue }=materials;
 const parts={};
 const group=(name,pos,turn=0)=>{const g=new THREE.Group();g.name=name;g.position.set(...pos);g.rotation.y=turn;root.add(g);parts[name]=g;return g;};
 const darkMetal=new THREE.MeshStandardMaterial({name:'Satin titanium',color:'#788a97',metalness:.9,roughness:.34});
 const lens=new THREE.MeshPhysicalMaterial({name:'Camera lens glass',color:'#112739',metalness:.15,roughness:.1,clearcoat:1});
 const diode=new THREE.MeshBasicMaterial({color:'#66bce8'});
 // 32-inch class display: tapered metal housing, thin bezel, VESA neck, I/O and ventilation.
 const monitor=group('NEW / 32-inch studio monitor',[-.31,.812,-.25]);
 box('Display base',[.265,.014,.19],[0,.009,.025],alu,monitor,.014);
 box('Base underside',[.25,.004,.175],[0,.002,.025],ink,monitor,.008);
 box('Monitor stem',[.058,.235,.035],[0,.13,-.012],alu,monitor,.012);
 box('Rear enclosure',[.72,.425,.036],[0,.385,-.025],alu,monitor,.018);
 box('Rear service panel',[.25,.19,.018],[0,.335,-.049],darkMetal,monitor,.02);
 box('Front bezel',[.716,.421,.014],[0,.385,-.001],ink,monitor,.012);
 const screenTexture=await texture(asset('tool-screens/recreations/01-targetprocess_portfolio-epic.png'),true);
 const display=plane('Targetprocess screen socket',.691,.389,[0,.389,.007],new THREE.MeshBasicMaterial({map:screenTexture,toneMapped:false}),monitor);display.castShadow=false;display.receiveShadow=false;
 for(let i=0;i<24;i++)box('Rear ventilation slot',[.012,.003,.001],[(-12+i)*.02,.537,-.044],ink,monitor,.001);
 for(let i=0;i<3;i++)box('USB-C port',[.014,.005,.003],[.08+i*.025,.272,-.059],ink,monitor,.002);
 const cameraLens=mesh('Monitor camera',new THREE.CircleGeometry(.003,20),lens,[0,.587,.0075],monitor);cameraLens.castShadow=false;
 mesh('Power indicator',new THREE.CircleGeometry(.0012,12),diode,[.326,.187,.008],monitor).castShadow=false;
 const rearWord=label('STUDIO 32',.12,.025,[0,.37,-.059],'#576974',95,monitor);rearWord.rotation.y=Math.PI;
 monitor.updateMatrixWorld(true);anchors.monitor=display.getWorldPosition(new THREE.Vector3());
 area('Monitor emission','#edf6ff',.28,.69,.38,anchors.monitor.toArray(),[-.31,.8,.3]);
 // New 16-inch laptop, authored at scale with a correctly hinged screen and key layout.
 const laptop=group('NEW / 16-inch aluminium laptop',[.67,.814,.04],-.22);
 box('Laptop bottom shell',[.36,.013,.25],[0,.008,0],alu,laptop,.009);
 box('Laptop upper deck',[.354,.004,.244],[0,.016,0],alu,laptop,.006);
 box('Trackpad inset',[.128,.001,.075],[0,.018,.069],darkMetal,laptop,.004);
 box('Trackpad glass',[.125,.001,.072],[0,.0188,.069],alu,laptop,.004);
 for(const side of [-1,1])for(let k=0;k<3;k++)box('Laptop side port',[.001,.004,.011],[side*.1805,.009,-.06+k*.023],ink,laptop,.001);
 const hinge=cyl('Laptop hinge',.006,.006,.29,[0,.018,-.112],darkMetal,laptop);hinge.rotation.z=Math.PI/2;
 const lid=new THREE.Group();lid.name='Laptop lid pivot';lid.position.set(0,.019,-.112);lid.rotation.x=-.21;laptop.add(lid);
 box('Lid aluminium',[.36,.234,.008],[0,.117,-.004],alu,lid,.007);
 box('Lid inner bezel',[.353,.226,.003],[0,.117,.002],ink,lid,.005);
 const laptopTex=await texture(asset('tool-screens/recreations/02-jira_epic.png'),true);
 const lp=plane('Jira screen socket',.337,.207,[0,.119,.004],new THREE.MeshBasicMaterial({map:laptopTex,toneMapped:false}),lid);lp.castShadow=false;lp.receiveShadow=false;
 mesh('Laptop camera',new THREE.CircleGeometry(.0015,16),lens,[0,.226,.004],lid).castShadow=false;
 for(let row=0;row<5;row++)for(let k=0;k<14;k++)box('Laptop key',[.019,.002,.015],[-.146+k*.0225,.019,-.087+row*.018],ink,laptop,.002);
 box('Laptop spacebar',[.10,.002,.014],[0,.019,.006],ink,laptop,.002);
 for(const x of [-.167,.167])for(let k=0;k<22;k++)box('Speaker perforation',[.005,.0005,.001],[x,.019,-.089+k*.0045],ink,laptop,.0003);
 laptop.updateMatrixWorld(true);anchors.laptop=lp.getWorldPosition(new THREE.Vector3());
 // Articulated aluminium desk lamp with a real illuminated diffuser and spot source.
 const lamp=group('NEW / architectural task lamp',[-.96,.811,-.23],Math.PI/2);
 cyl('Weighted lamp foot',.087,.095,.017,[0,.009,0],alu,lamp);
 const stem=cyl('Lamp stem',.009,.009,.34,[0,.18,0],alu,lamp);stem.rotation.z=-.12;
 box('Lamp horizontal arm',[.27,.015,.025],[.13,.35,0],alu,lamp,.007);
 const head=box('Lamp head',[.17,.018,.075],[.235,.348,.008],white,lamp,.012);head.rotation.z=-.08;
 const diffuse=new THREE.MeshStandardMaterial({color:'#fff7e9',emissive:'#fff2d2',emissiveIntensity:1.2});box('Lamp emitting face',[.151,.002,.057],[.235,.336,.008],diffuse,lamp,.006);
 const task=new THREE.SpotLight('#fff1d7',3.5,2,.88,.85,2);task.name='Desk task light / 4000K';task.position.set(-.96,1.14,-.465);task.target.position.set(-.94,.81,-.11);root.add(task,task.target);
 // Ceramic coffee vessel, water glass, pen tray and cable: deliberately quiet details.
 const cup=group('NEW / porcelain cup',[.99,.815,.30]);
 const profile=[[.0,0],[.032,0],[.036,.008],[.039,.082],[.034,.082],[.032,.01],[0,.01]].map(v=>new THREE.Vector2(...v));
 mesh('Porcelain cup body',new THREE.LatheGeometry(profile,48),white,[0,0,0],cup);
 const handle=mesh('Cup handle',new THREE.TorusGeometry(.024,.005,12,28,Math.PI*1.8),white,[.038,.045,0],cup);handle.rotation.z=-Math.PI*.9;
 const coffee=new THREE.MeshStandardMaterial({color:'#573c28',roughness:.2});cyl('Coffee surface',.033,.033,.001,[0,.069,0],coffee,cup);
 cyl('Stone coaster',.055,.055,.004,[.99,.813,.3],stone);
 box('Pen tray',[.22,.012,.075],[.39,.818,-.24],white,root,.012);
 const cableCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(.49,.822,-.02),new THREE.Vector3(.41,.826,-.12),new THREE.Vector3(.46,.819,-.3),new THREE.Vector3(.52,.80,-.36)]);
 mesh('USB-C woven cable',new THREE.TubeGeometry(cableCurve,40,.0018,8,false),ink,[0,0,0]);
 // A new indoor tree: curved stems, individually modelled leaves and visible veins.
 const plant=group('NEW / indoor ficus',[-2.75,0,-2.45]);
 cyl('Ceramic planter',.245,.19,.43,[0,.215,0],stone,plant);
 cyl('Planter inner lip',.233,.233,.012,[0,.427,0],white,plant);
 const soil=new THREE.MeshStandardMaterial({color:'#453e32',roughness:1});cyl('Soil',.224,.224,.009,[0,.42,0],soil,plant);
 const bark=new THREE.MeshStandardMaterial({color:'#7a6b4f',roughness:.95});
 const foliageCanvas=document.createElement('canvas');foliageCanvas.width=256;foliageCanvas.height=512;const fg=foliageCanvas.getContext('2d');
 const grad=fg.createLinearGradient(0,0,256,0);grad.addColorStop(0,'#315c31');grad.addColorStop(.48,'#698347');grad.addColorStop(.52,'#829653');grad.addColorStop(1,'#355c31');fg.fillStyle=grad;fg.fillRect(0,0,256,512);fg.strokeStyle='#9aa86e';fg.lineWidth=1.5;
 for(let j=0;j<18;j++){const y=j*28;fg.beginPath();fg.moveTo(128,y);fg.quadraticCurveTo(75,y+28,3,y+70);fg.moveTo(128,y);fg.quadraticCurveTo(185,y+28,253,y+70);fg.stroke();}fg.strokeStyle='#c2c88e';fg.lineWidth=2;fg.beginPath();fg.moveTo(128,0);fg.lineTo(128,512);fg.stroke();
 const leafTex=new THREE.CanvasTexture(foliageCanvas);leafTex.colorSpace=THREE.SRGBColorSpace;
 const leafMat=new THREE.MeshPhysicalMaterial({name:'Living ficus leaves',map:leafTex,roughness:.52,side:THREE.DoubleSide,clearcoat:.12});
 const leaves=[];
 const variation=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
 for(let stemIndex=0;stemIndex<5;stemIndex++){
  const a=stemIndex*2.399,h=1.65+variation(stemIndex)*.38,tip=new THREE.Vector3(Math.sin(a)*.34,h,Math.cos(a)*.34);
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,.38,0),new THREE.Vector3(Math.sin(a)*.08,.9,Math.cos(a)*.08),tip]);
  mesh('Ficus stem',new THREE.TubeGeometry(curve,20,.012,8,false),bark,[0,0,0],plant);
  for(let j=0;j<16;j++){
   const n=stemIndex*19+j,t=.24+j*.047+variation(n)*.025,p=curve.getPoint(t),angle=j*2.399+stemIndex*1.7+variation(n+40)*.6;
   const pivot=new THREE.Group();pivot.position.copy(p);pivot.rotation.y=angle;pivot.rotation.z=.3+variation(n+12)*.65;plant.add(pivot);
   const length=.25+variation(n+52)*.10,width=.15+variation(n+91)*.07;
   const geo=new THREE.PlaneGeometry(width,length,8,14),pos=geo.attributes.position,uv=geo.attributes.uv;
   for(let k=0;k<pos.count;k++){const v=uv.getY(k);pos.setX(k,pos.getX(k)*Math.pow(Math.sin(Math.PI*v),.7));pos.setY(k,.045+v*length);pos.setZ(k,.035*Math.sin(Math.PI*v)+Math.abs(pos.getX(k))*.2+.008*Math.sin(v*8+n));}geo.computeVertexNormals();
   const leaf=mesh('Ficus leaf',geo,leafMat,[0,0,0],pivot);
   mesh('Ficus petiole',new THREE.CylinderGeometry(.0015,.0025,.06,6),bark,[0,.025,0],pivot);
   pivot.rotation.x=.6+variation(n+33)*.7;leaves.push({pivot,base:pivot.rotation.z,baseX:pivot.rotation.x,phase:j*.7+stemIndex});
  }
 }
 // Three objects for the shelf and contemporary abstract art with a real frame.
 for(let k=0;k<4;k++)box('Bound reference volume',[.28,.035,.2],[1.32,.77+k*.035,-2.95],k%2?white:blue,root,.003);
 const art=group('NEW / framed geometric print',[0,1.8,4.465],Math.PI);
 box('Print frame',[1.25,1.55,.035],[0,0,0],oakMat(),art,.008);
 box('Print mount',[1.19,1.49,.007],[0,0,.023],white,art,.001);
 const artwork=document.createElement('canvas');artwork.width=800;artwork.height=1000;const ag=artwork.getContext('2d');ag.fillStyle='#f8f7f2';ag.fillRect(0,0,800,1000);ag.strokeStyle='#006fcf';ag.lineWidth=2;
 for(let i=0;i<15;i++){ag.beginPath();ag.arc(250,470,150+i*19,-Math.PI*.7,Math.PI*.7);ag.stroke();}ag.fillStyle='#006fcf';ag.fillRect(130,760,210,12);ag.fillStyle='#c9dfef';ag.fillRect(550,145,90,250);
 const at=new THREE.CanvasTexture(artwork);at.colorSpace=THREE.SRGBColorSpace;const ap=plane('Abstract print',1.05,1.34,[0,0,.028],new THREE.MeshBasicMaterial({map:at,toneMapped:false}),art);ap.castShadow=false;
 function oakMat(){return materials['Oak joinery'];}
 return {parts,taskLight:task,animate(time,strength=1){for(const {pivot,base,baseX,phase} of leaves){pivot.rotation.z=base+Math.sin(time*.7+phase)*.025*strength;pivot.rotation.x=baseX+Math.sin(time*.43+phase)*.018*strength;}}};
}
