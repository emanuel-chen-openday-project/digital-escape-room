// Knapsack Game Babylon.js Scene Module
// Converted 1:1 from original HTML

import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import { Item, ITEMS, IS_MOBILE, SCALE, ITEM_SCALE } from './types';

export interface ItemRoot extends BABYLON.TransformNode {
  metadata: {
    type: string;
    index: number;
    selected: boolean;
    basePosition: BABYLON.Vector3;
    slotIndex: number | null;
    labelRect?: GUI.Rectangle;
    itemIndex?: number;
  };
}

export interface StepsInfo {
  lowTopY: number;
  highTopY: number;
  lowZ: number;
  highZ: number;
  itemsCenterX: number;
}

export interface SceneRefs {
  scene: BABYLON.Scene;
  engine: BABYLON.Engine;
  camera: BABYLON.ArcRotateCamera;
  ui: GUI.AdvancedDynamicTexture;
  itemRoots: ItemRoot[];
  crateBase: BABYLON.Mesh;
  crateSlots: BABYLON.Vector3[];
  stepsInfo: StepsInfo;
}

// Sound
let moveAudio: HTMLAudioElement | null = null;

export function playMoveSfx(): void {
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
    preserveDrawingBuffer: true,
    stencil: true,
    antialias: true,
    adaptToDeviceRatio: true
  });
  engine.setHardwareScalingLevel(1 / window.devicePixelRatio);

  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.89, 0.93, 0.98, 1);

  // Lights - EXACT from original
  const hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.4;
  hemi.groundColor = new BABYLON.Color3(0.8, 0.85, 0.9);

  const dir = new BABYLON.DirectionalLight("dir", new BABYLON.Vector3(-0.5, -1, -0.5), scene);
  dir.intensity = 0.7;
  dir.position = new BABYLON.Vector3(10, 20, 10);

  // Shadow - EXACT from original
  const shadowGen = new BABYLON.ShadowGenerator(1024, dir);
  shadowGen.useBlurExponentialShadowMap = true;
  shadowGen.blurKernel = 16;

  // Camera - EXACT from original
  const camRadius = IS_MOBILE ? 22 * SCALE : 28 * SCALE;
  const camBeta = IS_MOBILE ? BABYLON.Tools.ToRadians(55) : BABYLON.Tools.ToRadians(65);
  const camTarget = IS_MOBILE ? new BABYLON.Vector3(0, 2.5 * SCALE, 0) : new BABYLON.Vector3(2 * SCALE, 2 * SCALE, 0);

  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    BABYLON.Tools.ToRadians(90),
    camBeta,
    camRadius,
    camTarget,
    scene
  );
  camera.attachControl(canvas, true);
  camera.inputs.clear();
  camera.lowerRadiusLimit = camRadius;
  camera.upperRadiusLimit = camRadius;

  camera.fovMode = BABYLON.Camera.FOVMODE_HORIZONTAL_FIXED;
  camera.fov = 1.2;

  // GUI - set idealWidth/idealHeight for consistent label sizing across DPI
  const ui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
  ui.idealWidth = 1920;
  ui.idealHeight = 1080;
  ui.renderAtIdealSize = true;

  // Create environment and get steps info
  const stepsInfo = createEnvironment(scene, shadowGen);

  // Create crate and slots
  const { crateBase, crateSlots } = createCrate(scene, shadowGen, ui);

  // Create items
  const itemRoots = createItems(scene, shadowGen, ui, stepsInfo);

  return {
    scene,
    engine,
    camera,
    ui,
    itemRoots,
    crateBase,
    crateSlots,
    stepsInfo
  };
}

