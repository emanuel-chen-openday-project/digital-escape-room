// Knapsack Game Babylon.js Scene Module
// Converted 1:1 from original HTML

import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import { gsap } from 'gsap';
import { Item, ITEMS, IS_MOBILE, SCALE, ITEM_SCALE } from './types';

export interface ItemMesh extends BABYLON.TransformNode {
  itemId: number;
  originalPosition: BABYLON.Vector3;
  inCrate: boolean;
  crateSlot: number | null;
}

export interface SceneRefs {
  scene: BABYLON.Scene;
  engine: BABYLON.Engine;
  advancedTexture: GUI.AdvancedDynamicTexture;
  itemMeshes: ItemMesh[];
  crateBase: BABYLON.Mesh;
  crateSlots: BABYLON.Vector3[];
}

// Audio for item movement
let moveAudio: HTMLAudioElement | null = null;

function playMoveSfx(): void {
  try {
    if (!moveAudio) {
      moveAudio = new Audio('/audio/transition-sfx-whoosh-sound-effect-407576.mp3');
    }
    moveAudio.currentTime = 0;
    moveAudio.volume = 0.3;
    moveAudio.play();
  } catch (e) {
    // Audio not available
  }
}

export function createKnapsackScene(canvas: HTMLCanvasElement): SceneRefs {
  const engine = new BABYLON.Engine(canvas, true, {
    antialias: true,
    stencil: true
  });
  engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 2));

  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.89, 0.95, 0.99, 1);

  // GUI
  const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');

  // Camera - from original HTML
  const isMobile = IS_MOBILE;
  const camRadius = isMobile ? 14 : 12;
  const camBeta = isMobile ? Math.PI / 3.2 : Math.PI / 3;
  const camAlpha = -Math.PI / 2;

  const camera = new BABYLON.ArcRotateCamera(
    'cam',
    camAlpha,
    camBeta,
    camRadius,
    new BABYLON.Vector3(0, 2, 0),
    scene
  );
  camera.attachControl(canvas, false);
  camera.inputs.clear();
  camera.lowerRadiusLimit = camRadius;
  camera.upperRadiusLimit = camRadius;

  // Lighting - from original HTML
  const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0.3), scene);
  hemi.intensity = 0.7;
  hemi.groundColor = new BABYLON.Color3(0.85, 0.88, 0.95);

  const sun = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-0.4, -0.8, 0.3), scene);
  sun.position = new BABYLON.Vector3(10, 15, -10);
  sun.intensity = 0.6;

  const shadowGen = new BABYLON.ShadowGenerator(2048, sun);
  shadowGen.useBlurExponentialShadowMap = true;
  shadowGen.blurKernel = 32;
  shadowGen.darkness = 0.2;

  // Create environment
  createWalls(scene);
  createTable(scene, shadowGen);
  const crateBase = createCrate(scene, shadowGen);

  // Create items
  const itemMeshes: ItemMesh[] = [];
  ITEMS.forEach((item, index) => {
    const mesh = createItem(scene, item, index, shadowGen, advancedTexture);
    itemMeshes.push(mesh);
  });

  // Create LED lights
  createLEDLights(scene);

  // Define crate slots (positions inside the crate)
  const crateSlots: BABYLON.Vector3[] = [
    new BABYLON.Vector3(-0.4, 0.5, -0.4),
    new BABYLON.Vector3(0.4, 0.5, -0.4),
    new BABYLON.Vector3(-0.4, 0.5, 0.4),
    new BABYLON.Vector3(0.4, 0.5, 0.4),
    new BABYLON.Vector3(0, 0.9, 0),
    new BABYLON.Vector3(0, 1.3, 0)
  ];

  return {
    scene,
    engine,
    advancedTexture,
    itemMeshes,
    crateBase,
    crateSlots
  };
}

function createWalls(scene: BABYLON.Scene): void {
  // Floor
  const floor = BABYLON.MeshBuilder.CreateGround('floor', { width: 20, height: 20 }, scene);
  const floorMat = new BABYLON.StandardMaterial('floorMat', scene);
  floorMat.diffuseColor = new BABYLON.Color3(0.92, 0.94, 0.96);
  floor.material = floorMat;
  floor.receiveShadows = true;

  // Back wall
  const wallMat = new BABYLON.StandardMaterial('wallMat', scene);
  wallMat.diffuseColor = new BABYLON.Color3(0.95, 0.97, 1);

  const backWall = BABYLON.MeshBuilder.CreateBox('backWall', { width: 14, height: 8, depth: 0.2 }, scene);
  backWall.position.set(0, 4, -5);
  backWall.material = wallMat;

  // Side walls
  const leftWall = BABYLON.MeshBuilder.CreateBox('leftWall', { width: 0.2, height: 8, depth: 10 }, scene);
  leftWall.position.set(-7, 4, 0);
  leftWall.material = wallMat;

  const rightWall = BABYLON.MeshBuilder.CreateBox('rightWall', { width: 0.2, height: 8, depth: 10 }, scene);
  rightWall.position.set(7, 4, 0);
  rightWall.material = wallMat;
}

