import * as BABYLON from '@babylonjs/core';
import { gsap } from 'gsap';
import { SCALE } from './stations';

export function createMachines(scene: BABYLON.Scene): void {
  createCNCMachine(scene, new BABYLON.Vector3(-12 * SCALE, 0, -6 * SCALE));
  createConveyorBelt(scene, new BABYLON.Vector3(-12 * SCALE, 0, 3 * SCALE));
  createWeldingRobot(scene, new BABYLON.Vector3(-12 * SCALE, 3.5 * SCALE, 12 * SCALE));
  createPackagingMachine(scene, new BABYLON.Vector3(12 * SCALE, 3.5 * SCALE, 12 * SCALE));
  createQualityControl(scene, new BABYLON.Vector3(12 * SCALE, 0, 3 * SCALE));
  createWarehouse(scene, new BABYLON.Vector3(12 * SCALE, 0, -6 * SCALE));
}

export function createCNCMachine(scene: BABYLON.Scene, position: BABYLON.Vector3): void {
  const machine = new BABYLON.TransformNode("cnc", scene);
  machine.position = position;

  const base = BABYLON.MeshBuilder.CreateBox("cncBase", {
    width: 3.5 * SCALE,
    height: 0.7 * SCALE,
    depth: 2.5 * SCALE
  }, scene);
  base.position.y = 0.35 * SCALE;
  base.parent = machine;

  const baseMat = new BABYLON.StandardMaterial("cncBaseMat", scene);
  baseMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.25);
  base.material = baseMat;

  const body = BABYLON.MeshBuilder.CreateBox("cncBody", {
    width: 3 * SCALE,
    height: 2.5 * SCALE,
    depth: 1.6 * SCALE
  }, scene);
  body.position.y = 1.8 * SCALE;
  body.parent = machine;

  const bodyMat = new BABYLON.StandardMaterial("cncBodyMat", scene);
  bodyMat.diffuseColor = new BABYLON.Color3(0.9, 0.92, 0.95);
  bodyMat.specularColor = new BABYLON.Color3(0.6, 0.6, 0.6);
  bodyMat.alpha = 0.85;
  body.material = bodyMat;

  // Front window
  const windowPlane = BABYLON.MeshBuilder.CreatePlane("cncWindow", {
    width: 2.4 * SCALE,
    height: 1.4 * SCALE
  }, scene);
  windowPlane.position = new BABYLON.Vector3(0, 2.0 * SCALE, 0.9 * SCALE);
  windowPlane.parent = machine;

  const windowMat = new BABYLON.StandardMaterial("cncWindowMat", scene);
  windowMat.diffuseColor = new BABYLON.Color3(0.5, 0.7, 1);
  windowMat.alpha = 0.45;
  windowMat.specularColor = new BABYLON.Color3(1, 1, 1);
  windowPlane.material = windowMat;

  // Work table
  const workTable = BABYLON.MeshBuilder.CreateBox("cncWorkTable", {
    width: 2.2 * SCALE,
    height: 0.12 * SCALE,
    depth: 1.0 * SCALE
  }, scene);
  workTable.position = new BABYLON.Vector3(0, 1.2 * SCALE, 0.3 * SCALE);
  workTable.parent = machine;

  const workTableMat = new BABYLON.StandardMaterial("workTableMat", scene);
  workTableMat.diffuseColor = new BABYLON.Color3(0.25, 0.25, 0.3);
  workTable.material = workTableMat;

  const workPiece = BABYLON.MeshBuilder.CreateBox("cncWorkPiece", {
    width: 0.7 * SCALE,
    height: 0.25 * SCALE,
    depth: 0.7 * SCALE
  }, scene);
  workPiece.position = new BABYLON.Vector3(-0.7 * SCALE, 1.35 * SCALE, 0.3 * SCALE);
  workPiece.parent = machine;

  const workPieceMat = new BABYLON.StandardMaterial("workPieceMat", scene);
  workPieceMat.diffuseColor = new BABYLON.Color3(0.8, 0.7, 0.5);
  workPiece.material = workPieceMat;

  const headMat = new BABYLON.StandardMaterial("cncHeadMat", scene);
  headMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.45);
  headMat.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.15);

  const head = BABYLON.MeshBuilder.CreateCylinder("cncHead", {
    height: 1 * SCALE,
    diameter: 0.5 * SCALE
  }, scene);
  head.position = new BABYLON.Vector3(0, 3.3 * SCALE, 0);
  head.parent = machine;
  head.material = headMat;

  const tool = BABYLON.MeshBuilder.CreateCylinder("cncTool", {
    height: 0.6 * SCALE,
    diameterTop: 0.05 * SCALE,
    diameterBottom: 0.15 * SCALE
  }, scene);
  tool.position = new BABYLON.Vector3(0, 3 * SCALE, 0);
  tool.parent = machine;
  tool.material = headMat;

  // Animations
  gsap.to(head.rotation, {
    y: Math.PI * 2,
    duration: 2,
    repeat: -1,
    ease: "none"
  });

  gsap.to(tool.rotation, {
    y: -Math.PI * 4,
    duration: 1,
    repeat: -1,
    ease: "none"
  });

  const cncTimeline = gsap.timeline({ repeat: -1, yoyo: true });
  cncTimeline.to([head.position, tool.position], {
    x: 0.9 * SCALE,
    duration: 1.8,
    ease: "power1.inOut"
  }).to([head.position, tool.position], {
    x: -0.9 * SCALE,
    duration: 1.8,
    ease: "power1.inOut"
  });

  gsap.to(workPiece.position, {
    z: 0.0 * SCALE,
    duration: 1.5,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut"
  });

  // Control panel
  const panel = BABYLON.MeshBuilder.CreateBox("cncPanel", {
    width: 1.2 * SCALE,
    height: 1.5 * SCALE,
    depth: 0.15 * SCALE
  }, scene);
  panel.position = new BABYLON.Vector3(1.8 * SCALE, 1.3 * SCALE, 0);
  panel.parent = machine;

  const panelMat = new BABYLON.StandardMaterial("cncPanelMat", scene);
  panelMat.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.1);
  panelMat.emissiveColor = new BABYLON.Color3(0, 0.2, 0.4);
  panel.material = panelMat;

  const screen = BABYLON.MeshBuilder.CreatePlane("cncScreen", {
    width: 1 * SCALE,
    height: 0.8 * SCALE
  }, scene);
  screen.position = new BABYLON.Vector3(1.85 * SCALE, 1.5 * SCALE, 0);
  screen.parent = machine;

  const screenMat = new BABYLON.StandardMaterial("screenMat", scene);
  screenMat.emissiveColor = new BABYLON.Color3(0, 0.5, 0.8);
  screen.material = screenMat;

  // LEDs
  const ledColors = [
    new BABYLON.Color3(0, 1, 0.3),
    new BABYLON.Color3(1, 0.5, 0),
    new BABYLON.Color3(0, 0.5, 1),
    new BABYLON.Color3(1, 0, 0)
  ];

  for (let i = 0; i < 4; i++) {
    const led = BABYLON.MeshBuilder.CreateSphere("led" + i, {
      diameter: 0.1 * SCALE
    }, scene);
    led.position = new BABYLON.Vector3(1.9 * SCALE, (1.7 - i * 0.25) * SCALE, 0);
    led.parent = machine;

    const ledMat = new BABYLON.StandardMaterial("ledMat" + i, scene);
    ledMat.emissiveColor = ledColors[i].clone();
    led.material = ledMat;

    gsap.to(ledMat.emissiveColor, {
      r: ledColors[i].r * 0.2,
      g: ledColors[i].g * 0.2,
      b: ledColors[i].b * 0.2,
      duration: 0.5 + i * 0.1,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut"
    });
  }

  createMetalChips(scene, position);
}