function createEnvironment(scene: BABYLON.Scene, shadowGen: BABYLON.ShadowGenerator): StepsInfo {
  // Floor - EXACT from original
  const floor = BABYLON.MeshBuilder.CreateGround("floor", { width: 50 * SCALE, height: 35 * SCALE }, scene);
  const floorMat = new BABYLON.StandardMaterial("floorMat", scene);
  floorMat.diffuseColor = new BABYLON.Color3(0.92, 0.94, 0.96);
  floorMat.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
  floor.material = floorMat;
  floor.receiveShadows = true;
  floor.isPickable = false;

  // Grid lines on floor - EXACT from original
  for (let i = -3; i <= 3; i++) {
    const line = BABYLON.MeshBuilder.CreateBox("gridLine" + i, {
      width: 50 * SCALE, height: 0.02 * SCALE, depth: 0.08 * SCALE
    }, scene);
    line.position.z = i * 2.5 * SCALE;
    line.position.y = 0.01 * SCALE;
    const lineMat = new BABYLON.StandardMaterial("lineMat" + i, scene);
    lineMat.diffuseColor = new BABYLON.Color3(0.7, 0.8, 0.9);
    lineMat.alpha = 0.5;
    line.material = lineMat;
    line.isPickable = false;
  }

  // Back wall - EXACT from original
  const wall = BABYLON.MeshBuilder.CreateBox("wall", {
    width: 50 * SCALE, height: 15 * SCALE, depth: 0.3 * SCALE
  }, scene);
  wall.position = new BABYLON.Vector3(0, 7.5 * SCALE, -12 * SCALE);
  const wallMat = new BABYLON.StandardMaterial("wallMat", scene);
  wallMat.diffuseColor = new BABYLON.Color3(0.95, 0.96, 0.98);
  wall.material = wallMat;
  wall.isPickable = false;

  // LED strip - EXACT from original
  const led = BABYLON.MeshBuilder.CreateBox("led", {
    width: 40 * SCALE, height: 0.2 * SCALE, depth: 0.1 * SCALE
  }, scene);
  led.position = new BABYLON.Vector3(0, 12 * SCALE, -11.8 * SCALE);
  const ledMat = new BABYLON.StandardMaterial("ledMat", scene);
  ledMat.emissiveColor = new BABYLON.Color3(0.3, 0.7, 1);
  led.material = ledMat;
  led.isPickable = false;

  // Table top - EXACT from original
  const tableTop = BABYLON.MeshBuilder.CreateBox("tableTop", {
    width: 28 * SCALE, depth: 14 * SCALE, height: 0.4 * SCALE
  }, scene);
  const tableY = 2.5 * SCALE;
  tableTop.position.y = tableY;
  const tableMat = new BABYLON.StandardMaterial("tableMat", scene);
  tableMat.diffuseColor = new BABYLON.Color3(0.96, 0.94, 0.9);
  tableMat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
  tableTop.material = tableMat;
  tableTop.receiveShadows = true;
  tableTop.isPickable = false;

  // Table legs - EXACT from original
  const legMat = new BABYLON.StandardMaterial("legMat", scene);
  legMat.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.75);

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = BABYLON.MeshBuilder.CreateCylinder("leg", {
        diameter: 0.4 * SCALE, height: tableY
      }, scene);
      leg.position = new BABYLON.Vector3(sx * 12 * SCALE, tableY / 2, sz * 5.5 * SCALE);
      leg.material = legMat;
      leg.isPickable = false;
    }
  }

  // Steps material - EXACT from original
  const stepMat = new BABYLON.StandardMaterial("stepMat", scene);
  stepMat.diffuseColor = new BABYLON.Color3(0.88, 0.91, 0.95);
  stepMat.specularColor = new BABYLON.Color3(0.6, 0.6, 0.7);

  const itemsCenterX = -5 * SCALE;

  // Lower step - EXACT from original
  const stepLow = BABYLON.MeshBuilder.CreateBox("stepLow", {
    width: 18 * SCALE, depth: 4 * SCALE, height: 0.4 * SCALE
  }, scene);
  stepLow.position = new BABYLON.Vector3(itemsCenterX, tableY + 0.45 * SCALE, 4.5 * SCALE);
  stepLow.material = stepMat;
  stepLow.receiveShadows = true;
  stepLow.isPickable = false;

  // Higher step - EXACT from original
  const stepHigh = BABYLON.MeshBuilder.CreateBox("stepHigh", {
    width: 18 * SCALE, depth: 5 * SCALE, height: 0.8 * SCALE
  }, scene);
  stepHigh.position = new BABYLON.Vector3(itemsCenterX, tableY + 0.85 * SCALE, -1 * SCALE);
  stepHigh.material = stepMat;
  stepHigh.receiveShadows = true;
  stepHigh.isPickable = false;

  return {
    lowTopY: stepLow.position.y + 0.2 * SCALE + 0.1 * SCALE,
    highTopY: stepHigh.position.y + 0.4 * SCALE + 0.1 * SCALE,
    lowZ: stepLow.position.z,
    highZ: stepHigh.position.z,
    itemsCenterX
  };
}

