import * as BABYLON from '@babylonjs/core';
import { gsap } from 'gsap';
import { SCALE, Station } from './stations';
import { PlayerRefs, animateWalk, stopWalkAnimation } from './createPlayer';

export interface GameState {
  isActive: boolean;
  currentStation: number;
  isMoving: boolean;
  walkSpeed: number;
  rotationSpeed: number;
  waitingForInput: boolean;
  doorClosedAfterEntry: boolean;
  exitStationAdded: boolean;
}

export function createInitialGameState(): GameState {
  return {
    isActive: false,
    currentStation: 0,
    isMoving: false,
    walkSpeed: 0.04,
    rotationSpeed: 0.12,
    waitingForInput: false,
    doorClosedAfterEntry: false,
    exitStationAdded: false
  };
}

export interface MoveResult {
  reachedStation: boolean;
  stationIndex: number;
  shouldShowGame: boolean;
  shouldStop: boolean;
  isTourComplete: boolean;
}

export function movePlayerToStation(
  gameState: GameState,
  stations: Station[],
  playerRefs: PlayerRefs,
  deltaTime: number
): MoveResult {
  const result: MoveResult = {
    reachedStation: false,
    stationIndex: gameState.currentStation,
    shouldShowGame: false,
    shouldStop: false,
    isTourComplete: false
  };

  if (!gameState.isMoving || !playerRefs.playerRoot) return result;

  const targetStation = stations[gameState.currentStation];
  const target = targetStation.position;
  const direction = target.subtract(playerRefs.playerRoot.position);
  direction.y = 0;
  const distance = direction.length();

  if (distance < 0.12 * SCALE) {
    playerRefs.playerRoot.position.x = target.x;
    playerRefs.playerRoot.position.z = target.z;

    // Smooth height adjustment
    if (Math.abs(playerRefs.playerRoot.position.y - target.y) > 0.01) {
      gsap.to(playerRefs.playerRoot.position, {
        y: target.y,
        duration: 0.4,
        ease: "power2.inOut"
      });
    }

    result.reachedStation = true;
    result.stationIndex = gameState.currentStation;

    // Check if exit station and tour complete
    if (gameState.exitStationAdded && gameState.currentStation === stations.length - 1) {
      result.isTourComplete = true;
      gameState.isMoving = false;
      gameState.waitingForInput = false;
      stopWalkAnimation(playerRefs);
      gameState.isActive = false;
      return result;
    }

    // Check if should stop at this station
    if (targetStation.shouldStop) {
      gameState.isMoving = false;
      gameState.waitingForInput = true;
      result.shouldStop = true;

      // Check if this is a game station (2, 4, or 8)
      if ([2, 4, 8].includes(gameState.currentStation)) {
        result.shouldShowGame = true;
      }

      stopWalkAnimation(playerRefs);
    } else {
      // Continue to next station automatically
      if (gameState.currentStation < stations.length - 1) {
        gameState.currentStation++;
      }
    }

    return result;
  }

  // Move towards target
  const moveDir = direction.normalize();
  const speed = gameState.walkSpeed * deltaTime * 60;

  playerRefs.playerRoot.position.addInPlace(moveDir.scale(speed));

  // Smooth height interpolation
  if (Math.abs(playerRefs.playerRoot.position.y - target.y) > 0.02) {
    playerRefs.playerRoot.position.y = BABYLON.Scalar.Lerp(
      playerRefs.playerRoot.position.y,
      target.y,
      0.08
    );
  }

  // Rotate towards movement direction
  const targetAngle = Math.atan2(moveDir.x, moveDir.z);
  const currentAngle = playerRefs.playerRoot.rotation.y;
  let angleDiff = targetAngle - currentAngle;

  while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
  while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

  playerRefs.playerRoot.rotation.y += angleDiff * gameState.rotationSpeed;

  // Animate walking
  animateWalk(playerRefs, deltaTime, distance);

  return result;
}

