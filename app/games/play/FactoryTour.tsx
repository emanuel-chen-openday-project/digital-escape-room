// @ts-nocheck
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import { gsap } from 'gsap';
import './FactoryTour.css';

// ============================================
// Types
// ============================================

interface FactoryTourProps {
  nickname: string;
  onTourComplete: () => void;
}

interface Station {
  position: BABYLON.Vector3;
  name: string;
  description: string;
  hasInfo: boolean;
  shouldStop: boolean;
  hasGame?: boolean;
  gameName?: string;
}

interface GameStateType {
  isActive: boolean;
  currentStation: number;
  isMoving: boolean;
  walkSpeed: number;
  rotationSpeed: number;
  waitingForInput: boolean;
}

// ============================================
// Constants
// ============================================

const SCALE = 0.35;

// ============================================
// Component
// ============================================

export default function FactoryTour({ nickname, onTourComplete }: FactoryTourProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);

  // UI State
  const [stationInfo, setStationInfo] = useState<{ name: string; desc: string } | null>(null);
  const [showNextButton, setShowNextButton] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructionsText, setInstructionsText] = useState('👆 לחץ על הכפתור למעבר לתחנה הבאה');

  // Game modal for mini-games
  const [showGameModal, setShowGameModal] = useState(false);
  const [currentGameName, setCurrentGameName] = useState('');

  // Refs for Babylon objects
  const cameraRef = useRef<BABYLON.UniversalCamera | null>(null);
  const playerRootRef = useRef<BABYLON.TransformNode | null>(null);
  const playerBodyRef = useRef<BABYLON.Mesh | null>(null);
  const playerHeadRef = useRef<BABYLON.Mesh | null>(null);
  const leftArmRef = useRef<BABYLON.Mesh | null>(null);
  const rightArmRef = useRef<BABYLON.Mesh | null>(null);
  const leftLegRef = useRef<BABYLON.Mesh | null>(null);
  const rightLegRef = useRef<BABYLON.Mesh | null>(null);
  const advancedTextureRef = useRef<GUI.AdvancedDynamicTexture | null>(null);

  // Door refs
  const entranceDoorRef = useRef<BABYLON.Mesh | null>(null);
  const doorDynamicTextureRef = useRef<BABYLON.DynamicTexture | null>(null);
  const currentDoorTextRef = useRef<string>('כניסה');
  const exitStationAddedRef = useRef<boolean>(false);
  const doorClosedAfterEntryRef = useRef<boolean>(false);

  // Game state ref
  const gameStateRef = useRef<GameStateType>({
    isActive: false,
    currentStation: 0,
    isMoving: false,
    walkSpeed: 0.04,
    rotationSpeed: 0.12,
    waitingForInput: false
  });

  // Stations ref
  const stationsRef = useRef<Station[]>([
    {
      position: new BABYLON.Vector3(0, 0, -20 * SCALE),
      name: "🏭 כניסה למפעל",
      description: "ברוכים הבאים למפעל התעשייתי המתקדם",
      hasInfo: false,
      shouldStop: false
    },
    {
      position: new BABYLON.Vector3(0, 0, -12 * SCALE),
      name: "📋 אזור קבלה",
      description: "כאן מתחיל תהליך הייצור",
      hasInfo: false,
      shouldStop: false
    },
    {
      position: new BABYLON.Vector3(-12 * SCALE, 0, -6 * SCALE),
      name: "🔧 מכונת CNC",
      description: "מכונת כרסום ממוחשבת לעיבוד מדויק",
      hasInfo: true,
      shouldStop: true,
      hasGame: true,
      gameName: "חידת ה-CNC"
    },
    {
      position: new BABYLON.Vector3(-12 * SCALE, 0, 3 * SCALE),
      name: "📦 קו ייצור",
      description: "מסוע אוטומטי להעברת מוצרים",
      hasInfo: false,
      shouldStop: false
    },
    {
      position: new BABYLON.Vector3(-12 * SCALE, 5.5 * SCALE, 12 * SCALE),
      name: "🤖 רובוט ריתוך",
      description: "זרוע רובוטית לריתוך מדויק",
      hasInfo: true,
      shouldStop: true,
      hasGame: true,
      gameName: "חידת הרובוט"
    },
    {
      position: new BABYLON.Vector3(0, 5.5 * SCALE, 14 * SCALE),
      name: "🌉 גשר תצפית",
      description: "נקודת תצפית על רצפת הייצור",
      hasInfo: false,
      shouldStop: false
    },
    {
      position: new BABYLON.Vector3(11 * SCALE, 5.5 * SCALE, 12 * SCALE),
      name: "📦 אריזה אוטומטית",
      description: "מערכת אריזה ממוחשבת",
      hasInfo: false,
      shouldStop: false
    },
    {
      position: new BABYLON.Vector3(12 * SCALE, 0, 3 * SCALE),
      name: "🔍 בקרת איכות",
      description: "בדיקה ומיון מוצרים",
      hasInfo: false,
      shouldStop: false
    },
    {
      position: new BABYLON.Vector3(12 * SCALE, 0, -6 * SCALE),
      name: "📦 מחסן חכם",
      description: "אחסון אוטומטי של מוצרים",
      hasInfo: true,
      shouldStop: true,
      hasGame: true,
      gameName: "חידת המחסן"
    },
    {
      position: new BABYLON.Vector3(0, 0, -12 * SCALE),
      name: "🏁 סיום הסיור",
      description: "תודה שביקרתם במפעל שלנו!",
      hasInfo: false,
      shouldStop: false
    }
  ]);

  // ============================================
  // Door Functions
  // ============================================

  const openDoor = useCallback(() => {
    if (!entranceDoorRef.current) return;
    gsap.to(entranceDoorRef.current.rotation, {
      y: -Math.PI / 2,
      duration: 1.2,
      ease: "power2.inOut"
    });
  }, []);

  const closeDoor = useCallback(() => {
    if (!entranceDoorRef.current) return;
    gsap.to(entranceDoorRef.current.rotation, {
      y: 0,
      duration: 1,
      ease: "power2.inOut"
    });
  }, []);

  // ============================================
  // Station Info Functions
  // ============================================

  const showStationInfoUI = useCallback((station: Station) => {
    setStationInfo({ name: station.name, desc: station.description });
  }, []);

  const hideStationInfoUI = useCallback(() => {
    setStationInfo(null);
  }, []);

  // ============================================
  // Walk Animation Functions
  // ============================================

  const animateWalk = useCallback((deltaTime: number, distance: number) => {
    const walkSpeed = Math.min(distance * 5, 7);

    if (leftArmRef.current && leftArmRef.current.metadata) {
      leftArmRef.current.metadata.swingPhase += deltaTime * walkSpeed;
      leftArmRef.current.rotation.x = Math.sin(leftArmRef.current.metadata.swingPhase) * 0.25;
    }

    if (rightArmRef.current && rightArmRef.current.metadata) {
      rightArmRef.current.metadata.swingPhase += deltaTime * walkSpeed;
      rightArmRef.current.rotation.x = Math.sin(rightArmRef.current.metadata.swingPhase) * 0.25;
    }

    if (leftLegRef.current && leftLegRef.current.metadata) {
      leftLegRef.current.metadata.swingPhase += deltaTime * walkSpeed;
      leftLegRef.current.rotation.x = Math.sin(leftLegRef.current.metadata.swingPhase) * 0.35;
    }

    if (rightLegRef.current && rightLegRef.current.metadata) {
      rightLegRef.current.metadata.swingPhase += deltaTime * walkSpeed;
      rightLegRef.current.rotation.x = Math.sin(rightLegRef.current.metadata.swingPhase) * 0.35;
    }

    const bob = Math.abs(Math.sin(Date.now() * 0.004 * walkSpeed)) * 0.03 * SCALE;
    if (playerBodyRef.current) playerBodyRef.current.position.y = 0.6 * SCALE + bob;
    if (playerHeadRef.current) playerHeadRef.current.position.y = 1.12 * SCALE + bob * 0.7;
  }, []);

  const stopWalkAnimation = useCallback(() => {
    const limbs = [leftArmRef.current, rightArmRef.current, leftLegRef.current, rightLegRef.current];
    limbs.forEach(limb => {
      if (limb) {
        gsap.to(limb.rotation, {
          x: 0,
          duration: 0.3,
          ease: "power2.out"
        });
      }
    });

    if (playerBodyRef.current) {
      gsap.to(playerBodyRef.current.position, { y: 0.6 * SCALE, duration: 0.3 });
    }
    if (playerHeadRef.current) {
      gsap.to(playerHeadRef.current.position, { y: 1.12 * SCALE, duration: 0.3 });
    }
  }, []);

  // ============================================
  // Camera Update Function
  // ============================================

  const updateCamera = useCallback(() => {
    const playerRoot = playerRootRef.current;
    const camera = cameraRef.current;
    if (!playerRoot || !camera) return;

    const targetPos = playerRoot.position.clone();
    const defaultOffset = new BABYLON.Vector3(0, 8 * SCALE, -15 * SCALE);

    let cameraOffset = defaultOffset.clone();
    let useRotation = true;

    // Special area: right side - from upper stairs, through packaging, to quality control
    const inRightCorridor =
        playerRoot.position.x > 8 * SCALE &&
        playerRoot.position.z > 0 * SCALE &&
        playerRoot.position.z < 15 * SCALE;

    if (inRightCorridor) {
      useRotation = false;

      const PLATFORM_HEIGHT = 3.5 * SCALE;
      let t = playerRoot.position.y / PLATFORM_HEIGHT;
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

    let newCameraPos;

    if (useRotation) {
      const rotMatrix = BABYLON.Matrix.RotationY(playerRoot.rotation.y);
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
  }, []);

  // ============================================
  // Fireworks Function
  // ============================================

  const createFireworks = useCallback((scene: BABYLON.Scene) => {
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
  }, []);

  // ============================================
  // Move To Next Station
  // ============================================

  const moveToNextStation = useCallback(() => {
    const gameState = gameStateRef.current;
    const stations = stationsRef.current;

    if (!gameState.waitingForInput || gameState.isMoving) return;

    hideStationInfoUI();
    setShowNextButton(false);
    setShowGameModal(false);

    // If leaving the warehouse (station 8) - change the door text to exit
    const warehouseIndex = 8;
    if (gameState.currentStation === warehouseIndex && !exitStationAddedRef.current) {
      // Change door text to "יציאה"
      if (doorDynamicTextureRef.current) {
        const ctx = doorDynamicTextureRef.current.getContext();
        const width = 512;
        const height = 512 * 0.75;

        // Door background
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#2a3f5f');
        gradient.addColorStop(0.5, '#1e3a5f');
        gradient.addColorStop(1, '#152a45');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Frames
        ctx.strokeStyle = '#4a6fa5';
        ctx.lineWidth = 8;
        ctx.strokeRect(20, 20, width - 40, height - 40);
        ctx.strokeStyle = '#3a5f95';
        ctx.lineWidth = 3;
        ctx.strokeRect(35, 35, width - 70, height - 70);

        // Panels
        ctx.fillStyle = 'rgba(74, 111, 165, 0.3)';
        ctx.fillRect(50, 50, width - 100, height * 0.35);
        ctx.fillRect(50, height * 0.55, width - 100, height * 0.35);

        // Text background
        const textBgY = height * 0.4;
        const textBgHeight = height * 0.2;
        ctx.fillStyle = 'rgba(120, 160, 220, 0.5)';
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

        // Text - יציאה
        ctx.font = 'bold 72px Heebo, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillText("יציאה", width/2 + 3, height/2 + 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillText("יציאה", width/2, height/2);

        // Handle
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.arc(width - 70, height/2, 18, 0, Math.PI * 2);
        ctx.fill();

        doorDynamicTextureRef.current.update();
        currentDoorTextRef.current = "יציאה";
      }
    }

    gameState.currentStation++;

    if (gameState.currentStation >= stations.length) {
      setInstructionsText('🎉 הסיור הסתיים בהצלחה!');
      setShowNextButton(false);
      gameState.isActive = false;

      if (sceneRef.current) {
        createFireworks(sceneRef.current);
      }

      // Call completion callback after fireworks
      setTimeout(() => {
        onTourComplete();
      }, 3000);
      return;
    }

    gameState.waitingForInput = false;
    gameState.isMoving = true;
  }, [hideStationInfoUI, createFireworks, onTourComplete]);

  // ============================================
  // Move Player To Station
  // ============================================

  const movePlayerToStation = useCallback((deltaTime: number) => {
    const gameState = gameStateRef.current;
    const stations = stationsRef.current;
    const playerRoot = playerRootRef.current;

    if (!gameState.isMoving || !playerRoot) return;

    const targetStation = stations[gameState.currentStation];
    const target = targetStation.position;
    const direction = target.subtract(playerRoot.position);
    direction.y = 0;
    const distance = direction.length();

    if (distance < 0.12 * SCALE) {
      playerRoot.position.x = target.x;
      playerRoot.position.z = target.z;

      // Smooth height adjustment
      if (Math.abs(playerRoot.position.y - target.y) > 0.01) {
        gsap.to(playerRoot.position, {
          y: target.y,
          duration: 0.4,
          ease: "power2.inOut"
        });
      }

      // Close door after entry - when moving from station 1 to station 2
      if (gameState.currentStation === 1 && !doorClosedAfterEntryRef.current) {
        doorClosedAfterEntryRef.current = true;
        setTimeout(() => {
          closeDoor();
        }, 500);
      }

      // Exit station outside factory - end
      if (exitStationAddedRef.current && gameState.currentStation === stations.length - 1) {
        gameState.isMoving = false;
        gameState.waitingForInput = false;
        stopWalkAnimation();

        setInstructionsText('🎉 הסיור הסתיים בהצלחה! יצאתם מהמפעל.');
        setShowNextButton(false);

        setTimeout(() => {
          closeDoor();
        }, 1500);

        if (sceneRef.current) {
          createFireworks(sceneRef.current);
        }

        gameState.isActive = false;

        // Call completion callback
        setTimeout(() => {
          onTourComplete();
        }, 3000);
        return;
      }

      // Check if to stop at station or continue automatically
      if (targetStation.shouldStop) {
        gameState.isMoving = false;
        gameState.waitingForInput = true;

        if (targetStation.hasInfo) {
          showStationInfoUI(targetStation);
        }

        // Check if this station has a game
        if (targetStation.hasGame && targetStation.gameName) {
          setCurrentGameName(targetStation.gameName);
          setShowGameModal(true);
        } else {
          setShowNextButton(true);
        }

        stopWalkAnimation();
      } else {
        // Check if this is the last station - if so, add exit station
        if (gameState.currentStation === stations.length - 1 && !exitStationAddedRef.current) {
          exitStationAddedRef.current = true;

          // Open door
          openDoor();

          // Add exit station outside factory
          const exitPos = new BABYLON.Vector3(0, 0, -20 * SCALE);
          stations.push({
            position: exitPos,
            name: "🚶‍♂️ יציאה מהמפעל",
            description: "סיימת את הסיור!",
            hasInfo: false,
            shouldStop: false
          });
        }

        // Continue immediately to next station - without stopping
        gameState.currentStation++;
        // Don't stop isMoving - continue moving
      }
      return;
    }

    const moveDir = direction.normalize();
    const speed = gameState.walkSpeed * deltaTime * 60;

    playerRoot.position.addInPlace(moveDir.scale(speed));

    // Smooth height interpolation according to target station
    if (Math.abs(playerRoot.position.y - target.y) > 0.02) {
      playerRoot.position.y = BABYLON.Scalar.Lerp(playerRoot.position.y, target.y, 0.08);
    }

    const targetAngle = Math.atan2(moveDir.x, moveDir.z);
    const currentAngle = playerRoot.rotation.y;
    let angleDiff = targetAngle - currentAngle;

    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    playerRoot.rotation.y += angleDiff * gameState.rotationSpeed;

    animateWalk(deltaTime, distance);
  }, [closeDoor, openDoor, stopWalkAnimation, showStationInfoUI, animateWalk, createFireworks, onTourComplete]);

  // ============================================
  // Create Scene Functions
  // ============================================

  const createFloor = useCallback((scene: BABYLON.Scene) => {
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
  }, []);

  const createEntrance = useCallback((scene: BABYLON.Scene) => {
    const entranceFrame = BABYLON.MeshBuilder.CreateBox("entranceFrame", {
      width: 12 * SCALE,
      height: 5 * SCALE,
      depth: 0.4 * SCALE
    }, scene);
    entranceFrame.position = new BABYLON.Vector3(0, 7.5 * SCALE, -18.2 * SCALE);

    const frameMat = new BABYLON.StandardMaterial("frameMat", scene);
    frameMat.diffuseColor = new BABYLON.Color3(0.2, 0.3, 0.6);
    frameMat.metallic = 0.9;
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

    // GUI for sign
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

    if (advancedTextureRef.current) {
      advancedTextureRef.current.addControl(rect);
      rect.linkWithMesh(signBoard);
    }

    // Door with dynamic texture
    const entranceDoor = BABYLON.MeshBuilder.CreateBox("entranceDoor", {
      width: 6 * SCALE,
      height: 4.5 * SCALE,
      depth: 0.25 * SCALE
    }, scene);
    entranceDoor.position = new BABYLON.Vector3(0, 2.25 * SCALE, -18 * SCALE + 0.15 * SCALE);
    entranceDoorRef.current = entranceDoor;

    // Create dynamic texture for door
    const doorTextureResolution = 512;
    const doorDynamicTexture = new BABYLON.DynamicTexture("doorTexture", {width: doorTextureResolution, height: doorTextureResolution * 0.75}, scene);
    doorDynamicTextureRef.current = doorDynamicTexture;

    const drawDoorTexture = (text: string) => {
      const ctx = doorDynamicTexture.getContext();
      const width = doorTextureResolution;
      const height = doorTextureResolution * 0.75;

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

      // Second inner frame
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

      // Gold line above and below text
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

      // The text
      ctx.font = 'bold 72px Heebo, Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Text shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillText(text, width/2 + 3, height/2 + 3);

      // The text itself - white with gold tint
      const textGrad = ctx.createLinearGradient(0, height * 0.4, 0, height * 0.6);
      textGrad.addColorStop(0, '#ffffff');
      textGrad.addColorStop(0.5, '#f0e68c');
      textGrad.addColorStop(1, '#ffffff');
      ctx.fillStyle = textGrad;
      ctx.fillText(text, width/2, height/2);

      // Door handle (circle)
      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.arc(width - 70, height/2, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b8960c';
      ctx.beginPath();
      ctx.arc(width - 70, height/2, 12, 0, Math.PI * 2);
      ctx.fill();

      doorDynamicTexture.update();
    };

    drawDoorTexture("כניסה");
    currentDoorTextRef.current = "כניסה";

    const doorMat = new BABYLON.StandardMaterial("doorMat", scene);
    doorMat.diffuseTexture = doorDynamicTexture;
    doorMat.diffuseTexture.uScale = -1;
    doorMat.backFaceCulling = false;
    doorMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.5);
    doorMat.emissiveColor = new BABYLON.Color3(0.05, 0.08, 0.12);
    entranceDoor.material = doorMat;

    // Pivot on right side of door
    entranceDoor.setPivotPoint(new BABYLON.Vector3(3 * SCALE, 0, 0));

    // Metal frame for door
    const doorFrameTop = BABYLON.MeshBuilder.CreateBox("doorFrameTop", {
      width: 6.5 * SCALE,
      height: 0.2 * SCALE,
      depth: 0.35 * SCALE
    }, scene);
    doorFrameTop.position = new BABYLON.Vector3(0, 4.6 * SCALE, -18 * SCALE + 0.1 * SCALE);
    const frameMetal = new BABYLON.StandardMaterial("frameMetal", scene);
    frameMetal.diffuseColor = new BABYLON.Color3(0.3, 0.35, 0.4);
    frameMetal.specularColor = new BABYLON.Color3(0.6, 0.6, 0.6);
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
  }, []);

  const createWallTexts = useCallback((scene: BABYLON.Scene, wallHeight: number) => {
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

      if (advancedTextureRef.current) {
        advancedTextureRef.current.addControl(textRect);
        textRect.linkWithMesh(textPlane);
      }
    });
  }, []);

  const createWindows = useCallback((scene: BABYLON.Scene, wallHeight: number) => {
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
  }, []);

  const createBuilding = useCallback((scene: BABYLON.Scene) => {
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
      const wall = BABYLON.MeshBuilder.CreateBox("wall" + i, w, scene);
      wall.position = new BABYLON.Vector3(w.x, wallHeight / 2, w.z);
      wall.material = wallMat;
    });

    createWallTexts(scene, wallHeight);
    createEntrance(scene);

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
  }, [createWallTexts, createEntrance, createWindows]);

  const createRailings = useCallback((scene: BABYLON.Scene, stairCount: number, stairHeight: number, stairDepth: number, platformHeight: number) => {
    const railMat = new BABYLON.StandardMaterial("railMat", scene);
    railMat.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.85);
    railMat.metallic = 0.95;

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
  }, []);

  const createStairs = useCallback((scene: BABYLON.Scene) => {
    const stairMat = new BABYLON.StandardMaterial("stairMat", scene);
    stairMat.diffuseColor = new BABYLON.Color3(0.55, 0.57, 0.6);
    stairMat.metallic = 0.7;

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
  }, [createRailings]);

  const createMetalChips = useCallback((scene: BABYLON.Scene, position: BABYLON.Vector3) => {
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
      chipMat.metallic = 1;
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
  }, []);

  const createCNCMachine = useCallback((scene: BABYLON.Scene, position: BABYLON.Vector3) => {
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
    baseMat.metallic = 0.9;
    baseMat.roughness = 0.2;
    base.material = baseMat;

    // Machine body
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
    workTableMat.metallic = 0.7;
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

    const head = BABYLON.MeshBuilder.CreateCylinder("cncHead", {
      height: 1 * SCALE,
      diameter: 0.5 * SCALE
    }, scene);
    head.position = new BABYLON.Vector3(0, 3.3 * SCALE, 0);
    head.parent = machine;

    const headMat = new BABYLON.StandardMaterial("cncHeadMat", scene);
    headMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.45);
    headMat.metallic = 1;
    headMat.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.15);
    head.material = headMat;

    const tool = BABYLON.MeshBuilder.CreateCylinder("cncTool", {
      height: 0.6 * SCALE,
      diameterTop: 0.05 * SCALE,
      diameterBottom: 0.15 * SCALE
    }, scene);
    tool.position = new BABYLON.Vector3(0, 3 * SCALE, 0);
    tool.parent = machine;
    tool.material = headMat;

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
      ledMat.emissiveColor = ledColors[i];
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
  }, [createMetalChips]);

  const createConveyorBelt = useCallback((scene: BABYLON.Scene, position: BABYLON.Vector3) => {
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
    beltMat.roughness = 0.8;

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

    for (let i = 0; i < 2; i++) {
      const roller = BABYLON.MeshBuilder.CreateCylinder("roller" + i, {
        height: 1.8 * SCALE,
        diameter: 0.3 * SCALE
      }, scene);
      roller.position = new BABYLON.Vector3((i * 5 - 2.5) * SCALE, 0.3 * SCALE, 0);
      roller.rotation.x = Math.PI / 2;
      roller.parent = conveyor;

      const rollerMat = new BABYLON.StandardMaterial("rollerMat", scene);
      rollerMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.55);
      rollerMat.metallic = 0.9;
      roller.material = rollerMat;

      gsap.to(roller.rotation, {
        z: Math.PI * 2,
        duration: 2,
        repeat: -1,
        ease: "none"
      });
    }

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
  }, []);

  const createWeldingRobot = useCallback((scene: BABYLON.Scene, position: BABYLON.Vector3) => {
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
    baseMat.metallic = 0.95;
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

    const arm1 = BABYLON.MeshBuilder.CreateBox("robotArm1", {
      width: 0.3 * SCALE,
      height: 1.5 * SCALE,
      depth: 0.3 * SCALE
    }, scene);
    arm1.position = new BABYLON.Vector3(0, 2.2 * SCALE, 0);
    arm1.rotation.z = Math.PI / 6;
    arm1.parent = robot;

    const armMat = new BABYLON.StandardMaterial("robotArmMat", scene);
    armMat.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.92);
    armMat.metallic = 1;
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
  }, []);

  const createPackagingMachine = useCallback((scene: BABYLON.Scene, position: BABYLON.Vector3) => {
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

    // Exit conveyor on right side
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

    for (let i = 0; i < 2; i++) {
      const arm = BABYLON.MeshBuilder.CreateBox("packArm" + i, {
        width: 0.25 * SCALE,
        height: 1.5 * SCALE,
        depth: 0.25 * SCALE
      }, scene);
      arm.position = new BABYLON.Vector3((i - 0.5) * 1.5 * SCALE, 2 * SCALE, 0);
      arm.parent = packager;

      const armMat = new BABYLON.StandardMaterial("packArmMat", scene);
      armMat.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.85);
      armMat.metallic = 0.8;
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

    for (let i = 0; i < 2; i++) {
      const packedBox = BABYLON.MeshBuilder.CreateBox("packedBox" + i, {
        width: 0.5 * SCALE,
        height: 0.5 * SCALE,
        depth: 0.5 * SCALE
      }, scene);
      packedBox.position = new BABYLON.Vector3(-1.5 * SCALE - i * 0.8 * SCALE, 0.8 * SCALE, 0);
      packedBox.parent = packager;

      const packedBoxMat = new BABYLON.StandardMaterial("packedBoxMat", scene);
      packedBoxMat.diffuseColor = new BABYLON.Color3(0.6, 0.8, 0.4);
      packedBox.material = packedBoxMat;

      gsap.to(packedBox.position, {
        x: -4 * SCALE,
        duration: 3,
        delay: i * 1.5,
        repeat: -1,
        ease: "none",
        onRepeat: function() {
          packedBox.position.x = -1.5 * SCALE;
        }
      });
    }
  }, []);

  const createQualityControl = useCallback((scene: BABYLON.Scene, position: BABYLON.Vector3) => {
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
  }, []);

  const createWarehouse = useCallback((scene: BABYLON.Scene, position: BABYLON.Vector3) => {
    const warehouse = new BABYLON.TransformNode("warehouse", scene);
    warehouse.position = position;

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

        const shelfMat = new BABYLON.StandardMaterial("shelfMat", scene);
        shelfMat.diffuseColor = new BABYLON.Color3(0.7, 0.5, 0.3);
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
            const colors = [
              new BABYLON.Color3(0.85, 0.65, 0.45),
              new BABYLON.Color3(0.45, 0.65, 0.85),
              new BABYLON.Color3(0.65, 0.85, 0.45)
            ];
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

        const poleMat = new BABYLON.StandardMaterial("poleMat", scene);
        poleMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.45);
        poleMat.metallic = 0.9;
        pole.material = poleMat;
      }
    }

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
  }, []);

  const createMachines = useCallback((scene: BABYLON.Scene) => {
    createCNCMachine(scene, new BABYLON.Vector3(-12 * SCALE, 0, -6 * SCALE));
    createConveyorBelt(scene, new BABYLON.Vector3(-12 * SCALE, 0, 3 * SCALE));
    createWeldingRobot(scene, new BABYLON.Vector3(-12 * SCALE, 3.5 * SCALE, 12 * SCALE));
    createPackagingMachine(scene, new BABYLON.Vector3(12 * SCALE, 3.5 * SCALE, 12 * SCALE));
    createQualityControl(scene, new BABYLON.Vector3(12 * SCALE, 0, 3 * SCALE));
    createWarehouse(scene, new BABYLON.Vector3(12 * SCALE, 0, -6 * SCALE));
  }, [createCNCMachine, createConveyorBelt, createWeldingRobot, createPackagingMachine, createQualityControl, createWarehouse]);

  const createPlayer = useCallback((scene: BABYLON.Scene) => {
    const stations = stationsRef.current;

    const playerRoot = new BABYLON.TransformNode("playerRoot", scene);
    playerRoot.position = stations[0].position.clone();
    playerRootRef.current = playerRoot;

    const playerBody = BABYLON.MeshBuilder.CreateCylinder("playerBody", {
      height: 0.8 * SCALE,
      diameterTop: 0.28 * SCALE,
      diameterBottom: 0.32 * SCALE
    }, scene);
    playerBody.position.y = 0.6 * SCALE;
    playerBody.parent = playerRoot;
    playerBodyRef.current = playerBody;

    const bodyMat = new BABYLON.StandardMaterial("playerBodyMat", scene);
    bodyMat.diffuseColor = new BABYLON.Color3(0.2, 0.4, 0.8);
    bodyMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    playerBody.material = bodyMat;

    const playerHead = BABYLON.MeshBuilder.CreateSphere("playerHead", {
      diameter: 0.28 * SCALE
    }, scene);
    playerHead.position.y = 1.12 * SCALE;
    playerHead.parent = playerRoot;
    playerHeadRef.current = playerHead;

    const headMat = new BABYLON.StandardMaterial("playerHeadMat", scene);
    headMat.diffuseColor = new BABYLON.Color3(0.95, 0.85, 0.75);
    playerHead.material = headMat;

    const helmet = BABYLON.MeshBuilder.CreateSphere("helmet", {
      diameter: 0.32 * SCALE,
      arc: 0.5
    }, scene);
    helmet.position.y = 1.15 * SCALE;
    helmet.rotation.x = Math.PI;
    helmet.parent = playerRoot;

    const helmetMat = new BABYLON.StandardMaterial("helmetMat", scene);
    helmetMat.diffuseColor = new BABYLON.Color3(1, 0.8, 0);
    helmetMat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    helmet.material = helmetMat;

    for (const side of [-1, 1]) {
      const eye = BABYLON.MeshBuilder.CreateSphere("eye", { diameter: 0.05 * SCALE }, scene);
      eye.position = new BABYLON.Vector3(side * 0.06 * SCALE, 1.13 * SCALE, 0.1 * SCALE);
      eye.parent = playerRoot;
      const eyeMat = new BABYLON.StandardMaterial("eyeMat", scene);
      eyeMat.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.1);
      eye.material = eyeMat;
    }

    const leftArm = BABYLON.MeshBuilder.CreateCylinder("leftArm", {
      height: 0.55 * SCALE,
      diameter: 0.1 * SCALE
    }, scene);
    leftArm.position = new BABYLON.Vector3(-0.22 * SCALE, 0.76 * SCALE, 0);
    leftArm.parent = playerRoot;
    leftArm.material = bodyMat;
    leftArm.metadata = { swingPhase: 0 };
    leftArmRef.current = leftArm;

    const rightArm = BABYLON.MeshBuilder.CreateCylinder("rightArm", {
      height: 0.55 * SCALE,
      diameter: 0.1 * SCALE
    }, scene);
    rightArm.position = new BABYLON.Vector3(0.22 * SCALE, 0.76 * SCALE, 0);
    rightArm.parent = playerRoot;
    rightArm.material = bodyMat;
    rightArm.metadata = { swingPhase: Math.PI };
    rightArmRef.current = rightArm;

    const leftLeg = BABYLON.MeshBuilder.CreateCylinder("leftLeg", {
      height: 0.65 * SCALE,
      diameter: 0.12 * SCALE
    }, scene);
    leftLeg.position = new BABYLON.Vector3(-0.1 * SCALE, 0.32 * SCALE, 0);
    leftLeg.parent = playerRoot;
    leftLeg.material = bodyMat;
    leftLeg.metadata = { swingPhase: 0 };
    leftLegRef.current = leftLeg;

    const rightLeg = BABYLON.MeshBuilder.CreateCylinder("rightLeg", {
      height: 0.65 * SCALE,
      diameter: 0.12 * SCALE
    }, scene);
    rightLeg.position = new BABYLON.Vector3(0.1 * SCALE, 0.32 * SCALE, 0);
    rightLeg.parent = playerRoot;
    rightLeg.material = bodyMat;
    rightLeg.metadata = { swingPhase: Math.PI };
    rightLegRef.current = rightLeg;
  }, []);

  const createScene = useCallback(() => {
    if (!canvasRef.current) return null;

    const engine = new BABYLON.Engine(canvasRef.current, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true
    });
    engineRef.current = engine;

    const scene = new BABYLON.Scene(engine);
    sceneRef.current = scene;
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
    cameraRef.current = camera;

    // GUI
    advancedTextureRef.current = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    // Create scene elements
    createFloor(scene);
    createBuilding(scene);
    createStairs(scene);
    createMachines(scene);
    createPlayer(scene);

    return scene;
  }, [createFloor, createBuilding, createStairs, createMachines, createPlayer]);

  // ============================================
  // Main Effect - Initialize Scene
  // ============================================

  useEffect(() => {
    const scene = createScene();
    if (!scene || !engineRef.current) return;

    const gameState = gameStateRef.current;

    // Start the tour immediately (no start screen)
    setShowInstructions(true);
    gameState.isActive = true;
    gameState.currentStation = 1;
    gameState.isMoving = false;

    // Open door after delay
    setTimeout(() => {
      openDoor();
    }, 600);

    // Start walking after door opens
    setTimeout(() => {
      gameState.isMoving = true;
    }, 2000);

    // Render loop
    let lastTime = Date.now();
    engineRef.current.runRenderLoop(() => {
      const now = Date.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;

      if (gameState.isActive) {
        movePlayerToStation(deltaTime);
        updateCamera();
      }

      scene.render();
    });

    // Resize handler
    const handleResize = () => {
      engineRef.current?.resize();
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      gsap.killTweensOf("*");
      scene.dispose();
      engineRef.current?.dispose();
    };
  }, [createScene, openDoor, movePlayerToStation, updateCamera]);

  // ============================================
  // Render
  // ============================================

  return (
    <div className="factory-tour-container">
      <canvas ref={canvasRef} className="factory-tour-canvas" />

      {/* Station Info */}
      <div className={`station-info ${stationInfo ? 'show' : ''}`}>
        <div className="station-name">{stationInfo?.name}</div>
        <div className="station-desc">{stationInfo?.desc}</div>
      </div>

      {/* Instructions */}
      <div className={`instructions ${showInstructions ? 'show' : ''}`}>
        {instructionsText}
      </div>

      {/* Next Button */}
      <button
        className={`next-btn ${showNextButton ? 'show' : ''}`}
        onClick={moveToNextStation}
      >
        ➤ המשך לתחנה הבאה
      </button>

      {/* Game Modal */}
      {showGameModal && (
        <div className="game-modal-overlay">
          <div className="game-modal">
            <div className="game-modal-icon">🎮</div>
            <div className="game-modal-title">{currentGameName}</div>
            <div className="game-modal-desc">
              משחק זה יתווסף בקרוב!<br/>
              בינתיים, המשיכו בסיור במפעל.
            </div>
            <button
              className="game-modal-btn"
              onClick={moveToNextStation}
            >
              המשך בסיור ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