export function createMetalChips(scene: BABYLON.Scene, position: BABYLON.Vector3): void {
  for (let i = 0; i < 5; i++) {
    const chip = BABYLON.MeshBuilder.CreateBox("chip" + i, {
      width: 0.05 * SCALE,
      height: 0.02 * SCALE,
      depth: 0.05 * SCALE
    }, scene);
    chip.position = position.add(new BABYLON.Vector3(
      (Math.random() - 0.5) * SCALE,
      0.1 * SCALE,
      (Math.random() - 0.5) * SCALE
    ));

    const chipMat = new BABYLON.StandardMaterial("chipMat", scene);
    chipMat.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.75);
    chip.material = chipMat;

    gsap.to(chip.position, {
      y: 0,
      x: position.x + (Math.random() - 0.5) * 2 * SCALE,
      z: position.z + (Math.random() - 0.5) * 2 * SCALE,
      duration: 1 + Math.random(),
      repeat: -1,
      ease: "bounce.out",
      delay: Math.random() * 2
    });
  }
}

export function createConveyorBelt(scene: BABYLON.Scene, position: BABYLON.Vector3): void {
  const conveyor = new BABYLON.TransformNode("conveyor", scene);
  conveyor.position = position;

  const base = BABYLON.MeshBuilder.CreateBox("conveyorBase", {
    width: 6 * SCALE,
    height: 0.4 * SCALE,
    depth: 1.8 * SCALE
  }, scene);
  base.position.y = 0.2 * SCALE;
  base.parent = conveyor;

  const baseMat = new BABYLON.StandardMaterial("conveyorBaseMat", scene);
  baseMat.diffuseColor = new BABYLON.Color3(0.35, 0.35, 0.4);
  base.material = baseMat;

  const belt = BABYLON.MeshBuilder.CreateBox("conveyorBelt", {
    width: 5.8 * SCALE,
    height: 0.15 * SCALE,
    depth: 1.6 * SCALE
  }, scene);
  belt.position.y = 0.5 * SCALE;
  belt.parent = conveyor;

  const beltMat = new BABYLON.StandardMaterial("conveyorBeltMat", scene);
  beltMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.15);

  const beltTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/floor.png", scene);
  beltTexture.uScale = 10;
  beltTexture.vScale = 2;
  beltMat.diffuseTexture = beltTexture;
  belt.material = beltMat;

  scene.registerBeforeRender(() => {
    if (beltTexture) {
      beltTexture.uOffset += 0.005;
    }
  });

  // Rollers
  const rollerMat = new BABYLON.StandardMaterial("rollerMat", scene);
  rollerMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.55);

  for (let i = 0; i < 2; i++) {
    const roller = BABYLON.MeshBuilder.CreateCylinder("roller" + i, {
      height: 1.8 * SCALE,
      diameter: 0.3 * SCALE
    }, scene);
    roller.position = new BABYLON.Vector3((i * 5 - 2.5) * SCALE, 0.3 * SCALE, 0);
    roller.rotation.x = Math.PI / 2;
    roller.parent = conveyor;
    roller.material = rollerMat;

    gsap.to(roller.rotation, {
      z: Math.PI * 2,
      duration: 2,
      repeat: -1,
      ease: "none"
    });
  }

  // Boxes on conveyor
  for (let i = 0; i < 4; i++) {
    const box = BABYLON.MeshBuilder.CreateBox("conveyorBox" + i, {
      width: 0.6 * SCALE,
      height: 0.6 * SCALE,
      depth: 0.6 * SCALE
    }, scene);
    box.position = new BABYLON.Vector3((-2 + i * 1.5) * SCALE, 0.9 * SCALE, 0);
    box.parent = conveyor;

    const boxMat = new BABYLON.StandardMaterial("boxMat" + i, scene);
    boxMat.diffuseColor = new BABYLON.Color3(0.8, 0.6, 0.4);
    box.material = boxMat;

    const label = BABYLON.MeshBuilder.CreatePlane("label" + i, {
      width: 0.4 * SCALE,
      height: 0.2 * SCALE
    }, scene);
    label.position = new BABYLON.Vector3((-2 + i * 1.5) * SCALE, 0.9 * SCALE, 0.31 * SCALE);
    label.parent = conveyor;

    const labelMat = new BABYLON.StandardMaterial("labelMat", scene);
    labelMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
    labelMat.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    label.material = labelMat;

    const timeline = gsap.timeline({ repeat: -1 });
    timeline.to(box.position, {
      x: 2.5 * SCALE,
      duration: 3,
      ease: "none"
    }).to(box.position, {
      x: -2.5 * SCALE,
      duration: 0.01
    });

    timeline.to(label.position, {
      x: 2.5 * SCALE,
      duration: 3,
      ease: "none"
    }, 0).to(label.position, {
      x: -2.5 * SCALE,
      duration: 0.01
    }, 3);
  }
}