function createTable(scene: BABYLON.Scene, shadowGen: BABYLON.ShadowGenerator): void {
  // Table top
  const tableMat = new BABYLON.StandardMaterial('tableMat', scene);
  tableMat.diffuseColor = new BABYLON.Color3(0.55, 0.4, 0.25);
  tableMat.specularPower = 64;

  const tableTop = BABYLON.MeshBuilder.CreateBox('tableTop', { width: 8, height: 0.15, depth: 4 }, scene);
  tableTop.position.set(0, 1, 0);
  tableTop.material = tableMat;
  tableTop.receiveShadows = true;
  shadowGen.addShadowCaster(tableTop);

  // Table legs
  const legMat = new BABYLON.StandardMaterial('legMat', scene);
  legMat.diffuseColor = new BABYLON.Color3(0.45, 0.32, 0.2);

  const legPositions = [
    [-3.6, -1.6],
    [3.6, -1.6],
    [-3.6, 1.6],
    [3.6, 1.6]
  ];

  legPositions.forEach((pos, i) => {
    const leg = BABYLON.MeshBuilder.CreateCylinder('leg' + i, { diameter: 0.15, height: 1 }, scene);
    leg.position.set(pos[0], 0.5, pos[1]);
    leg.material = legMat;
    shadowGen.addShadowCaster(leg);
  });
}

function createCrate(scene: BABYLON.Scene, shadowGen: BABYLON.ShadowGenerator): BABYLON.Mesh {
  // Cardboard material
  const cardboardMat = new BABYLON.StandardMaterial('cardboardMat', scene);
  cardboardMat.diffuseColor = new BABYLON.Color3(0.76, 0.6, 0.42);
  cardboardMat.specularPower = 8;

  // Crate base (box without top)
  const crateSize = 1.8;
  const crateHeight = 1.2;

  const crateBase = BABYLON.MeshBuilder.CreateBox('crateBase', {
    width: crateSize,
    height: crateHeight,
    depth: crateSize
  }, scene);
  crateBase.position.set(2.5, 1 + crateHeight / 2, 0);
  crateBase.material = cardboardMat;
  shadowGen.addShadowCaster(crateBase);

  // Inner box (to make it look hollow)
  const innerBox = BABYLON.MeshBuilder.CreateBox('innerBox', {
    width: crateSize - 0.1,
    height: crateHeight - 0.1,
    depth: crateSize - 0.1
  }, scene);
  innerBox.position.set(2.5, 1 + crateHeight / 2 + 0.05, 0);
  const innerMat = new BABYLON.StandardMaterial('innerMat', scene);
  innerMat.diffuseColor = new BABYLON.Color3(0.65, 0.5, 0.35);
  innerBox.material = innerMat;

  // Flaps (transparent) - from original HTML
  const flapMat = new BABYLON.StandardMaterial('flapMat', scene);
  flapMat.diffuseColor = new BABYLON.Color3(0.76, 0.6, 0.42);
  flapMat.alpha = 0.6;

  const flapWidth = crateSize / 2;
  const flapHeight = crateSize / 2;
  const flapY = 1 + crateHeight;

  // Front flaps
  const frontFlap1 = BABYLON.MeshBuilder.CreateBox('frontFlap1', { width: flapWidth, height: 0.02, depth: flapHeight }, scene);
  frontFlap1.position.set(2.5 - flapWidth / 4, flapY, flapHeight / 4);
  frontFlap1.rotation.x = -Math.PI / 6;
  frontFlap1.material = flapMat;

  const frontFlap2 = BABYLON.MeshBuilder.CreateBox('frontFlap2', { width: flapWidth, height: 0.02, depth: flapHeight }, scene);
  frontFlap2.position.set(2.5 + flapWidth / 4, flapY, flapHeight / 4);
  frontFlap2.rotation.x = -Math.PI / 6;
  frontFlap2.material = flapMat;

  // Back flaps
  const backFlap1 = BABYLON.MeshBuilder.CreateBox('backFlap1', { width: flapWidth, height: 0.02, depth: flapHeight }, scene);
  backFlap1.position.set(2.5 - flapWidth / 4, flapY, -flapHeight / 4);
  backFlap1.rotation.x = Math.PI / 6;
  backFlap1.material = flapMat;

  const backFlap2 = BABYLON.MeshBuilder.CreateBox('backFlap2', { width: flapWidth, height: 0.02, depth: flapHeight }, scene);
  backFlap2.position.set(2.5 + flapWidth / 4, flapY, -flapHeight / 4);
  backFlap2.rotation.x = Math.PI / 6;
  backFlap2.material = flapMat;

  return crateBase;
}