function createCrate(scene: BABYLON.Scene, shadowGen: BABYLON.ShadowGenerator, ui: GUI.AdvancedDynamicTexture): { crateBase: BABYLON.Mesh; crateSlots: BABYLON.Vector3[] } {
  const crateX = 10 * SCALE;
  const crateY = 2.7 * SCALE;
  const crateZ = 1.5 * SCALE;
  const boxWidth = 8 * SCALE;
  const boxHeight = 3.5 * SCALE;
  const boxDepth = 6 * SCALE;
  const wallThickness = 0.15 * SCALE;

  // Cardboard material - EXACT from original
  const cardboardMat = new BABYLON.StandardMaterial("cardboardMat", scene);
  cardboardMat.diffuseColor = new BABYLON.Color3(0.76, 0.6, 0.4);
  cardboardMat.specularColor = new BABYLON.Color3(0.08, 0.08, 0.08);
  cardboardMat.specularPower = 4;

  // Transparent cardboard - EXACT from original
  const transparentCardboard = new BABYLON.StandardMaterial("transparentCardboard", scene);
  transparentCardboard.diffuseColor = new BABYLON.Color3(0.78, 0.62, 0.42);
  transparentCardboard.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
  transparentCardboard.alpha = 0.35;

  // Rim material - EXACT from original
  const rimMat = new BABYLON.StandardMaterial("rimMat", scene);
  rimMat.diffuseColor = new BABYLON.Color3(0.65, 0.48, 0.3);

  // Base - EXACT from original
  const crateBase = BABYLON.MeshBuilder.CreateBox("crateBase", {
    width: boxWidth, height: wallThickness, depth: boxDepth
  }, scene);
  crateBase.position = new BABYLON.Vector3(crateX, crateY, crateZ);
  crateBase.material = cardboardMat;
  crateBase.isPickable = false;

  // Transparent walls - EXACT from original
  const frontWall = BABYLON.MeshBuilder.CreateBox("frontWall", {
    width: boxWidth, height: boxHeight, depth: wallThickness
  }, scene);
  frontWall.position = new BABYLON.Vector3(crateX, crateY + boxHeight / 2, crateZ + boxDepth / 2);
  frontWall.material = transparentCardboard;
  frontWall.isPickable = false;

  const backWall = BABYLON.MeshBuilder.CreateBox("backWall", {
    width: boxWidth, height: boxHeight, depth: wallThickness
  }, scene);
  backWall.position = new BABYLON.Vector3(crateX, crateY + boxHeight / 2, crateZ - boxDepth / 2);
  backWall.material = transparentCardboard;
  backWall.isPickable = false;

  const rightWall = BABYLON.MeshBuilder.CreateBox("rightWall", {
    width: wallThickness, height: boxHeight, depth: boxDepth
  }, scene);
  rightWall.position = new BABYLON.Vector3(crateX + boxWidth / 2, crateY + boxHeight / 2, crateZ);
  rightWall.material = transparentCardboard;
  rightWall.isPickable = false;

  const leftWall = BABYLON.MeshBuilder.CreateBox("leftWall", {
    width: wallThickness, height: boxHeight, depth: boxDepth
  }, scene);
  leftWall.position = new BABYLON.Vector3(crateX - boxWidth / 2, crateY + boxHeight / 2, crateZ);
  leftWall.material = transparentCardboard;
  leftWall.isPickable = false;

  // Transparent flaps - EXACT from original
  const flapHeight = boxDepth / 2 * 0.85;
  const flapThickness = wallThickness * 0.8;

  const frontFlap = BABYLON.MeshBuilder.CreateBox("frontFlap", {
    width: boxWidth - 0.3 * SCALE, height: flapThickness, depth: flapHeight
  }, scene);
  frontFlap.position = new BABYLON.Vector3(crateX, crateY + boxHeight, crateZ + boxDepth / 2 + flapHeight / 2 - 0.1 * SCALE);
  frontFlap.rotation.x = -0.2;
  frontFlap.material = transparentCardboard;
  frontFlap.isPickable = false;

  const backFlap = BABYLON.MeshBuilder.CreateBox("backFlap", {
    width: boxWidth - 0.3 * SCALE, height: flapThickness, depth: flapHeight
  }, scene);
  backFlap.position = new BABYLON.Vector3(crateX, crateY + boxHeight, crateZ - boxDepth / 2 - flapHeight / 2 + 0.1 * SCALE);
  backFlap.rotation.x = 0.2;
  backFlap.material = transparentCardboard;
  backFlap.isPickable = false;

  const rightFlap = BABYLON.MeshBuilder.CreateBox("rightFlap", {
    width: boxWidth / 2 * 0.85, height: flapThickness, depth: boxDepth - 0.3 * SCALE
  }, scene);
  rightFlap.position = new BABYLON.Vector3(crateX + boxWidth / 2 + boxWidth / 4 * 0.85 - 0.1 * SCALE, crateY + boxHeight, crateZ);
  rightFlap.rotation.z = 0.25;
  rightFlap.material = transparentCardboard;
  rightFlap.isPickable = false;

  const leftFlap = BABYLON.MeshBuilder.CreateBox("leftFlap", {
    width: boxWidth / 2 * 0.85, height: flapThickness, depth: boxDepth - 0.3 * SCALE
  }, scene);
  leftFlap.position = new BABYLON.Vector3(crateX - boxWidth / 2 - boxWidth / 4 * 0.85 + 0.1 * SCALE, crateY + boxHeight, crateZ);
  leftFlap.rotation.z = -0.25;
  leftFlap.material = transparentCardboard;
  leftFlap.isPickable = false;

  // Top rim - EXACT from original
  const topFrames = [
    { w: boxWidth + 0.1 * SCALE, d: wallThickness * 2, x: 0, z: crateZ + boxDepth / 2 },
    { w: boxWidth + 0.1 * SCALE, d: wallThickness * 2, x: 0, z: crateZ - boxDepth / 2 },
    { w: wallThickness * 2, d: boxDepth, x: boxWidth / 2, z: crateZ },
    { w: wallThickness * 2, d: boxDepth, x: -boxWidth / 2, z: crateZ }
  ];
  topFrames.forEach((f, i) => {
    const rim = BABYLON.MeshBuilder.CreateBox("rim" + i, {
      width: f.w, height: 0.15 * SCALE, depth: f.d
    }, scene);
    rim.position = new BABYLON.Vector3(crateX + f.x, crateY + boxHeight, f.z);
    rim.material = rimMat;
    rim.isPickable = false;
  });

  // Wave lines on walls - EXACT from original
  const waveMat = new BABYLON.StandardMaterial("waveMat", scene);
  waveMat.diffuseColor = new BABYLON.Color3(0.55, 0.4, 0.25);
  waveMat.alpha = 0.4;

  for (let i = 0; i < 3; i++) {
    const lineFront = BABYLON.MeshBuilder.CreateBox("waveFront" + i, {
      width: boxWidth - 0.8 * SCALE, height: 0.05 * SCALE, depth: 0.02 * SCALE
    }, scene);
    lineFront.position = new BABYLON.Vector3(crateX, crateY + 0.8 * SCALE + i * 1 * SCALE, crateZ + boxDepth / 2 + 0.1 * SCALE);
    lineFront.material = waveMat;
    lineFront.isPickable = false;

    const lineBack = BABYLON.MeshBuilder.CreateBox("waveBack" + i, {
      width: boxWidth - 0.8 * SCALE, height: 0.05 * SCALE, depth: 0.02 * SCALE
    }, scene);
    lineBack.position = new BABYLON.Vector3(crateX, crateY + 0.8 * SCALE + i * 1 * SCALE, crateZ - boxDepth / 2 - 0.1 * SCALE);
    lineBack.material = waveMat;
    lineBack.isPickable = false;
  }

  // Green slot markers - EXACT from original
  const markerMat = new BABYLON.StandardMaterial("markerMat", scene);
  markerMat.diffuseColor = new BABYLON.Color3(0.4, 0.7, 0.4);
  markerMat.alpha = 0.25;

  const slotCenter = new BABYLON.Vector3(crateX, crateY + 0.2 * SCALE, crateZ);
  const slotSpacingX = 2.4 * SCALE;
  const slotSpacingZ = 1.8 * SCALE;

  const crateSlots: BABYLON.Vector3[] = [];

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const pos = new BABYLON.Vector3(
        slotCenter.x + (col - 1) * slotSpacingX,
        slotCenter.y + row * 1.5 * SCALE,
        slotCenter.z + (row === 0 ? 1 : -1) * slotSpacingZ
      );
      crateSlots.push(pos);

      // Green marker
      const marker = BABYLON.MeshBuilder.CreateBox("marker" + row + col, {
        width: 2 * SCALE, height: 0.08 * SCALE, depth: 1.5 * SCALE
      }, scene);
      marker.position = new BABYLON.Vector3(pos.x, crateY + 0.1 * SCALE + row * 0.05 * SCALE, pos.z);
      marker.material = markerMat;
      marker.isPickable = false;
    }
  }

  // Crate label - EXACT from original
  const label = new GUI.Rectangle();
  label.width = "160px";
  label.height = "44px";
  label.thickness = 0;
  label.cornerRadius = 10;
  label.background = "rgba(255,255,255,0.95)";
  ui.addControl(label);
  label.linkWithMesh(crateBase);
  label.linkOffsetY = 100;
  label.linkOffsetX = -30;

  const labelText = new GUI.TextBlock();
  labelText.text = "📦 החבילה שלך";
  labelText.color = "#6D4C2A";
  labelText.fontSize = 18;
  labelText.fontFamily = "Heebo";
  labelText.fontWeight = "700";
  label.addControl(labelText);

  return { crateBase, crateSlots };
}

