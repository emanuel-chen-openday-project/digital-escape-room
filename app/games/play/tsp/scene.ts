// TSP Game Babylon.js Scene Module

import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import { gsap } from 'gsap';
import { NODES, ROAD_DEFINITIONS, TSPNode, NODE_COUNT } from './types';

export interface SceneRefs {
  scene: BABYLON.Scene;
  engine: BABYLON.Engine;
  camera: BABYLON.ArcRotateCamera;
  advancedTexture: GUI.AdvancedDynamicTexture;
  nodeTransforms: BABYLON.TransformNode[];
  truckParent: BABYLON.TransformNode;
  playerSegments: BABYLON.Mesh[];
}

export function createTSPScene(canvas: HTMLCanvasElement): SceneRefs {
  const engine = new BABYLON.Engine(canvas, true, {
    antialias: true,
    adaptToDeviceRatio: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance"
  });
  engine.setHardwareScalingLevel(1 / window.devicePixelRatio);

  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.85, 0.93, 0.98, 1);

  const isMobile = window.innerWidth < 768 || window.innerHeight < 700;
  const radius = isMobile ? 250 : 220;
  const beta = isMobile ? Math.PI / 3.8 : Math.PI / 3;
  const fixedAlpha = -Math.PI / 2;
  const target = new BABYLON.Vector3(0, 0, 0);

  const camera = new BABYLON.ArcRotateCamera("camera", fixedAlpha, beta, radius, target, scene);
  camera.lowerAlphaLimit = camera.upperAlphaLimit = fixedAlpha;
  camera.lowerBetaLimit = camera.upperBetaLimit = beta;
  camera.lowerRadiusLimit = camera.upperRadiusLimit = radius;

  // Adjust FOV for iPad-like aspect ratios (1.2–1.5) without affecting other devices
  const aspect = engine.getRenderWidth() / engine.getRenderHeight();
  if (aspect >= 1.2 && aspect <= 1.5) {
    camera.fov = 0.6;
  }

  // Lighting
  const hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.75;
  hemi.diffuse = new BABYLON.Color3(1, 0.98, 0.95);
  hemi.groundColor = new BABYLON.Color3(0.5, 0.6, 0.55);

  const sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(-0.5, -1, 0.4), scene);
  sun.position = new BABYLON.Vector3(50, 70, -50);
  sun.intensity = 0.55;
  sun.diffuse = new BABYLON.Color3(1, 0.95, 0.85);

  const shadowGen = new BABYLON.ShadowGenerator(1024, sun);
  shadowGen.useBlurExponentialShadowMap = true;
  shadowGen.blurScale = 2;

  // Ground
  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 280, height: 280 }, scene);
  const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
  groundMat.diffuseColor = new BABYLON.Color3(0.94, 0.93, 0.88);
  groundMat.specularColor = new BABYLON.Color3(0, 0, 0);
  ground.material = groundMat;
  ground.receiveShadows = true;

  // GUI
  const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
  advancedTexture.idealWidth = 1920;
  advancedTexture.idealHeight = 1080;
  advancedTexture.renderAtIdealSize = true;

  // Create visuals
  createRoads(scene);
  createEnvironment(scene, shadowGen);

  // Create nodes
  const nodeTransforms: BABYLON.TransformNode[] = [];
  NODES.forEach((node) => {
    if (node.type === "depot") {
      nodeTransforms[node.id] = createDepot(scene, shadowGen, advancedTexture, node);
    } else {
      nodeTransforms[node.id] = createBranch(scene, shadowGen, advancedTexture, node);
    }
  });

  // Road labels
  createRoadLabels(scene, advancedTexture);

  // Truck
  const truckParent = createTruck(scene, shadowGen);
  setTruckToNode(truckParent, nodeTransforms, 0);

  return {
    scene,
    engine,
    camera,
    advancedTexture,
    nodeTransforms,
    truckParent,
    playerSegments: []
  };
}