function createItem(
  scene: BABYLON.Scene,
  item: Item,
  index: number,
  shadowGen: BABYLON.ShadowGenerator,
  advancedTexture: GUI.AdvancedDynamicTexture
): ItemMesh {
  const S = ITEM_SCALE;

  // Position items on the left side of the table
  const startX = -2.5;
  const startZ = -1;
  const spacing = 1.2;
  const row = Math.floor(index / 3);
  const col = index % 3;
  const x = startX + col * spacing;
  const z = startZ + row * spacing;
  const y = 1.15;

  const parent = new BABYLON.TransformNode('item_' + item.id, scene) as ItemMesh;
  parent.position.set(x, y, z);
  parent.itemId = item.id;
  parent.originalPosition = new BABYLON.Vector3(x, y, z);
  parent.inCrate = false;
  parent.crateSlot = null;

  const mat = new BABYLON.StandardMaterial('itemMat' + item.id, scene);
  mat.diffuseColor = item.color;
  mat.specularPower = 32;

  // Create different shapes based on item type - from original HTML
  switch (item.type) {
    case 'monitor':
      createMonitor(scene, parent, mat, shadowGen, S);
      break;
    case 'wallclock':
      createWallClock(scene, parent, mat, shadowGen, S);
      break;
    case 'headphones':
      createHeadphones(scene, parent, mat, shadowGen, S);
      break;
    case 'books':
      createBooks(scene, parent, mat, shadowGen, S);
      break;
    case 'speaker':
      createSpeaker(scene, parent, mat, shadowGen, S);
      break;
    case 'keyboard':
      createKeyboard(scene, parent, mat, shadowGen, S);
      break;
  }

  // Click area
  const clickArea = BABYLON.MeshBuilder.CreateBox('clickArea' + item.id, {
    width: 1 * S,
    height: 1 * S,
    depth: 1 * S
  }, scene);
  clickArea.position.y = 0.3 * S;
  clickArea.parent = parent;
  clickArea.visibility = 0;
  clickArea.isPickable = true;
  (clickArea as any).itemId = item.id;

  // Label - from original HTML
  const rect = new GUI.Rectangle();
  rect.width = IS_MOBILE ? '85px' : '100px';
  rect.height = IS_MOBILE ? '28px' : '32px';
  rect.cornerRadius = 16;
  rect.thickness = 2;
  rect.color = '#1565C0';
  rect.background = 'white';
  advancedTexture.addControl(rect);
  rect.linkWithMesh(parent);
  rect.linkOffsetY = IS_MOBILE ? -50 : -60;

  const txt = new GUI.TextBlock();
  txt.text = `${item.emoji} ₪${item.value}`;
  txt.color = '#1565C0';
  txt.fontSize = IS_MOBILE ? 11 : 13;
  txt.fontWeight = 'bold';
  txt.fontFamily = 'Heebo';
  rect.addControl(txt);

  // Weight label
  const weightRect = new GUI.Rectangle();
  weightRect.width = IS_MOBILE ? '50px' : '55px';
  weightRect.height = IS_MOBILE ? '20px' : '22px';
  weightRect.cornerRadius = 10;
  weightRect.thickness = 0;
  weightRect.background = 'rgba(21, 101, 192, 0.9)';
  advancedTexture.addControl(weightRect);
  weightRect.linkWithMesh(parent);
  weightRect.linkOffsetY = IS_MOBILE ? -25 : -30;

  const weightTxt = new GUI.TextBlock();
  weightTxt.text = `${item.weight} ק"ג`;
  weightTxt.color = 'white';
  weightTxt.fontSize = IS_MOBILE ? 9 : 10;
  weightTxt.fontWeight = 'bold';
  weightTxt.fontFamily = 'Heebo';
  weightRect.addControl(weightTxt);

  // Idle animation
  let t = Math.random() * Math.PI * 2;
  scene.registerBeforeRender(() => {
    t += 0.02;
    parent.position.y = (parent.inCrate ? parent.position.y : y) + Math.sin(t) * 0.015;
  });

  return parent;
}