export function updateCamera(
  camera: BABYLON.UniversalCamera,
  playerRefs: PlayerRefs
): void {
  if (!playerRefs.playerRoot || !camera) return;

  const targetPos = playerRefs.playerRoot.position.clone();
  const defaultOffset = new BABYLON.Vector3(0, 8 * SCALE, -15 * SCALE);

  let cameraOffset = defaultOffset.clone();
  let useRotation = true;

  // Special area: right corridor
  const inRightCorridor =
    playerRefs.playerRoot.position.x > 8 * SCALE &&
    playerRefs.playerRoot.position.z > 0 * SCALE &&
    playerRefs.playerRoot.position.z < 15 * SCALE;

  if (inRightCorridor) {
    useRotation = false;

    const PLATFORM_HEIGHT = 3.5 * SCALE;
    let t = playerRefs.playerRoot.position.y / PLATFORM_HEIGHT;
    t = Math.max(0, Math.min(1, t));

    const highOffset = new BABYLON.Vector3(-15 * SCALE, 11.5 * SCALE, 0 * SCALE);
    const closeOffset = new BABYLON.Vector3(-14 * SCALE, 11 * SCALE, 0 * SCALE);

    const alpha = 1 - t;

    cameraOffset = new BABYLON.Vector3(
      BABYLON.Scalar.Lerp(highOffset.x, closeOffset.x, alpha),
      BABYLON.Scalar.Lerp(highOffset.y, closeOffset.y, alpha),
      BABYLON.Scalar.Lerp(highOffset.z, closeOffset.z, alpha)
    );
  }

  let newCameraPos: BABYLON.Vector3;

  if (useRotation) {
    const rotMatrix = BABYLON.Matrix.RotationY(playerRefs.playerRoot.rotation.y);
    const rotatedOffset = BABYLON.Vector3.TransformCoordinates(cameraOffset, rotMatrix);
    newCameraPos = targetPos.add(rotatedOffset);
  } else {
    newCameraPos = targetPos.add(cameraOffset);
  }

  gsap.to(camera.position, {
    x: newCameraPos.x,
    y: newCameraPos.y,
    z: newCameraPos.z,
    duration: 0.4,
    ease: "power2.out"
  });

  camera.setTarget(
    targetPos.add(new BABYLON.Vector3(0, 0.5 * SCALE, 2 * SCALE))
  );
}

export function createFireworks(scene: BABYLON.Scene): void {
  const fireworks = new BABYLON.ParticleSystem("fireworks", 100, scene);
  fireworks.particleTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/flare.png", scene);
  fireworks.emitter = new BABYLON.Vector3(0, 5 * SCALE, 0);
  fireworks.minEmitBox = new BABYLON.Vector3(-5 * SCALE, 0, -5 * SCALE);
  fireworks.maxEmitBox = new BABYLON.Vector3(5 * SCALE, 0, 5 * SCALE);
  fireworks.color1 = new BABYLON.Color4(1, 0, 0, 1);
  fireworks.color2 = new BABYLON.Color4(0, 0, 1, 1);
  fireworks.colorDead = new BABYLON.Color4(1, 1, 0, 0);
  fireworks.minSize = 0.1 * SCALE;
  fireworks.maxSize = 0.3 * SCALE;
  fireworks.minLifeTime = 0.5;
  fireworks.maxLifeTime = 1.5;
  fireworks.emitRate = 20;
  fireworks.gravity = new BABYLON.Vector3(0, -2 * SCALE, 0);
  fireworks.direction1 = new BABYLON.Vector3(-2, 8, -2);
  fireworks.direction2 = new BABYLON.Vector3(2, 10, 2);
  fireworks.minEmitPower = 2 * SCALE;
  fireworks.maxEmitPower = 4 * SCALE;
  fireworks.start();

  setTimeout(() => fireworks.stop(), 5000);
}