function createRoads(scene: BABYLON.Scene): void {
  const roadMat = new BABYLON.StandardMaterial("roadMat", scene);
  roadMat.diffuseColor = new BABYLON.Color3(0.35, 0.35, 0.38);
  roadMat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);

  ROAD_DEFINITIONS.forEach((r, idx) => {
    const nodeA = NODES[r.a];
    const nodeB = NODES[r.b];
    const dx = nodeB.x - nodeA.x;
    const dz = nodeB.z - nodeA.z;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);

    const road = BABYLON.MeshBuilder.CreateBox("road_" + idx, { width: 4, height: 0.15, depth: length }, scene);
    road.position.x = (nodeA.x + nodeB.x) / 2;
    road.position.y = 0.08;
    road.position.z = (nodeA.z + nodeB.z) / 2;
    road.rotation.y = angle;
    road.material = roadMat;
  });
}

function createEnvironment(scene: BABYLON.Scene, shadowGen: BABYLON.ShadowGenerator): void {
  const grassMat = new BABYLON.StandardMaterial("grassMat", scene);
  grassMat.diffuseColor = new BABYLON.Color3(0.55, 0.78, 0.45);
  grassMat.specularColor = new BABYLON.Color3(0, 0, 0);

  const grassPositions = [
    { x: -100, z: -60, w: 45, h: 50 },
    { x: 100, z: -60, w: 45, h: 50 },
    { x: -100, z: 60, w: 45, h: 50 },
    { x: 100, z: 60, w: 45, h: 50 },
    { x: 0, z: -90, w: 60, h: 35 },
    { x: 0, z: 95, w: 60, h: 35 },
  ];

  grassPositions.forEach((pos, i) => {
    const grass = BABYLON.MeshBuilder.CreateGround("grass_" + i, { width: pos.w, height: pos.h }, scene);
    grass.position.set(pos.x, 0.05, pos.z);
    grass.material = grassMat;
  });

  // Trees
  const treePositions = [[-115, -75], [115, -75], [-115, 75], [115, 75], [-50, -95], [50, -95], [-50, 100], [50, 100], [-120, 0], [120, 0]];
  treePositions.forEach(([x, z], i) => createTree(scene, shadowGen, x, z, i));

  // Bushes
  const bushPositions = [[-95, -50], [95, -50], [-95, 50], [95, 50], [-30, -85], [30, -85], [-30, 90], [30, 90]];
  bushPositions.forEach(([x, z], i) => createBush(scene, x, z, i));
}

function createTree(scene: BABYLON.Scene, shadowGen: BABYLON.ShadowGenerator, x: number, z: number, index: number): void {
  const trunkMat = new BABYLON.StandardMaterial("trunkMat_" + index, scene);
  trunkMat.diffuseColor = new BABYLON.Color3(0.5, 0.35, 0.2);
  trunkMat.specularColor = new BABYLON.Color3(0, 0, 0);

  const foliageMat = new BABYLON.StandardMaterial("foliageMat_" + index, scene);
  foliageMat.diffuseColor = new BABYLON.Color3(0.4, 0.7, 0.35);
  foliageMat.specularColor = new BABYLON.Color3(0, 0, 0);

  const trunk = BABYLON.MeshBuilder.CreateCylinder("trunk_" + index, { height: 4, diameterTop: 1, diameterBottom: 1.5 }, scene);
  trunk.position.set(x, 2, z);
  trunk.material = trunkMat;
  shadowGen.addShadowCaster(trunk);

  const foliage1 = BABYLON.MeshBuilder.CreateSphere("foliage1_" + index, { diameter: 7, segments: 8 }, scene);
  foliage1.position.set(x, 6, z);
  foliage1.material = foliageMat;
  shadowGen.addShadowCaster(foliage1);

  const foliage2 = BABYLON.MeshBuilder.CreateSphere("foliage2_" + index, { diameter: 5, segments: 8 }, scene);
  foliage2.position.set(x + 2, 5, z + 1);
  foliage2.material = foliageMat;
  shadowGen.addShadowCaster(foliage2);

  const foliage3 = BABYLON.MeshBuilder.CreateSphere("foliage3_" + index, { diameter: 5, segments: 8 }, scene);
  foliage3.position.set(x - 2, 5.5, z - 1);
  foliage3.material = foliageMat;
  shadowGen.addShadowCaster(foliage3);
}

