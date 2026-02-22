// Hungarian Game Babylon.js Scene Module
// Converted 1:1 from original HTML

import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import { gsap } from 'gsap';
import { COURIERS, ORDERS, Courier, Order, IS_MOBILE, COURIER_SCALE, COURIER_HEIGHT } from './types';

export interface CourierMesh extends BABYLON.TransformNode {
  courierId: number;
  originalX: number;
  originalZ: number;
  ringMat: BABYLON.StandardMaterial | null;
}

export interface SceneRefs {
  scene: BABYLON.Scene;
  engine: BABYLON.Engine;
  advancedTexture: GUI.AdvancedDynamicTexture;
  courierMeshes: CourierMesh[];
  assignmentLines: Record<string, BABYLON.Mesh>;
}

export function createHungarianScene(canvas: HTMLCanvasElement): SceneRefs {
  const engine = new BABYLON.Engine(canvas, true, {
    antialias: true,
    stencil: true
  });
  engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 2));

  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.91, 0.94, 0.97, 1);

  // GUI - set idealWidth/idealHeight for consistent label sizing across DPI
  const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');
  advancedTexture.idealWidth = 1920;
  advancedTexture.idealHeight = 1080;
  advancedTexture.renderAtIdealSize = true;

  // Camera - from original HTML
  const isMobile = IS_MOBILE;
  const camRadius = isMobile ? 95 : 100;
  const camBeta = isMobile ? Math.PI / 4.2 : Math.PI / 3.5;
  const camAlpha = -Math.PI / 2;

  const camera = new BABYLON.ArcRotateCamera('cam', camAlpha, camBeta, camRadius, new BABYLON.Vector3(0, 0, 0), scene);
  camera.attachControl(canvas, false);
  camera.inputs.clear();
  camera.lowerRadiusLimit = camRadius;
  camera.upperRadiusLimit = camRadius;

  // Lighting - from original HTML
  const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.6;
  hemi.groundColor = new BABYLON.Color3(0.75, 0.78, 0.85);

  const sun = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-0.5, -1, 0.3), scene);
  sun.position = new BABYLON.Vector3(50, 70, -50);
  sun.intensity = 0.8;

  const shadowGen = new BABYLON.ShadowGenerator(2048, sun);
  shadowGen.useBlurExponentialShadowMap = true;
  shadowGen.blurKernel = 32;
  shadowGen.darkness = 0.15;

  // Ground - from original HTML
  const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 120, height: 120 }, scene);
  const groundMat = new BABYLON.StandardMaterial('groundMat', scene);
  groundMat.diffuseColor = new BABYLON.Color3(0.9, 0.92, 0.94);
  ground.material = groundMat;
  ground.receiveShadows = true;

  // Create roads
  createRoads(scene);

  // Create environment (trees, street lights)
  createEnvironment(scene, shadowGen);

  // Create couriers
  const courierMeshes: CourierMesh[] = [];
  COURIERS.forEach(c => {
    courierMeshes.push(createCourier(scene, c, shadowGen, advancedTexture));
  });

  // Create restaurants and houses
  ORDERS.forEach(o => {
    createRestaurant(scene, o, shadowGen, advancedTexture);
    createHouse(scene, o, shadowGen, advancedTexture);
  });

  return {
    scene,
    engine,
    advancedTexture,
    courierMeshes,
    assignmentLines: {}
  };
}