function createItems(scene: BABYLON.Scene, shadowGen: BABYLON.ShadowGenerator, ui: GUI.AdvancedDynamicTexture, stepsInfo: StepsInfo): ItemRoot[] {
  const itemRoots: ItemRoot[] = [];

  const startX = stepsInfo.itemsCenterX - 5 * SCALE;
  const gapX = 5 * SCALE;
  const rowY = [stepsInfo.lowTopY, stepsInfo.highTopY];
  const rowZ = [stepsInfo.lowZ, stepsInfo.highZ];

  ITEMS.forEach((item, i) => {
    const row = i < 3 ? 0 : 1;
    const col = i % 3;

    const root = new BABYLON.TransformNode("itemRoot_" + i, scene) as ItemRoot;

    // Lower row items slightly forward - EXACT from original
    const zOffset = row === 0 ? 1 * SCALE : 0;

    root.position = new BABYLON.Vector3(
      startX + col * gapX,
      rowY[row],
      rowZ[row] + zOffset
    );

    buildItemModel(scene, root, item, shadowGen);

    root.metadata = {
      type: "itemRoot",
      index: i,
      selected: false,
      basePosition: root.position.clone(),
      slotIndex: null
    };

    // Item label - EXACT from original
    const rect = new GUI.Rectangle();
    rect.width = IS_MOBILE ? "100px" : "110px";
    rect.height = IS_MOBILE ? "62px" : "68px";
    rect.thickness = 0;
    rect.cornerRadius = 12;
    rect.background = "rgba(255,255,255,0.95)";
    rect.shadowBlur = 10;
    rect.shadowColor = "rgba(0,0,0,0.2)";
    ui.addControl(rect);
    rect.linkWithMesh(root);
    rect.linkOffsetY = row === 0 ? -95 : -80;

    // Monitor label offset - EXACT from original
    if (i === 0) {
      rect.linkOffsetX = 40;
    }

    root.metadata.labelRect = rect;
    root.metadata.itemIndex = i;

    const stack = new GUI.StackPanel();
    stack.isVertical = true;
    rect.addControl(stack);

    const nameTxt = new GUI.TextBlock();
    nameTxt.text = item.emoji + " " + item.name;
    nameTxt.color = "#263238";
    nameTxt.fontSize = IS_MOBILE ? 16 : 18;
    nameTxt.fontFamily = "Heebo";
    nameTxt.fontWeight = "700";
    nameTxt.height = "28px";
    stack.addControl(nameTxt);

    const weightTxt = new GUI.TextBlock();
    weightTxt.text = "משקל: " + item.weight + " ק\"ג";
    weightTxt.color = "#1565C0";
    weightTxt.fontSize = IS_MOBILE ? 13 : 14;
    weightTxt.fontFamily = "Heebo";
    weightTxt.fontWeight = "600";
    weightTxt.height = "18px";
    weightTxt.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    stack.addControl(weightTxt);

    const priceTxt = new GUI.TextBlock();
    priceTxt.text = "רווח: " + item.value + " ש\"ח";
    priceTxt.color = "#1976D2";
    priceTxt.fontSize = IS_MOBILE ? 13 : 14;
    priceTxt.fontFamily = "Heebo";
    priceTxt.fontWeight = "700";
    priceTxt.height = "18px";
    priceTxt.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    stack.addControl(priceTxt);

    itemRoots.push(root);
  });

  return itemRoots;
}