function createBush(scene: BABYLON.Scene, x: number, z: number, index: number): void {
  const bushMat = new BABYLON.StandardMaterial("bushMat_" + index, scene);
  bushMat.diffuseColor = new BABYLON.Color3(0.35, 0.6, 0.3);
  bushMat.specularColor = new BABYLON.Color3(0, 0, 0);

  const bush = BABYLON.MeshBuilder.CreateSphere("bush_" + index, { diameter: 4, segments: 6 }, scene);
  bush.position.set(x, 1.5, z);
  bush.scaling.y = 0.6;
  bush.material = bushMat;
}

function createDepot(scene: BABYLON.Scene, shadowGen: BABYLON.ShadowGenerator, advancedTexture: GUI.AdvancedDynamicTexture, node: TSPNode): BABYLON.TransformNode {
  const parent = new BABYLON.TransformNode("depot_" + node.id, scene);
  parent.position = new BABYLON.Vector3(node.x, 0, node.z);
  (parent as any).nodeId = node.id;

  // Grass platform
  const grassPlatform = BABYLON.MeshBuilder.CreateCylinder("depotGrass", { height: 0.5, diameter: 20, tessellation: 32 }, scene);
  grassPlatform.position.y = 0.25;
  grassPlatform.parent = parent;
  const grassMat = new BABYLON.StandardMaterial("depotGrassMat", scene);
  grassMat.diffuseColor = new BABYLON.Color3(0.6, 0.85, 0.5);
  grassMat.specularColor = new BABYLON.Color3(0, 0, 0);
  grassPlatform.material = grassMat;

  // Building
  const buildingMat = new BABYLON.StandardMaterial("depotBuildingMat", scene);
  buildingMat.diffuseColor = new BABYLON.Color3(1.0, 0.6, 0.55);
  buildingMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

  const building = BABYLON.MeshBuilder.CreateBox("depotBuilding", { width: 14, height: 18, depth: 14 }, scene);
  building.position.y = 9.5;
  building.parent = parent;
  building.material = buildingMat;
  shadowGen.addShadowCaster(building);

  // Windows
  const windowMat = new BABYLON.StandardMaterial("windowMat", scene);
  windowMat.diffuseColor = new BABYLON.Color3(0.9, 0.95, 1);
  windowMat.emissiveColor = new BABYLON.Color3(0.2, 0.25, 0.3);

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      [[0, 7.2], [0, -7.2]].forEach(([xOff, zOff]) => {
        const w = BABYLON.MeshBuilder.CreateBox("window", { width: 3.5, height: 3.5, depth: 0.3 }, scene);
        w.position.set(-2.5 + col * 5, 5 + row * 5, zOff);
        w.parent = parent;
        w.material = windowMat;
      });
      [[-7.2, 0], [7.2, 0]].forEach(([xOff, zOff]) => {
        const w = BABYLON.MeshBuilder.CreateBox("window", { width: 0.3, height: 3.5, depth: 3.5 }, scene);
        w.position.set(xOff, 5 + row * 5, -2.5 + col * 5);
        w.parent = parent;
        w.material = windowMat;
      });
    }
  }

  // Roof
  const roofMat = new BABYLON.StandardMaterial("depotRoofMat", scene);
  roofMat.diffuseColor = new BABYLON.Color3(1.0, 0.6, 0.55);
  roofMat.specularColor = new BABYLON.Color3(0, 0, 0);

  const roof = BABYLON.MeshBuilder.CreateBox("depotRoof", { width: 15, height: 1, depth: 15 }, scene);
  roof.position.y = 19;
  roof.parent = parent;
  roof.material = roofMat;
  shadowGen.addShadowCaster(roof);

  parent.scaling = new BABYLON.Vector3(1.15, 1.15, 1.15);
  addNodeLabel(advancedTexture, parent, node.name, node);
  return parent;
}

