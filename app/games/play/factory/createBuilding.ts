import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import { gsap } from 'gsap';
import { SCALE } from './stations';
import { createWallTexts } from './createScene';

export interface DoorRefs {
  entranceDoor: BABYLON.Mesh | null;
  doorDynamicTexture: BABYLON.DynamicTexture | null;
}

let doorRefs: DoorRefs = {
  entranceDoor: null,
  doorDynamicTexture: null
};

export function getDoorRefs(): DoorRefs {
  return doorRefs;
}

export function createBuilding(scene: BABYLON.Scene, advancedTexture: GUI.AdvancedDynamicTexture): DoorRefs {
  const wallHeight = 15 * SCALE;
  const wallMat = new BABYLON.StandardMaterial("wallMat", scene);
  wallMat.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.97);
  wallMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);

  const walls = [
    { width: 0.5 * SCALE, height: wallHeight, depth: 45 * SCALE, x: -20 * SCALE, z: 0 },
    { width: 0.5 * SCALE, height: wallHeight, depth: 45 * SCALE, x: 20 * SCALE, z: 0 },
    { width: 40 * SCALE, height: wallHeight, depth: 0.5 * SCALE, x: 0, z: 18 * SCALE },
    { width: 13 * SCALE, height: wallHeight, depth: 0.5 * SCALE, x: -13.5 * SCALE, z: -18 * SCALE },
    { width: 13 * SCALE, height: wallHeight, depth: 0.5 * SCALE, x: 13.5 * SCALE, z: -18 * SCALE }
  ];

  walls.forEach((w, i) => {
    const wall = BABYLON.MeshBuilder.CreateBox("wall" + i, {
      width: w.width,
      height: w.height,
      depth: w.depth
    }, scene);
    wall.position = new BABYLON.Vector3(w.x, wallHeight / 2, w.z);
    wall.material = wallMat;
  });

  createWallTexts(scene, wallHeight, advancedTexture);
  doorRefs = createEntrance(scene, advancedTexture);

  // Roof
  const roof = BABYLON.MeshBuilder.CreateBox("roof", {
    width: 40 * SCALE,
    height: 0.3 * SCALE,
    depth: 45 * SCALE
  }, scene);
  roof.position.y = wallHeight;

  const roofMat = new BABYLON.StandardMaterial("roofMat", scene);
  roofMat.diffuseColor = new BABYLON.Color3(0.8, 0.85, 0.9);
  roofMat.alpha = 0.2;
  roofMat.specularColor = new BABYLON.Color3(1, 1, 1);
  roof.material = roofMat;

  createWindows(scene, wallHeight);

  return doorRefs;
}

