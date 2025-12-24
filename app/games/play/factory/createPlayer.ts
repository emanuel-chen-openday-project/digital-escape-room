import * as BABYLON from '@babylonjs/core';
import { gsap } from 'gsap';
import { SCALE, Station } from './stations';

export interface PlayerRefs {
  playerRoot: BABYLON.TransformNode;
  playerBody: BABYLON.Mesh;
  playerHead: BABYLON.Mesh;
  leftArm: BABYLON.Mesh;
  rightArm: BABYLON.Mesh;
  leftLeg: BABYLON.Mesh;
  rightLeg: BABYLON.Mesh;
}

export function createPlayer(scene: BABYLON.Scene, initialStation: Station): PlayerRefs {
  const playerRoot = new BABYLON.TransformNode("playerRoot", scene);
  playerRoot.position = initialStation.position.clone();

  const bodyMat = new BABYLON.StandardMaterial("playerBodyMat", scene);
  bodyMat.diffuseColor = new BABYLON.Color3(0.2, 0.4, 0.8);
  bodyMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);

  const playerBody = BABYLON.MeshBuilder.CreateCylinder("playerBody", {
    height: 0.8 * SCALE,
    diameterTop: 0.28 * SCALE,
    diameterBottom: 0.32 * SCALE
  }, scene);
  playerBody.position.y = 0.6 * SCALE;
  playerBody.parent = playerRoot;
  playerBody.material = bodyMat;

  const headMat = new BABYLON.StandardMaterial("playerHeadMat", scene);
  headMat.diffuseColor = new BABYLON.Color3(0.95, 0.85, 0.75);

  const playerHead = BABYLON.MeshBuilder.CreateSphere("playerHead", {
    diameter: 0.28 * SCALE
  }, scene);
  playerHead.position.y = 1.12 * SCALE;
  playerHead.parent = playerRoot;
  playerHead.material = headMat;

  // Helmet
  const helmetMat = new BABYLON.StandardMaterial("helmetMat", scene);
  helmetMat.diffuseColor = new BABYLON.Color3(1, 0.8, 0);
  helmetMat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);

  const helmet = BABYLON.MeshBuilder.CreateSphere("helmet", {
    diameter: 0.32 * SCALE,
    arc: 0.5
  }, scene);
  helmet.position.y = 1.15 * SCALE;
  helmet.rotation.x = Math.PI;
  helmet.parent = playerRoot;
  helmet.material = helmetMat;

  // Eyes
  const eyeMat = new BABYLON.StandardMaterial("eyeMat", scene);
  eyeMat.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.1);

  for (const side of [-1, 1]) {
    const eye = BABYLON.MeshBuilder.CreateSphere("eye", { diameter: 0.05 * SCALE }, scene);
    eye.position = new BABYLON.Vector3(side * 0.06 * SCALE, 1.13 * SCALE, 0.1 * SCALE);
    eye.parent = playerRoot;
    eye.material = eyeMat;
  }

  // Arms
  const leftArm = BABYLON.MeshBuilder.CreateCylinder("leftArm", {
    height: 0.55 * SCALE,
    diameter: 0.1 * SCALE
  }, scene);
  leftArm.position = new BABYLON.Vector3(-0.22 * SCALE, 0.76 * SCALE, 0);
  leftArm.parent = playerRoot;
  leftArm.material = bodyMat;
  leftArm.metadata = { swingPhase: 0 };

  const rightArm = BABYLON.MeshBuilder.CreateCylinder("rightArm", {
    height: 0.55 * SCALE,
    diameter: 0.1 * SCALE
  }, scene);
  rightArm.position = new BABYLON.Vector3(0.22 * SCALE, 0.76 * SCALE, 0);
  rightArm.parent = playerRoot;
  rightArm.material = bodyMat;
  rightArm.metadata = { swingPhase: Math.PI };

  // Legs
  const leftLeg = BABYLON.MeshBuilder.CreateCylinder("leftLeg", {
    height: 0.65 * SCALE,
    diameter: 0.12 * SCALE
  }, scene);
  leftLeg.position = new BABYLON.Vector3(-0.1 * SCALE, 0.32 * SCALE, 0);
  leftLeg.parent = playerRoot;
  leftLeg.material = bodyMat;
  leftLeg.metadata = { swingPhase: 0 };

  const rightLeg = BABYLON.MeshBuilder.CreateCylinder("rightLeg", {
    height: 0.65 * SCALE,
    diameter: 0.12 * SCALE
  }, scene);
  rightLeg.position = new BABYLON.Vector3(0.1 * SCALE, 0.32 * SCALE, 0);
  rightLeg.parent = playerRoot;
  rightLeg.material = bodyMat;
  rightLeg.metadata = { swingPhase: Math.PI };

  return {
    playerRoot,
    playerBody,
    playerHead,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg
  };
}

export function animateWalk(playerRefs: PlayerRefs, deltaTime: number, distance: number): void {
  const { leftArm, rightArm, leftLeg, rightLeg, playerBody, playerHead } = playerRefs;
  const walkSpeed = Math.min(distance * 5, 7);

  if (leftArm && leftArm.metadata) {
    leftArm.metadata.swingPhase += deltaTime * walkSpeed;
    leftArm.rotation.x = Math.sin(leftArm.metadata.swingPhase) * 0.25;
  }

  if (rightArm && rightArm.metadata) {
    rightArm.metadata.swingPhase += deltaTime * walkSpeed;
    rightArm.rotation.x = Math.sin(rightArm.metadata.swingPhase) * 0.25;
  }

  if (leftLeg && leftLeg.metadata) {
    leftLeg.metadata.swingPhase += deltaTime * walkSpeed;
    leftLeg.rotation.x = Math.sin(leftLeg.metadata.swingPhase) * 0.35;
  }

  if (rightLeg && rightLeg.metadata) {
    rightLeg.metadata.swingPhase += deltaTime * walkSpeed;
    rightLeg.rotation.x = Math.sin(rightLeg.metadata.swingPhase) * 0.35;
  }

  const bob = Math.abs(Math.sin(Date.now() * 0.004 * walkSpeed)) * 0.03 * SCALE;
  if (playerBody) playerBody.position.y = 0.6 * SCALE + bob;
  if (playerHead) playerHead.position.y = 1.12 * SCALE + bob * 0.7;
}

export function stopWalkAnimation(playerRefs: PlayerRefs): void {
  const { leftArm, rightArm, leftLeg, rightLeg, playerBody, playerHead } = playerRefs;

  gsap.to([leftArm.rotation, rightArm.rotation, leftLeg.rotation, rightLeg.rotation], {
    x: 0,
    duration: 0.3,
    ease: "power2.out"
  });

  gsap.to(playerBody.position, { y: 0.6 * SCALE, duration: 0.3 });
  gsap.to(playerHead.position, { y: 1.12 * SCALE, duration: 0.3 });
}