function createBranch(scene: BABYLON.Scene, shadowGen: BABYLON.ShadowGenerator, advancedTexture: GUI.AdvancedDynamicTexture, node: TSPNode): BABYLON.TransformNode {
  const parent = new BABYLON.TransformNode("branch_" + node.id, scene);
  parent.position = new BABYLON.Vector3(node.x, 0, node.z);
  (parent as any).nodeId = node.id;

  // Grass platform
  const grassPlatform = BABYLON.MeshBuilder.CreateCylinder("branchGrass_" + node.id, { height: 0.4, diameter: 24, tessellation: 24 }, scene);
  grassPlatform.position.y = 0.2;
  grassPlatform.parent = parent;
  const grassMat = new BABYLON.StandardMaterial("branchGrassMat_" + node.id, scene);
  grassMat.diffuseColor = new BABYLON.Color3(0.30, 0.55, 0.45);
  grassMat.specularColor = new BABYLON.Color3(0, 0, 0);
  grassPlatform.material = grassMat;

  // House walls
  const wallMat = new BABYLON.StandardMaterial("wallMat_" + node.id, scene);
  wallMat.diffuseColor = new BABYLON.Color3(1.0, 1.0, 0.97);
  wallMat.specularColor = new BABYLON.Color3(0, 0, 0);

  const houseBase = BABYLON.MeshBuilder.CreateBox("houseBase_" + node.id, { width: 12, height: 8, depth: 10 }, scene);
  houseBase.position.y = 4.5;
  houseBase.parent = parent;
  houseBase.material = wallMat;
  shadowGen.addShadowCaster(houseBase);

  // Roof
  const roofMat = new BABYLON.StandardMaterial("roofMat_" + node.id, scene);
  roofMat.diffuseColor = new BABYLON.Color3(0.85, 0.65, 0.95);
  roofMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

  const roofAngle = Math.PI / 6;
  const roofLeft = BABYLON.MeshBuilder.CreateBox("roofLeft_" + node.id, { width: 7.5, height: 0.8, depth: 12 }, scene);
  roofLeft.position.set(-3.2, 10.5, 0);
  roofLeft.rotation.z = roofAngle;
  roofLeft.parent = parent;
  roofLeft.material = roofMat;
  shadowGen.addShadowCaster(roofLeft);

  const roofRight = BABYLON.MeshBuilder.CreateBox("roofRight_" + node.id, { width: 7.5, height: 0.8, depth: 12 }, scene);
  roofRight.position.set(3.2, 10.5, 0);
  roofRight.rotation.z = -roofAngle;
  roofRight.parent = parent;
  roofRight.material = roofMat;
  shadowGen.addShadowCaster(roofRight);

  // Door
  const doorMat = new BABYLON.StandardMaterial("doorMat_" + node.id, scene);
  doorMat.diffuseColor = new BABYLON.Color3(0.55, 0.35, 0.2);
  doorMat.specularColor = new BABYLON.Color3(0, 0, 0);

  const door = BABYLON.MeshBuilder.CreateBox("door_" + node.id, { width: 2.5, height: 4, depth: 0.3 }, scene);
  door.position.set(0, 2.5, 5.2);
  door.parent = parent;
  door.material = doorMat;

  // Windows
  const windowMat = new BABYLON.StandardMaterial("houseWindowMat_" + node.id, scene);
  windowMat.diffuseColor = new BABYLON.Color3(0.7, 0.85, 0.95);
  windowMat.emissiveColor = new BABYLON.Color3(0.1, 0.15, 0.2);

  [[-4, 5, 5.2], [4, 5, 5.2]].forEach(([x, y, z]) => {
    const w = BABYLON.MeshBuilder.CreateBox("windowFront", { width: 2.5, height: 2.5, depth: 0.3 }, scene);
    w.position.set(x, y, z);
    w.parent = parent;
    w.material = windowMat;
  });

  // Side windows
  [[6.2, 5, 0], [-6.2, 5, 0]].forEach(([x, y, z]) => {
    const w = BABYLON.MeshBuilder.CreateBox("windowSide", { width: 0.3, height: 2.5, depth: 2.5 }, scene);
    w.position.set(x, y, z);
    w.parent = parent;
    w.material = windowMat;
  });

  parent.scaling = new BABYLON.Vector3(1.4, 1.4, 1.4);
  addNodeLabel(advancedTexture, parent, node.name, node);
  return parent;
}

