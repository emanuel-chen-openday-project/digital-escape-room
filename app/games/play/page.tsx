// @ts-nocheck
'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { useRouter } from 'next/navigation';
import { useGame } from '@/lib/contexts/GameContext';
import { useAuth } from '@/lib/hooks/useAuth';

export default function GamePlay() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { nickname, isGameActive, totalScore, currentStation, completeGame, resetGame } = useGame();

  const mountRef = useRef(null);
  const headerRef = useRef(null);
  const nicknameRef = useRef(null);
  const scoreRef = useRef(null);
  const cardRef = useRef(null);
  const stationsRef = useRef([]);
  const buttonRef = useRef(null);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  // Redirect if not authenticated or no active game
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/');
      } else if (!isGameActive) {
        router.push('/games');
      }
    }
  }, [user, authLoading, isGameActive, router]);

  // GSAP Animations
  useEffect(() => {
    if (!isLoaded || !isGameActive) return;

    const tl = gsap.timeline();

    tl.from(headerRef.current, {
      y: -50,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    })
    .from(nicknameRef.current, {
      x: -30,
      opacity: 0,
      duration: 0.5,
      ease: "power2.out"
    }, "-=0.4")
    .from(scoreRef.current, {
      x: 30,
      opacity: 0,
      duration: 0.5,
      ease: "power2.out"
    }, "-=0.4")
    .from(cardRef.current, {
      y: 60,
      opacity: 0,
      scale: 0.9,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.3")
    .from(stationsRef.current, {
      scale: 0,
      opacity: 0,
      duration: 0.4,
      stagger: 0.05,
      ease: "back.out(1.7)"
    }, "-=0.4")
    .from(buttonRef.current, {
      scale: 0,
      rotation: -10,
      duration: 0.6,
      ease: "elastic.out(1, 0.5)"
    }, "-=0.2");

    // Score pulse animation
    gsap.to(scoreRef.current, {
      scale: 1.05,
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

  }, [isLoaded, isGameActive]);

  // Three.js Scene
  useEffect(() => {
    if (typeof window === 'undefined' || !isGameActive) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspectRatio = width / height;

    const camera = new THREE.PerspectiveCamera(60, aspectRatio, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    if (mountRef.current) {
      mountRef.current.innerHTML = '';
      mountRef.current.appendChild(renderer.domElement);
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0x60a5fa, 1.5);
    directionalLight1.position.set(5, 10, 5);
    directionalLight1.castShadow = true;
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0x38bdf8, 1);
    directionalLight2.position.set(-5, 5, -5);
    scene.add(directionalLight2);

    const pointLight1 = new THREE.PointLight(0x0ea5e9, 2, 50);
    pointLight1.position.set(8, 8, 8);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x3b82f6, 1.5, 50);
    pointLight2.position.set(-8, -5, 5);
    scene.add(pointLight2);

    const geometries = [];

    const createMetallicMaterial = (color, emissive) => {
      return new THREE.MeshStandardMaterial({
        color: color,
        emissive: emissive,
        emissiveIntensity: 0.3,
        metalness: 0.9,
        roughness: 0.1,
      });
    };

    const createWireframeMaterial = (color) => {
      return new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.4,
      });
    };

    // Industrial gears
    const torusGeo1 = new THREE.TorusGeometry(2.5, 0.5, 16, 32);
    const torus1 = new THREE.Mesh(torusGeo1, createMetallicMaterial(0x0ea5e9, 0x0284c7));
    torus1.position.set(-6, 2, -12);
    torus1.castShadow = true;
    scene.add(torus1);
    const torus1Wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(torusGeo1),
      createWireframeMaterial(0x38bdf8)
    );
    torus1.add(torus1Wire);
    geometries.push({ mesh: torus1, speedX: 0.006, speedY: 0.003, isGear: true });

    const torusGeo2 = new THREE.TorusGeometry(1.8, 0.4, 16, 24);
    const torus2 = new THREE.Mesh(torusGeo2, createMetallicMaterial(0x3b82f6, 0x1e40af));
    torus2.position.set(6, -1, -10);
    torus2.castShadow = true;
    scene.add(torus2);
    const torus2Wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(torusGeo2),
      createWireframeMaterial(0x60a5fa)
    );
    torus2.add(torus2Wire);
    geometries.push({ mesh: torus2, speedX: -0.008, speedY: 0.004, isGear: true });

    // Torus Knot
    const torusKnotGeo = new THREE.TorusKnotGeometry(1.5, 0.4, 100, 16);
    const torusKnot = new THREE.Mesh(torusKnotGeo, createMetallicMaterial(0x06b6d4, 0x0891b2));
    torusKnot.position.set(0, 3, -14);
    torusKnot.castShadow = true;
    scene.add(torusKnot);
    const torusKnotWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(torusKnotGeo),
      createWireframeMaterial(0x22d3ee)
    );
    torusKnot.add(torusKnotWire);
    geometries.push({ mesh: torusKnot, speedX: 0.003, speedY: 0.005, isGear: false });

    // Icosahedron
    const icosaGeo = new THREE.IcosahedronGeometry(2, 0);
    const icosa = new THREE.Mesh(icosaGeo, createMetallicMaterial(0x0284c7, 0x075985));
    icosa.position.set(-4, -2, -9);
    icosa.castShadow = true;
    scene.add(icosa);
    const icosaWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(icosaGeo),
      createWireframeMaterial(0x0ea5e9)
    );
    icosa.add(icosaWire);
    geometries.push({ mesh: icosa, speedX: 0.004, speedY: 0.006, isGear: false });

    // Dodecahedron
    const dodecaGeo = new THREE.DodecahedronGeometry(1.5, 0);
    const dodeca = new THREE.Mesh(dodecaGeo, createMetallicMaterial(0x38bdf8, 0x0369a1));
    dodeca.position.set(4, 1, -11);
    dodeca.castShadow = true;
    scene.add(dodeca);
    const dodecaWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(dodecaGeo),
      createWireframeMaterial(0x7dd3fc)
    );
    dodeca.add(dodecaWire);
    geometries.push({ mesh: dodeca, speedX: 0.005, speedY: 0.004, isGear: false });

    // Particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1500;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 80;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.03,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Grid
    const gridHelper = new THREE.GridHelper(50, 50, 0x94a3b8, 0xe2e8f0);
    gridHelper.position.y = -10;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.2;
    scene.add(gridHelper);

    camera.position.z = 12;
    camera.position.y = 2;

    let time = 0;
    let animationId;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      time += 0.01;

      geometries.forEach(({ mesh, speedX, speedY, isGear }) => {
        if (isGear) {
          mesh.rotation.z += speedX;
        } else {
          mesh.rotation.x += speedX;
          mesh.rotation.y += speedY;
        }
        mesh.position.y += Math.sin(time + mesh.position.x) * 0.015;
      });

      particlesMesh.rotation.y += 0.0005;

      camera.position.x += (mousePos.x * 1.5 - camera.position.x) * 0.03;
      camera.position.y += (mousePos.y * 1.5 + 2 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, -10);

      pointLight1.position.x = Math.sin(time * 0.5) * 8;
      pointLight1.position.z = Math.cos(time * 0.5) * 8;

      pointLight2.position.x = Math.cos(time * 0.7) * 8;
      pointLight2.position.z = Math.sin(time * 0.7) * 8;

      renderer.render(scene, camera);
    };

    animate();
    setTimeout(() => setIsLoaded(true), 100);

    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isGameActive]);

  // Mouse/Touch movement
  useEffect(() => {
    const handleMove = (e) => {
      if (!mountRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const x = (clientX / window.innerWidth) * 2 - 1;
      const y = -(clientY / window.innerHeight) * 2 + 1;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
    };
  }, []);

  const handleCompleteGame = async () => {
    gsap.timeline()
      .to(buttonRef.current, { scale: 0.95, duration: 0.1, ease: "power2.in" })
      .to(buttonRef.current, { scale: 1.05, duration: 0.2, ease: "elastic.out(1, 0.3)" })
      .to(buttonRef.current, { scale: 1, duration: 0.1, ease: "power2.out" });

    try {
      await completeGame();
      setTimeout(() => router.push('/dashboard'), 300);
    } catch (error) {
      console.error('Error completing game:', error);
    }
  };

  const handleExitGame = () => {
    resetGame();
    router.push('/dashboard');
  };

  if (authLoading || !isGameActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Three.js Canvas */}
      <div ref={mountRef} className="absolute inset-0 z-0" />

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col h-full safe-area-inset">
        {/* Header */}
        <div
          ref={headerRef}
          className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-4 py-3 shadow-lg"
        >
          <div className="max-w-lg mx-auto flex items-center justify-between">
            {/* Nickname */}
            <div ref={nicknameRef} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-slate-800 font-bold text-lg">{nickname}</p>
            </div>

            {/* Score */}
            <div ref={scoreRef} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-xl shadow-md">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <span className="font-bold">{totalScore}</span>
            </div>

            {/* Exit Button */}
            <button
              onClick={handleExitGame}
              className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-xl"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          {/* Placeholder Card */}
          <div
            ref={cardRef}
            className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-slate-200/50 shadow-2xl text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-blue-300">
              <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-3">
              כאן יופיעו החידות
            </h2>

            <p className="text-slate-500 mb-8">
              הסיור במפעל עם שלוש החידות יתווסף בקרוב...
            </p>

            {/* Station Progress */}
            <div className="flex justify-center gap-2 mb-6">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  ref={el => stationsRef.current[i] = el}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    i < currentStation
                      ? 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md shadow-blue-500/50'
                      : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>

            <p className="text-slate-400 text-sm mb-8">
              תחנה {currentStation} מתוך 10
            </p>

            {/* Test Complete Button */}
            <button
              ref={buttonRef}
              onClick={handleCompleteGame}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                סיים משחק (לבדיקה)
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