function createRoads(scene: BABYLON.Scene): void {
  const roadMat = new BABYLON.StandardMaterial('roadMat', scene);
  roadMat.diffuseColor = new BABYLON.Color3(0.38, 0.4, 0.45);

  const lineMat = new BABYLON.StandardMaterial('lineMat', scene);
  lineMat.diffuseColor = new BABYLON.Color3(1, 0.95, 0.4);
  lineMat.emissiveColor = new BABYLON.Color3(0.15, 0.14, 0.05);

  // Roads in grid pattern - from original HTML
  for (let i = -40; i <= 40; i += 20) {
    const rH = BABYLON.MeshBuilder.CreateBox('rH' + i, { width: 120, height: 0.05, depth: 8 }, scene);
    rH.position.set(0, 0.025, i);
    rH.material = roadMat;

    const rV = BABYLON.MeshBuilder.CreateBox('rV' + i, { width: 8, height: 0.05, depth: 120 }, scene);
    rV.position.set(i, 0.025, 0);
    rV.material = roadMat;

    // Road markings
    for (let j = -55; j <= 55; j += 5) {
      const lH = BABYLON.MeshBuilder.CreateBox('lH', { width: 3.5, height: 0.06, depth: 0.25 }, scene);
      lH.position.set(j, 0.06, i);
      lH.material = lineMat;

      const lV = BABYLON.MeshBuilder.CreateBox('lV', { width: 0.25, height: 0.06, depth: 3.5 }, scene);
      lV.position.set(i, 0.06, j);
      lV.material = lineMat;
    }
  }
}

function createEnvironment(scene: BABYLON.Scene, shadowGen: BABYLON.ShadowGenerator): void {
  // Trees - from original HTML
  const treePositions: [number, number][] = [
    [-50, -45], [50, -45], [-50, 45], [50, 45],
    [-55, 0], [55, 0], [0, -50], [0, 50]
  ];
  treePositions.forEach(pos => createTree(scene, pos[0], pos[1], shadowGen));

  // Street lights - from original HTML
  const lightPositions: [number, number][] = [
    [-35, -35], [35, -35], [-35, 35], [35, 35],
    [-35, 0], [35, 0], [0, -35], [0, 35]
  ];
  lightPositions.forEach(pos => createStreetLight(scene, pos[0], pos[1]));
}

function createTree(scene: BABYLON.Scene, x: number, z: number, shadowGen: BABYLON.ShadowGenerator): void {
  const trunk = BABYLON.MeshBuilder.CreateCylinder('trunk', { height: 3.5, diameter: 0.9 }, scene);
  trunk.position.set(x, 1.75, z);
  const trunkMat = new BABYLON.StandardMaterial('trunkMat', scene);
  trunkMat.diffuseColor = new BABYLON.Color3(0.5, 0.35, 0.18);
  trunk.material = trunkMat;
  shadowGen.addShadowCaster(trunk);

  const leaves = BABYLON.MeshBuilder.CreateSphere('leaves', { diameter: 6, segments: 8 }, scene);
  leaves.position.set(x, 5.5, z);
  leaves.scaling.y = 1.2;
  const leavesMat = new BABYLON.StandardMaterial('leavesMat', scene);
  leavesMat.diffuseColor = new BABYLON.Color3(0.35, 0.72, 0.38);
  leaves.material = leavesMat;
  shadowGen.addShadowCaster(leaves);
}

function createStreetLight(scene: BABYLON.Scene, x: number, z: number): void {
  const poleMat = new BABYLON.StandardMaterial('poleMat', scene);
  poleMat.diffuseColor = new BABYLON.Color3(0.28, 0.28, 0.32);

  const pole = BABYLON.MeshBuilder.CreateCylinder('pole', { height: 9, diameter: 0.4 }, scene);
  pole.position.set(x, 4.5, z);
  pole.material = poleMat;

  const arm = BABYLON.MeshBuilder.CreateBox('arm', { width: 3, height: 0.25, depth: 0.25 }, scene);
  arm.position.set(x + 1.5, 9, z);
  arm.material = poleMat;

  const bulb = BABYLON.MeshBuilder.CreateSphere('bulb', { diameter: 0.7 }, scene);
  bulb.position.set(x + 3, 8.7, z);
  const bulbMat = new BABYLON.StandardMaterial('bulbMat', scene);
  bulbMat.emissiveColor = new BABYLON.Color3(1, 0.95, 0.75);
  bulb.material = bulbMat;

  const light = new BABYLON.PointLight('streetLight', new BABYLON.Vector3(x + 3, 8.5, z), scene);
  light.intensity = 0.35;
  light.range = 20;
}

