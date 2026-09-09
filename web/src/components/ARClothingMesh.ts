import * as THREE from 'three';

export type ARCategory = 'clothing' | 'home' | 'model';
export type GarmentType = 'tshirt' | 'shirt' | 'dress';

const JOINT_ORDER = ['neck', 'leftShoulder', 'rightShoulder', 'leftHip', 'rightHip'] as const;

type JointDef = {
  name: typeof JOINT_ORDER[number];
  bindPos: THREE.Vector3;
};

function getJoints(category: ARCategory): JointDef[] {
  if (category === 'home') {
    return [
      { name: 'neck', bindPos: new THREE.Vector3(0, 0.5, 0.02) },
      { name: 'leftShoulder', bindPos: new THREE.Vector3(-0.6, 0.4, 0) },
      { name: 'rightShoulder', bindPos: new THREE.Vector3(0.6, 0.4, 0) },
      { name: 'leftHip', bindPos: new THREE.Vector3(-0.6, -0.4, 0) },
      { name: 'rightHip', bindPos: new THREE.Vector3(0.6, -0.4, 0) },
    ];
  }
  if (category === 'model') {
    return [
      { name: 'neck', bindPos: new THREE.Vector3(0, 0.55, 0.02) },
      { name: 'leftShoulder', bindPos: new THREE.Vector3(-0.5, 0.45, 0) },
      { name: 'rightShoulder', bindPos: new THREE.Vector3(0.5, 0.45, 0) },
      { name: 'leftHip', bindPos: new THREE.Vector3(-0.4, -0.55, 0) },
      { name: 'rightHip', bindPos: new THREE.Vector3(0.4, -0.55, 0) },
    ];
  }
  // clothing
  return [
    { name: 'neck', bindPos: new THREE.Vector3(0, 0.6, 0.02) },
    { name: 'leftShoulder', bindPos: new THREE.Vector3(-0.55, 0.45, 0) },
    { name: 'rightShoulder', bindPos: new THREE.Vector3(0.55, 0.45, 0) },
    { name: 'leftHip', bindPos: new THREE.Vector3(-0.45, -0.55, 0) },
    { name: 'rightHip', bindPos: new THREE.Vector3(0.45, -0.55, 0) },
  ];
}

function _extrudeShape(shape: THREE.Shape, depth = 0.05): THREE.ExtrudeGeometry {
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 28,
    steps: 1,
  });
  geom.translate(0, 0, -depth / 2);
  geom.computeVertexNormals();
  return geom;
}

function normalizeUVs(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const min = box.min;
  const max = box.max;
  const w = Math.max(0.0001, max.x - min.x);
  const h = Math.max(0.0001, max.y - min.y);
  const pos = geometry.attributes.position.array as Float32Array;
  const uv = geometry.attributes.uv.array as Float32Array;
  for (let i = 0; i < pos.length; i += 3) {
    const x = pos[i];
    const y = pos[i + 1];
    const idx = (i / 3) * 2;
    uv[idx] = (x - min.x) / w;
    uv[idx + 1] = (y - min.y) / h;
  }
  return geometry;
}

function createTShirtGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const neckW = 0.22;
  const shoulderY = 0.48;
  const shoulderX = 0.38;
  const sleeveOutX = 0.78;
  const sleeveOutY = 0.3;
  const sleeveInX = 0.55;
  const sleeveInY = 0.12;
  const armpitX = 0.43;
  const armpitY = 0.12;
  const bottomX = 0.42;
  const bottomY = -0.58;

  shape.moveTo(-neckW, shoulderY);
  shape.lineTo(neckW, shoulderY);
  shape.quadraticCurveTo(0, shoulderY - 0.18, -neckW, shoulderY);
  shape.lineTo(-shoulderX, shoulderY);
  shape.lineTo(-sleeveOutX, sleeveOutY);
  shape.lineTo(-sleeveInX, sleeveInY);
  shape.lineTo(-armpitX, armpitY);
  shape.lineTo(-bottomX, bottomY);
  shape.lineTo(bottomX, bottomY);
  shape.lineTo(armpitX, armpitY);
  shape.lineTo(sleeveInX, sleeveInY);
  shape.lineTo(sleeveOutX, sleeveOutY);
  shape.lineTo(shoulderX, shoulderY);
  shape.lineTo(neckW, shoulderY);

  return normalizeUVs(_extrudeShape(shape));
}

