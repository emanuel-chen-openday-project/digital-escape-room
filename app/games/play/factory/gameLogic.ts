import * as BABYLON from '@babylonjs/core';
import { gsap } from 'gsap';
import { SCALE, Station, getStopPosition } from './stations';
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
  waitingForGameClick: boolean; // NEW: waiting for user to click on station to start game
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
    exitStationAdded: false,
    waitingForGameClick: false
  };
}

export interface MoveResult {
  reachedStation: boolean;
  stationIndex: number;
  isGameStation: boolean; // CHANGED: indicates this is a game station (user needs to click to start)
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
    isGameStation: false,
    shouldStop: false,
    isTourComplete: false
  };

  if (!gameState.isMoving || !playerRefs.playerRoot) return result;

  const targetStation = stations[gameState.currentStation];
  // Use stop position (with offset) for game stations
  const target = getStopPosition(targetStation);
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
      gameState.waitingForGameClick = false;
      stopWalkAnimation(playerRefs);
      gameState.isActive = false;
      return result;
    }

    // Check if should stop at this station
    if (targetStation.shouldStop) {
      gameState.isMoving = false;
      gameState.waitingForInput = true;
      result.shouldStop = true;

      // Check if this is a game station - DON'T auto-open, just mark it
      if (targetStation.isGameStation) {
        result.isGameStation = true;
        gameState.waitingForGameClick = true; // Wait for user to click
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
    shouldStop: false,
    isGameStation: false
  });
}

// Helper function to create bouncing indicator mesh above a station
export function createStationIndicator(
  scene: BABYLON.Scene,
  station: Station
): BABYLON.TransformNode {
  const indicatorRoot = new BABYLON.TransformNode("stationIndicator", scene);
  indicatorRoot.position = station.position.clone();
  indicatorRoot.position.y += 3 * SCALE; // Position above the station

  // Create green circle
  const circle = BABYLON.MeshBuilder.CreateTorus("indicatorCircle", {
    diameter: 1.2 * SCALE,
    thickness: 0.15 * SCALE,
    tessellation: 32
  }, scene);
  circle.rotation.x = Math.PI / 2; // Make it horizontal
  circle.parent = indicatorRoot;

  // Create arrow (cone pointing down)
  const arrow = BABYLON.MeshBuilder.CreateCylinder("indicatorArrow", {
    diameterTop: 0,
    diameterBottom: 0.5 * SCALE,
    height: 0.6 * SCALE,
    tessellation: 16
  }, scene);
  arrow.rotation.x = Math.PI; // Point downward
  arrow.position.y = -0.4 * SCALE;
  arrow.parent = indicatorRoot;

  // Green material
  const greenMat = new BABYLON.StandardMaterial("greenMat", scene);
  greenMat.diffuseColor = new BABYLON.Color3(0.2, 0.9, 0.3);
  greenMat.emissiveColor = new BABYLON.Color3(0.1, 0.5, 0.15);
  greenMat.specularColor = new BABYLON.Color3(0.3, 1, 0.4);

  circle.material = greenMat;
  arrow.material = greenMat;

  // Bouncing animation
  const bounceAnimation = new BABYLON.Animation(
    "bounceAnim",
    "position.y",
    30,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
  );

  const startY = indicatorRoot.position.y;
  const keys = [
    { frame: 0, value: startY },
    { frame: 15, value: startY + 0.3 * SCALE },
    { frame: 30, value: startY }
  ];
  bounceAnimation.setKeys(keys);

  // Add easing
  const easingFunction = new BABYLON.SineEase();
  easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
  bounceAnimation.setEasingFunction(easingFunction);

  indicatorRoot.animations.push(bounceAnimation);
  scene.beginAnimation(indicatorRoot, 0, 30, true);

  return indicatorRoot;
}

// Helper function to remove indicator
export function removeStationIndicator(indicator: BABYLON.TransformNode): void {
  if (indicator) {
    indicator.getChildMeshes().forEach(mesh => mesh.dispose());
    indicator.dispose();
  }
}