export function createWeldingRobot(scene: BABYLON.Scene, position: BABYLON.Vector3): void {
  const robot = new BABYLON.TransformNode("robot", scene);
  robot.position = position;

  const base = BABYLON.MeshBuilder.CreateCylinder("robotBase", {
    height: 0.6 * SCALE,
    diameter: 1.8 * SCALE
  }, scene);
  base.position.y = 0.3 * SCALE;
  base.parent = robot;

  const baseMat = new BABYLON.StandardMaterial("robotBaseMat", scene);
  baseMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.35);
  base.material = baseMat;

  const body = BABYLON.MeshBuilder.CreateCylinder("robotBody", {
    height: 1.2 * SCALE,
    diameter: 0.8 * SCALE
  }, scene);
  body.position.y = 1.2 * SCALE;
  body.parent = robot;

  const bodyMat = new BABYLON.StandardMaterial("robotBodyMat", scene);
  bodyMat.diffuseColor = new BABYLON.Color3(1, 0.6, 0.2);
  bodyMat.specularColor = new BABYLON.Color3(0.7, 0.7, 0.7);
  body.material = bodyMat;

  const armMat = new BABYLON.StandardMaterial("robotArmMat", scene);
  armMat.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.92);

  const arm1 = BABYLON.MeshBuilder.CreateBox("robotArm1", {
    width: 0.3 * SCALE,
    height: 1.5 * SCALE,
    depth: 0.3 * SCALE
  }, scene);
  arm1.position = new BABYLON.Vector3(0, 2.2 * SCALE, 0);
  arm1.rotation.z = Math.PI / 6;
  arm1.parent = robot;
  arm1.material = armMat;

  const arm2 = BABYLON.MeshBuilder.CreateBox("robotArm2", {
    width: 0.25 * SCALE,
    height: 1.2 * SCALE,
    depth: 0.25 * SCALE
  }, scene);
  arm2.position = new BABYLON.Vector3(0.8 * SCALE, 2.8 * SCALE, 0);
  arm2.rotation.z = -Math.PI / 4;
  arm2.parent = robot;
  arm2.material = armMat;

  const weldHead = BABYLON.MeshBuilder.CreateCylinder("weldHead", {
    height: 0.4 * SCALE,
    diameter: 0.25 * SCALE
  }, scene);
  weldHead.position = new BABYLON.Vector3(1.2 * SCALE, 3 * SCALE, 0);
  weldHead.parent = robot;

  const weldMat = new BABYLON.StandardMaterial("weldMat", scene);
  weldMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.15);
  weldMat.emissiveColor = new BABYLON.Color3(0.3, 0.5, 1);
  weldHead.material = weldMat;

  // Animation
  const tl = gsap.timeline({ repeat: -1 });
  tl.to(arm1.rotation, {
    z: -Math.PI / 6,
    duration: 2,
    ease: "power2.inOut"
  }).to(arm1.rotation, {
    z: Math.PI / 6,
    duration: 2,
    ease: "power2.inOut"
  });

  tl.to(arm2.rotation, {
    z: -Math.PI / 8,
    duration: 1.5,
    ease: "power2.inOut"
  }, 0).to(arm2.rotation, {
    z: -Math.PI / 4,
    duration: 1.5,
    ease: "power2.inOut"
  }, 1.5);

  // Sparks
  const sparks = new BABYLON.ParticleSystem("sparks", 50, scene);
  sparks.particleTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/flare.png", scene);
  sparks.emitter = weldHead;
  sparks.minEmitBox = new BABYLON.Vector3(-0.1 * SCALE, 0, -0.1 * SCALE);
  sparks.maxEmitBox = new BABYLON.Vector3(0.1 * SCALE, 0, 0.1 * SCALE);
  sparks.color1 = new BABYLON.Color4(1, 0.8, 0.2, 1);
  sparks.color2 = new BABYLON.Color4(1, 0.5, 0, 1);
  sparks.colorDead = new BABYLON.Color4(0.5, 0.2, 0, 0);
  sparks.minSize = 0.02 * SCALE;
  sparks.maxSize = 0.05 * SCALE;
  sparks.minLifeTime = 0.1;
  sparks.maxLifeTime = 0.3;
  sparks.emitRate = 30;
  sparks.gravity = new BABYLON.Vector3(0, -9.81 * SCALE, 0);
  sparks.direction1 = new BABYLON.Vector3(-1, 1, -1);
  sparks.direction2 = new BABYLON.Vector3(1, 1, 1);
  sparks.minEmitPower = 1 * SCALE;
  sparks.maxEmitPower = 3 * SCALE;
  sparks.start();

  // Weld light
  const weldLight = new BABYLON.PointLight("weldLight", position.add(new BABYLON.Vector3(1.2 * SCALE, 3 * SCALE, 0)), scene);
  weldLight.diffuse = new BABYLON.Color3(0.6, 0.8, 1);
  weldLight.intensity = 5.2;
  weldLight.range = 4 * SCALE;

  gsap.to(weldLight, {
    intensity: 10,
    duration: 0.1,
    repeat: -1,
    yoyo: true
  });
}

