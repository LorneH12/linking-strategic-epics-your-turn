import * as THREE from 'three';
import { buildDistrict } from './district.js';

// A fictional, dimensional city outside the west-facing glazing.
// Clouds remain transparent layered cards; the street and all visible buildings are geometry.
export function buildCity({root,box,mesh,plane,materials}){
 const city=new THREE.Group();city.name='Fictional city / animated background';root.add(city);
 const district=buildDistrict({city,box,mesh});
 // Transparent procedural cloud map, softly layered; no baked room background.
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const c=canvas.getContext('2d');
 let seed=107;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
 for(let i=0;i<85;i++){const x=140+random()*740,y=210+(random()-.5)*135,r=40+random()*100;const gr=c.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(255,255,255,.17)');gr.addColorStop(.55,'rgba(255,255,255,.09)');gr.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=gr;c.fillRect(x-r,y-r,r*2,r*2);}
 const cloudMap=new THREE.CanvasTexture(canvas);cloudMap.colorSpace=THREE.SRGBColorSpace;const cloudMaterial=new THREE.MeshBasicMaterial({map:cloudMap,transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
 const clouds=[];
 for(let i=0;i<6;i++){const p=plane('Drifting cloud layer',24+i*3,12+i,[ -65-i*8,14+(i%3)*6,-45+i*19],cloudMaterial,city);p.rotation.y=Math.PI/2;p.castShadow=false;clouds.push({p,z:p.position.z,speed:.035+i*.009});}
 const birds=[];const birdMat=new THREE.MeshStandardMaterial({color:'#647b87',roughness:1,side:THREE.DoubleSide});
 for(let i=0;i<3;i++){const g=new THREE.Group();g.name='Distant bird';const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,.26,.04,.035,.08,0,-.12],3));geo.computeVertexNormals();const a=mesh('Bird wing',geo,birdMat,[0,0,0],g),b=mesh('Bird wing',geo.clone(),birdMat,[0,0,0],g);b.scale.x=-1;city.add(g);birds.push({g,a,b,phase:i*1.4});}
 return {city,district,animate(t,strength=1){
  clouds.forEach(({p,z,speed})=>p.position.z=z+((t*speed)%30)*strength);
  district.animate(t,strength);

  birds.forEach(({g,a,b,phase},i)=>{const progress=(t+phase*4)%65;g.visible=strength>0&&progress<19;g.position.set(-31-i*2,8+i*.35+Math.sin(t*.6+phase)*.15,-19+progress*2);a.rotation.z=Math.sin(t*4+phase)*.4;b.rotation.z=-a.rotation.z;});
 }};
}
