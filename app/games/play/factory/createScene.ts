import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import { SCALE } from './stations';

export interface SceneRefs {
  scene: BABYLON.Scene;
  camera: BABYLON.UniversalCamera;
  advancedTexture: GUI.AdvancedDynamicTexture;
}

export function createScene(engine: BABYLON.Engine): SceneRefs {
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.92, 0.94, 0.97, 1);

  // Fog
  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.015;
  scene.fogColor = new BABYLON.Color3(0.9, 0.92, 0.95);

  // Lighting
  const hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.8;
  hemi.diffuse = new BABYLON.Color3(1, 1, 1);
  hemi.groundColor = new BABYLON.Color3(0.5, 0.5, 0.55);

  const sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(-0.5, -1, 0.5), scene);
  sun.intensity = 0.9;
  sun.position = new BABYLON.Vector3(20 * SCALE, 30 * SCALE, -20 * SCALE);

  // Camera
  const camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 10 * SCALE, -18 * SCALE), scene);
  camera.setTarget(new BABYLON.Vector3(0, 0, 0));
  scene.activeCamera = camera;

  // GUI
  const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

  return { scene, camera, advancedTexture };
}

export function createFloor(scene: BABYLON.Scene): void {
  const ground = BABYLON.MeshBuilder.CreateGround("ground", {
    width: 60 * SCALE,
    height: 60 * SCALE
  }, scene);

  const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
  groundMat.diffuseColor = new BABYLON.Color3(0.75, 0.78, 0.82);
  groundMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);

  const groundTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/floor.png", scene);
  groundTexture.uScale = 12;
  groundTexture.vScale = 12;
  groundMat.diffuseTexture = groundTexture;
  groundMat.bumpTexture = groundTexture;
  groundMat.bumpTexture.level = 0.3;

  ground.material = groundMat;
  ground.receiveShadows = true;

  // Marking lines
  for (let i = -2; i <= 2; i++) {
    if (i !== 0) {
      const line = BABYLON.MeshBuilder.CreateBox("line" + i, {
        width: 40 * SCALE,
        height: 0.02 * SCALE,
        depth: 0.15 * SCALE
      }, scene);
      line.position = new BABYLON.Vector3(i * 6 * SCALE, 0.01 * SCALE, 0);

      const lineMat = new BABYLON.StandardMaterial("lineMat", scene);
      lineMat.diffuseColor = new BABYLON.Color3(1, 0.85, 0);
      lineMat.emissiveColor = new BABYLON.Color3(0.5, 0.4, 0);
      line.material = lineMat;
    }
  }
}

export function createWallTexts(scene: BABYLON.Scene, wallHeight: number, advancedTexture: GUI.AdvancedDynamicTexture): void {
  const equations = [
    "OEE = A × P × Q",
    "Takt Time = Available Time / Customer Demand",
    "Cp = (USL - LSL) / 6σ",
    "Lead Time = WIP / Throughput"
  ];

  equations.forEach((eq, i) => {
    const textPlane = BABYLON.MeshBuilder.CreatePlane("equation" + i, {
      width: 4 * SCALE,
      height: 1 * SCALE
    }, scene);
    textPlane.position = new BABYLON.Vector3(-19.9 * SCALE, (10 - i * 2) * SCALE, (-10 + i * 5) * SCALE);
    textPlane.rotation.y = Math.PI / 2;

    const textMat = new BABYLON.StandardMaterial("textMat" + i, scene);
    textMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.3);
    textMat.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.15);
    textPlane.material = textMat;

    const text = new GUI.TextBlock();
    text.text = eq;
    text.color = "white";
    text.fontSize = 16;
    text.fontFamily = "monospace";

    const textRect = new GUI.Rectangle();
    textRect.width = "200px";
    textRect.height = "40px";
    textRect.thickness = 0;
    textRect.addControl(text);

    advancedTexture.addControl(textRect);
    textRect.linkWithMesh(textPlane);
  });
}