function createShirtGeometry(): THREE.BufferGeometry {
  // 宽松长袖衬衫轮廓
  const shape = new THREE.Shape();
  const neckW = 0.22;
  const shoulderY = 0.5;
  const shoulderX = 0.42;
  const sleeveOutX = 0.9;
  const sleeveOutY = 0.15;
  const sleeveInX = 0.62;
  const sleeveInY = 0.05;
  const armpitX = 0.45;
  const armpitY = 0.05;
  const bottomX = 0.44;
  const bottomY = -0.72;

  shape.moveTo(-neckW, shoulderY);
  shape.lineTo(neckW, shoulderY);
  shape.quadraticCurveTo(0, shoulderY - 0.18, -neckW, shoulderY);
  shape.lineTo(-shoulderX, shoulderY);
  shape.lineTo(-sleeveOutX, sleeveOutY);
  shape.lineTo(-sleeveInX, sleeveInY);
  shape.lineTo(-armpitX, armpitY);
  shape.lineTo(-bottomX, bottomY);
  shape.lineTo(bottomX, bottomY);
  shape.lineTo(armpitX, armpitY);
  shape.lineTo(sleeveInX, sleeveInY);
  shape.lineTo(sleeveOutX, sleeveOutY);
  shape.lineTo(shoulderX, shoulderY);
  shape.lineTo(neckW, shoulderY);

  return normalizeUVs(_extrudeShape(shape));
}

function createDressGeometry(): THREE.BufferGeometry {
  // 无袖连衣裙：肩部到裙摆梯形
  const shape = new THREE.Shape();
  const neckW = 0.24;
  const shoulderY = 0.5;
  const shoulderX = 0.4;
  const bottomX = 0.62;
  const bottomY = -0.95;

  shape.moveTo(-neckW, shoulderY);
  shape.lineTo(neckW, shoulderY);
  shape.quadraticCurveTo(0, shoulderY - 0.22, -neckW, shoulderY);
  shape.lineTo(-shoulderX, shoulderY);
  shape.lineTo(-bottomX, bottomY);
  shape.lineTo(bottomX, bottomY);
  shape.lineTo(shoulderX, shoulderY);
  shape.lineTo(neckW, shoulderY);

  return normalizeUVs(_extrudeShape(shape));
}

function createPillowGeometry(): THREE.BoxGeometry {
  const geom = new THREE.BoxGeometry(1.3, 0.7, 0.18, 16, 10, 2);
  const pos = geom.attributes.position.array as Float32Array;
  for (let i = 0; i < pos.length; i += 3) {
    const x = pos[i];
    const y = pos[i + 1];
    const absX = Math.abs(x);
    const absY = Math.abs(y);
    const corner = Math.max(absX - 0.45, absY - 0.15);
    if (corner > 0) {
      const factor = 1 - corner * 0.35;
      pos[i + 2] *= factor;
    }
  }
  geom.computeVertexNormals();
  return geom;
}

function createSashGeometry(): THREE.PlaneGeometry {
  const geom = new THREE.PlaneGeometry(0.55, 1.7, 12, 32);
  const pos = geom.attributes.position.array as Float32Array;
  for (let i = 0; i < pos.length; i += 3) {
    const x = pos[i];
    const y = pos[i + 1];
    pos[i] = x + Math.sin((y + 0.85) * 1.8) * 0.08;
    const t = Math.abs(y) / 0.85;
    const taper = 1 - Math.pow(t, 2) * 0.35;
    pos[i] *= taper;
  }
  geom.computeVertexNormals();
  return geom;
}

