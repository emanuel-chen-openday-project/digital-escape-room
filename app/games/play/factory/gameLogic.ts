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

// Create arrow indicator above game station
export function createArrowIndicator(scene: BABYLON.Scene, station: Station): BABYLON.TransformNode {
  const indicatorRoot = new BABYLON.TransformNode("arrowIndicator", scene);
  indicatorRoot.position = station.position.clone();
  indicatorRoot.position.y += 4 * SCALE; // Position above the station

  // Create dynamic texture for the neon arrow SVG
  const textureSize = 256;
  const dynamicTexture = new BABYLON.DynamicTexture("arrowTexture", textureSize, scene, true);
  const ctx = dynamicTexture.getContext();

  // Draw the neon arrow circle
  const centerX = textureSize / 2;
  const centerY = textureSize / 2;
  const radius = 90;

  // Clear with transparent background
  ctx.clearRect(0, 0, textureSize, textureSize);

  // Draw glow effect (multiple circles with decreasing opacity)
  for (let i = 3; i >= 0; i--) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + i * 8, 0, 2 * Math.PI);
    ctx.strokeStyle = `rgba(57, 255, 20, ${0.1 - i * 0.02})`;
    ctx.lineWidth = 10;
    ctx.stroke();
  }

  // Draw main circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = "#39ff14";
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.stroke();

  // Draw arrow - vertical line
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - 40);
  ctx.lineTo(centerX, centerY + 25);
  ctx.strokeStyle = "#39ff14";
  ctx.lineWidth = 16;
  ctx.lineCap = "round";
  ctx.stroke();

  // Draw arrow head
  ctx.beginPath();
  ctx.moveTo(centerX - 30, centerY + 5);
  ctx.lineTo(centerX, centerY + 40);
  ctx.lineTo(centerX + 30, centerY + 5);
  ctx.strokeStyle = "#39ff14";
  ctx.lineWidth = 16;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

  dynamicTexture.update();

  // Create the visible arrow plane
  const arrowPlane = BABYLON.MeshBuilder.CreatePlane("arrowPlane", { size: 2 * SCALE }, scene);
  arrowPlane.parent = indicatorRoot;
  arrowPlane.position.y = 0;
  arrowPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

  const arrowMaterial = new BABYLON.StandardMaterial("arrowMaterial", scene);
  arrowMaterial.emissiveTexture = dynamicTexture; // Use emissive for glow effect
  arrowMaterial.emissiveTexture.hasAlpha = true;
  arrowMaterial.useAlphaFromDiffuseTexture = true;
  arrowMaterial.opacityTexture = dynamicTexture; // Use same texture for alpha
  arrowMaterial.disableLighting = true; // Pure emissive, no lighting needed
  arrowMaterial.backFaceCulling = false;
  arrowPlane.material = arrowMaterial;

  // Create larger transparent clickable area behind the arrow
  const clickArea = BABYLON.MeshBuilder.CreatePlane("clickArea", { size: 4 * SCALE }, scene);
  clickArea.parent = indicatorRoot;
  clickArea.position.y = 0;
  clickArea.position.z = 0.01; // Slightly behind
  clickArea.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

  const clickMaterial = new BABYLON.StandardMaterial("clickMaterial", scene);
  clickMaterial.alpha = 0.01; // Almost invisible but clickable
  clickMaterial.backFaceCulling = false;
  clickArea.material = clickMaterial;

  // Mark as pickable
  arrowPlane.isPickable = true;
  clickArea.isPickable = true;

  // Add bouncing animation
  gsap.to(indicatorRoot.position, {
    y: indicatorRoot.position.y + 0.4 * SCALE,
    duration: 0.7,
    ease: "power1.inOut",
    yoyo: true,
    repeat: -1
  });

  // Add pulsing scale effect for glow
  gsap.to(arrowPlane.scaling, {
    x: 1.1,
    y: 1.1,
    duration: 0.5,
    ease: "power1.inOut",
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
