// Art-directed realtime lighting, not calibrated lux/temperature or path tracing.
// Baseline reproduces the 18ca935 rig for same-camera comparisons.
export function createLightingController({scene,renderer,root,lights,materials}) {
  const lightBaseline=Object.fromEntries(Object.entries(lights).map(([name,l])=>[name,{intensity:l.intensity,color:l.color.clone()}]));
  const fields=['roughness','metalness','clearcoat','clearcoatRoughness','sheen','sheenRoughness'];
  const materialBaseline=Object.fromEntries(Object.entries(materials).map(([name,m])=>[name,{...Object.fromEntries(fields.filter(k=>m[k]!==undefined).map(k=>[k,m[k]])),normalScale:m.normalScale?.clone()}]));
  const environment=scene.environmentIntensity,shadowType=renderer.shadowMap.type;
  const shadowRadius=lights.daylight.shadow.radius,shadowIntensity=lights.daylight.shadow.intensity;
  let current='baseline';
  const light=(name,intensity,color)=>{const l=lights[name];if(!l)return;l.intensity=intensity;if(color)l.color.set(color);};
  function apply(name='daylight') {
    if(!['baseline','daylight'].includes(name))throw new Error('Unknown lighting preset: '+name);
    for(const [key,b] of Object.entries(lightBaseline)){lights[key].intensity=b.intensity;lights[key].color.copy(b.color);}
    for(const [key,b] of Object.entries(materialBaseline)){const m=materials[key];for(const field of fields)if(b[field]!==undefined)m[field]=b[field];if(b.normalScale)m.normalScale.copy(b.normalScale);}
    scene.environmentIntensity=environment;renderer.shadowMap.type=shadowType;
    lights.daylight.shadow.radius=shadowRadius;lights.daylight.shadow.intensity=shadowIntensity;
    if(name==='daylight'){
      scene.environmentIntensity=.48;
      light('daylight',1.25,'#fff9f0');
      light('Window daylight / 5600K',3.0,'#eef6ff');
      light('Ceiling bounce',.38,'#f3f5f4');
      light('Indirect room bounce',.22,'#eee5d7');
      light('Pendant / 4000K',1.5,'#fff1dc');
      light('Monitor emission',.12,'#edf6ff');
      light('task',1.4,'#fff1dc');
      // Preserve the established filter and 4096 resolution during this lighting pass.
      renderer.shadowMap.type=shadowType;lights.daylight.shadow.radius=shadowRadius;lights.daylight.shadow.intensity=.62;
      const plaster=materials['Warm white painted plaster'];plaster.normalScale.set(.065,.065);plaster.roughness=.9;
      const stone=materials['Honed ivory mineral surface'];stone.roughness=.78;stone.clearcoat=.06;stone.clearcoatRoughness=.75;
      materials['Satin anodised aluminium'].roughness=.42;
      materials['Blue architectural lacquer'].roughness=.45;
      const fabric=materials['Blue woven upholstery'];fabric.normalScale.set(.16,.16);fabric.roughness=.9;fabric.sheen=.35;fabric.sheenRoughness=.8;
      materials['Ivory keycaps'].roughness=.68;
    }
    const unique=new Set();root.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])unique.add(m);});
    unique.forEach(m=>m.needsUpdate=true);renderer.shadowMap.needsUpdate=true;current=name;
    return describe();
  }
  function describe(){return {preset:current,environmentIntensity:scene.environmentIntensity,exposure:renderer.toneMappingExposure,shadowType:renderer.shadowMap.type,shadowMapSize:lights.daylight.shadow.mapSize.toArray(),shadowRadius:lights.daylight.shadow.radius,lights:Object.fromEntries(Object.entries(lights).map(([name,l])=>[name,{intensity:l.intensity,color:'#'+l.color.getHexString()}])),limitations:['Art-directed relative values, not calibrated photometry.','RectAreaLight bounce/spill are non-shadowing approximations.','No automatic global illumination from emissive surfaces.']};}
  return {apply,describe,get preset(){return current;}};
}
