// @ts-nocheck
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import './FactoryTour.css';

import { SCALE, GAME_STATIONS, createStations, Station } from './factory/stations';
import { createScene, createFloor } from './factory/createScene';
import { createBuilding, createStairs, openDoor, closeDoor, drawDoorTexture, DoorRefs } from './factory/createBuilding';
import { createMachines } from './factory/createMachines';
import { createPlayer, PlayerRefs, stopWalkAnimation } from './factory/createPlayer';
import {
  GameState,
  createInitialGameState,
  movePlayerToStation,
  updateCamera,
  createFireworks,
  addExitStation
} from './factory/gameLogic';
import { TSPGame, GameResult } from './tsp';

interface FactoryTourProps {
  nickname: string;
  onTourComplete: () => void;
}

export default function FactoryTour({ nickname, onTourComplete }: FactoryTourProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const cameraRef = useRef<BABYLON.UniversalCamera | null>(null);
  const playerRefsRef = useRef<PlayerRefs | null>(null);
  const doorRefsRef = useRef<DoorRefs | null>(null);
  const stationsRef = useRef<Station[]>([]);
  const gameStateRef = useRef<GameState>(createInitialGameState());

  const [currentStation, setCurrentStation] = useState(0);
  const [showStationInfo, setShowStationInfo] = useState(false);
  const [stationInfo, setStationInfo] = useState({ name: '', description: '' });
  const [showNextButton, setShowNextButton] = useState(false);
  const [showGameModal, setShowGameModal] = useState(false);
  const [currentGame, setCurrentGame] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [tourComplete, setTourComplete] = useState(false);

  // Initialize Babylon.js
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const engine = new BABYLON.Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true
    });
    engineRef.current = engine;

    // Create scene
    const { scene, camera, advancedTexture } = createScene(engine);
    sceneRef.current = scene;
    cameraRef.current = camera;

    // Create floor
    createFloor(scene);

    // Create building and get door refs
    const doorRefs = createBuilding(scene, advancedTexture);
    doorRefsRef.current = doorRefs;

    // Create stairs
    createStairs(scene);

    // Create machines
    createMachines(scene);

    // Create stations
    const stations = createStations();
    stationsRef.current = stations;

    // Create player at first station
    const playerRefs = createPlayer(scene, stations[0]);
    playerRefsRef.current = playerRefs;

    // Game loop
    let lastTime = Date.now();

    engine.runRenderLoop(() => {
      const now = Date.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;

      const gameState = gameStateRef.current;

      if (gameState.isActive && playerRefsRef.current && cameraRef.current) {
        const result = movePlayerToStation(
          gameState,
          stationsRef.current,
          playerRefsRef.current,
          deltaTime
        );

        if (result.reachedStation) {
          setCurrentStation(result.stationIndex);

          // Close door after entry (station 1 to 2)
          if (result.stationIndex === 1 && !gameState.doorClosedAfterEntry) {
            gameState.doorClosedAfterEntry = true;
            setTimeout(() => {
              closeDoor(doorRefsRef.current?.entranceDoor || null);
            }, 500);
          }

          if (result.shouldStop) {
            const station = stationsRef.current[result.stationIndex];
            if (station.hasInfo) {
              setStationInfo({ name: station.name, description: station.description });
              setShowStationInfo(true);
            }

            if (result.shouldShowGame) {
              const gameInfo = GAME_STATIONS[result.stationIndex];
              if (gameInfo) {
                setCurrentGame(gameInfo.name);
                setShowGameModal(true);
              }
            } else {
              setShowNextButton(true);
            }
          }

          if (result.isTourComplete) {
            setTourComplete(true);
            createFireworks(scene);
            setTimeout(() => {
              closeDoor(doorRefsRef.current?.entranceDoor || null);
            }, 1500);
          }
        }

        updateCamera(cameraRef.current, playerRefsRef.current);
      }

      scene.render();
    });

    // Handle resize
    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    // Start the tour immediately (no start screen)
    startTour();

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.dispose();
    };
  }, []);

  const startTour = useCallback(() => {
    const gameState = gameStateRef.current;
    gameState.isActive = true;
    gameState.currentStation = 1;
    gameState.isMoving = false;

    setShowInstructions(true);

    // Open door after delay
    setTimeout(() => {
      openDoor(doorRefsRef.current?.entranceDoor || null);
    }, 600);

    // Start moving after door opens
    setTimeout(() => {
      gameState.isMoving = true;
    }, 2000);
  }, []);

  const handleContinueAfterGame = useCallback((result?: GameResult) => {
    // Log game result if available
    if (result) {
      console.log('Game completed:', result);
    }
    setShowGameModal(false);
    setCurrentGame(null);
    setShowNextButton(true);
  }, []);

  const handleNextStation = useCallback(() => {
    const gameState = gameStateRef.current;
    if (!gameState.waitingForInput || gameState.isMoving) return;

    setShowStationInfo(false);
    setShowNextButton(false);

    // If leaving warehouse (station 8), change door text to "exit"
    const warehouseIndex = 8;
    if (gameState.currentStation === warehouseIndex && !gameState.exitStationAdded) {
      // Change door text to exit
      if (doorRefsRef.current?.doorDynamicTexture) {
        drawDoorTexture(doorRefsRef.current.doorDynamicTexture, "יציאה");
      }
    }

    gameState.currentStation++;

    if (gameState.currentStation >= stationsRef.current.length) {
      // Tour complete
      setTourComplete(true);
      gameState.isActive = false;
      if (sceneRef.current) {
        createFireworks(sceneRef.current);
      }
      return;
    }

    // Check if this is the last station before exit
    if (gameState.currentStation === stationsRef.current.length - 1 && !gameState.exitStationAdded) {
      gameState.exitStationAdded = true;
      openDoor(doorRefsRef.current?.entranceDoor || null);
      addExitStation(stationsRef.current);
    }

    gameState.waitingForInput = false;
    gameState.isMoving = true;
  }, []);

  const handleTourComplete = useCallback(() => {
    onTourComplete();
  }, [onTourComplete]);

  return (
    <div className="factory-container" dir="rtl">
      <canvas ref={canvasRef} className="factory-canvas" />

      {/* Nickname Display */}
      <div className="nickname-display">{nickname}</div>

      {/* Station Info */}
      <div className={`station-info ${showStationInfo ? 'show' : ''}`}>
        <div className="station-name">{stationInfo.name}</div>
        <div className="station-desc">{stationInfo.description}</div>
      </div>

      {/* Instructions */}
      <div className={`instructions ${showInstructions && !showGameModal ? 'show' : ''}`}>
        👆 לחץ על הכפתור למעבר לתחנה הבאה
      </div>

      {/* Next Button */}
      <button
        className={`next-btn ${showNextButton && !showGameModal ? 'show' : ''}`}
        onClick={handleNextStation}
      >
        ➤ המשך לתחנה הבאה
      </button>

      {/* Game Modal */}
      {showGameModal && currentGame && (
        currentGame === 'TSP' ? (
          <TSPGame onComplete={handleContinueAfterGame} />
        ) : (
          <div className="game-modal-overlay">
            <div className="game-modal">
              <h2>{GAME_STATIONS[currentStation]?.title || 'משחק'}</h2>
              <p>המשחק יתווסף בקרוב</p>
              <button className="game-modal-btn" onClick={() => handleContinueAfterGame()}>
                המשך בסיור
              </button>
            </div>
          </div>
        )
      )}

      {/* Tour Complete Modal */}
      {tourComplete && (
        <div className="game-modal-overlay">
          <div className="game-modal tour-complete-modal">
            <h2>🎉 הסיור הסתיים בהצלחה!</h2>
            <p>תודה שביקרת במפעל שלנו</p>
            <button className="game-modal-btn tour-complete-btn" onClick={handleTourComplete}>
              סיים
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