function buildItemModel(scene: BABYLON.Scene, root: BABYLON.TransformNode, item: Item, shadowGen: BABYLON.ShadowGenerator): void {
  const S = SCALE * ITEM_SCALE;

  // Hitbox for click area - EXACT from original
  const hitboxSize = 2.5 * S;
  const hitbox = BABYLON.MeshBuilder.CreateBox("hitbox_" + item.type, {
    width: hitboxSize,
    height: hitboxSize,
    depth: hitboxSize
  }, scene);
  hitbox.parent = root;
  hitbox.position.y = hitboxSize / 2;
  hitbox.visibility = 0;
  hitbox.isPickable = true;

  const metalMat = new BABYLON.StandardMaterial("metalMat_" + item.type, scene);
  metalMat.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.65);
  metalMat.specularColor = new BABYLON.Color3(0.9, 0.9, 1);
  metalMat.specularPower = 64;

  const colorMat = new BABYLON.StandardMaterial("colorMat_" + item.type, scene);
  colorMat.diffuseColor = item.color;
  colorMat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.6);
  colorMat.specularPower = 32;

  // Build each item type - EXACT from original
  switch (item.type) {
    case "monitor":
      buildMonitor(scene, root, colorMat, metalMat, shadowGen, S);
      break;
    case "wallclock":
      buildWallClock(scene, root, colorMat, shadowGen, S);
      break;
    case "headphones":
      buildHeadphones(scene, root, colorMat, shadowGen, S);
      break;
    case "books":
      buildBooks(scene, root, shadowGen, S);
      break;
    case "speaker":
      buildSpeaker(scene, root, colorMat, shadowGen, S);
      break;
    case "keyboard":
      buildKeyboard(scene, root, colorMat, shadowGen, S);
      break;
  }
}

function buildMonitor(scene: BABYLON.Scene, root: BABYLON.TransformNode, colorMat: BABYLON.StandardMaterial, metalMat: BABYLON.StandardMaterial, shadowGen: BABYLON.ShadowGenerator, S: number): void {
  const screen = BABYLON.MeshBuilder.CreateBox("screen", { width: 2.2 * S, height: 1.4 * S, depth: 0.12 * S }, scene);
  screen.parent = root;
  screen.position.y = 1.2 * S;
  screen.material = colorMat;
  shadowGen.addShadowCaster(screen);

  const display = BABYLON.MeshBuilder.CreateBox("display", { width: 2 * S, height: 1.2 * S, depth: 0.02 * S }, scene);
  display.parent = root;
  display.position = new BABYLON.Vector3(0, 1.2 * S, 0.08 * S);
  const displayMat = new BABYLON.StandardMaterial("displayMat", scene);
  displayMat.emissiveColor = new BABYLON.Color3(0.1, 0.25, 0.4);
  display.material = displayMat;

  const stand = BABYLON.MeshBuilder.CreateBox("stand", { width: 0.25 * S, height: 0.8 * S, depth: 0.25 * S }, scene);
  stand.parent = root;
  stand.position.y = 0.4 * S;
  stand.material = metalMat;
  shadowGen.addShadowCaster(stand);

  const base = BABYLON.MeshBuilder.CreateCylinder("base", { diameter: 1.2 * S, height: 0.1 * S }, scene);
  base.parent = root;
  base.position.y = 0.05 * S;
  base.material = metalMat;
  shadowGen.addShadowCaster(base);
}