function assignSkinWeights(geometry: THREE.BufferGeometry, joints: JointDef[]) {
  const posAttr = geometry.attributes.position;
  const count = posAttr.count;
  const skinIndex = new Uint16Array(count * 4);
  const skinWeight = new Float32Array(count * 4);

  for (let i = 0; i < count; i++) {
    const vx = posAttr.getX(i);
    const vy = posAttr.getY(i);
    const vz = posAttr.getZ(i);

    const scored = joints.map((j, idx) => {
      const d = Math.hypot(vx - j.bindPos.x, vy - j.bindPos.y, vz - j.bindPos.z);
      return { idx, d };
    }).sort((a, b) => a.d - b.d);

    const nearest = scored.slice(0, 2);
    const w0 = 1 / (nearest[0].d + 0.001);
    const w1 = 1 / (nearest[1].d + 0.001);
    const total = w0 + w1;

    skinIndex[i * 4] = nearest[0].idx;
    skinIndex[i * 4 + 1] = nearest[1].idx;
    skinIndex[i * 4 + 2] = 0;
    skinIndex[i * 4 + 3] = 0;
    skinWeight[i * 4] = w0 / total;
    skinWeight[i * 4 + 1] = w1 / total;
    skinWeight[i * 4 + 2] = 0;
    skinWeight[i * 4 + 3] = 0;
  }

  geometry.setAttribute('skinIndex', new THREE.BufferAttribute(skinIndex, 4));
  geometry.setAttribute('skinWeight', new THREE.BufferAttribute(skinWeight, 4));
}

function createMaterial(texture: THREE.Texture): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    opacity: 0.98,
    side: THREE.DoubleSide,
    roughness: 0.55,
    metalness: 0.05,
  });
}

