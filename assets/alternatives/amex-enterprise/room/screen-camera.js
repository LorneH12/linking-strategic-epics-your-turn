import * as THREE from 'three';

const ease=t=>t*t*t*(t*(t*6-15)+10);

// Recompute from the actual screen plane: includes the laptop hinge and yaw.
export function screenFrame(root, name, aspect) {
  const mesh=root.getObjectByName(name==='laptop'?'Jira screen socket':'Targetprocess screen socket');
  root.updateMatrixWorld(true);
  const center=mesh.getWorldPosition(new THREE.Vector3());
  const rotation=mesh.getWorldQuaternion(new THREE.Quaternion());
  const normal=new THREE.Vector3(0,0,1).applyQuaternion(rotation);
  const scale=mesh.getWorldScale(new THREE.Vector3());
  const width=mesh.geometry.parameters.width*scale.x, height=mesh.geometry.parameters.height*scale.y;
  const fov=38, distance=Math.max(height,width/aspect)/(2*Math.tan(THREE.MathUtils.degToRad(fov/2)))*1.025;
  return {center,rotation,normal,width,height,fov,position:center.clone().addScaledVector(normal,distance)};
}

export function planScreenFlight(root,camera,name) {
  const frame=screenFrame(root,name,camera.aspect), start=camera.position.clone();
  const boxes=[];
  root.traverse(o=>{
    if(!o.isMesh||o.isInstancedMesh||!o.visible)return;
    o.geometry.computeBoundingBox();
    const b=o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld).expandByScalar(.035);
    // Only nearby room geometry participates. An already intersecting start must be escapable.
    if(b.max.x < -4.2||b.min.x>4.2||b.max.z < -3.7||b.min.z>4.6||b.containsPoint(start))return;
    boxes.push(b);
  });
  const ray=new THREE.Ray(), hit=new THREE.Vector3();
  const clear=(a,b)=>{
    const length=a.distanceTo(b);if(length<1e-7)return true;
    ray.set(a,b.clone().sub(a).divideScalar(length));
    return !boxes.some(box=>box.containsPoint(a)||box.containsPoint(b)||(ray.intersectBox(box,hit)&&a.distanceTo(hit)<length));
  };
  // A visibility graph chooses direct travel when clear, or an aisle/over-desk route.
  const nodes=[start,frame.position,frame.center.clone().addScaledVector(frame.normal,1.15)];
  for(const y of [1.8,2.35,2.95])for(const x of [-2.8,-1.4,0,1.4,2.8])for(const z of [-2, .8,2.6]){
    const p=new THREE.Vector3(x,y,z);if(!boxes.some(b=>b.containsPoint(p)))nodes.push(p);
  }
  const distances=nodes.map(()=>Infinity),previous=[],visited=new Set();distances[0]=0;
  while(visited.size<nodes.length){
    let u=-1;for(let i=0;i<nodes.length;i++)if(!visited.has(i)&&(u<0||distances[i]<distances[u]))u=i;
    if(u<0||!Number.isFinite(distances[u]))break;if(u===1)break;visited.add(u);
    for(let v=0;v<nodes.length;v++)if(!visited.has(v)&&clear(nodes[u],nodes[v])){
      const cost=distances[u]+nodes[u].distanceTo(nodes[v]);
      if(cost<distances[v]){distances[v]=cost;previous[v]=u;}
    }
  }
  if(!Number.isFinite(distances[1]))throw new Error('Move the camera into the room, then select the screen again.');
  const points=[];for(let i=1;i!==undefined;i=previous[i])points.unshift(nodes[i]);
  // Round each bend only as far as the room permits, never cut through a desk/device.
  const path=new THREE.CurvePath();let cursor=points[0];
  for(let i=1;i<points.length-1;i++){
    const a=points[i-1],b=points[i],c=points[i+1];let curve=null,entry=b,exit=b;
    for(const radius of [.5,.25,.1,.03]){
      const r=Math.min(radius,a.distanceTo(b)*.3,b.distanceTo(c)*.3);
      entry=b.clone().lerp(a,r/b.distanceTo(a));exit=b.clone().lerp(c,r/b.distanceTo(c));
      const candidate=new THREE.QuadraticBezierCurve3(entry,b,exit),samples=candidate.getPoints(24);
      if(samples.slice(1).every((p,j)=>clear(samples[j],p))){curve=candidate;break;}
    }
    if(curve){path.add(new THREE.LineCurve3(cursor,entry));path.add(curve);cursor=exit;}
    else{path.add(new THREE.LineCurve3(cursor,b));cursor=b;}
  }
  path.add(new THREE.LineCurve3(cursor,frame.position));
  const fromRotation=camera.quaternion.clone(),fromFov=camera.fov;
  const length=path.getLength(),duration=THREE.MathUtils.clamp(1.8+length*.65,2,6.5);
  return {name,frame,path,duration,clear, sample(t){
    t=THREE.MathUtils.clamp(t,0,1);const e=ease(t),position=length<1e-7?frame.position.clone():path.getPointAt(e);
    const look=new THREE.Matrix4().lookAt(position,frame.center,new THREE.Vector3(0,1,0));
    const rotation=new THREE.Quaternion().setFromRotationMatrix(look);
    rotation.slerp(frame.rotation,ease(Math.max(0,(t-.65)/.35)));
    rotation.copy(fromRotation.clone().slerp(rotation,ease(Math.min(1,t/.45))));
    return {position,rotation,fov:THREE.MathUtils.lerp(fromFov,frame.fov,e)};
  }};
}