function buildWallClock(scene: BABYLON.Scene, root: BABYLON.TransformNode, colorMat: BABYLON.StandardMaterial, shadowGen: BABYLON.ShadowGenerator, S: number): void {
  // Clock body
  const body = BABYLON.MeshBuilder.CreateCylinder("body", { diameter: 1.8 * S, height: 0.15 * S }, scene);
  body.parent = root;
  body.position.y = 0.9 * S;
  body.rotation.x = Math.PI / 2;
  body.material = colorMat;
  shadowGen.addShadowCaster(body);

  // Frame
  const frame = BABYLON.MeshBuilder.CreateTorus("frame", { diameter: 1.85 * S, thickness: 0.1 * S, tessellation: 32 }, scene);
  frame.parent = root;
  frame.position.y = 0.9 * S;
  frame.rotation.x = Math.PI / 2;
  const frameMat = new BABYLON.StandardMaterial("frameMat", scene);
  frameMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.35);
  frame.material = frameMat;
  shadowGen.addShadowCaster(frame);

  // Clock face
  const face = BABYLON.MeshBuilder.CreateCylinder("face", { diameter: 1.6 * S, height: 0.02 * S }, scene);
  face.parent = root;
  face.position = new BABYLON.Vector3(0, 0.9 * S, 0.08 * S);
  face.rotation.x = Math.PI / 2;
  const faceMat = new BABYLON.StandardMaterial("faceMat", scene);
  faceMat.diffuseColor = new BABYLON.Color3(0.98, 0.98, 0.98);
  face.material = faceMat;

  // Hour hand
  const handMat = new BABYLON.StandardMaterial("handMat", scene);
  handMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.15);

  const hourHand = BABYLON.MeshBuilder.CreateBox("hourHand", { width: 0.08 * S, height: 0.4 * S, depth: 0.03 * S }, scene);
  hourHand.parent = root;
  hourHand.position = new BABYLON.Vector3(0, 1.05 * S, 0.1 * S);
  hourHand.rotation.z = 0.5;
  hourHand.material = handMat;

  // Minute hand
  const minHand = BABYLON.MeshBuilder.CreateBox("minHand", { width: 0.05 * S, height: 0.6 * S, depth: 0.03 * S }, scene);
  minHand.parent = root;
  minHand.position = new BABYLON.Vector3(0.15 * S, 1.1 * S, 0.1 * S);
  minHand.rotation.z = -0.8;
  minHand.material = handMat;

  // Center
  const center = BABYLON.MeshBuilder.CreateCylinder("center", { diameter: 0.12 * S, height: 0.05 * S }, scene);
  center.parent = root;
  center.position = new BABYLON.Vector3(0, 0.9 * S, 0.12 * S);
  center.rotation.x = Math.PI / 2;
  const centerMat = new BABYLON.StandardMaterial("centerMat", scene);
  centerMat.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2);
  center.material = centerMat;

  // Hour marks (12, 3, 6, 9)
  const positions = [
    { x: 0, y: 1.5 * S },
    { x: 0.55 * S, y: 0.9 * S },
    { x: 0, y: 0.3 * S },
    { x: -0.55 * S, y: 0.9 * S }
  ];
  positions.forEach((pos, i) => {
    const mark = BABYLON.MeshBuilder.CreateBox("mark" + i, { width: 0.08 * S, height: 0.15 * S, depth: 0.02 * S }, scene);
    mark.parent = root;
    mark.position = new BABYLON.Vector3(pos.x, pos.y, 0.1 * S);
    mark.material = handMat;
  });
}

function buildHeadphones(scene: BABYLON.Scene, root: BABYLON.TransformNode, colorMat: BABYLON.StandardMaterial, shadowGen: BABYLON.ShadowGenerator, S: number): void {
  const bandScale = 0.7;

  // Hit area
  const hitBox = BABYLON.MeshBuilder.CreateBox("hitBox", { width: 1.3 * S, height: 0.8 * S, depth: 0.5 * S }, scene);
  hitBox.parent = root;
  hitBox.position.y = 0.4 * S;
  hitBox.visibility = 0;

  // Headband
  const band = BABYLON.MeshBuilder.CreateTorus("band", { diameter: 1 * S * bandScale, thickness: 0.1 * S, tessellation: 32 }, scene);
  band.parent = root;
  band.position.y = 0.5 * S;
  band.rotation.x = Math.PI / 2;
  band.scaling = new BABYLON.Vector3(1, 1, 0.5);
  band.material = colorMat;
  shadowGen.addShadowCaster(band);

  // Padding
  const padMat = new BABYLON.StandardMaterial("padMat", scene);
  padMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.32);

  const padding = BABYLON.MeshBuilder.CreateBox("padding", { width: 0.4 * S, height: 0.06 * S, depth: 0.12 * S }, scene);
  padding.parent = root;
  padding.position.y = 0.68 * S;
  padding.material = padMat;

  // Left ear cup
  const earL = BABYLON.MeshBuilder.CreateCylinder("earL", { diameter: 0.4 * S, height: 0.15 * S }, scene);
  earL.parent = root;
  earL.position = new BABYLON.Vector3(-0.42 * S, 0.3 * S, 0);
  earL.rotation.z = Math.PI / 2;
  earL.material = colorMat;
  shadowGen.addShadowCaster(earL);

  // Left cushion
  const cushionL = BABYLON.MeshBuilder.CreateCylinder("cushionL", { diameter: 0.35 * S, height: 0.1 * S }, scene);
  cushionL.parent = root;
  cushionL.position = new BABYLON.Vector3(-0.5 * S, 0.3 * S, 0);
  cushionL.rotation.z = Math.PI / 2;
  cushionL.material = padMat;

  // Right ear cup
  const earR = BABYLON.MeshBuilder.CreateCylinder("earR", { diameter: 0.4 * S, height: 0.15 * S }, scene);
  earR.parent = root;
  earR.position = new BABYLON.Vector3(0.42 * S, 0.3 * S, 0);
  earR.rotation.z = Math.PI / 2;
  earR.material = colorMat;
  shadowGen.addShadowCaster(earR);

  // Right cushion
  const cushionR = BABYLON.MeshBuilder.CreateCylinder("cushionR", { diameter: 0.35 * S, height: 0.1 * S }, scene);
  cushionR.parent = root;
  cushionR.position = new BABYLON.Vector3(0.5 * S, 0.3 * S, 0);
  cushionR.rotation.z = Math.PI / 2;
  cushionR.material = padMat;
}