export function createPackagingMachine(scene: BABYLON.Scene, position: BABYLON.Vector3): void {
  const packager = new BABYLON.TransformNode("packager", scene);
  packager.position = position;

  const frame = BABYLON.MeshBuilder.CreateBox("packagerFrame", {
    width: 2.5 * SCALE,
    height: 3 * SCALE,
    depth: 2 * SCALE
  }, scene);
  frame.position.y = 1.5 * SCALE;
  frame.parent = packager;

  const frameMat = new BABYLON.StandardMaterial("packagerFrameMat", scene);
  frameMat.diffuseColor = new BABYLON.Color3(0.85, 0.87, 0.9);
  frameMat.alpha = 0.3;
  frameMat.wireframe = true;
  frame.material = frameMat;

  const inner = BABYLON.MeshBuilder.CreateBox("packagerInner", {
    width: 2.3 * SCALE,
    height: 2.8 * SCALE,
    depth: 1.8 * SCALE
  }, scene);
  inner.position.y = 1.5 * SCALE;
  inner.parent = packager;

  const innerMat = new BABYLON.StandardMaterial("packagerInnerMat", scene);
  innerMat.diffuseColor = new BABYLON.Color3(0.75, 0.78, 0.82);
  inner.material = innerMat;

  // Exit conveyor
  const exitConveyor = BABYLON.MeshBuilder.CreateBox("exitConveyor", {
    width: 3 * SCALE,
    height: 0.1 * SCALE,
    depth: 1 * SCALE
  }, scene);
  exitConveyor.position = new BABYLON.Vector3(-2 * SCALE, 0.5 * SCALE, 0);
  exitConveyor.parent = packager;

  const exitConveyorMat = new BABYLON.StandardMaterial("exitConveyorMat", scene);
  exitConveyorMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.35);
  exitConveyor.material = exitConveyorMat;

  const armMat = new BABYLON.StandardMaterial("packArmMat", scene);
  armMat.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.85);

  for (let i = 0; i < 2; i++) {
    const arm = BABYLON.MeshBuilder.CreateBox("packArm" + i, {
      width: 0.25 * SCALE,
      height: 1.5 * SCALE,
      depth: 0.25 * SCALE
    }, scene);
    arm.position = new BABYLON.Vector3((i - 0.5) * 1.5 * SCALE, 2 * SCALE, 0);
    arm.parent = packager;
    arm.material = armMat;

    const piston = BABYLON.MeshBuilder.CreateCylinder("piston" + i, {
      height: 0.3 * SCALE,
      diameter: 0.15 * SCALE
    }, scene);
    piston.position = new BABYLON.Vector3((i - 0.5) * 1.5 * SCALE, 1.2 * SCALE, 0);
    piston.parent = packager;
    piston.material = armMat;

    gsap.to(arm.position, {
      y: 1 * SCALE,
      duration: 1.2,
      delay: i * 0.6,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut"
    });

    gsap.to(piston.position, {
      y: 0.2 * SCALE,
      duration: 1.2,
      delay: i * 0.6,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut"
    });
  }

  // Packed boxes
  const packedBoxMat = new BABYLON.StandardMaterial("packedBoxMat", scene);
  packedBoxMat.diffuseColor = new BABYLON.Color3(0.6, 0.8, 0.4);

  for (let i = 0; i < 2; i++) {
    const packedBox = BABYLON.MeshBuilder.CreateBox("packedBox" + i, {
      width: 0.5 * SCALE,
      height: 0.5 * SCALE,
      depth: 0.5 * SCALE
    }, scene);
    packedBox.position = new BABYLON.Vector3(-1.5 * SCALE - i * 0.8 * SCALE, 0.8 * SCALE, 0);
    packedBox.parent = packager;
    packedBox.material = packedBoxMat;

    gsap.to(packedBox.position, {
      x: -4 * SCALE,
      duration: 3,
      delay: i * 1.5,
      repeat: -1,
      ease: "none",
      onRepeat: function () {
        packedBox.position.x = -1.5 * SCALE;
      }
    });
  }
}