function createMonitor(scene: BABYLON.Scene, parent: BABYLON.TransformNode, mat: BABYLON.Material, shadowGen: BABYLON.ShadowGenerator, S: number): void {
  // Screen
  const screen = BABYLON.MeshBuilder.CreateBox('screen', { width: 0.8 * S, height: 0.5 * S, depth: 0.05 * S }, scene);
  screen.position.y = 0.3 * S;
  screen.parent = parent;
  screen.material = mat;
  shadowGen.addShadowCaster(screen);

  // Screen bezel
  const bezelMat = new BABYLON.StandardMaterial('bezelMat', scene);
  bezelMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.12);

  const bezel = BABYLON.MeshBuilder.CreateBox('bezel', { width: 0.85 * S, height: 0.55 * S, depth: 0.04 * S }, scene);
  bezel.position.set(0, 0.3 * S, -0.01 * S);
  bezel.parent = parent;
  bezel.material = bezelMat;

  // Stand
  const stand = BABYLON.MeshBuilder.CreateCylinder('stand', { diameter: 0.1 * S, height: 0.2 * S }, scene);
  stand.position.y = 0.02 * S;
  stand.parent = parent;
  stand.material = bezelMat;

  // Base
  const base = BABYLON.MeshBuilder.CreateCylinder('base', { diameter: 0.25 * S, height: 0.03 * S }, scene);
  base.position.y = -0.08 * S;
  base.parent = parent;
  base.material = bezelMat;
}

function createWallClock(scene: BABYLON.Scene, parent: BABYLON.TransformNode, mat: BABYLON.Material, shadowGen: BABYLON.ShadowGenerator, S: number): void {
  // Clock face
  const face = BABYLON.MeshBuilder.CreateCylinder('face', { diameter: 0.5 * S, height: 0.08 * S }, scene);
  face.rotation.x = Math.PI / 2;
  face.position.y = 0.15 * S;
  face.parent = parent;
  face.material = mat;
  shadowGen.addShadowCaster(face);

  // Frame
  const frameMat = new BABYLON.StandardMaterial('frameMat', scene);
  frameMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.32);

  const frame = BABYLON.MeshBuilder.CreateTorus('frame', { diameter: 0.52 * S, thickness: 0.03 * S }, scene);
  frame.rotation.x = Math.PI / 2;
  frame.position.y = 0.15 * S;
  frame.parent = parent;
  frame.material = frameMat;

  // Clock hands
  const handMat = new BABYLON.StandardMaterial('handMat', scene);
  handMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);

  const hourHand = BABYLON.MeshBuilder.CreateBox('hourHand', { width: 0.02 * S, height: 0.12 * S, depth: 0.01 * S }, scene);
  hourHand.position.set(0, 0.2 * S, 0.05 * S);
  hourHand.rotation.z = Math.PI / 4;
  hourHand.parent = parent;
  hourHand.material = handMat;

  const minHand = BABYLON.MeshBuilder.CreateBox('minHand', { width: 0.015 * S, height: 0.18 * S, depth: 0.01 * S }, scene);
  minHand.position.set(0, 0.15 * S, 0.05 * S);
  minHand.rotation.z = -Math.PI / 3;
  minHand.parent = parent;
  minHand.material = handMat;
}