export function createEntrance(scene: BABYLON.Scene, advancedTexture: GUI.AdvancedDynamicTexture): DoorRefs {
  const entranceFrame = BABYLON.MeshBuilder.CreateBox("entranceFrame", {
    width: 12 * SCALE,
    height: 5 * SCALE,
    depth: 0.4 * SCALE
  }, scene);
  entranceFrame.position = new BABYLON.Vector3(0, 7.5 * SCALE, -18.2 * SCALE);

  const frameMat = new BABYLON.StandardMaterial("frameMat", scene);
  frameMat.diffuseColor = new BABYLON.Color3(0.2, 0.3, 0.6);
  entranceFrame.material = frameMat;

  const signBoard = BABYLON.MeshBuilder.CreateBox("signBoard", {
    width: 10 * SCALE,
    height: 2 * SCALE,
    depth: 0.3 * SCALE
  }, scene);
  signBoard.position = new BABYLON.Vector3(0, 9 * SCALE, -18.35 * SCALE);

  const signMat = new BABYLON.StandardMaterial("signMat", scene);
  signMat.diffuseColor = new BABYLON.Color3(0.15, 0.35, 0.75);
  signMat.emissiveColor = new BABYLON.Color3(0.1, 0.2, 0.4);
  signBoard.material = signMat;

  const signText = new GUI.TextBlock();
  signText.text = "🏭 מפעל טכנולוגיות מתקדמות 🏭";
  signText.color = "white";
  signText.fontSize = 24;
  signText.fontWeight = "bold";
  signText.fontFamily = "Heebo";

  const rect = new GUI.Rectangle();
  rect.width = "300px";
  rect.height = "50px";
  rect.thickness = 0;
  rect.background = "transparent";
  rect.addControl(signText);

  advancedTexture.addControl(rect);
  rect.linkWithMesh(signBoard);

  // Door with texture
  const entranceDoor = BABYLON.MeshBuilder.CreateBox("entranceDoor", {
    width: 6 * SCALE,
    height: 4.5 * SCALE,
    depth: 0.25 * SCALE
  }, scene);
  entranceDoor.position = new BABYLON.Vector3(0, 2.25 * SCALE, -18 * SCALE + 0.15 * SCALE);

  // Dynamic texture for door
  const doorTextureResolution = 512;
  const doorDynamicTexture = new BABYLON.DynamicTexture("doorTexture", { width: doorTextureResolution, height: doorTextureResolution * 0.75 }, scene);

  drawDoorTexture(doorDynamicTexture, "כניסה");

  const doorMat = new BABYLON.StandardMaterial("doorMat", scene);
  doorMat.diffuseTexture = doorDynamicTexture;
  (doorMat.diffuseTexture as BABYLON.Texture).uScale = -1;
  doorMat.backFaceCulling = false;
  doorMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.5);
  doorMat.emissiveColor = new BABYLON.Color3(0.05, 0.08, 0.12);
  entranceDoor.material = doorMat;

  // Pivot on right side
  entranceDoor.setPivotPoint(new BABYLON.Vector3(3 * SCALE, 0, 0));

  // Door frame
  const frameMetal = new BABYLON.StandardMaterial("frameMetal", scene);
  frameMetal.diffuseColor = new BABYLON.Color3(0.3, 0.35, 0.4);
  frameMetal.specularColor = new BABYLON.Color3(0.6, 0.6, 0.6);

  const doorFrameTop = BABYLON.MeshBuilder.CreateBox("doorFrameTop", {
    width: 6.5 * SCALE,
    height: 0.2 * SCALE,
    depth: 0.35 * SCALE
  }, scene);
  doorFrameTop.position = new BABYLON.Vector3(0, 4.6 * SCALE, -18 * SCALE + 0.1 * SCALE);
  doorFrameTop.material = frameMetal;

  const doorFrameLeft = BABYLON.MeshBuilder.CreateBox("doorFrameLeft", {
    width: 0.2 * SCALE,
    height: 4.7 * SCALE,
    depth: 0.35 * SCALE
  }, scene);
  doorFrameLeft.position = new BABYLON.Vector3(-3.2 * SCALE, 2.3 * SCALE, -18 * SCALE + 0.1 * SCALE);
  doorFrameLeft.material = frameMetal;

  const doorFrameRight = BABYLON.MeshBuilder.CreateBox("doorFrameRight", {
    width: 0.2 * SCALE,
    height: 4.7 * SCALE,
    depth: 0.35 * SCALE
  }, scene);
  doorFrameRight.position = new BABYLON.Vector3(3.2 * SCALE, 2.3 * SCALE, -18 * SCALE + 0.1 * SCALE);
  doorFrameRight.material = frameMetal;

  return { entranceDoor, doorDynamicTexture };
}