function createCourier(scene: BABYLON.Scene, c: Courier, shadowGen: BABYLON.ShadowGenerator, advancedTexture: GUI.AdvancedDynamicTexture): CourierMesh {
  const S = COURIER_SCALE;
  const H = COURIER_HEIGHT;

  const parent = new BABYLON.TransformNode('courier_' + c.id, scene) as CourierMesh;
  parent.position.set(c.x, H, c.z);
  parent.courierId = c.id;
  parent.originalX = c.x;
  parent.originalZ = c.z;

  const color = BABYLON.Color3.FromHexString(c.color);
  const bodyMat = new BABYLON.StandardMaterial('bodyMat' + c.id, scene);
  bodyMat.diffuseColor = color;
  bodyMat.specularPower = 64;

  // Motorcycle body - from original HTML
  const body = BABYLON.MeshBuilder.CreateBox('body', { width: 1.1 * S, height: 0.65 * S, depth: 2.8 * S }, scene);
  body.position.y = 0.85 * S;
  body.parent = parent;
  body.material = bodyMat;
  shadowGen.addShadowCaster(body);

  // Tank
  const tank = BABYLON.MeshBuilder.CreateCylinder('tank', { diameter: 0.75 * S, height: 1.3 * S }, scene);
  tank.rotation.x = Math.PI / 2;
  tank.position.set(0, 1.05 * S, 0.45 * S);
  tank.parent = parent;
  tank.material = bodyMat;
  shadowGen.addShadowCaster(tank);

  // Seat
  const seatMat = new BABYLON.StandardMaterial('seatMat', scene);
  seatMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);

  const seat = BABYLON.MeshBuilder.CreateBox('seat', { width: 0.75 * S, height: 0.28 * S, depth: 1.1 * S }, scene);
  seat.position.set(0, 1.28 * S, -0.35 * S);
  seat.parent = parent;
  seat.material = seatMat;
  shadowGen.addShadowCaster(seat);

  // Wheels
  const wheelMat = new BABYLON.StandardMaterial('wheelMat', scene);
  wheelMat.diffuseColor = new BABYLON.Color3(0.08, 0.08, 0.08);

  const chromeMat = new BABYLON.StandardMaterial('chromeMat', scene);
  chromeMat.diffuseColor = new BABYLON.Color3(0.82, 0.82, 0.88);
  chromeMat.specularPower = 128;

  // Front wheel
  const fWheel = BABYLON.MeshBuilder.CreateTorus('fw', { diameter: 1.1 * S, thickness: 0.32 * S, tessellation: 32 }, scene);
  fWheel.rotation.z = Math.PI / 2;
  fWheel.position.set(0, 0.55 * S, 1.2 * S);
  fWheel.parent = parent;
  fWheel.material = wheelMat;
  shadowGen.addShadowCaster(fWheel);

  const fRim = BABYLON.MeshBuilder.CreateCylinder('frim', { diameter: 0.55 * S, height: 0.28 * S }, scene);
  fRim.rotation.x = Math.PI / 2;
  fRim.position.set(0, 0.55 * S, 1.2 * S);
  fRim.parent = parent;
  fRim.material = chromeMat;

  // Back wheel
  const bWheel = BABYLON.MeshBuilder.CreateTorus('bw', { diameter: 1.1 * S, thickness: 0.32 * S, tessellation: 32 }, scene);
  bWheel.rotation.z = Math.PI / 2;
  bWheel.position.set(0, 0.55 * S, -1 * S);
  bWheel.parent = parent;
  bWheel.material = wheelMat;
  shadowGen.addShadowCaster(bWheel);

  const bRim = BABYLON.MeshBuilder.CreateCylinder('brim', { diameter: 0.55 * S, height: 0.28 * S }, scene);
  bRim.rotation.x = Math.PI / 2;
  bRim.position.set(0, 0.55 * S, -1 * S);
  bRim.parent = parent;
  bRim.material = chromeMat;

  // Handlebar
  const handlebar = BABYLON.MeshBuilder.CreateCylinder('hbar', { diameter: 0.09 * S, height: 1.4 * S }, scene);
  handlebar.rotation.z = Math.PI / 2;
  handlebar.position.set(0, 1.55 * S, 1.1 * S);
  handlebar.parent = parent;
  handlebar.material = chromeMat;

  // Headlight
  const headlight = BABYLON.MeshBuilder.CreateSphere('hl', { diameter: 0.35 * S }, scene);
  headlight.position.set(0, 1.15 * S, 1.45 * S);
  headlight.parent = parent;
  const hlMat = new BABYLON.StandardMaterial('hlMat', scene);
  hlMat.emissiveColor = new BABYLON.Color3(1, 1, 0.8);
  headlight.material = hlMat;

  // Taillight
  const taillight = BABYLON.MeshBuilder.CreateBox('tl', { width: 0.55 * S, height: 0.18 * S, depth: 0.12 * S }, scene);
  taillight.position.set(0, 0.95 * S, -1.45 * S);
  taillight.parent = parent;
  const tlMat = new BABYLON.StandardMaterial('tlMat', scene);
  tlMat.emissiveColor = new BABYLON.Color3(1, 0.1, 0.1);
  taillight.material = tlMat;

  // Delivery box
  const boxMat = new BABYLON.StandardMaterial('boxMat', scene);
  boxMat.diffuseColor = new BABYLON.Color3(0.98, 0.98, 0.98);

  const deliveryBox = BABYLON.MeshBuilder.CreateBox('dbox', { width: 1.5 * S, height: 1.2 * S, depth: 1.5 * S }, scene);
  deliveryBox.position.set(0, 1.75 * S, -0.95 * S);
  deliveryBox.parent = parent;
  deliveryBox.material = boxMat;
  shadowGen.addShadowCaster(deliveryBox);

  // Selection ring - from original HTML
  const ringSize = IS_MOBILE ? 6 : 5;
  const ring = BABYLON.MeshBuilder.CreateTorus('ring', { diameter: ringSize * S, thickness: 0.3, tessellation: 64 }, scene);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.15;
  ring.parent = parent;
  const ringMat = new BABYLON.StandardMaterial('ringMat' + c.id, scene);
  ringMat.emissiveColor = color;
  ringMat.alpha = 0;
  ring.material = ringMat;
  parent.ringMat = ringMat;

  // Clickable area - invisible but larger for easier tapping
  const clickArea = BABYLON.MeshBuilder.CreateCylinder('clickArea', { diameter: 8 * S, height: 5 * S }, scene);
  clickArea.position.y = 2 * S;
  clickArea.parent = parent;
  clickArea.visibility = 0;
  clickArea.isPickable = true;
  (clickArea as any).courierId = c.id;

  // Label - from original HTML
  const labelWidth = IS_MOBILE ? '90px' : '90px';
  const labelHeight = IS_MOBILE ? '32px' : '32px';
  const fontSize = IS_MOBILE ? 15 : 16;
  const labelOffset = IS_MOBILE ? -85 : -90;

  const rect = new GUI.Rectangle();
  rect.width = labelWidth;
  rect.height = labelHeight;
  rect.cornerRadius = 16;
  rect.thickness = 0;
  rect.background = c.color;
  advancedTexture.addControl(rect);
  rect.linkWithMesh(parent);
  rect.linkOffsetY = labelOffset;

  const txt = new GUI.TextBlock();
  txt.text = c.name;
  txt.color = 'white';
  txt.fontSize = fontSize;
  txt.fontWeight = 'bold';
  txt.fontFamily = 'Heebo';
  rect.addControl(txt);

  // Idle animation - from original HTML
  let t = Math.random() * Math.PI * 2;
  scene.registerBeforeRender(() => {
    t += 0.04;
    parent.position.y = H + Math.sin(t * 2) * 0.08;
    fWheel.rotation.x += 0.03;
    bWheel.rotation.x += 0.03;
  });

  return parent;
}

