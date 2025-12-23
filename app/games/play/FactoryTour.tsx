// @ts-nocheck
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as BABYLON from '@babylonjs/core';
import './FactoryTour.css';

// Constants
const SCALE = 0.35;
const TOTAL_STATIONS = 10;
const GAME_STATIONS = [2, 4, 8]; // 0-indexed stations that have mini-games

// Station definitions with Hebrew descriptions
const STATIONS = [
  {
    id: 0,
    name: 'כניסה למפעל',
    description: 'ברוכים הבאים למפעל הייצור החכם! כאן נתחיל את המסע שלנו.',
    position: new BABYLON.Vector3(0 * SCALE, 2 * SCALE, 0 * SCALE),
    lookAt: new BABYLON.Vector3(0, 1.5 * SCALE, -10 * SCALE),
  },
  {
    id: 1,
    name: 'אזור קבלת חומרים',
    description: 'כאן מגיעים חומרי הגלם לפני שהם נכנסים לקו הייצור.',
    position: new BABYLON.Vector3(-8 * SCALE, 2 * SCALE, -8 * SCALE),
    lookAt: new BABYLON.Vector3(-15 * SCALE, 1 * SCALE, -15 * SCALE),
  },
  {
    id: 2,
    name: 'תחנת בקרת איכות #1',
    description: 'תחנת בדיקה ראשונה - כאן נבדקים החומרים הנכנסים.',
    position: new BABYLON.Vector3(-15 * SCALE, 2 * SCALE, -20 * SCALE),
    lookAt: new BABYLON.Vector3(-20 * SCALE, 1 * SCALE, -25 * SCALE),
    hasGame: true,
    gameName: 'חידת בקרת האיכות',
  },
  {
    id: 3,
    name: 'קו הייצור הראשי',
    description: 'לב המפעל - כאן מתבצע תהליך הייצור העיקרי.',
    position: new BABYLON.Vector3(-5 * SCALE, 3 * SCALE, -30 * SCALE),
    lookAt: new BABYLON.Vector3(0, 2 * SCALE, -35 * SCALE),
  },
  {
    id: 4,
    name: 'תחנת ההרכבה',
    description: 'כאן מורכבים החלקים השונים למוצר המוגמר.',
    position: new BABYLON.Vector3(10 * SCALE, 2.5 * SCALE, -35 * SCALE),
    lookAt: new BABYLON.Vector3(15 * SCALE, 1 * SCALE, -40 * SCALE),
    hasGame: true,
    gameName: 'חידת ההרכבה',
  },
  {
    id: 5,
    name: 'מערכת האוטומציה',
    description: 'רובוטים וזרועות מכניות מבצעים משימות מורכבות.',
    position: new BABYLON.Vector3(20 * SCALE, 2 * SCALE, -30 * SCALE),
    lookAt: new BABYLON.Vector3(25 * SCALE, 2 * SCALE, -25 * SCALE),
  },
  {
    id: 6,
    name: 'חדר הבקרה',
    description: 'מרכז השליטה והפיקוד של כל המפעל.',
    position: new BABYLON.Vector3(25 * SCALE, 4 * SCALE, -15 * SCALE),
    lookAt: new BABYLON.Vector3(20 * SCALE, 3 * SCALE, -10 * SCALE),
  },
  {
    id: 7,
    name: 'אזור האחסון',
    description: 'מחסנים חכמים לאחסון מוצרים מוגמרים.',
    position: new BABYLON.Vector3(15 * SCALE, 2 * SCALE, -5 * SCALE),
    lookAt: new BABYLON.Vector3(10 * SCALE, 1 * SCALE, 0),
  },
  {
    id: 8,
    name: 'תחנת בקרת איכות #2',
    description: 'בדיקה סופית לפני משלוח - הבטחת איכות מקסימלית.',
    position: new BABYLON.Vector3(5 * SCALE, 2 * SCALE, 5 * SCALE),
    lookAt: new BABYLON.Vector3(0, 1.5 * SCALE, 10 * SCALE),
    hasGame: true,
    gameName: 'חידת הבדיקה הסופית',
  },
  {
    id: 9,
    name: 'יציאה ומשלוחים',
    description: 'סיום המסע - המוצרים יוצאים לדרכם אל הלקוחות.',
    position: new BABYLON.Vector3(0 * SCALE, 2 * SCALE, 15 * SCALE),
    lookAt: new BABYLON.Vector3(0, 1 * SCALE, 20 * SCALE),
  },
];