function addNodeLabel(advancedTexture: GUI.AdvancedDynamicTexture, parent: BABYLON.TransformNode, text: string, nodeData: TSPNode): void {
  const rect = new GUI.Rectangle();
  rect.adaptWidthToChildren = true;
  rect.adaptHeightToChildren = true;
  rect.cornerRadius = 7;
  rect.thickness = 1;
  rect.color = "#cccccc";
  rect.background = "rgba(227, 242, 253, 0.95)";
  rect.paddingLeft = "2px";
  rect.paddingTop = "2px";
  advancedTexture.addControl(rect);
  rect.linkWithMesh(parent);

  const offsets: Record<number, [number, number]> = {
    0: [0, -30],
    1: [-63, -10],
    2: [-65, 5],
    3: [61, -15],
    4: [-57, -15],
    5: [49, -20],
    6: [61, -20],
    7: [0, -38]
  };
  const [offsetX, offsetY] = offsets[nodeData.id] || [0, -20];
  rect.linkOffsetX = offsetX;
  rect.linkOffsetY = offsetY;

  const tb = new GUI.TextBlock();
  tb.text = text;
  tb.color = "#1565C0";
  tb.fontWeight = "bold";
  tb.fontSize = 12;
  tb.fontFamily = "Heebo";
  tb.resizeToFit = true;
  tb.paddingLeft = "3px";
  tb.paddingRight = "3px";
  tb.paddingTop = "1px";
  tb.paddingBottom = "1px";
  rect.addControl(tb);
}

function createRoadLabels(scene: BABYLON.Scene, advancedTexture: GUI.AdvancedDynamicTexture): void {
  ROAD_DEFINITIONS.forEach((r, idx) => {
    const a = NODES[r.a];
    const b = NODES[r.b];
    const path = [new BABYLON.Vector3(a.x, 0.4, a.z), new BABYLON.Vector3(b.x, 0.4, b.z)];

    let position: BABYLON.Vector3;

    if ((r.a === 1 && r.b === 3) || (r.a === 3 && r.b === 1)) {
      position = BABYLON.Vector3.Lerp(path[0], path[1], 0.8);
      position.z -= 1;
      position.x -= 8;
    } else if ((r.a === 0 && r.b === 2) || (r.a === 2 && r.b === 0)) {
      position = BABYLON.Vector3.Lerp(path[0], path[1], 0.6);
      position.z += 7;
    } else if ((r.a === 0 && r.b === 7) || (r.a === 7 && r.b === 0)) {
      position = BABYLON.Vector3.Center(path[0], path[1]);
      position.z += 25;
    } else {
      position = BABYLON.Vector3.Center(path[0], path[1]);
    }

    const anchor = new BABYLON.TransformNode("edgeAnchor_" + idx, scene);
    anchor.position = new BABYLON.Vector3(position.x, 2.5, position.z);

    const rect = new GUI.Rectangle();
    rect.adaptWidthToChildren = true;
    rect.adaptHeightToChildren = true;
    rect.cornerRadius = 16;
    rect.background = "rgba(255, 255, 255, 0.92)";
    rect.thickness = 2;
    rect.color = "rgba(30, 80, 150, 0.3)";
    advancedTexture.addControl(rect);
    rect.linkWithMesh(anchor);

    const tb = new GUI.TextBlock();
    tb.text = r.d + " km";
    tb.color = "#1565C0";
    tb.fontWeight = "bold";
    tb.fontSize = 18;
    tb.fontFamily = "Heebo";
    tb.resizeToFit = true;
    tb.paddingLeft = "7px";
    tb.paddingRight = "7px";
    tb.paddingTop = "4px";
    tb.paddingBottom = "4px";
    rect.addControl(tb);
  });
}