function createRestaurant(scene: BABYLON.Scene, o: Order, shadowGen: BABYLON.ShadowGenerator, advancedTexture: GUI.AdvancedDynamicTexture): BABYLON.TransformNode {
  const parent = new BABYLON.TransformNode('rest_' + o.id, scene);
  parent.position.set(o.restX, 0, o.restZ);

  const color = BABYLON.Color3.FromHexString(o.color);
  const mat = new BABYLON.StandardMaterial('restMat' + o.id, scene);
  mat.diffuseColor = color.scale(0.88);

  // Building base
  const base = BABYLON.MeshBuilder.CreateBox('base', { width: 5.5, height: 6.5, depth: 5.5 }, scene);
  base.position.y = 3.25;
  base.parent = parent;
  base.material = mat;
  shadowGen.addShadowCaster(base);

  // Roof
  const roofMat = new BABYLON.StandardMaterial('roofMat', scene);
  roofMat.diffuseColor = new BABYLON.Color3(0.68, 0.22, 0.22);

  const roof = BABYLON.MeshBuilder.CreateCylinder('roof', { diameterTop: 0, diameterBottom: 7.5, height: 3.2, tessellation: 4 }, scene);
  roof.position.y = 8;
  roof.rotation.y = Math.PI / 4;
  roof.parent = parent;
  roof.material = roofMat;
  shadowGen.addShadowCaster(roof);

  // Door
  const doorMat = new BABYLON.StandardMaterial('doorMat', scene);
  doorMat.diffuseColor = new BABYLON.Color3(0.48, 0.3, 0.14);

  const door = BABYLON.MeshBuilder.CreateBox('door', { width: 1.5, height: 3, depth: 0.15 }, scene);
  door.position.set(0, 1.5, 2.8);
  door.parent = parent;
  door.material = doorMat;

  // Windows
  const windowMat = new BABYLON.StandardMaterial('winMat', scene);
  windowMat.diffuseColor = new BABYLON.Color3(0.72, 0.88, 1);
  windowMat.emissiveColor = new BABYLON.Color3(0.32, 0.42, 0.52);

  for (let i = -1; i <= 1; i += 2) {
    const win = BABYLON.MeshBuilder.CreateBox('win', { width: 1.1, height: 1.3, depth: 0.12 }, scene);
    win.position.set(i * 1.6, 4.2, 2.8);
    win.parent = parent;
    win.material = windowMat;
  }

  // Sign
  const signMat = new BABYLON.StandardMaterial('signMat', scene);
  signMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
  signMat.emissiveColor = color.scale(0.5);

  const sign = BABYLON.MeshBuilder.CreateBox('sign', { width: 4, height: 1.1, depth: 0.28 }, scene);
  sign.position.set(0, 5.6, 2.95);
  sign.parent = parent;
  sign.material = signMat;

  // Label - from original HTML
  const labelOffset = IS_MOBILE ? -75 : -120;
  const fontSize = IS_MOBILE ? 10 : 11;

  const rect = new GUI.Rectangle();
  rect.width = IS_MOBILE ? '95px' : '120px';
  rect.height = IS_MOBILE ? '22px' : '28px';
  rect.cornerRadius = 14;
  rect.thickness = 2;
  rect.color = 'white';
  rect.background = o.color;
  advancedTexture.addControl(rect);
  rect.linkWithMesh(parent);
  rect.linkOffsetY = labelOffset;

  const txt = new GUI.TextBlock();
  txt.text = '🍕 ' + o.restaurant;
  txt.color = 'white';
  txt.fontSize = fontSize;
  txt.fontWeight = 'bold';
  txt.fontFamily = 'Heebo';
  rect.addControl(txt);

  // Floating icon
  const iconMat = new BABYLON.StandardMaterial('iconMat', scene);
  iconMat.diffuseColor = color;
  iconMat.emissiveColor = color.scale(0.6);

  const icon = BABYLON.MeshBuilder.CreateSphere('icon', { diameter: 2 }, scene);
  icon.position.y = 12;
  icon.parent = parent;
  icon.material = iconMat;

  let time = Math.random() * Math.PI * 2;
  scene.registerBeforeRender(() => {
    time += 0.025;
    icon.position.y = 12 + Math.sin(time) * 0.45;
    icon.rotation.y += 0.015;
  });

  return parent;
}