function buildBooks(scene: BABYLON.Scene, root: BABYLON.TransformNode, shadowGen: BABYLON.ShadowGenerator, S: number): void {
  const bookColors = [
    new BABYLON.Color3(0.7, 0.2, 0.15),
    new BABYLON.Color3(0.15, 0.4, 0.7),
    new BABYLON.Color3(0.2, 0.55, 0.25),
    new BABYLON.Color3(0.6, 0.5, 0.1)
  ];

  // 4 books - EXACT from original
  for (let i = 0; i < 4; i++) {
    const book = BABYLON.MeshBuilder.CreateBox("book" + i, {
      width: 1.2 * S + (Math.random() - 0.5) * 0.2 * S,
      height: 0.25 * S,
      depth: 1.6 * S
    }, scene);
    book.parent = root;
    book.position = new BABYLON.Vector3((Math.random() - 0.5) * 0.1 * S, 0.125 * S + i * 0.26 * S, 0);
    book.rotation.y = (Math.random() - 0.5) * 0.15;
    const bookMat = new BABYLON.StandardMaterial("bookMat" + i, scene);
    bookMat.diffuseColor = bookColors[i];
    book.material = bookMat;
    shadowGen.addShadowCaster(book);

    const spine = BABYLON.MeshBuilder.CreateBox("spine" + i, { width: 0.03 * S, height: 0.24 * S, depth: 1.55 * S }, scene);
    spine.parent = book;
    spine.position.x = -0.58 * S;
    const spineMat = new BABYLON.StandardMaterial("spineMat" + i, scene);
    spineMat.diffuseColor = new BABYLON.Color3(0.95, 0.93, 0.88);
    spine.material = spineMat;
  }
}

function buildSpeaker(scene: BABYLON.Scene, root: BABYLON.TransformNode, colorMat: BABYLON.StandardMaterial, shadowGen: BABYLON.ShadowGenerator, S: number): void {
  // Body
  const body = BABYLON.MeshBuilder.CreateBox("body", { width: 0.9 * S, height: 1.2 * S, depth: 0.7 * S }, scene);
  body.parent = root;
  body.position.y = 0.6 * S;
  body.material = colorMat;
  shadowGen.addShadowCaster(body);

  // Woofer
  const wooferMat = new BABYLON.StandardMaterial("wooferMat", scene);
  wooferMat.diffuseColor = new BABYLON.Color3(0.25, 0.25, 0.28);

  const woofer = BABYLON.MeshBuilder.CreateCylinder("woofer", { diameter: 0.55 * S, height: 0.08 * S }, scene);
  woofer.parent = root;
  woofer.position = new BABYLON.Vector3(0, 0.4 * S, 0.36 * S);
  woofer.rotation.x = Math.PI / 2;
  woofer.material = wooferMat;

  // Woofer center
  const wooferCenterMat = new BABYLON.StandardMaterial("wooferCenterMat", scene);
  wooferCenterMat.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.18);

  const wooferCenter = BABYLON.MeshBuilder.CreateCylinder("wooferCenter", { diameter: 0.2 * S, height: 0.1 * S }, scene);
  wooferCenter.parent = root;
  wooferCenter.position = new BABYLON.Vector3(0, 0.4 * S, 0.4 * S);
  wooferCenter.rotation.x = Math.PI / 2;
  wooferCenter.material = wooferCenterMat;

  // Tweeter
  const tweeter = BABYLON.MeshBuilder.CreateCylinder("tweeter", { diameter: 0.25 * S, height: 0.06 * S }, scene);
  tweeter.parent = root;
  tweeter.position = new BABYLON.Vector3(0, 0.9 * S, 0.36 * S);
  tweeter.rotation.x = Math.PI / 2;
  tweeter.material = wooferMat;

  // Tweeter dome
  const domeMat = new BABYLON.StandardMaterial("domeMat", scene);
  domeMat.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.75);
  domeMat.specularColor = new BABYLON.Color3(1, 1, 1);

  const tweeterDome = BABYLON.MeshBuilder.CreateSphere("tweeterDome", { diameter: 0.12 * S }, scene);
  tweeterDome.parent = root;
  tweeterDome.position = new BABYLON.Vector3(0, 0.9 * S, 0.38 * S);
  tweeterDome.material = domeMat;

  // LED
  const ledMat = new BABYLON.StandardMaterial("ledMat", scene);
  ledMat.emissiveColor = new BABYLON.Color3(0.2, 0.6, 1);

  const led = BABYLON.MeshBuilder.CreateCylinder("led", { diameter: 0.06 * S, height: 0.02 * S }, scene);
  led.parent = root;
  led.position = new BABYLON.Vector3(0, 1.1 * S, 0.36 * S);
  led.rotation.x = Math.PI / 2;
  led.material = ledMat;

  // Feet
  const footMat = new BABYLON.StandardMaterial("footMat", scene);
  footMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.32);

  for (const dx of [-0.3, 0.3]) {
    for (const dz of [-0.25, 0.25]) {
      const foot = BABYLON.MeshBuilder.CreateCylinder("foot", { diameter: 0.1 * S, height: 0.04 * S }, scene);
      foot.parent = root;
      foot.position = new BABYLON.Vector3(dx * S, 0.02 * S, dz * S);
      foot.material = footMat;
    }
  }
}