export function createQualityControl(scene: BABYLON.Scene, position: BABYLON.Vector3): void {
  const qc = new BABYLON.TransformNode("qc", scene);
  qc.position = position;

  const desk = BABYLON.MeshBuilder.CreateBox("qcDesk", {
    width: 2.5 * SCALE,
    height: 0.7 * SCALE,
    depth: 1.5 * SCALE
  }, scene);
  desk.position.y = 0.35 * SCALE;
  desk.parent = qc;

  const deskMat = new BABYLON.StandardMaterial("qcDeskMat", scene);
  deskMat.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.97);
  desk.material = deskMat;

  const screen = BABYLON.MeshBuilder.CreateBox("qcScreen", {
    width: 1.5 * SCALE,
    height: 1 * SCALE,
    depth: 0.08 * SCALE
  }, scene);
  screen.position = new BABYLON.Vector3(0, 1.3 * SCALE, 0);
  screen.parent = qc;

  const screenMat = new BABYLON.StandardMaterial("qcScreenMat", scene);
  screenMat.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.1);
  screenMat.emissiveColor = new BABYLON.Color3(0.1, 0.3, 0.5);
  screen.material = screenMat;

  const graph = BABYLON.MeshBuilder.CreatePlane("graph", {
    width: 1.3 * SCALE,
    height: 0.8 * SCALE
  }, scene);
  graph.position = new BABYLON.Vector3(0, 1.3 * SCALE, 0.05 * SCALE);
  graph.parent = qc;

  const graphMat = new BABYLON.StandardMaterial("graphMat", scene);
  graphMat.emissiveColor = new BABYLON.Color3(0, 0.8, 0.4);
  graphMat.alpha = 0.7;
  graph.material = graphMat;

  gsap.to(screenMat.emissiveColor, {
    r: 0.2,
    g: 0.5,
    b: 0.8,
    duration: 2,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut"
  });

  // Scanner
  const scanner = BABYLON.MeshBuilder.CreateCylinder("scanner", {
    height: 0.6 * SCALE,
    diameter: 0.25 * SCALE
  }, scene);
  scanner.position = new BABYLON.Vector3(-0.7 * SCALE, 1 * SCALE, 0.4 * SCALE);
  scanner.parent = qc;

  const scannerMat = new BABYLON.StandardMaterial("scannerMat", scene);
  scannerMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.35);
  scannerMat.emissiveColor = new BABYLON.Color3(1, 0, 0);
  scanner.material = scannerMat;

  const laser = BABYLON.MeshBuilder.CreateCylinder("laser", {
    height: 0.01 * SCALE,
    diameter: 1.5 * SCALE
  }, scene);
  laser.position = new BABYLON.Vector3(-0.7 * SCALE, 0.8 * SCALE, 0.4 * SCALE);
  laser.rotation.z = Math.PI / 2;
  laser.parent = qc;

  const laserMat = new BABYLON.StandardMaterial("laserMat", scene);
  laserMat.emissiveColor = new BABYLON.Color3(1, 0, 0);
  laserMat.alpha = 0.6;
  laser.material = laserMat;

  const scanTimeline = gsap.timeline({ repeat: -1 });
  scanTimeline.to(laser.position, {
    z: -0.4 * SCALE,
    duration: 2,
    ease: "none"
  }).to(laser.position, {
    z: 0.4 * SCALE,
    duration: 2,
    ease: "none"
  });

  scanTimeline.to(scanner.rotation, {
    y: Math.PI,
    duration: 4,
    ease: "none"
  }, 0);
}