function createHouse(scene: BABYLON.Scene, o: Order, shadowGen: BABYLON.ShadowGenerator, advancedTexture: GUI.AdvancedDynamicTexture): BABYLON.TransformNode {
  const parent = new BABYLON.TransformNode('house_' + o.id, scene);
  parent.position.set(o.custX, 0, o.custZ);

  // House base
  const baseMat = new BABYLON.StandardMaterial('houseMat', scene);
  baseMat.diffuseColor = new BABYLON.Color3(0.94, 0.9, 0.85);

  const base = BABYLON.MeshBuilder.CreateBox('hbase', { width: 5, height: 5, depth: 5 }, scene);
  base.position.y = 2.5;
  base.parent = parent;
  base.material = baseMat;
  shadowGen.addShadowCaster(base);

  // Roof
  const roofMat = new BABYLON.StandardMaterial('hroofMat', scene);
  roofMat.diffuseColor = new BABYLON.Color3(0.58, 0.38, 0.25);

  const roof = BABYLON.MeshBuilder.CreateCylinder('hroof', { diameterTop: 0, diameterBottom: 7, height: 2.8, tessellation: 4 }, scene);
  roof.position.y = 6.2;
  roof.rotation.y = Math.PI / 4;
  roof.parent = parent;
  roof.material = roofMat;
  shadowGen.addShadowCaster(roof);

  // Door
  const color = BABYLON.Color3.FromHexString(o.color);
  const doorMat = new BABYLON.StandardMaterial('hdoorMat', scene);
  doorMat.diffuseColor = color.scale(0.75);

  const door = BABYLON.MeshBuilder.CreateBox('hdoor', { width: 1.3, height: 2.4, depth: 0.12 }, scene);
  door.position.set(0, 1.2, 2.55);
  door.parent = parent;
  door.material = doorMat;

  // Windows
  const windowMat = new BABYLON.StandardMaterial('hwinMat', scene);
  windowMat.diffuseColor = new BABYLON.Color3(0.62, 0.78, 0.98);
  windowMat.emissiveColor = new BABYLON.Color3(0.28, 0.38, 0.48);

  for (let i = -1; i <= 1; i += 2) {
    const win = BABYLON.MeshBuilder.CreateBox('hwin', { width: 0.85, height: 0.85, depth: 0.12 }, scene);
    win.position.set(i * 1.3, 3.5, 2.55);
    win.parent = parent;
    win.material = windowMat;
  }

  // Label - from original HTML
  const labelOffset = IS_MOBILE ? -60 : -100;
  const fontSize = IS_MOBILE ? 10 : 11;

  const rect = new GUI.Rectangle();
  rect.width = IS_MOBILE ? '90px' : '110px';
  rect.height = IS_MOBILE ? '22px' : '28px';
  rect.cornerRadius = 14;
  rect.thickness = 2;
  rect.color = o.color;
  rect.background = 'white';
  advancedTexture.addControl(rect);
  rect.linkWithMesh(parent);
  rect.linkOffsetY = labelOffset;

  const txt = new GUI.TextBlock();
  txt.text = '🏠 ' + o.family;
  txt.color = '#333';
  txt.fontSize = fontSize;
  txt.fontWeight = 'bold';
  txt.fontFamily = 'Heebo';
  rect.addControl(txt);

  // Floating marker
  const markerMat = new BABYLON.StandardMaterial('markerMat', scene);
  markerMat.diffuseColor = color;
  markerMat.emissiveColor = color.scale(0.45);

  const marker = BABYLON.MeshBuilder.CreateCylinder('marker', { diameterTop: 0.45, diameterBottom: 1.6, height: 2.8 }, scene);
  marker.position.y = 10;
  marker.parent = parent;
  marker.material = markerMat;

  let time = Math.random() * Math.PI * 2;
  scene.registerBeforeRender(() => {
    time += 0.03;
    marker.position.y = 10 + Math.sin(time) * 0.38;
  });

  return parent;
}