export function addExitStation(stations: Station[]): void {
  const exitPos = new BABYLON.Vector3(0, 0, -20 * SCALE);
  stations.push({
    position: exitPos,
    name: "🚶‍♂️ יציאה מהמפעל",
    description: "סיימת את הסיור!",
    hasInfo: false,
    shouldStop: false
  });
}

// Create puzzle button above game station
export function createArrowIndicator(scene: BABYLON.Scene, station: Station): BABYLON.TransformNode {
  const indicatorRoot = new BABYLON.TransformNode("puzzleButton", scene);
  indicatorRoot.position = station.position.clone();

  // Higher position for CNC machine so it doesn't hide the machine
  const isCNC = station.name.includes('CNC');
  indicatorRoot.position.y += isCNC ? 5.5 * SCALE : 4.5 * SCALE;

  // === MAIN BUTTON TEXTURE - elegant round button ===
  const textureSize = 1024;
  const dynamicTexture = new BABYLON.DynamicTexture("puzzleButtonTexture", textureSize, scene, true);
  const ctx = dynamicTexture.getContext() as CanvasRenderingContext2D;
  const cx = textureSize / 2;
  const cy = textureSize / 2;
  const r = 350;

  ctx.clearRect(0, 0, textureSize, textureSize);

  // === OUTER GLOW RING ===
  const outerGlow = ctx.createRadialGradient(cx, cy, r + 5, cx, cy, r + 100);
  outerGlow.addColorStop(0, 'rgba(59, 130, 246, 0.6)');
  outerGlow.addColorStop(0.4, 'rgba(37, 99, 235, 0.2)');
  outerGlow.addColorStop(1, 'rgba(37, 99, 235, 0)');
  ctx.beginPath();
  ctx.arc(cx, cy, r + 100, 0, 2 * Math.PI);
  ctx.fillStyle = outerGlow;
  ctx.fill();

  // Drop shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 8;

  // Main circle - brighter blue gradient
  const bgGrad = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  bgGrad.addColorStop(0, '#60a5fa');
  bgGrad.addColorStop(0.5, '#3b82f6');
  bgGrad.addColorStop(1, '#2563eb');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.fillStyle = bgGrad;
  ctx.fill();

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Strong top glass shine
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.clip();
  const shine = ctx.createLinearGradient(cx, cy - r, cx, cy - r + 260);
  shine.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
  shine.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
  shine.addColorStop(1, 'transparent');
  ctx.beginPath();
  ctx.ellipse(cx, cy - r + 130, r * 0.75, 140, 0, 0, 2 * Math.PI);
  ctx.fillStyle = shine;
  ctx.fill();
  ctx.restore();

  // Bright white border
  ctx.beginPath();
  ctx.arc(cx, cy, r - 4, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 6;
  ctx.stroke();

  // White circle behind emoji so it pops on any device
  ctx.beginPath();
  ctx.arc(cx, cy - 105, 100, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.fill();

  // Puzzle emoji - top
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '180px serif';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;
  ctx.fillText('🧩', cx, cy - 105);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // "לפתיחת החידה" - first line, bright white
  ctx.font = 'bold 100px Heebo, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 10;
  ctx.fillText('לפתיחת החידה', cx, cy + 50);

  // "לחץ כאן" - second line, bigger and bolder
  ctx.font = 'bold 125px Heebo, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('לחץ עליי', cx, cy + 180);
  ctx.shadowBlur = 0;

  // Downward arrow
  ctx.save();
  ctx.translate(cx, cy + r + 55);
  ctx.fillStyle = '#2563eb';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.beginPath();
  ctx.moveTo(-50, -15);
  ctx.lineTo(50, -15);
  ctx.lineTo(0, 50);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  dynamicTexture.update();

  // === BUTTON PLANE ===
  const buttonPlane = BABYLON.MeshBuilder.CreatePlane("buttonPlane", { size: 3.0 * SCALE }, scene);
  buttonPlane.parent = indicatorRoot;
  buttonPlane.position.y = 0;
  buttonPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

  const buttonMaterial = new BABYLON.StandardMaterial("buttonMaterial", scene);
  buttonMaterial.emissiveTexture = dynamicTexture;
  buttonMaterial.emissiveTexture.hasAlpha = true;
  buttonMaterial.opacityTexture = dynamicTexture;
  buttonMaterial.disableLighting = true;
  buttonMaterial.backFaceCulling = false;
  buttonPlane.material = buttonMaterial;

  // === PULSING GLOW (blue glow behind button) ===
  const glowTexture = new BABYLON.DynamicTexture("glowTexture", 512, scene, true);
  const glowCtx = glowTexture.getContext() as CanvasRenderingContext2D;
  glowCtx.clearRect(0, 0, 512, 512);
  const glowGrad = glowCtx.createRadialGradient(256, 256, 60, 256, 256, 250);
  glowGrad.addColorStop(0, 'rgba(59, 130, 246, 0.7)');
  glowGrad.addColorStop(0.4, 'rgba(59, 130, 246, 0.3)');
  glowGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');
  glowCtx.beginPath();
  glowCtx.arc(256, 256, 250, 0, 2 * Math.PI);
  glowCtx.fillStyle = glowGrad;
  glowCtx.fill();
  glowTexture.update();

  const glowPlane = BABYLON.MeshBuilder.CreatePlane("glowPlane", { size: 4 * SCALE }, scene);
  glowPlane.parent = indicatorRoot;
  glowPlane.position.y = 0;
  glowPlane.position.z = -0.02;
  glowPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

  const glowMaterial = new BABYLON.StandardMaterial("glowMaterial", scene);
  glowMaterial.emissiveTexture = glowTexture;
  glowMaterial.emissiveTexture.hasAlpha = true;
  glowMaterial.opacityTexture = glowTexture;
  glowMaterial.disableLighting = true;
  glowMaterial.backFaceCulling = false;
  glowMaterial.alpha = 0.6;
  glowPlane.material = glowMaterial;

  // === CLICK AREA (invisible, larger for easy tapping) ===
  const clickArea = BABYLON.MeshBuilder.CreatePlane("clickArea", { size: 4 * SCALE }, scene);
  clickArea.parent = indicatorRoot;
  clickArea.position.y = 0;
  clickArea.position.z = 0.03;
  clickArea.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

  const clickMaterial = new BABYLON.StandardMaterial("clickMaterial", scene);
  clickMaterial.alpha = 0.01;
  clickMaterial.backFaceCulling = false;
  clickArea.material = clickMaterial;

  buttonPlane.isPickable = true;
  clickArea.isPickable = true;
  glowPlane.isPickable = true;

  // === ANIMATIONS ===

  // Gentle floating up and down
  gsap.to(indicatorRoot.position, {
    y: indicatorRoot.position.y + 0.3 * SCALE,
    duration: 1.5,
    ease: "power1.inOut",
    yoyo: true,
    repeat: -1
  });

  // Breathing scale pulse on button
  gsap.to(buttonPlane.scaling, {
    x: 1.06,
    y: 1.06,
    duration: 1.2,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1
  });

  // Pulsing glow behind button
  gsap.to(glowPlane.scaling, {
    x: 1.3,
    y: 1.3,
    duration: 1.5,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1
  });

  gsap.to(glowMaterial, {
    alpha: 0.3,
    duration: 1.5,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1
  });

  return indicatorRoot;
}

// Remove arrow indicator
export function removeArrowIndicator(indicator: BABYLON.TransformNode): void {
  if (indicator) {
    gsap.killTweensOf(indicator.position);
    indicator.getChildMeshes().forEach(mesh => {
      if (mesh.material) {
        gsap.killTweensOf(mesh.material);
        mesh.material.dispose();
      }
      mesh.dispose();
    });
    indicator.dispose();
  }
}