/** 将衣物裁剪到屏幕空间的人体蒙版（selfie segmentation 或躯干多边形） */
export function applyScreenSpaceMask(
  mesh: THREE.SkinnedMesh,
  maskTexture: THREE.Texture,
  resolution: THREE.Vector2,
  threshold = 0.32
) {
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  materials.forEach((mat) => {
    if (!(mat instanceof THREE.MeshStandardMaterial)) return;
    mat.transparent = true;
    mat.depthTest = false;
    mat.depthWrite = false;
    mat.side = THREE.DoubleSide;
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.maskTexture = { value: maskTexture };
      shader.uniforms.resolution = { value: resolution };
      shader.fragmentShader = `
        uniform sampler2D maskTexture;
        uniform vec2 resolution;
      ` + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        vec2 _screenUv = vec2(gl_FragCoord.x / resolution.x, 1.0 - (gl_FragCoord.y / resolution.y));
        float _bodyMask = texture2D(maskTexture, _screenUv).r;
        if (_bodyMask < 0.32) discard;
        diffuseColor.a *= smoothstep(0.32, 0.37, _bodyMask);
        `
      );
    };
    mat.customProgramCacheKey = () => `ssm-${maskTexture.uuid}-${resolution.x}-${resolution.y}-${threshold}`;
    mat.needsUpdate = true;
  });
}

export function createSkinnedGarment(
  category: ARCategory,
  garmentType: GarmentType,
  texture: THREE.Texture
): THREE.SkinnedMesh {
  const joints = getJoints(category);

  let geometry: THREE.BufferGeometry;
  if (category === 'home') geometry = createPillowGeometry();
  else if (category === 'model') geometry = createSashGeometry();
  else if (garmentType === 'shirt') geometry = createShirtGeometry();
  else if (garmentType === 'dress') geometry = createDressGeometry();
  else geometry = createTShirtGeometry();

  assignSkinWeights(geometry, joints);

  const bones = joints.map((j) => {
    const bone = new THREE.Bone();
    bone.position.copy(j.bindPos);
    bone.name = j.name;
    return bone;
  });

  const skeleton = new THREE.Skeleton(bones);
  const material = createMaterial(texture);

  const mesh = new THREE.SkinnedMesh(geometry, material);
  mesh.add(bones[0]);
  bones[0].add(bones[1]);
  bones[0].add(bones[2]);
  bones[0].add(bones[3]);
  bones[0].add(bones[4]);
  mesh.bind(skeleton);
  mesh.visible = false;

  return mesh;
}

export function createSkinnedClothing(category: ARCategory, texture: THREE.Texture): THREE.SkinnedMesh {
  return createSkinnedGarment(category, 'tshirt', texture);
}

export function createSkinnedClothingFromGeometry(
  geometry: THREE.BufferGeometry,
  sourceMatrix: THREE.Matrix4,
  texture: THREE.Texture,
): THREE.SkinnedMesh {
  const geom = geometry.clone();
  geom.applyMatrix4(sourceMatrix);
  geom.computeBoundingBox();
  const box = geom.boundingBox!;
  const min = box.min;
  const max = box.max;
  const cx = (min.x + max.x) / 2;
  const cy = (min.y + max.y) / 2;
  const height = Math.max(0.001, max.y - min.y);
  const scale = 1.0 / height;
  geom.translate(-cx, -cy, 0);
  geom.scale(scale, scale, scale);
  normalizeUVs(geom);
  geom.computeVertexNormals();

  const joints: JointDef[] = [
    { name: 'neck', bindPos: new THREE.Vector3(0, 0.5, 0.02) },
    { name: 'leftShoulder', bindPos: new THREE.Vector3(-0.5, 0.4, 0) },
    { name: 'rightShoulder', bindPos: new THREE.Vector3(0.5, 0.4, 0) },
    { name: 'leftHip', bindPos: new THREE.Vector3(-0.35, -0.45, 0) },
    { name: 'rightHip', bindPos: new THREE.Vector3(0.35, -0.45, 0) },
  ];

  assignSkinWeights(geom, joints);

  const bones = joints.map((j) => {
    const bone = new THREE.Bone();
    bone.position.copy(j.bindPos);
    bone.name = j.name;
    return bone;
  });

  const skeleton = new THREE.Skeleton(bones);
  const material = createMaterial(texture);

  const mesh = new THREE.SkinnedMesh(geom, material);
  mesh.add(bones[0]);
  bones[0].add(bones[1]);
  bones[0].add(bones[2]);
  bones[0].add(bones[3]);
  bones[0].add(bones[4]);
  mesh.bind(skeleton);
  mesh.visible = false;
  return mesh;
}

export function updateClothingPose(
  mesh: THREE.Object3D,
  bones: THREE.Bone[],
  landmarks: any[],
  videoAspect: number
) {
  const ls = landmarks[11];
  const rs = landmarks[12];
  const lh = landmarks[23];
  const rh = landmarks[24];

  const shoulderCxSrc = (ls.x + rs.x) / 2;
  const shoulderCySrc = (ls.y + rs.y) / 2;
  const shoulderWidth = Math.max(0.001, Math.abs(rs.x - ls.x));
  const hipCySrc = (lh.y + rh.y) / 2;
  const hipWidth = Math.abs(rh.x - lh.x);

  const shoulderCx = shoulderCxSrc;
  const shoulderCy = shoulderCySrc;

  // 位置映射到 NDC 空间，与肩膀中心对齐
  mesh.position.set((shoulderCx - 0.5) * 10, -(shoulderCy - 0.5) * 10 * videoAspect, 0);
  // x 按肩宽缩放，y 按躯干长度缩放，确保覆盖整个躯干
  const torsoHeight = Math.max(0.001, shoulderCy - hipCySrc);
  mesh.scale.set(shoulderWidth * 13, torsoHeight * 13 * videoAspect, shoulderWidth * 13);

  const shoulderSlope = Math.atan2(
    rs.y - ls.y,
    rs.x - ls.x
  );
  mesh.rotation.z = shoulderSlope;

  bones[0].position.set(0, 0.12, 0.02);
  bones[1].position.set(-0.5, (shoulderCy - ls.y) / shoulderWidth, 0);
  bones[2].position.set(0.5, (shoulderCy - rs.y) / shoulderWidth, 0);
  bones[3].position.set(-(hipWidth / shoulderWidth) / 2, (shoulderCy - hipCySrc) / shoulderWidth, 0);
  bones[4].position.set((hipWidth / shoulderWidth) / 2, (shoulderCy - hipCySrc) / shoulderWidth, 0);

  bones.forEach((b) => b.updateMatrixWorld());
  (mesh as THREE.SkinnedMesh).skeleton?.update();
}
