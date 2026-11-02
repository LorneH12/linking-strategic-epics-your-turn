import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { buildObjects } from './objects.js';
import { buildCity } from './city.js';
import { buildOffice } from './office.js';
import { createLightingController } from './lighting.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

// Standalone set factory: no imports from the production film or its singleton scene.
// Units are metres; +Y is up, the feature wall is at Z=-3.45.
const asset = path => new URL('../../../'+path, import.meta.url).href;
const local = path => new URL(path, import.meta.url).href;
export const shots = {
  hero: { position:[3.5,2.0,3.95], target:[-.3,1.27,-1.15], fov:51 },
  desk: { position:[2.35,1.75,2.45], target:[-.2,1.13,-.05], fov:42 },
  screen: { position:[-.34,1.32,1.05], target:[-.34,1.22,-.34], fov:35 },
  reverse: { position:[-2.65,1.85,-2.15], target:[.5,1.1,.65], fov:50 },
  city: { position:[-3.25,1.85,1.5], target:[-27,4,-5], fov:52 },
  street: { position:[-3.35,2.15,2.9], target:[-13,-3.9,-6], fov:54 },
  materials: { position:[1.8,1.28,1.0], target:[.72,.83,.03], fov:38 },
  office: { position:[1.4,1.8,3.7], target:[7.4,1.35,.4], fov:62 },
  threshold: { position:[5.7,1.75,2.9], target:[0,1.2,-.3], fov:60 },
  building: { position:[10.8,2.1,3.2], target:[2.4,1.3,-.5], fov:65 }
};