export function createWarehouse(scene: BABYLON.Scene, position: BABYLON.Vector3): void {
  const warehouse = new BABYLON.TransformNode("warehouse", scene);
  warehouse.position = position;

  const shelfMat = new BABYLON.StandardMaterial("shelfMat", scene);
  shelfMat.diffuseColor = new BABYLON.Color3(0.7, 0.5, 0.3);

  const poleMat = new BABYLON.StandardMaterial("poleMat", scene);
  poleMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.45);

  const colors = [
    new BABYLON.Color3(0.85, 0.65, 0.45),
    new BABYLON.Color3(0.45, 0.65, 0.85),
    new BABYLON.Color3(0.65, 0.85, 0.45)
  ];

  for (let row = 0; row < 2; row++) {
    for (let level = 0; level < 4; level++) {
      const shelf = BABYLON.MeshBuilder.CreateBox("shelf" + row + level, {
        width: 2 * SCALE,
        height: 0.08 * SCALE,
        depth: 1.2 * SCALE
      }, scene);
      shelf.position = new BABYLON.Vector3(
        (row - 0.5) * 2.5 * SCALE,
        0.4 * SCALE + level * 0.8 * SCALE,
        0
      );
      shelf.parent = warehouse;
      shelf.material = shelfMat;

      if (level > 0) {
        for (let b = 0; b < 3; b++) {
          const box = BABYLON.MeshBuilder.CreateBox("shelfBox", {
            width: 0.4 * SCALE,
            height: 0.35 * SCALE,
            depth: 0.35 * SCALE
          }, scene);
          box.position = new BABYLON.Vector3(
            (row - 0.5) * 2.5 * SCALE + (b - 1) * 0.5 * SCALE,
            0.6 * SCALE + level * 0.8 * SCALE,
            0
          );
          box.parent = warehouse;

          const boxMat = new BABYLON.StandardMaterial("shelfBoxMat", scene);
          boxMat.diffuseColor = colors[b % 3];
          box.material = boxMat;
        }
      }
    }

    for (let i = 0; i < 3; i++) {
      const pole = BABYLON.MeshBuilder.CreateCylinder("pole", {
        height: 3.5 * SCALE,
        diameter: 0.12 * SCALE
      }, scene);
      pole.position = new BABYLON.Vector3(
        (row - 0.5) * 2.5 * SCALE + (i - 1) * SCALE,
        1.75 * SCALE,
        0
      );
      pole.parent = warehouse;
      pole.material = poleMat;
    }
  }

  // Warehouse robot
  const warehouseRobot = BABYLON.MeshBuilder.CreateBox("warehouseRobot", {
    width: 0.4 * SCALE,
    height: 0.6 * SCALE,
    depth: 0.4 * SCALE
  }, scene);
  warehouseRobot.position = new BABYLON.Vector3(0, 0.3 * SCALE, 1 * SCALE);
  warehouseRobot.parent = warehouse;

  const robotMat = new BABYLON.StandardMaterial("warehouseRobotMat", scene);
  robotMat.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.9);
  robotMat.emissiveColor = new BABYLON.Color3(0.1, 0.3, 0.5);
  warehouseRobot.material = robotMat;

  gsap.to(warehouseRobot.position, {
    z: -1 * SCALE,
    duration: 4,
    repeat: -1,
    yoyo: true,
    ease: "power2.inOut"
  });

  gsap.to(warehouseRobot.position, {
    x: 1.5 * SCALE,
    duration: 2,
    repeat: -1,
    yoyo: true,
    ease: "power2.inOut"
  });
}