function createTruck(scene: BABYLON.Scene, shadowGen: BABYLON.ShadowGenerator): BABYLON.TransformNode {
  const parent = new BABYLON.TransformNode("truckParent", scene);
  parent.position.y = 0.1;

  const cargoMat = new BABYLON.StandardMaterial("cargoMat", scene);
  cargoMat.diffuseColor = new BABYLON.Color3(0.95, 0.6, 0.2);
  cargoMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

  const cabinMat = new BABYLON.StandardMaterial("cabinMat", scene);
  cabinMat.diffuseColor = new BABYLON.Color3(0.2, 0.4, 0.8);
  cabinMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

  const wheelMat = new BABYLON.StandardMaterial("wheelMat", scene);
  wheelMat.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.15);
  wheelMat.specularColor = new BABYLON.Color3(0, 0, 0);

  // Cargo
  const cargo = BABYLON.MeshBuilder.CreateBox("truckCargo", { width: 3.2, height: 2.2, depth: 4.2 }, scene);
  cargo.position.y = 1.6;
  cargo.position.z = -1;
  cargo.parent = parent;
  cargo.material = cargoMat;

  // Cabin
  const cabin = BABYLON.MeshBuilder.CreateBox("truckCabin", { width: 3.2, height: 2.8, depth: 2.2 }, scene);
  cabin.position.y = 1.9;
  cabin.position.z = 2;
  cabin.parent = parent;
  cabin.material = cabinMat;

  // Cabin window
  const windowMat = new BABYLON.StandardMaterial("truckWindowMat", scene);
  windowMat.diffuseColor = new BABYLON.Color3(0.7, 0.85, 0.95);
  windowMat.emissiveColor = new BABYLON.Color3(0.1, 0.15, 0.2);

  const cabinWindow = BABYLON.MeshBuilder.CreateBox("cabinWindow", { width: 2.8, height: 1.2, depth: 0.2 }, scene);
  cabinWindow.position.set(0, 2.5, 3.1);
  cabinWindow.parent = parent;
  cabinWindow.material = windowMat;

  // Wheels
  [[1.8, 2], [-1.8, 2], [1.8, -1.5], [-1.8, -1.5]].forEach(([x, z], i) => {
    const wheel = BABYLON.MeshBuilder.CreateCylinder("wheel_" + i, { diameter: 1.5, height: 0.8, tessellation: 12 }, scene);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.75, z);
    wheel.parent = parent;
    wheel.material = wheelMat;
    shadowGen.addShadowCaster(wheel);
  });

  parent.scaling = new BABYLON.Vector3(3, 3, 3);
  return parent;
}

export function setTruckToNode(truckParent: BABYLON.TransformNode, nodeTransforms: BABYLON.TransformNode[], nodeId: number): void {
  const t = nodeTransforms[nodeId];
  if (!t) return;
  const offset = nodeId === 0 ? 15 : 18;
  truckParent.position.x = t.position.x;
  truckParent.position.z = t.position.z - offset;
  truckParent.rotation.y = Math.PI;
}

export function animateTruck(
  scene: BABYLON.Scene,
  truckParent: BABYLON.TransformNode,
  nodeTransforms: BABYLON.TransformNode[],
  playerSegments: BABYLON.Mesh[],
  fromId: number,
  toId: number,
  onComplete: () => void
): void {
  const fromPos = nodeTransforms[fromId].position;
  const toPos = nodeTransforms[toId].position;

  const direction = toPos.subtract(fromPos).normalize();
  const dx = toPos.x - fromPos.x;
  const dz = toPos.z - fromPos.z;

  if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
    truckParent.rotation.y = Math.atan2(dx, dz);
  }

  const stopOffset = 5.5;
  const targetX = toPos.x - direction.x * stopOffset;
  const targetZ = toPos.z - direction.z * stopOffset;

  gsap.to(truckParent.position, {
    x: targetX,
    z: targetZ,
    duration: 1.2,
    ease: "power2.inOut",
    onComplete
  });

  // Draw path segment
  const path = [
    new BABYLON.Vector3(fromPos.x, 0.8, fromPos.z),
    new BABYLON.Vector3(toPos.x, 0.8, toPos.z)
  ];
  const tube = BABYLON.MeshBuilder.CreateTube("playerSeg", { path, radius: 2.2, tessellation: 8 }, scene);
  const mat = new BABYLON.StandardMaterial("playerSegMat", scene);
  mat.diffuseColor = new BABYLON.Color3(0.0, 0.9, 0.9);
  mat.emissiveColor = new BABYLON.Color3(0.5, 0.0, 0.6);
  tube.material = mat;
  playerSegments.push(tube);
}
