import * as THREE from 'three';

// Original, deterministic city geometry. Units are metres; street datum is -6 m.
// Background people are intentionally distant schematic figures, not scanned humans.
export function buildDistrict({city,box,mesh}) {
  let seed=42019;
  const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  const material=(name,color,roughness=.7,extra={})=>new THREE.MeshStandardMaterial({name,color,roughness,...extra});
  const concrete=material('City / pale limestone','#c4c4b7'),paving=material('City / sidewalk concrete','#c5c4ba',.95);
  const asphalt=material('City / asphalt','#626e75',.96),marking=material('City / road paint','#e5e4d5',.9);
  const metal=material('City / powder-coated street furniture','#4c6067',.6),bark=material('City / bark','#77654f',.96);
  const soil=material('City / planting soil','#655c46',1),rubber=material('City / tyres','#30383a',.92);
  const glass=new THREE.MeshPhysicalMaterial({name:'City / glazing',color:'#8ca8b3',metalness:.32,roughness:.26,clearcoat:.35});
  const boxGeo=new THREE.BoxGeometry(1,1,1),matrix=new THREE.Matrix4(),quat=new THREE.Quaternion();
  const batches=new Map();
  const add=(name,size,position,mat,color)=>{const key=name;if(!batches.has(key))batches.set(key,{mat,items:[]});batches.get(key).items.push({size,position,color});};
  const flush=()=>{for(const [name,{mat,items}] of batches){const inst=new THREE.InstancedMesh(boxGeo,mat,items.length);inst.name=name;items.forEach((o,i)=>{matrix.compose(new THREE.Vector3(...o.position),quat,new THREE.Vector3(...o.size));inst.setMatrixAt(i,matrix);if(o.color)inst.setColorAt(i,new THREE.Color(o.color));});inst.receiveShadow=true;city.add(inst);}batches.clear();};
  box('City ground',[190,.2,210],[-80,-6.16,0],material('City / ground','#a5b0a0',1),city,0);
  box('Two-lane avenue / 6.6 m',[6.6,.1,160],[-12,-6.06,0],asphalt,city,0);
  box('Cross street',[82,.1,6.6],[-45,-6.055,10],asphalt,city,0);
  for(const x of [-16.95,-7.05])for(const [z,len] of [[-35,83],[48.5,63]]){
    box('Sidewalk / separated furniture and walking zones',[3.3,.18,len],[x,-5.96,z],paving,city,.025);
    add('Concrete curb blocks',[.22,.22,len],[x+(x<-12?1.55:-1.55),-5.94,z],concrete);
    for(let dz=z-len/2+.8;dz<z+len/2;dz+=1.6)add('Paving joints',[3.12,.002,.012],[x,-5.866,dz],metal);
  }
  for(let z=-77;z<80;z+=5)if(z<5||z>15)add('Road center dashes',[.1,.005,2.6],[-12,-6.003,z],marking);
  for(const x of [-15.05,-8.95])for(const [z,len] of [[-36,82],[48,64]])add('Road edge line',[.09,.006,len],[x,-6,z],marking);
  for(const z of [5.8,14.2])for(let x=-14.7;x<-9;x+=.85)add('Crosswalk stripes',[.48,.008,2.4],[x,-5.996,z],marking);
  for(const x of [-14.3,-9.7])for(const z of [3.8,16.2])add('Stop line',[2.5,.008,.22],[x,-5.996,z],marking);
  // Storm drains and paired tactile curb pads avoid a perfectly featureless pavement.
  for(const x of [-15.22,-8.78])for(const z of [-12,24,48]){
    add('Drain surround',[.26,.02,.6],[x,-5.99,z],metal);
    for(let k=0;k<5;k++)add('Drain grate slots',[.22,.025,.025],[x,-5.98,z-.22+k*.11],rubber);
  }
  for(const x of [-16.2,-7.8])for(const z of [5.4,14.6])add('Tactile crossing pads',[.8,.012,1.2],[x,-5.858,z],material('City / tactile paving','#c7b692',.9));

  const buildings=[
    {x:-27,z:-12,w:15,d:17,h:13,type:0}, {x:-29,z:31,w:18,d:24,h:18,type:1},
    {x:-30,z:-43,w:18,d:21,h:31,type:2}, {x:-51,z:1,w:22,d:22,h:38,type:1},
    {x:-55,z:48,w:22,d:20,h:43,type:0}, {x:-58,z:-37,w:23,d:22,h:48,type:2},
    {x:-84,z:-12,w:22,d:28,h:57,type:1}, {x:-90,z:39,w:24,d:24,h:49,type:2},
    {x:-102,z:-60,w:25,d:26,h:65,type:0}
  ];
  const facadeMats=[material('City / warm stone façade','#c8c7ba',.82),material('City / light silver façade','#b2c1c7',.45,{metalness:.2}),material('City / pale terracotta façade','#c5b8a5',.85)];
  const recess=material('City / recessed window jamb','#627580',.7),interior=material('City / shaded interior','#8b9695',.95);
  const warm=material('City / occasional occupied room','#cfcdc0',.8,{emissive:'#b6aa86',emissiveIntensity:.1});
  const occupants=[];
  buildings.forEach((b,bi)=>{
    const {x,z,w,d,h,type}=b,facade=facadeMats[type],floors=Math.floor(h/3.25);
    box('City building / dimensional façade',[w,h,d],[x,h/2-6,z],facade,city,.035);
    // Jambs stand proud of glazing; floor courses and parapets create real parallax.
    for(let f=0;f<floors;f++){
      const y=-4.35+f*3.25;
      for(let c=0;c<Math.floor(d/2.15);c++){
        const zz=z-d/2+1.2+c*2.15,face=x+w/2;
        add('Window recesses / east',[.09,2.22,1.65],[face+.03,y,zz],recess);
        const value=.72+random()*.28;
        add('Glazed windows / east',[.025,1.92,1.38],[face+.083,y,zz],glass,new THREE.Color().setRGB(value*.94,value,value));
        add('Window sills / east',[.28,.095,1.77],[face+.12,y-1.1,zz],concrete);
        if(random()<.28)add('Interior roller blinds / east',[.027,.3+random()*.7,1.34],[face+.1,y+.55,zz],interior);
        if(bi<3&&f>0&&random()<.06){
          add('Occupied office windows',[.03,1.87,1.32],[face+.11,y,zz],warm);
          const person=box('Distant office activity',[.04,.78,.22],[face+.14,y-.45,zz],metal,city,.03);occupants.push({person,z:zz,phase:random()*9});
        }
      }
      for(const side of [-1,1])for(let c=0;c<Math.floor(w/2.15);c++){
        const xx=x-w/2+1.2+c*2.15;
        add('Window recesses / sides',[1.65,2.22,.09],[xx,y,z+side*(d/2+.03)],recess);
        add('Glazed windows / sides',[1.38,1.92,.025],[xx,y,z+side*(d/2+.083)],glass,new THREE.Color().setScalar(.75+random()*.25));
        add('Window sills / sides',[1.77,.095,.28],[xx,y-1.1,z+side*(d/2+.12)],concrete);
      }
      if(f>0)add('Façade horizontal courses',[w+.28,.13,d+.28],[x,-6+f*3.25,z],facade);
    }
    for(const dz of [-d/2+.2,d/2-.2])add('Façade corner piers',[.26,h,.38],[x+w/2+.14,h/2-6,z+dz],concrete);
    box('Roof parapet cap',[w+.3,.22,d+.3],[x,h-5.9,z],concrete,city,.025);
    box('Setback service core',[w*.37,1.5,d*.31],[x-1,h-5.15,z],metal,city,.045);
    // Ground-level lobby, recessed entry and sheltered canopy on the street side.
    box('Ground-floor lobby glazing',[.05,2.6,5.2],[x+w/2+.16,-4.58,z],glass,city,0);
    box('Entrance canopy',[2.2,.16,5.8],[x+w/2+.9,-2.97,z],facade,city,.025);
    for(const dz of [-1.1,1.1])add('Lobby door stiles',[.08,2.6,.05],[x+w/2+.22,-4.58,z+dz],metal);
    box('Entrance approach paving',[Math.max(1,-18.6-(x+w/2)),.08,5.6],[(x+w/2-18.6)/2,-5.9,z],paving,city,0);
  });

  // Avenue trees: real branched trunks and hundreds of individually oriented leaf surfaces.
  const treeLeaves=new THREE.MeshStandardMaterial({name:'City / varied live leaves',color:'#728351',roughness:.85,side:THREE.DoubleSide});
  const leafGeo=new THREE.SphereGeometry(1,5,3),trees=[];
  function branch(parent,a,b,r){const delta=b.clone().sub(a),o=mesh('Tree branch',new THREE.CylinderGeometry(r*.55,r,delta.length(),7),bark,a.clone().add(b).multiplyScalar(.5).toArray(),parent);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());}
  for(let i=0;i<12;i++){
    const z=-59+i*11.3;if(z>2&&z<19)continue;
    const x=i%2?-7.05:-17.05,g=new THREE.Group();g.name='Street tree';g.position.set(x,-5.85,z);city.add(g);
    box('Tree planting bed',[1.55,.05,2.4],[0,-.01,0],soil,g,.08);
    const height=4.3+random()*.8;branch(g,new THREE.Vector3(),new THREE.Vector3(.06,height*.75,0),.10);
    const crown=new THREE.Group();crown.name='Street tree canopy';g.add(crown);
    const centers=[];
    for(let j=0;j<7;j++){const a=j*2.399+random()*.5,center=new THREE.Vector3(Math.cos(a)*(.55+random()*.45),height-.8+random()*.7,Math.sin(a)*(.55+random()*.4));centers.push(center);branch(crown,new THREE.Vector3(.04,1.8+j*.12,0),center,.035);}
    const leaves=new THREE.InstancedMesh(leafGeo,treeLeaves,420);leaves.name='Street tree individual leaves';
    for(let k=0;k<420;k++){
      const center=centers[k%centers.length],radius=Math.cbrt(random()),az=random()*Math.PI*2,el=Math.acos(2*random()-1);
      const p=center.clone().add(new THREE.Vector3(Math.sin(el)*Math.cos(az)*.85,Math.cos(el)*.8,Math.sin(el)*Math.sin(az)*.85).multiplyScalar(radius));
      const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(random()*3,random()*6,random()*3));
      matrix.compose(p,q,new THREE.Vector3(.10+random()*.08,.015,.20+random()*.1));leaves.setMatrixAt(k,matrix);leaves.setColorAt(k,new THREE.Color().setHSL(.19+random()*.065,.25+random()*.15,.38+random()*.16));
    }
    crown.add(leaves);trees.push({crown,phase:i*1.9});
    for(const zz of [-1.28,1.28])add('Tree bed edging',[1.7,.13,.1],[x,-5.8,z+zz],concrete);
  }
  // Street furniture scaled for people, placed outside the clear walking routes.
  for(const z of [-25,-3,25,47]){
    box('Bench supports',[.46,.4,1.45],[-17.1,-5.65,z],metal,city,.025);
    for(let s=0;s<4;s++)add('Bench timber slats',[.11,.055,1.6],[-17.31+s*.14,-5.42,z],material('City / bench timber','#a79576',.8));
    box('Street litter bin',[.42,.78,.42],[-17.2,-5.46,z+2],metal,city,.04);
    const pole=mesh('Street lamp pole',new THREE.CylinderGeometry(.035,.07,5,10),metal,[-16.8,-3.35,z+4],city);
    box('Street lamp arm',[1.4,.07,.09],[-16.15,-.88,z+4],metal,city,.025);
    box('Street lamp housing',[.65,.09,.28],[-15.55,-.94,z+4],metal,city,.04);
  }

  const cars=[];
  const vehicleGlass=new THREE.MeshPhysicalMaterial({name:'City / tinted vehicle windows',color:'#405965',roughness:.24,metalness:.12,clearcoat:.35,envMapIntensity:.45});
  const cabinGeometry=new THREE.BufferGeometry();
  cabinGeometry.setAttribute('position',new THREE.Float32BufferAttribute([-.79,.85,-1.25,.79,.85,-1.25,.79,.85,1.2,-.79,.85,1.2,-.67,1.42,-.84,.67,1.42,-.84,.67,1.42,.65,-.67,1.42,.65],3));
  cabinGeometry.setIndex([0,4,5,0,5,1,1,5,6,1,6,2,2,6,7,2,7,3,3,7,4,3,4,0,4,7,6,4,6,5]);cabinGeometry.computeVertexNormals();
  for(let i=0;i<8;i++){
    const g=new THREE.Group();g.name='Distant moving vehicle';city.add(g);
    const paint=new THREE.MeshPhysicalMaterial({name:'City / vehicle paint',color:['#d8dcd8','#667e8c','#9b9e9b','#36546a','#b5ab99'][i%5],metalness:.05,roughness:.35,clearcoat:.5,envMapIntensity:.6});
    box('Vehicle body / 1.82 × 4.45 m',[1.82,.58,4.45],[0,.62,0],paint,g,.22);
    mesh('Sloped windscreen and tapered cabin',cabinGeometry,vehicleGlass,[0,0,0],g);
    box('Painted roof',[1.38,.06,1.55],[0,1.44,-.1],paint,g,.045);
    for(const x of [-.918,.918]){box('Door beltline',[.018,.025,2.7],[x,.85,-.1],metal,g,.005);for(const z of [-.65,.6])box('Door handle',[.025,.04,.2],[x,.77,z],metal,g,.01);}
    for(const x of [-.81,.81])for(const z of [-.92,.48])box('Vehicle window pillar',[.06,.54,.07],[x,1.12,z],paint,g,.015);
    for(const x of [-.94,.94])box('Side mirror',[.20,.13,.25],[x,1.12,.72],paint,g,.045);
    const wheels=[];
    for(const x of [-.87,.87])for(const z of [-1.42,1.42]){
      const wheel=mesh('Vehicle wheel',new THREE.CylinderGeometry(.32,.32,.19,20),rubber,[x,.32,z],g);wheel.rotation.z=Math.PI/2;wheels.push(wheel);
      const hub=mesh('Alloy wheel hub',new THREE.CylinderGeometry(.20,.20,.20,16),metal,[x,.32,z],g);hub.rotation.z=Math.PI/2;
    }
    for(const x of [-.62,.62]){
      box('Headlight',[.43,.12,.045],[x,.72,2.23],material('City / headlight','#e0e5df',.3),g,.02);
      box('Tail light',[.4,.12,.045],[x,.72,-2.23],material('City / tail light','#a66c62',.4),g,.02);
    }
    box('Front grille',[.8,.15,.04],[0,.51,2.23],rubber,g,.015);
    const dir=i%2?1:-1;g.rotation.y=dir===1?0:Math.PI;g.position.set(-12+dir*1.65,-5.99,0);
    cars.push({g,wheels,dir,offset:Math.floor(i/2)*38+(dir===1?7:0),speed:dir===1?4.5:5.2});
  }
  const walkers=[];
  const skin=material('City / pedestrian skin','#b4977c',.9),trousers=material('City / pedestrian trousers','#4b5964',.9);
  for(let i=0;i<9;i++){
    const g=new THREE.Group();g.name='Distant sidewalk pedestrian';city.add(g);
    const outfit=material('City / pedestrian coat',['#687e8b','#a49c88','#4d6578','#b7b4a5'][i%4],.94);
    const head=mesh('Pedestrian head',new THREE.SphereGeometry(.115,10,8),skin,[0,1.57,0],g);head.scale.y=1.12;
    box('Pedestrian torso',[.35,.52,.23],[0,1.17,0],outfit,g,.09);
    const limbs=[];
    for(const side of [-1,1]){
      const leg=new THREE.Group();leg.position.set(side*.095,.94,0);g.add(leg);mesh('Walking leg',new THREE.CapsuleGeometry(.065,.70,3,6),trousers,[0,-.42,0],leg);box('Walking shoe',[.14,.10,.26],[0,-.87,.055],rubber,leg,.025);limbs.push({pivot:leg,side,amount:.32});
      const arm=new THREE.Group();arm.position.set(side*.22,1.39,0);g.add(arm);mesh('Walking arm',new THREE.CapsuleGeometry(.05,.42,3,6),outfit,[0,-.23,0],arm);limbs.push({pivot:arm,side:-side,amount:.23});
    }
    const dir=i%2?1:-1;g.rotation.y=dir===1?0:Math.PI;g.position.set(i%3?-18.03:-6.12,-5.86,0);
    // Walk on one continuous sidewalk segment; do not wander into active traffic.
    walkers.push({g,limbs,dir,phase:i*.7,offset:[58,51,34,43,60,9,22,4,56][i],speed:.75+(i%3)*.12});
  }
  flush();
  return {cars,walkers,trees,buildings,occupants,animate(t,strength=1){
    const time=t*strength;
    cars.forEach(({g,wheels,dir,offset,speed})=>{g.position.z=dir*((time*speed+offset)%152-76);wheels.forEach(w=>w.rotation.x=-time*speed/.32);});
    walkers.forEach(({g,limbs,dir,phase,offset,speed})=>{g.position.z=-66+((time*speed+offset)%64);if(dir<0)g.position.z=-4-((time*speed+offset)%64);limbs.forEach(({pivot,side,amount})=>pivot.rotation.x=Math.sin(time*5+phase)*amount*side);});
    trees.forEach(({crown,phase})=>{crown.rotation.z=Math.sin(time*.48+phase)*.007;crown.rotation.x=Math.sin(time*.37+phase)*.006;});
    occupants.forEach(({person,z,phase})=>person.position.z=z+Math.sin(time*.13+phase)*.18);
  }};
}