function createHeadphones(scene: BABYLON.Scene, parent: BABYLON.TransformNode, mat: BABYLON.Material, shadowGen: BABYLON.ShadowGenerator, S: number): void {
  // Headband
  const bandMat = new BABYLON.StandardMaterial('bandMat', scene);
  bandMat.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.18);

  const band = BABYLON.MeshBuilder.CreateTube('band', {
    path: [
      new BABYLON.Vector3(-0.15 * S, 0, 0),
      new BABYLON.Vector3(-0.12 * S, 0.1 * S, 0),
      new BABYLON.Vector3(0, 0.15 * S, 0),
      new BABYLON.Vector3(0.12 * S, 0.1 * S, 0),
      new BABYLON.Vector3(0.15 * S, 0, 0)
    ],
    radius: 0.03 * S,
    tessellation: 12,
    cap: BABYLON.Mesh.CAP_ALL
  }, scene);
  band.position.y = 0.25 * S;
  band.parent = parent;
  band.material = bandMat;
  shadowGen.addShadowCaster(band);

  // Ear cups
  const cupMat = new BABYLON.StandardMaterial('cupMat', scene);
  cupMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.22);

  const leftCup = BABYLON.MeshBuilder.CreateCylinder('leftCup', { diameter: 0.15 * S, height: 0.08 * S }, scene);
  leftCup.rotation.z = Math.PI / 2;
  leftCup.position.set(-0.18 * S, 0.1 * S, 0);
  leftCup.parent = parent;
  leftCup.material = cupMat;
  shadowGen.addShadowCaster(leftCup);

  const rightCup = BABYLON.MeshBuilder.CreateCylinder('rightCup', { diameter: 0.15 * S, height: 0.08 * S }, scene);
  rightCup.rotation.z = Math.PI / 2;
  rightCup.position.set(0.18 * S, 0.1 * S, 0);
  rightCup.parent = parent;
  rightCup.material = cupMat;
  shadowGen.addShadowCaster(rightCup);

  // Cushions
  const cushionMat = new BABYLON.StandardMaterial('cushionMat', scene);
  cushionMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.32);

  const leftCushion = BABYLON.MeshBuilder.CreateCylinder('leftCushion', { diameter: 0.12 * S, height: 0.04 * S }, scene);
  leftCushion.rotation.z = Math.PI / 2;
  leftCushion.position.set(-0.2 * S, 0.1 * S, 0);
  leftCushion.parent = parent;
  leftCushion.material = cushionMat;

  const rightCushion = BABYLON.MeshBuilder.CreateCylinder('rightCushion', { diameter: 0.12 * S, height: 0.04 * S }, scene);
  rightCushion.rotation.z = Math.PI / 2;
  rightCushion.position.set(0.2 * S, 0.1 * S, 0);
  rightCushion.parent = parent;
  rightCushion.material = cushionMat;
}

function createBooks(scene: BABYLON.Scene, parent: BABYLON.TransformNode, mat: BABYLON.Material, shadowGen: BABYLON.ShadowGenerator, S: number): void {
  const bookColors = [
    new BABYLON.Color3(0.6, 0.3, 0.1),
    new BABYLON.Color3(0.2, 0.4, 0.6),
    new BABYLON.Color3(0.5, 0.2, 0.3)
  ];

  for (let i = 0; i < 3; i++) {
    const bookMat = new BABYLON.StandardMaterial('bookMat' + i, scene);
    bookMat.diffuseColor = bookColors[i];

    const book = BABYLON.MeshBuilder.CreateBox('book' + i, {
      width: 0.25 * S,
      height: 0.35 * S,
      depth: 0.06 * S
    }, scene);
    book.position.set(0, 0.18 * S, (i - 1) * 0.08 * S);
    book.parent = parent;
    book.material = bookMat;
    shadowGen.addShadowCaster(book);
  }
}

function createSpeaker(scene: BABYLON.Scene, parent: BABYLON.TransformNode, mat: BABYLON.Material, shadowGen: BABYLON.ShadowGenerator, S: number): void {
  // Body
  const body = BABYLON.MeshBuilder.CreateCylinder('body', { diameter: 0.3 * S, height: 0.45 * S }, scene);
  body.position.y = 0.23 * S;
  body.parent = parent;
  body.material = mat;
  shadowGen.addShadowCaster(body);

  // Speaker grille
  const grilleMat = new BABYLON.StandardMaterial('grilleMat', scene);
  grilleMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.22);

  const grille = BABYLON.MeshBuilder.CreateCylinder('grille', { diameter: 0.25 * S, height: 0.32 * S }, scene);
  grille.position.y = 0.23 * S;
  grille.parent = parent;
  grille.material = grilleMat;

  // Base
  const baseMat = new BABYLON.StandardMaterial('baseMat', scene);
  baseMat.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.18);

  const base = BABYLON.MeshBuilder.CreateCylinder('base', { diameter: 0.28 * S, height: 0.05 * S }, scene);
  base.position.y = 0.025 * S;
  base.parent = parent;
  base.material = baseMat;
}