interface FactoryTourProps {
  nickname: string;
  onTourComplete: () => void;
  onScoreUpdate?: (score: number) => void;
  initialScore?: number;
}

export default function FactoryTour({
  nickname,
  onTourComplete,
  onScoreUpdate,
  initialScore = 0,
}: FactoryTourProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const cameraRef = useRef<BABYLON.FreeCamera | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [currentStation, setCurrentStation] = useState(0);
  const [showStationInfo, setShowStationInfo] = useState(false);
  const [showGameModal, setShowGameModal] = useState(false);
  const [isTourComplete, setIsTourComplete] = useState(false);
  const [score, setScore] = useState(initialScore);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  // Hide instructions after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowInstructions(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Create the factory floor
  const createFloor = useCallback((scene: BABYLON.Scene) => {
    const floorSize = 100 * SCALE;
    const floor = BABYLON.MeshBuilder.CreateGround(
      'floor',
      { width: floorSize, height: floorSize },
      scene
    );

    const floorMaterial = new BABYLON.StandardMaterial('floorMat', scene);
    floorMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.35);
    floorMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    floor.material = floorMaterial;
    floor.receiveShadows = true;

    // Floor grid lines
    const gridSize = 50;
    const gridStep = floorSize / gridSize;
    const gridLines: BABYLON.Vector3[][] = [];

    for (let i = -gridSize / 2; i <= gridSize / 2; i++) {
      // X lines
      gridLines.push([
        new BABYLON.Vector3(i * gridStep, 0.01, -floorSize / 2),
        new BABYLON.Vector3(i * gridStep, 0.01, floorSize / 2),
      ]);
      // Z lines
      gridLines.push([
        new BABYLON.Vector3(-floorSize / 2, 0.01, i * gridStep),
        new BABYLON.Vector3(floorSize / 2, 0.01, i * gridStep),
      ]);
    }

    const gridMesh = BABYLON.MeshBuilder.CreateLineSystem(
      'grid',
      { lines: gridLines },
      scene
    );
    const gridMaterial = new BABYLON.StandardMaterial('gridMat', scene);
    gridMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.25, 0.3);
    gridMaterial.alpha = 0.3;
    gridMesh.material = gridMaterial;

    return floor;
  }, []);

  // Create building structure
  const createBuilding = useCallback((scene: BABYLON.Scene) => {
    const wallHeight = 15 * SCALE;
    const buildingSize = 80 * SCALE;

    // Walls
    const wallMaterial = new BABYLON.StandardMaterial('wallMat', scene);
    wallMaterial.diffuseColor = new BABYLON.Color3(0.35, 0.4, 0.45);
    wallMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

    // Back wall
    const backWall = BABYLON.MeshBuilder.CreateBox(
      'backWall',
      { width: buildingSize, height: wallHeight, depth: 0.5 * SCALE },
      scene
    );
    backWall.position = new BABYLON.Vector3(0, wallHeight / 2, -buildingSize / 2);
    backWall.material = wallMaterial;

    // Side walls
    const leftWall = BABYLON.MeshBuilder.CreateBox(
      'leftWall',
      { width: 0.5 * SCALE, height: wallHeight, depth: buildingSize },
      scene
    );
    leftWall.position = new BABYLON.Vector3(-buildingSize / 2, wallHeight / 2, 0);
    leftWall.material = wallMaterial;

    const rightWall = BABYLON.MeshBuilder.CreateBox(
      'rightWall',
      { width: 0.5 * SCALE, height: wallHeight, depth: buildingSize },
      scene
    );
    rightWall.position = new BABYLON.Vector3(buildingSize / 2, wallHeight / 2, 0);
    rightWall.material = wallMaterial;

    // Ceiling beams
    const beamMaterial = new BABYLON.StandardMaterial('beamMat', scene);
    beamMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.35, 0.3);

    for (let i = -3; i <= 3; i++) {
      const beam = BABYLON.MeshBuilder.CreateBox(
        `beam_${i}`,
        { width: buildingSize, height: 0.5 * SCALE, depth: 1 * SCALE },
        scene
      );
      beam.position = new BABYLON.Vector3(0, wallHeight - 0.5 * SCALE, i * 10 * SCALE);
      beam.material = beamMaterial;
    }

    // Ceiling
    const ceiling = BABYLON.MeshBuilder.CreateBox(
      'ceiling',
      { width: buildingSize, height: 0.3 * SCALE, depth: buildingSize },
      scene
    );
    ceiling.position = new BABYLON.Vector3(0, wallHeight, 0);
    const ceilingMaterial = new BABYLON.StandardMaterial('ceilingMat', scene);
    ceilingMaterial.diffuseColor = new BABYLON.Color3(0.25, 0.25, 0.3);
    ceiling.material = ceilingMaterial;
  }, []);

  // Create machines and equipment
  const createMachines = useCallback((scene: BABYLON.Scene) => {
    const machineMaterial = new BABYLON.StandardMaterial('machineMat', scene);
    machineMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.5, 0.7);
    machineMaterial.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);

    const accentMaterial = new BABYLON.StandardMaterial('accentMat', scene);
    accentMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.5, 0.2);
    accentMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.1, 0);

    const metalMaterial = new BABYLON.StandardMaterial('metalMat', scene);
    metalMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.65);
    metalMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);

    // Conveyor belts
    for (let i = 0; i < 3; i++) {
      const conveyor = BABYLON.MeshBuilder.CreateBox(
        `conveyor_${i}`,
        { width: 30 * SCALE, height: 1 * SCALE, depth: 3 * SCALE },
        scene
      );
      conveyor.position = new BABYLON.Vector3(-10 * SCALE + i * 15 * SCALE, 1 * SCALE, -25 * SCALE);
      conveyor.material = metalMaterial;

      // Conveyor legs
      for (let j = -2; j <= 2; j++) {
        const leg = BABYLON.MeshBuilder.CreateCylinder(
          `leg_${i}_${j}`,
          { height: 1 * SCALE, diameter: 0.3 * SCALE },
          scene
        );
        leg.position = new BABYLON.Vector3(
          conveyor.position.x + j * 6 * SCALE,
          0.5 * SCALE,
          conveyor.position.z
        );
        leg.material = metalMaterial;
      }
    }

    // Large industrial machines
    const machinePositions = [
      { x: -20, z: -15 },
      { x: -20, z: -30 },
      { x: 15, z: -35 },
      { x: 20, z: -20 },
      { x: 25, z: -10 },
      { x: 10, z: 0 },
    ];

    machinePositions.forEach((pos, index) => {
      // Main body
      const machine = BABYLON.MeshBuilder.CreateBox(
        `machine_${index}`,
        { width: 6 * SCALE, height: 8 * SCALE, depth: 5 * SCALE },
        scene
      );
      machine.position = new BABYLON.Vector3(pos.x * SCALE, 4 * SCALE, pos.z * SCALE);
      machine.material = machineMaterial;

      // Control panel
      const panel = BABYLON.MeshBuilder.CreateBox(
        `panel_${index}`,
        { width: 2 * SCALE, height: 3 * SCALE, depth: 0.3 * SCALE },
        scene
      );
      panel.position = new BABYLON.Vector3(
        pos.x * SCALE,
        5 * SCALE,
        pos.z * SCALE + 2.8 * SCALE
      );
      panel.material = accentMaterial;

      // Rotating element on top
      const cylinder = BABYLON.MeshBuilder.CreateCylinder(
        `cylinder_${index}`,
        { height: 2 * SCALE, diameter: 3 * SCALE },
        scene
      );
      cylinder.position = new BABYLON.Vector3(
        pos.x * SCALE,
        9 * SCALE,
        pos.z * SCALE
      );
      cylinder.material = metalMaterial;

      // Animate the cylinder
      scene.registerBeforeRender(() => {
        cylinder.rotation.y += 0.02;
      });
    });

    // Robot arms
    const robotPositions = [
      { x: -5, z: -28 },
      { x: 5, z: -28 },
      { x: 22, z: -28 },
    ];

    robotPositions.forEach((pos, index) => {
      // Base
      const base = BABYLON.MeshBuilder.CreateCylinder(
        `robotBase_${index}`,
        { height: 1 * SCALE, diameter: 3 * SCALE },
        scene
      );
      base.position = new BABYLON.Vector3(pos.x * SCALE, 0.5 * SCALE, pos.z * SCALE);
      base.material = metalMaterial;

      // Arm segment 1
      const arm1 = BABYLON.MeshBuilder.CreateBox(
        `arm1_${index}`,
        { width: 1 * SCALE, height: 5 * SCALE, depth: 1 * SCALE },
        scene
      );
      arm1.position = new BABYLON.Vector3(pos.x * SCALE, 3.5 * SCALE, pos.z * SCALE);
      arm1.material = accentMaterial;

      // Joint
      const joint = BABYLON.MeshBuilder.CreateSphere(
        `joint_${index}`,
        { diameter: 1.2 * SCALE },
        scene
      );
      joint.position = new BABYLON.Vector3(pos.x * SCALE, 6 * SCALE, pos.z * SCALE);
      joint.material = metalMaterial;

      // Arm segment 2
      const arm2 = BABYLON.MeshBuilder.CreateBox(
        `arm2_${index}`,
        { width: 0.8 * SCALE, height: 4 * SCALE, depth: 0.8 * SCALE },
        scene
      );
      arm2.position = new BABYLON.Vector3(pos.x * SCALE + 2 * SCALE, 6 * SCALE, pos.z * SCALE);
      arm2.rotation.z = Math.PI / 4;
      arm2.material = accentMaterial;

      // Animate robot arm
      let time = index * Math.PI / 3;
      scene.registerBeforeRender(() => {
        time += 0.02;
        arm2.rotation.z = Math.PI / 4 + Math.sin(time) * 0.3;
        arm2.position.x = pos.x * SCALE + 2 * SCALE + Math.cos(time) * SCALE;
      });
    });

    // Storage shelves
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const shelf = BABYLON.MeshBuilder.CreateBox(
          `shelf_${row}_${col}`,
          { width: 4 * SCALE, height: 6 * SCALE, depth: 2 * SCALE },
          scene
        );
        shelf.position = new BABYLON.Vector3(
          12 * SCALE + col * 5 * SCALE,
          3 * SCALE,
          2 * SCALE + row * 3 * SCALE
        );
        shelf.material = metalMaterial;

        // Boxes on shelves
        for (let level = 0; level < 3; level++) {
          const box = BABYLON.MeshBuilder.CreateBox(
            `box_${row}_${col}_${level}`,
            { width: 1.5 * SCALE, height: 1.5 * SCALE, depth: 1.5 * SCALE },
            scene
          );
          box.position = new BABYLON.Vector3(
            shelf.position.x,
            1 * SCALE + level * 2 * SCALE,
            shelf.position.z
          );
          const boxMat = new BABYLON.StandardMaterial(`boxMat_${row}_${col}_${level}`, scene);
          boxMat.diffuseColor = new BABYLON.Color3(
            0.6 + Math.random() * 0.3,
            0.4 + Math.random() * 0.3,
            0.2 + Math.random() * 0.3
          );
          box.material = boxMat;
        }
      }
    }
  }, []);

  // Create lighting
  const createLights = useCallback((scene: BABYLON.Scene) => {
    // Ambient light
    const ambient = new BABYLON.HemisphericLight(
      'ambient',
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    ambient.intensity = 0.4;
    ambient.diffuse = new BABYLON.Color3(0.9, 0.9, 1);
    ambient.groundColor = new BABYLON.Color3(0.3, 0.3, 0.4);

    // Main directional light
    const dirLight = new BABYLON.DirectionalLight(
      'dirLight',
      new BABYLON.Vector3(-1, -2, -1),
      scene
    );
    dirLight.position = new BABYLON.Vector3(20 * SCALE, 30 * SCALE, 20 * SCALE);
    dirLight.intensity = 0.8;
    dirLight.diffuse = new BABYLON.Color3(1, 0.95, 0.9);

    // Spot lights for industrial feel
    const spotPositions = [
      { x: -15, z: -20 },
      { x: 15, z: -20 },
      { x: 0, z: -35 },
      { x: 20, z: -5 },
    ];

    spotPositions.forEach((pos, index) => {
      const spot = new BABYLON.SpotLight(
        `spot_${index}`,
        new BABYLON.Vector3(pos.x * SCALE, 14 * SCALE, pos.z * SCALE),
        new BABYLON.Vector3(0, -1, 0),
        Math.PI / 3,
        2,
        scene
      );
      spot.intensity = 0.6;
      spot.diffuse = new BABYLON.Color3(1, 0.9, 0.7);

      // Light fixture
      const fixture = BABYLON.MeshBuilder.CreateCylinder(
        `fixture_${index}`,
        { height: 0.5 * SCALE, diameterTop: 0.3 * SCALE, diameterBottom: 1.5 * SCALE },
        scene
      );
      fixture.position = new BABYLON.Vector3(pos.x * SCALE, 14.5 * SCALE, pos.z * SCALE);
      const fixtureMat = new BABYLON.StandardMaterial(`fixtureMat_${index}`, scene);
      fixtureMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
      fixtureMat.emissiveColor = new BABYLON.Color3(0.5, 0.45, 0.3);
      fixture.material = fixtureMat;
    });
  }, []);

  // Create station markers
  const createStationMarkers = useCallback((scene: BABYLON.Scene) => {
    STATIONS.forEach((station) => {
      // Glowing marker
      const marker = BABYLON.MeshBuilder.CreateCylinder(
        `marker_${station.id}`,
        { height: 0.3 * SCALE, diameter: 2 * SCALE },
        scene
      );
      marker.position = new BABYLON.Vector3(
        station.position.x,
        0.2 * SCALE,
        station.position.z
      );

      const markerMat = new BABYLON.StandardMaterial(`markerMat_${station.id}`, scene);
      if (station.hasGame) {
        markerMat.diffuseColor = new BABYLON.Color3(1, 0.6, 0.2);
        markerMat.emissiveColor = new BABYLON.Color3(0.5, 0.3, 0.1);
      } else {
        markerMat.diffuseColor = new BABYLON.Color3(0.2, 0.6, 1);
        markerMat.emissiveColor = new BABYLON.Color3(0.1, 0.3, 0.5);
      }
      markerMat.alpha = 0.7;
      marker.material = markerMat;

      // Floating number
      const numberPlane = BABYLON.MeshBuilder.CreatePlane(
        `numberPlane_${station.id}`,
        { width: 1.5 * SCALE, height: 1.5 * SCALE },
        scene
      );
      numberPlane.position = new BABYLON.Vector3(
        station.position.x,
        3 * SCALE,
        station.position.z
      );
      numberPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

      // Create dynamic texture for number
      const dynamicTexture = new BABYLON.DynamicTexture(
        `numTex_${station.id}`,
        { width: 128, height: 128 },
        scene
      );
      const ctx = dynamicTexture.getContext();
      ctx.fillStyle = station.hasGame ? '#f59e0b' : '#3b82f6';
      ctx.beginPath();
      ctx.arc(64, 64, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.font = 'bold 60px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((station.id + 1).toString(), 64, 64);
      dynamicTexture.update();

      const numMat = new BABYLON.StandardMaterial(`numMat_${station.id}`, scene);
      numMat.diffuseTexture = dynamicTexture;
      numMat.emissiveTexture = dynamicTexture;
      numMat.opacityTexture = dynamicTexture;
      numMat.backFaceCulling = false;
      numberPlane.material = numMat;

      // Animate marker
      let time = station.id * 0.5;
      scene.registerBeforeRender(() => {
        time += 0.03;
        marker.scaling.y = 1 + Math.sin(time) * 0.2;
        numberPlane.position.y = 3 * SCALE + Math.sin(time * 1.5) * 0.3 * SCALE;
      });
    });
  }, []);

  // Animate camera to station
  const animateToStation = useCallback(
    (stationIndex: number) => {
      if (!cameraRef.current || !sceneRef.current || isAnimating) return;

      const station = STATIONS[stationIndex];
      if (!station) return;

      setIsAnimating(true);
      setShowStationInfo(false);

      const camera = cameraRef.current;
      const scene = sceneRef.current;

      // Create animation for position
      const posAnimation = new BABYLON.Animation(
        'cameraPos',
        'position',
        30,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      posAnimation.setKeys([
        { frame: 0, value: camera.position.clone() },
        { frame: 60, value: station.position.clone() },
      ]);

      // Easing function
      const easingFunction = new BABYLON.QuadraticEase();
      easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
      posAnimation.setEasingFunction(easingFunction);

      camera.animations = [posAnimation];

      scene.beginAnimation(camera, 0, 60, false, 1, () => {
        // Update camera target
        camera.setTarget(station.lookAt);

        setIsAnimating(false);
        setCurrentStation(stationIndex);
        setShowStationInfo(true);

        // Check if this station has a game
        if (station.hasGame) {
          setTimeout(() => {
            setShowGameModal(true);
          }, 1000);
        }
      });
    },
    [isAnimating]
  );

  // Handle continuing to next station
  const handleContinue = useCallback(() => {
    setShowStationInfo(false);
    setShowGameModal(false);

    if (currentStation < TOTAL_STATIONS - 1) {
      setTimeout(() => {
        animateToStation(currentStation + 1);
      }, 300);
    } else {
      // Tour complete
      setIsTourComplete(true);
    }
  }, [currentStation, animateToStation]);

  // Handle game modal continue
  const handleGameContinue = useCallback(() => {
    // Award points for visiting game station
    const newScore = score + 100;
    setScore(newScore);
    if (onScoreUpdate) {
      onScoreUpdate(newScore);
    }
    setShowGameModal(false);
    handleContinue();
  }, [score, onScoreUpdate, handleContinue]);

  // Handle tour completion
  const handleTourFinish = useCallback(() => {
    onTourComplete();
  }, [onTourComplete]);

  // Initialize Babylon.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    // Create engine
    const engine = new BABYLON.Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });
    engineRef.current = engine;

    // Create scene
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.06, 0.09, 0.15, 1);
    sceneRef.current = scene;

    // Create camera
    const camera = new BABYLON.FreeCamera(
      'camera',
      STATIONS[0].position.clone(),
      scene
    );
    camera.setTarget(STATIONS[0].lookAt);
    camera.minZ = 0.1;
    camera.speed = 2 * SCALE;
    camera.angularSensibility = 3000;
    cameraRef.current = camera;

    // Attach camera controls (limited for tour mode)
    camera.attachControl(canvas, true);
    camera.inputs.removeByType('FreeCameraKeyboardMoveInput');

    // Create environment
    createFloor(scene);
    createBuilding(scene);
    createMachines(scene);
    createLights(scene);
    createStationMarkers(scene);

    // Fog for atmosphere
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.01;
    scene.fogColor = new BABYLON.Color3(0.06, 0.09, 0.15);

    // Run render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Handle resize
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    // Loading complete
    setTimeout(() => {
      setIsLoading(false);
      setShowStationInfo(true);
    }, 1500);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      engine.dispose();
      scene.dispose();
    };
  }, [createFloor, createBuilding, createMachines, createLights, createStationMarkers]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (showGameModal) {
          handleGameContinue();
        } else if (showStationInfo && !isAnimating) {
          handleContinue();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showStationInfo, showGameModal, isAnimating, handleContinue, handleGameContinue]);

  return (
    <div className="factory-tour-container">
      {/* Loading Screen */}
      {isLoading && (
        <div className="factory-loading">
          <div className="spinner" />
          <p>טוען את המפעל...</p>
        </div>
      )}

      {/* Babylon.js Canvas */}
      <canvas ref={canvasRef} className="factory-tour-canvas" />

      {/* Header */}
      {!isLoading && (
        <div className="factory-tour-header">
          <div className="user-info">
            <div className="user-avatar">{nickname.charAt(0).toUpperCase()}</div>
            <span className="nickname">{nickname}</span>
          </div>

          <div className="score-display">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            <span>{score}</span>
          </div>

          <button className="exit-btn" onClick={onTourComplete}>
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Progress Bar */}
      {!isLoading && (
        <div className="progress-container">
          {STATIONS.map((station, index) => (
            <div
              key={station.id}
              className={`progress-dot ${
                index < currentStation
                  ? 'completed'
                  : index === currentStation
                  ? 'current'
                  : ''
              } ${station.hasGame ? 'has-game' : ''}`}
            />
          ))}
        </div>
      )}

      {/* Instructions */}
      {!isLoading && showInstructions && (
        <div className={`instructions-tooltip ${!showInstructions ? 'hidden' : ''}`}>
          לחצו &quot;המשך&quot; או Enter כדי להתקדם לתחנה הבאה
        </div>
      )}

      {/* Station Info Panel */}
      {!isLoading && showStationInfo && !showGameModal && !isTourComplete && (
        <div className="station-info-panel">
          <div className="station-number">{currentStation + 1}</div>
          <h3>{STATIONS[currentStation].name}</h3>
          <p>{STATIONS[currentStation].description}</p>
          <button className="continue-btn" onClick={handleContinue} disabled={isAnimating}>
            {currentStation < TOTAL_STATIONS - 1 ? 'המשך לתחנה הבאה' : 'סיים סיור'}
          </button>
        </div>
      )}

      {/* Game Modal */}
      {showGameModal && (
        <div className="game-modal-overlay">
          <div className="game-modal">
            <div className="game-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="game-number">חידה {GAME_STATIONS.indexOf(currentStation) + 1}</span>
            <h2>{STATIONS[currentStation].gameName}</h2>
            <p>המשחק יתווסף בקרוב! לעת עתה, לחצו על המשך כדי להמשיך בסיור.</p>
            <button className="modal-btn primary" onClick={handleGameContinue}>
              המשך בסיור (+100 נק&#39;)
            </button>
          </div>
        </div>
      )}

      {/* Tour Complete Screen */}
      {isTourComplete && (
        <div className="tour-complete-overlay">
          <div className="tour-complete-card">
            <div className="trophy-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
            <h2>סיור הושלם!</h2>
            <p>כל הכבוד! עברת את כל 10 התחנות במפעל בהצלחה.</p>
            <div className="final-score">
              <div className="label">הניקוד שלך</div>
              <div className="score">{score}</div>
            </div>
            <button className="complete-btn" onClick={handleTourFinish}>
              סיים וחזור לדשבורד
            </button>
          </div>
        </div>
      )}

      {/* Touch Controls for Mobile */}
      <div className="touch-controls">
        <button
          className="touch-btn"
          onClick={handleContinue}
          disabled={isAnimating || !showStationInfo || showGameModal}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 5l7 7-7 7M5 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