export function drawDoorTexture(doorDynamicTexture: BABYLON.DynamicTexture, text: string): void {
  const ctx = doorDynamicTexture.getContext();
  const width = 512;
  const height = 512 * 0.75;

  // Door background - dark blue gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#2a3f5f');
  gradient.addColorStop(0.5, '#1e3a5f');
  gradient.addColorStop(1, '#152a45');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Inner frame
  ctx.strokeStyle = '#4a6fa5';
  ctx.lineWidth = 8;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  ctx.strokeStyle = '#3a5f95';
  ctx.lineWidth = 3;
  ctx.strokeRect(35, 35, width - 70, height - 70);

  // Top panel
  ctx.fillStyle = 'rgba(74, 111, 165, 0.3)';
  ctx.fillRect(50, 50, width - 100, height * 0.35);

  // Bottom panel
  ctx.fillRect(50, height * 0.55, width - 100, height * 0.35);

  // Text background
  const textBgY = height * 0.4;
  const textBgHeight = height * 0.2;
  const textGradient = ctx.createLinearGradient(0, textBgY, 0, textBgY + textBgHeight);
  textGradient.addColorStop(0, 'rgba(100, 140, 200, 0.4)');
  textGradient.addColorStop(0.5, 'rgba(120, 160, 220, 0.5)');
  textGradient.addColorStop(1, 'rgba(100, 140, 200, 0.4)');
  ctx.fillStyle = textGradient;
  ctx.fillRect(60, textBgY, width - 120, textBgHeight);

  // Gold lines
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, textBgY + 5);
  ctx.lineTo(width - 80, textBgY + 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(80, textBgY + textBgHeight - 5);
  ctx.lineTo(width - 80, textBgY + textBgHeight - 5);
  ctx.stroke();

  // Text
  ctx.font = 'bold 72px Heebo, Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillText(text, width / 2 + 3, height / 2 + 3);

  // Main text
  const textGrad = ctx.createLinearGradient(0, height * 0.4, 0, height * 0.6);
  textGrad.addColorStop(0, '#ffffff');
  textGrad.addColorStop(0.5, '#f0e68c');
  textGrad.addColorStop(1, '#ffffff');
  ctx.fillStyle = textGrad;
  ctx.fillText(text, width / 2, height / 2);

  // Door handle
  ctx.fillStyle = '#d4af37';
  ctx.beginPath();
  ctx.arc(width - 70, height / 2, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b8960c';
  ctx.beginPath();
  ctx.arc(width - 70, height / 2, 12, 0, Math.PI * 2);
  ctx.fill();

  doorDynamicTexture.update();
}

export function createWindows(scene: BABYLON.Scene, wallHeight: number): void {
  const windowMat = new BABYLON.StandardMaterial("windowMat", scene);
  windowMat.diffuseColor = new BABYLON.Color3(0.7, 0.85, 1);
  windowMat.alpha = 0.4;
  windowMat.specularColor = new BABYLON.Color3(1, 1, 1);

  for (let i = 0; i < 3; i++) {
    const winL = BABYLON.MeshBuilder.CreateBox("winL" + i, {
      width: 0.1 * SCALE,
      height: 3 * SCALE,
      depth: 4 * SCALE
    }, scene);
    winL.position = new BABYLON.Vector3(-20 * SCALE, 7 * SCALE, (-10 + i * 10) * SCALE);
    winL.material = windowMat;

    const winR = BABYLON.MeshBuilder.CreateBox("winR" + i, {
      width: 0.1 * SCALE,
      height: 3 * SCALE,
      depth: 4 * SCALE
    }, scene);
    winR.position = new BABYLON.Vector3(20 * SCALE, 7 * SCALE, (-10 + i * 10) * SCALE);
    winR.material = windowMat;
  }
}

export function createStairs(scene: BABYLON.Scene): void {
  const stairMat = new BABYLON.StandardMaterial("stairMat", scene);
  stairMat.diffuseColor = new BABYLON.Color3(0.55, 0.57, 0.6);

  const stairCount = 14;
  const stairHeight = 0.25 * SCALE;
  const stairDepth = 0.6 * SCALE;
  const stairWidth = 3.5 * SCALE;
  const platformHeight = 3.5 * SCALE;

  // Left - up
  for (let i = 0; i < stairCount; i++) {
    const stair = BABYLON.MeshBuilder.CreateBox("stairL" + i, {
      width: stairWidth,
      height: stairHeight,
      depth: stairDepth
    }, scene);
    stair.position = new BABYLON.Vector3(
      -12 * SCALE,
      stairHeight / 2 + i * stairHeight,
      7 * SCALE + i * stairDepth
    );
    stair.material = stairMat;
  }

  // Right - down
  for (let i = 0; i < stairCount; i++) {
    const stair = BABYLON.MeshBuilder.CreateBox("stairR" + i, {
      width: stairWidth,
      height: stairHeight,
      depth: stairDepth
    }, scene);
    stair.position = new BABYLON.Vector3(
      12 * SCALE,
      platformHeight - stairHeight / 2 - i * stairHeight,
      14.5 * SCALE - i * stairDepth
    );
    stair.material = stairMat;
  }

  // Platform
  const platform = BABYLON.MeshBuilder.CreateBox("platform", {
    width: 30 * SCALE,
    height: 0.3 * SCALE,
    depth: 7 * SCALE
  }, scene);
  platform.position = new BABYLON.Vector3(0, platformHeight, 14 * SCALE);
  platform.material = stairMat;

  const meshFloor = BABYLON.MeshBuilder.CreateBox("meshFloor", {
    width: 28 * SCALE,
    height: 0.05 * SCALE,
    depth: 6.5 * SCALE
  }, scene);
  meshFloor.position = new BABYLON.Vector3(0, platformHeight + 0.17 * SCALE, 14 * SCALE);

  const meshMat = new BABYLON.StandardMaterial("meshMat", scene);
  meshMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.45);
  meshMat.alpha = 0.8;
  meshMat.wireframe = true;
  meshFloor.material = meshMat;

  createRailings(scene, stairCount, stairHeight, stairDepth, platformHeight);
}