// Update assignment lines on the map
export function updateAssignmentLines(
  scene: BABYLON.Scene,
  courierMeshes: CourierMesh[],
  assignmentLines: Record<string, BABYLON.Mesh>,
  assignments: Record<number, number>
): Record<string, BABYLON.Mesh> {
  // Update ring visibility
  courierMeshes.forEach(mesh => {
    const isAssigned = assignments[mesh.courierId] !== undefined;
    if (mesh.ringMat) {
      mesh.ringMat.alpha = isAssigned ? 0.7 : 0;
      mesh.ringMat.emissiveColor = BABYLON.Color3.FromHexString(isAssigned ? '#4CAF50' : '#FFD700');
    }
  });

  // Dispose old lines
  Object.values(assignmentLines).forEach(l => l.dispose());
  const newLines: Record<string, BABYLON.Mesh> = {};

  // Create new lines
  Object.entries(assignments).forEach(([cId, oId]) => {
    const courier = COURIERS.find(c => c.id === parseInt(cId));
    const order = ORDERS.find(o => o.id === oId);
    const mesh = courierMeshes.find(m => m.courierId === parseInt(cId));

    if (courier && order && mesh) {
      const points = [
        new BABYLON.Vector3(mesh.position.x, 2, mesh.position.z),
        new BABYLON.Vector3(order.restX, 2, order.restZ),
        new BABYLON.Vector3(order.custX, 2, order.custZ)
      ];

      const tube = BABYLON.MeshBuilder.CreateTube('line_' + cId, {
        path: points,
        radius: 0.35,
        tessellation: 12,
        cap: BABYLON.Mesh.CAP_ALL
      }, scene);

      const mat = new BABYLON.StandardMaterial('tubeMat_' + cId, scene);
      mat.diffuseColor = BABYLON.Color3.FromHexString(courier.color);
      mat.emissiveColor = BABYLON.Color3.FromHexString(courier.color).scale(0.5);
      mat.alpha = 0.85;
      tube.material = mat;

      newLines[cId] = tube;
    }
  });

  return newLines;
}