function createKeyboard(scene: BABYLON.Scene, parent: BABYLON.TransformNode, mat: BABYLON.Material, shadowGen: BABYLON.ShadowGenerator, S: number): void {
  // Base
  const base = BABYLON.MeshBuilder.CreateBox('kbBase', { width: 0.7 * S, height: 0.04 * S, depth: 0.25 * S }, scene);
  base.position.y = 0.02 * S;
  base.parent = parent;
  base.material = mat;
  shadowGen.addShadowCaster(base);

  // Keys (simplified grid)
  const keyMat = new BABYLON.StandardMaterial('keyMat', scene);
  keyMat.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.97);

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      const key = BABYLON.MeshBuilder.CreateBox('key' + row + col, {
        width: 0.06 * S,
        height: 0.02 * S,
        depth: 0.06 * S
      }, scene);
      key.position.set(
        (col - 3.5) * 0.08 * S,
        0.05 * S,
        (row - 1) * 0.07 * S
      );
      key.parent = parent;
      key.material = keyMat;
    }
  }
}

function createLEDLights(scene: BABYLON.Scene): void {
  // LED strip on back wall - from original HTML
  const ledMat = new BABYLON.StandardMaterial('ledMat', scene);
  ledMat.diffuseColor = new BABYLON.Color3(0.3, 0.6, 1);
  ledMat.emissiveColor = new BABYLON.Color3(0.3, 0.6, 1);

  for (let i = -5; i <= 5; i += 0.5) {
    const led = BABYLON.MeshBuilder.CreateSphere('led', { diameter: 0.1 }, scene);
    led.position.set(i, 7, -4.8);
    led.material = ledMat;

    // Point light for glow effect
    if (Math.abs(i) % 2 === 0) {
      const light = new BABYLON.PointLight('ledLight' + i, new BABYLON.Vector3(i, 7, -4.5), scene);
      light.intensity = 0.15;
      light.range = 3;
      light.diffuse = new BABYLON.Color3(0.3, 0.6, 1);
    }
  }
}

// Animate item moving to crate with arc - from original HTML
export async function animateItemToCrate(
  itemMesh: ItemMesh,
  crateBase: BABYLON.Mesh,
  crateSlots: BABYLON.Vector3[],
  slotIndex: number
): Promise<void> {
  playMoveSfx();

  const startPos = itemMesh.position.clone();
  const cratePos = crateBase.position;
  const slot = crateSlots[slotIndex];
  const endPos = new BABYLON.Vector3(
    cratePos.x + slot.x,
    cratePos.y + slot.y - 0.4,
    cratePos.z + slot.z
  );

  // Arc animation
  const midY = Math.max(startPos.y, endPos.y) + 1.5;

  return new Promise(resolve => {
    const tl = gsap.timeline({
      onComplete: () => {
        itemMesh.inCrate = true;
        itemMesh.crateSlot = slotIndex;
        resolve();
      }
    });

    tl.to(itemMesh.position, {
      y: midY,
      duration: 0.3,
      ease: 'power2.out'
    });

    tl.to(itemMesh.position, {
      x: endPos.x,
      z: endPos.z,
      duration: 0.4,
      ease: 'power2.inOut'
    }, '<');

    tl.to(itemMesh.position, {
      y: endPos.y,
      duration: 0.3,
      ease: 'power2.in'
    });

    tl.to(itemMesh.scaling, {
      x: 0.7,
      y: 0.7,
      z: 0.7,
      duration: 0.3
    }, '-=0.3');
  });
}

// Animate item back to original position - from original HTML
export async function animateItemFromCrate(itemMesh: ItemMesh): Promise<void> {
  playMoveSfx();

  const startPos = itemMesh.position.clone();
  const endPos = itemMesh.originalPosition;

  // Arc animation
  const midY = Math.max(startPos.y, endPos.y) + 1.5;

  return new Promise(resolve => {
    const tl = gsap.timeline({
      onComplete: () => {
        itemMesh.inCrate = false;
        itemMesh.crateSlot = null;
        resolve();
      }
    });

    tl.to(itemMesh.position, {
      y: midY,
      duration: 0.3,
      ease: 'power2.out'
    });

    tl.to(itemMesh.position, {
      x: endPos.x,
      z: endPos.z,
      duration: 0.4,
      ease: 'power2.inOut'
    }, '<');

    tl.to(itemMesh.position, {
      y: endPos.y,
      duration: 0.3,
      ease: 'power2.in'
    });

    tl.to(itemMesh.scaling, {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.3
    }, '-=0.3');
  });
}

// Reset all items to original positions
export function resetItems(itemMeshes: ItemMesh[]): void {
  itemMeshes.forEach(mesh => {
    mesh.position.copyFrom(mesh.originalPosition);
    mesh.scaling.set(1, 1, 1);
    mesh.inCrate = false;
    mesh.crateSlot = null;
  });
}