export async function buildRoom(scene, renderer, progress=()=>{}, options={}) {
  RectAreaLightUniformsLib.init();
  const root = new THREE.Group(); root.name='Amex enterprise alternative room'; scene.add(root);
  const materials={}, lights={}, anchors={}, errors=[];
  const manager=new THREE.LoadingManager();
  manager.onError=url=>errors.push(url);
  const tx=new THREE.TextureLoader(manager);
  const anisotropy=Math.min(12,renderer.capabilities.getMaxAnisotropy());
  const texture=async(url,color=false,repeat=[1,1])=>{const t=await tx.loadAsync(url);t.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);t.anisotropy=anisotropy;return t;};
  progress('Loading scanned surfaces…');
  const [wood,woodN,woodR,plasterN,plasterR,fabricN,stoneN,stoneR,hdr]=await Promise.all([
    texture(asset('textures/wood_floor_diff.jpg'),true,[4,4]),texture(asset('textures/wood_floor_nor.jpg'),false,[4,4]),texture(asset('textures/wood_floor_rough.jpg'),false,[4,4]),
    texture(asset('textures/painted_plaster_wall_nor.jpg'),false,[3,1.4]),texture(asset('textures/painted_plaster_wall_rough.jpg'),false,[3,1.4]),
    texture(local('materials/woven-normal.png'),false,[8,8]),texture(local('materials/stone-normal.png'),false,[3,2]),texture(local('materials/stone-roughness.png'),false,[3,2]),
    new HDRLoader(manager).loadAsync(asset('lighting/room-reflections_loft-hall.hdr'))
  ]);
  progress('Scanned surfaces and HDR loaded');
  hdr.mapping=THREE.EquirectangularReflectionMapping;scene.environment=hdr;scene.environmentIntensity=.75;scene.environmentRotation.y=.7;scene.background=new THREE.Color('#9ecdea');
  scene.fog=new THREE.FogExp2('#cce0ed',.006);
  const standard=(name,props)=>materials[name]=new THREE.MeshStandardMaterial({name,...props});
  const physical=(name,props)=>materials[name]=new THREE.MeshPhysicalMaterial({name,...props});
  const white=standard('Warm white painted plaster',{color:'#f5f3ed',normalMap:plasterN,normalScale:new THREE.Vector2(.13,.13),roughnessMap:plasterR,roughness:.95});
  const pale=document.createElement('canvas');pale.width=pale.height=2048;const pc=pale.getContext('2d');pc.filter='saturate(0.38) brightness(1.18)';pc.drawImage(wood.image,0,0,2048,2048);wood.image=pale;wood.needsUpdate=true;
  const floorMat=standard('Scanned oak flooring / pale finish',{map:wood,normalMap:woodN,normalScale:new THREE.Vector2(.22,.22),roughnessMap:woodR,roughness:.8});
  const stone=physical('Honed ivory mineral surface',{color:'#e9e5db',normalMap:stoneN,normalScale:new THREE.Vector2(.12,.12),roughnessMap:stoneR,roughness:.67,clearcoat:.12,clearcoatRoughness:.65});
  const aluminium=physical('Satin anodised aluminium',{color:'#b9c2c7',metalness:1,roughness:.38,anisotropy:.35});
  const trim=standard('Warm powder coat',{color:'#dedfd9',metalness:0,roughness:.65});
  const blue=standard('Blue architectural lacquer',{color:'#006fcf',roughness:.38,metalness:.05});
  const ink=standard('Graphite device polymer',{color:'#202b35',roughness:.48});
  const fabric=physical('Blue woven upholstery',{color:'#477c9e',roughness:.96,normalMap:fabricN,normalScale:new THREE.Vector2(.3,.3),sheen:.5,sheenColor:new THREE.Color('#b5ceda')});
  const seamMaterial=standard('Upholstery seam thread',{color:'#376985',roughness:.95});
  const rug=standard('Ivory woven wool',{color:'#dddcd4',roughness:1,normalMap:fabricN,normalScale:new THREE.Vector2(.4,.4)});
  const oak=standard('Oak joinery',{map:wood.clone(),normalMap:woodN.clone(),roughness:.65});oak.map.repeat.set(.7,.7);oak.normalMap.repeat.set(.7,.7);
  const glass=physical('Low iron architectural glass',{color:'#ffffff',transmission:.98,thickness:.012,ior:1.5,roughness:.025,metalness:0,envMapIntensity:.18,specularIntensity:.12});
  const emitter=standard('Opal light diffuser',{color:'#ffffff',emissive:'#fff5e8',emissiveIntensity:2,roughness:.4});
  function mesh(name,geo,mat,pos,parent=root){const o=new THREE.Mesh(geo,mat);o.name=name;o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  const box=(name,size,pos,mat,parent=root,r=.01)=>mesh(name,r?new RoundedBoxGeometry(...size,3,Math.min(r,...size.map(v=>v/2))):new THREE.BoxGeometry(...size),mat,pos,parent);
  const cyl=(name,r1,r2,h,pos,mat,parent=root)=>mesh(name,new THREE.CylinderGeometry(r1,r2,h,48),mat,pos,parent);
  const plane=(name,w,h,pos,mat,parent=root)=>mesh(name,new THREE.PlaneGeometry(w,h),mat,pos,parent);
  const area=(name,color,power,w,h,pos,target)=>{const l=new THREE.RectAreaLight(color,power,w,h);l.name=name;l.position.set(...pos);l.lookAt(...target);root.add(l);lights[name]=l;return l;};
  const label=(text,w,h,pos,color='#173e62',size=72,parent=root)=>{
    const c=document.createElement('canvas');c.width=w<.03?128:2048;c.height=Math.round(c.width*h/w);const g=c.getContext('2d');g.fillStyle=color;g.font=`500 ${size*c.width/2048}px Manrope,Arial`;g.textAlign='center';g.textBaseline='middle';g.fillText(text,c.width/2,c.height/2);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=anisotropy;const o=plane(text,w,h,pos,new THREE.MeshBasicMaterial({map:t,transparent:true,toneMapped:false,depthWrite:false}),parent);o.castShadow=false;o.receiveShadow=false;return o;
  };
  // Enclosed architecture, including an actual ceiling and a return behind the camera.
  box('Oak floor slab',[8,.12,8],[0,-.06,.5],floorMat,root,0);
  box('Feature wall',[8,3.4,.18],[0,1.7,-3.55],white,root,0);
  box('Ceiling',[8,.12,8],[0,3.46,.5],white,root,0);
  box('Rear return wall',[8,3.4,.16],[0,1.7,4.58],white,root,0);
  const office=buildOffice({root,box,plane,area,materials});
  box('Window sill wall',[.18,.38,8],[-4.08,.19,.5],white,root,0);
  box('Window head',[.18,.22,8],[-4.08,3.29,.5],white,root,0);
  for(const z of [-3.4,-1.45,.5,2.45,4.4])box('Window mullion',[.13,2.85,.065],[-4,1.8,z],trim);
  for(const y of [.39,3.18])box('Window horizontal frame',[.17,.055,7.9],[-4,y,.5],aluminium);
  for(let i=0;i<4;i++){const p=plane('Window glazing',1.88,2.75,[-4.015,1.78,-2.43+i*1.95],glass);p.rotation.y=Math.PI/2;p.castShadow=false;}
  const city=buildCity({root,box,mesh,plane,materials});
  for(const z of [-3.4,4.4])box('Skirting',[7.95,.08,.025],[0,.04,z],trim,root,0);
  // Rear wall: dimensional slats, stone panel and an authentic logo texture.
  box('Brand wall stone panel',[3.4,2.75,.08],[-.35,1.7,-3.405],stone);
  for(let i=0;i<17;i++)box('Oak acoustic fin',[.055,2.75,.08],[1.5+i*.14,1.7,-3.37],oak,root,.008);
  box('Brand panel blue reveal',[.025,2.75,.02],[-2.04,1.7,-3.35],blue,root,.002);
  const logo=await texture(local('branding/amex-bluebox-hires.svg'),true);
  box('Amex dimensional logo plaque',[.79,.79,.035],[-.35,2.14,-3.33],blue,root,.003);
  plane('American Express Blue Box',.78,.78,[-.35,2.14,-3.307],new THREE.MeshBasicMaterial({map:logo,toneMapped:false}));
  label('ENTERPRISE TECHNOLOGY SERVICES',2.8,.16,[-.35,1.53,-3.302],'#315771',76);
  label('Connected work. Clear outcomes.',2.65,.3,[-.35,1.18,-3.3],'#234c6b',94);
  // Central desk: bevels, inset cable path and legs with credible manufacturing detail.
  box('Demonstration desk / mineral top',[2.45,.055,1.03],[0,.78,0],stone,root,.022);
  box('Desk underside shadow reveal',[2.35,.025,.94],[0,.741,0],oak,root,.012);
  for(const x of [-1.02,1.02]){
    box('Desk pedestal leg',[.085,.71,.65],[x,.355,0],trim,root,.018);
    box('Desk foot',[.12,.025,.76],[x,.018,.01],aluminium,root,.009);
  }
  box('Cable trough',[1.35,.08,.12],[0,.68,-.32],ink);
  box('Cable cover',[.28,.004,.07],[.52,.810,-.36],aluminium,root,.006);
  box('Blue desk pad',[1.05,.004,.43],[-.22,.810,.12],fabric,root,.018);
  // A woven rug provides a distinct near-ground layer below the hero workstation.
  box('Workspace rug',[3.5,.008,2.65],[.1,.006,.35],rug,root,.035);
  // Chair: all parts are dimensional; this is an authored model, not a billboard.
  function piping(name,w,d,y,parent){
    const radius=.055,points=[];
    for(const [cx,cz,angle] of [[w/2-radius,d/2-radius,0],[-w/2+radius,d/2-radius,Math.PI/2],[-w/2+radius,-d/2+radius,Math.PI],[w/2-radius,-d/2+radius,Math.PI*1.5]])
      for(let i=0;i<=8;i++){const a=angle+i*Math.PI/16;points.push(new THREE.Vector3(cx+Math.cos(a)*radius,y,cz+Math.sin(a)*radius));}
    mesh(name,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points,true),100,.0024,5,true),seamMaterial,[0,0,0],parent);
  }
  function chair(x,z,turn=0){const g=new THREE.Group();g.name='Upholstered task chair';g.position.set(x,0,z);g.rotation.y=turn;root.add(g);
    box('Seat cushion',[.52,.095,.49],[0,.47,0],fabric,g,.045);
    piping('Seat stitched welt',.49,.46,.478,g);
    box('Seat support shell',[.48,.028,.44],[0,.408,0],ink,g,.025);
    const b=box('Upholstered back',[.5,.58,.095],[0,.78,.24],fabric,g,.045);b.rotation.x=-.1;
    const backSeam=new THREE.Group();backSeam.position.set(0,.78,.292);backSeam.rotation.x=Math.PI/2-.1;g.add(backSeam);piping('Back stitched welt',.46,.53,0,backSeam);
    for(const x of [-.13,.13])box('Back tailored channel',[.002,.43,.002],[x,.8,.187],seamMaterial,g,.001);
    box('Lumbar support cover',[.29,.11,.023],[0,.64,.18],fabric,g,.025);
    const lever=box('Chair adjustment lever',[.16,.018,.025],[.28,.39,-.07],ink,g,.008);lever.rotation.z=-.12;
    cyl('Pneumatic column',.027,.034,.3,[0,.26,0],aluminium,g);
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const arm=box('Cast aluminium base',[.055,.025,.31],[Math.sin(a)*.14,.10,Math.cos(a)*.14],aluminium,g,.012);arm.rotation.y=a;const wheel=cyl('Caster',.035,.035,.045,[Math.sin(a)*.29,.044,Math.cos(a)*.29],ink,g);wheel.rotation.z=Math.PI/2;}
    for(const s of [-1,1]){box('Arm support',[.025,.23,.025],[s*.29,.57,.11],aluminium,g);box('Armrest',[.065,.035,.31],[s*.29,.69,.01],ink,g,.015);}return g;
  }chair(.05,.98,-.08);
  // Secondary seating and storage deepen the room without cluttering the desk.
  box('Credenza oak body',[2.6,.65,.48],[2.15,.39,-2.98],oak,root,.018);
  box('Credenza stone top',[2.65,.025,.5],[2.15,.73,-2.98],stone);
  for(let i=0;i<4;i++){box('Cabinet door',[.63,.56,.023],[1.18+i*.65,.4,-2.724],trim,root,.006);box('Cabinet pull',[.17,.012,.022],[1.18+i*.65,.64,-2.703],aluminium,root,.004);}
  for(const x of [1.05,3.25])for(const z of [-3.12,-2.84])cyl('Cabinet leg',.018,.018,.09,[x,.045,z],aluminium);
  const lounge=new THREE.Group();lounge.name='Blue lounge chair';lounge.position.set(2.75,0,1.5);lounge.rotation.y=-.4;root.add(lounge);
  box('Lounge seat',[.82,.18,.75],[0,.42,0],fabric,lounge,.08);box('Lounge back',[.85,.7,.17],[0,.7,-.32],fabric,lounge,.08);
  piping('Lounge cushion welt',.77,.70,.445,lounge);
  const loungeBackSeam=new THREE.Group();loungeBackSeam.position.set(0,.7,-.228);loungeBackSeam.rotation.x=Math.PI/2;lounge.add(loungeBackSeam);piping('Lounge back welt',.78,.62,0,loungeBackSeam);
  for(const x of [-.22,0,.22])box('Lounge tailored seam',[.002,.47,.002],[x,.72,-.229],seamMaterial,lounge,.001);
  box('Lounge underside platform',[.76,.065,.64],[0,.30,0],oak,lounge,.025);
  for(const x of [-.43,.43])box('Lounge arm',[.13,.35,.78],[x,.58,0],fabric,lounge,.055);
  for(const x of [-.32,.32])for(const z of [-.25,.25])cyl('Lounge oak foot',.025,.02,.32,[x,.16,z],oak,lounge);
  cyl('Side table stem',.035,.035,.49,[1.8,.245,1.65],aluminium);cyl('Side table base',.24,.24,.025,[1.8,.018,1.65],trim);cyl('Side table stone top',.34,.34,.03,[1.8,.51,1.65],stone);
  // Pendant has a visible diffuser AND a real emitter.
  for(const x of [-.72,.72])cyl('Pendant suspension',.003,.003,.43,[x,3.18,-.1],aluminium);
  box('Suspended linear light',[1.85,.055,.08],[0,2.94,-.1],aluminium,root,.018);
  box('Pendant diffuser',[1.78,.006,.065],[0,2.908,-.1],emitter,root,.003);
  area('Pendant / 4000K','#fff3df',3,1.78,.065,[0,2.9,-.1],[0,.78,-.1]);
  area('Window daylight / 5600K','#f1f7ff',1.8,6,2.4,[-3.9,1.9,.1],[0,1,-.3]);
  area('Ceiling bounce','#ffffff',1.0,4,4,[0,3.28,.5],[0,0,.5]);
  area('Indirect room bounce','#f4f6f7',.65,5,5,[0,.12,.5],[0,3.4,.5]);
  const sun=new THREE.DirectionalLight('#fff8ed',1.55);sun.name='Daylight key with contact shadows';sun.position.set(-3.5,4.6,2.3);sun.target.position.set(.1,.1,-1.1);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:.1,far:16});sun.shadow.normalBias=.008;sun.shadow.bias=-.00015;sun.shadow.radius=3;sun.shadow.intensity=.7;root.add(sun,sun.target);lights.daylight=sun;
  // The ceiling encloses the room but does not block the daylight key in this realtime lighting approximation.
  root.getObjectByName('Ceiling').castShadow=false;
  progress('Building replacement workstation and living objects...');
  const objects=await buildObjects({root,box,cyl,mesh,plane,area,label,materials,texture,asset,anchors});
  lights.task=objects.taskLight;
  const screenAnchor=anchors.monitor;shots.screen.target=screenAnchor.toArray();shots.screen.position=[screenAnchor.x,screenAnchor.y+.02,screenAnchor.z+1.0];
  // Keyboard with individually separated keycaps and printed legends.
  const kb=new THREE.Group();kb.position.set(-.35,.814,.18);root.add(kb);box('Keyboard aluminium case',[.32,.015,.115],[0,.008,0],aluminium,kb,.006);
  const keymat=standard('Ivory keycaps',{color:'#e9eceb',roughness:.6});
  const rows=['1234567890-=','QWERTYUIOP[]','ASDFGHJKL;','ZXCVBNM,./'];
  rows.forEach((row,r)=>[...row].forEach((char,i)=>{const x=-.145+i*.023+(r===2?.008:0),z=-.039+r*.022;box('Key '+char,[.02,.006,.019],[x,.019,z],keymat,kb,.002);const glyph=label(char,.014,.014,[x,.0225,z],'#64717a',140,kb);glyph.rotation.x=-Math.PI/2;}));
  box('Spacebar',[.115,.006,.017],[0,.019,.049],keymat,kb,.002);
  const mouse=mesh('Mouse',new THREE.SphereGeometry(1,40,24),keymat,[.05,.828,.2]);mouse.scale.set(.031,.017,.052);
  box('Mouse wheel',[.004,.004,.014],[.05,.845,.185],ink,root,.002);
  box('Blue notebook',[.16,.018,.22],[-.94,.82,.16],blue,root,.006);box('Notebook page block',[.153,.012,.213],[-.94,.822,.16],trim,root,.003);
  box('Notebook cover',[.16,.003,.22],[-.94,.831,.16],blue,root,.002);
  const pen=cyl('Aluminium pen',.003,.003,.135,[-.81,.818,.15],aluminium);pen.rotation.x=Math.PI/2;pen.rotation.z=.12;
  // A ceramic vessel on the credenza, formed as a true lathed surface.
  const profile=[[.0,0],[.08,0],[.11,.03],[.115,.19],[.08,.27],[.055,.3],[.047,.3],[.07,.26],[.1,.18],[.095,.04],[0,.02]].map(([x,y])=>new THREE.Vector2(x,y));
  mesh('Ceramic vessel',new THREE.LatheGeometry(profile,48),stone,[2.9,.745,-2.93]);
  root.updateMatrixWorld(true);
  const deskGroup=new THREE.Group();deskGroup.name='NEW / demonstration desk';root.add(deskGroup);
  for(const child of [...root.children])if(/^(Demonstration desk|Desk underside|Desk pedestal|Desk foot|Cable trough|Cable cover)/.test(child.name))deskGroup.attach(child);
  objects.parts[deskGroup.name]=deskGroup;
  const lighting=createLightingController({scene,renderer,root,lights,materials});
  if(options.lightingPreset && options.lightingPreset!=='baseline')lighting.apply(options.lightingPreset);
  return {root,materials,lights,anchors,errors,objects,city,office,lighting,setLightingPreset:lighting.apply,animate(time,strength=1){objects.animate(time,strength);city.animate(time,strength);sun.position.z=2.3+Math.sin(time/180)*.22*strength;},dispose(){root.traverse(o=>{o.geometry?.dispose();});Object.values(materials).forEach(m=>m.dispose());scene.remove(root);}};
}