function buildKeyboard(scene: BABYLON.Scene, root: BABYLON.TransformNode, colorMat: BABYLON.StandardMaterial, shadowGen: BABYLON.ShadowGenerator, S: number): void {
  // Body
  const body = BABYLON.MeshBuilder.CreateBox("body", { width: 2.5 * S, height: 0.15 * S, depth: 0.9 * S }, scene);
  body.parent = root;
  body.position.y = 0.075 * S;
  body.material = colorMat;
  shadowGen.addShadowCaster(body);

  // Keys area
  const keysMat = new BABYLON.StandardMaterial("keysMat", scene);
  keysMat.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.18);

  const keysArea = BABYLON.MeshBuilder.CreateBox("keysArea", { width: 2.3 * S, height: 0.05 * S, depth: 0.75 * S }, scene);
  keysArea.parent = root;
  keysArea.position.y = 0.16 * S;
  keysArea.material = keysMat;

  // Individual keys - 4 rows x 12 cols - EXACT from original
  const singleKeyMat = new BABYLON.StandardMaterial("singleKeyMat", scene);
  singleKeyMat.diffuseColor = new BABYLON.Color3(0.25, 0.25, 0.28);

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 12; col++) {
      const key = BABYLON.MeshBuilder.CreateBox("key" + row + col, { width: 0.15 * S, height: 0.03 * S, depth: 0.15 * S }, scene);
      key.parent = root;
      key.position = new BABYLON.Vector3(
        -1.05 * S + col * 0.18 * S,
        0.19 * S,
        0.25 * S - row * 0.18 * S
      );
      key.material = singleKeyMat;
    }
  }

  // Spacebar
  const spacebarMat = new BABYLON.StandardMaterial("spacebarMat", scene);
  spacebarMat.diffuseColor = new BABYLON.Color3(0.28, 0.28, 0.3);

  const spacebar = BABYLON.MeshBuilder.CreateBox("spacebar", { width: 1 * S, height: 0.03 * S, depth: 0.15 * S }, scene);
  spacebar.parent = root;
  spacebar.position = new BABYLON.Vector3(0, 0.19 * S, -0.32 * S);
  spacebar.material = spacebarMat;

  // LEDs
  for (let i = 0; i < 3; i++) {
    const led = BABYLON.MeshBuilder.CreateBox("led" + i, { width: 0.05 * S, height: 0.02 * S, depth: 0.05 * S }, scene);
    led.parent = root;
    led.position = new BABYLON.Vector3(0.9 * S + i * 0.12 * S, 0.16 * S, 0.35 * S);
    const ledMat = new BABYLON.StandardMaterial("ledMat" + i, scene);
    ledMat.emissiveColor = i === 0 ? new BABYLON.Color3(0, 0.8, 0) : new BABYLON.Color3(0.2, 0.2, 0.2);
    led.material = ledMat;
  }
}

// Animation for moving items - EXACT from original
export function moveNodeTo(node: BABYLON.TransformNode, targetPos: BABYLON.Vector3, scene: BABYLON.Scene): void {
  const from = node.position.clone();
  const to = targetPos.clone();
  const midY = Math.max(from.y, to.y) + 1.5 * SCALE;

  const anim = new BABYLON.Animation(
    "moveAnim",
    "position",
    60,
    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  const keys = [
    { frame: 0, value: from },
    { frame: 15, value: new BABYLON.Vector3(from.x, midY, from.z) },
    { frame: 30, value: new BABYLON.Vector3(to.x, midY, to.z) },
    { frame: 45, value: to }
  ];

  anim.setKeys(keys);

  const ease = new BABYLON.CubicEase();
  ease.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
  anim.setEasingFunction(ease);

  node.animations = [anim];
  scene.beginAnimation(node, 0, 45, false);
}

// Reset all items to original positions
export function resetItems(itemRoots: ItemRoot[]): void {
  itemRoots.forEach(root => {
    root.position.copyFrom(root.metadata.basePosition);
    root.metadata.selected = false;
    root.metadata.slotIndex = null;
    if (root.metadata.labelRect && root.metadata.itemIndex === 0) {
      root.metadata.labelRect.linkOffsetX = 40;
    }
  });
}