// Animate couriers moving to deliver
export async function animateCouriersDelivery(
  scene: BABYLON.Scene,
  courierMeshes: CourierMesh[],
  assignments: Record<number, number>,
  assignmentLines: Record<string, BABYLON.Mesh>
): Promise<void> {
  // Dispose assignment lines before animation
  Object.values(assignmentLines).forEach(l => l.dispose());

  const animations: Promise<void>[] = [];

  Object.entries(assignments).forEach(([cId, oId]) => {
    const mesh = courierMeshes.find(m => m.courierId === parseInt(cId));
    const order = ORDERS.find(o => o.id === oId);
    if (mesh && order) {
      animations.push(animateSingleCourier(mesh, order));
    }
  });

  await Promise.all(animations);
}

function animateSingleCourier(mesh: CourierMesh, order: Order): Promise<void> {
  return new Promise(resolve => {
    const path = [
      { x: mesh.originalX, z: mesh.originalZ },
      { x: order.restX, z: order.restZ },
      { x: order.custX, z: order.custZ }
    ];

    let segmentIndex = 0;

    function animateSegment() {
      if (segmentIndex >= path.length - 1) {
        resolve();
        return;
      }

      const start = path[segmentIndex];
      const end = path[segmentIndex + 1];
      const dx = end.x - start.x;
      const dz = end.z - start.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      const duration = distance * 70; // From original HTML - was 50, then 70 for slower

      mesh.rotation.y = Math.atan2(dx, dz);

      gsap.to(mesh.position, {
        x: end.x,
        z: end.z,
        duration: duration / 1000,
        ease: 'power2.inOut',
        onComplete: () => {
          segmentIndex++;
          setTimeout(animateSegment, 150);
        }
      });
    }

    animateSegment();
  });
}

// Reset courier positions
export function resetCourierPositions(courierMeshes: CourierMesh[]): void {
  courierMeshes.forEach(mesh => {
    mesh.position.x = mesh.originalX;
    mesh.position.z = mesh.originalZ;
    mesh.rotation.y = 0;
    if (mesh.ringMat) {
      mesh.ringMat.alpha = 0;
    }
  });
}