export function createRailings(scene: BABYLON.Scene, stairCount: number, stairHeight: number, stairDepth: number, platformHeight: number): void {
  const railMat = new BABYLON.StandardMaterial("railMat", scene);
  railMat.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.85);

  for (let i = 0; i <= stairCount; i++) {
    const rail = BABYLON.MeshBuilder.CreateCylinder("railL" + i, {
      height: 1.2 * SCALE,
      diameter: 0.08 * SCALE
    }, scene);
    rail.position = new BABYLON.Vector3(
      -14 * SCALE,
      0.6 * SCALE + i * stairHeight,
      7 * SCALE + i * stairDepth
    );
    rail.material = railMat;
  }

  for (let i = 0; i <= stairCount; i++) {
    const rail = BABYLON.MeshBuilder.CreateCylinder("railR" + i, {
      height: 1.2 * SCALE,
      diameter: 0.08 * SCALE
    }, scene);
    rail.position = new BABYLON.Vector3(
      14 * SCALE,
      platformHeight + 0.6 * SCALE - i * stairHeight,
      14.5 * SCALE - i * stairDepth
    );
    rail.material = railMat;
  }

  for (const side of [-1, 1]) {
    for (let i = 0; i < 10; i++) {
      const bridgeRail = BABYLON.MeshBuilder.CreateCylinder("bridgeRail", {
        height: 1 * SCALE,
        diameter: 0.08 * SCALE
      }, scene);
      bridgeRail.position = new BABYLON.Vector3(
        side * 14 * SCALE,
        platformHeight + 0.5 * SCALE,
        10 * SCALE + i * 0.8 * SCALE
      );
      bridgeRail.material = railMat;
    }
  }
}

export function openDoor(entranceDoor: BABYLON.Mesh | null): void {
  if (!entranceDoor) return;
  gsap.to(entranceDoor.rotation, {
    y: -Math.PI / 2,
    duration: 1.2,
    ease: "power2.inOut"
  });
}

export function closeDoor(entranceDoor: BABYLON.Mesh | null): void {
  if (!entranceDoor) return;
  gsap.to(entranceDoor.rotation, {
    y: 0,
    duration: 1,
    ease: "power2.inOut"
  });
}
