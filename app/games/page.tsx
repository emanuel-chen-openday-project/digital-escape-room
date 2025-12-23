// @ts-nocheck
'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { useRouter } from 'next/navigation';
import { useGame } from '@/lib/contexts/GameContext';
import { useAuth } from '@/lib/hooks/useAuth';

export default function GamesIntro() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { startGame } = useGame();

  const mountRef = useRef(null);
  const logoRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const cardRef = useRef(null);
  const textLinesRef = useRef([]);
  const buttonRef = useRef(null);
  const backButtonRef = useRef(null);
  const statusDotsRef = useRef([]);
  const modalRef = useRef(null);
  const modalContentRef = useRef(null);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // GSAP Animations
  useEffect(() => {
    if (!isLoaded) return;

    const tl = gsap.timeline();

    tl.from(logoRef.current, {
      scale: 0,
      rotation: 360,
      duration: 1.2,
      ease: "elastic.out(1, 0.5)"
    })
    .from(titleRef.current, {
      y: 50,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.6")
    .from(subtitleRef.current, {
      y: 30,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out"
    }, "-=0.4")
    .from(cardRef.current, {
      y: 60,
      opacity: 0,
      scale: 0.9,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.3")
    .from(textLinesRef.current, {
      x: -30,
      opacity: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: "power2.out"
    }, "-=0.4")
    .from(buttonRef.current, {
      scale: 0,
      rotation: -10,
      duration: 0.6,
      ease: "elastic.out(1, 0.5)"
    }, "-=0.2")
    .from(backButtonRef.current, {
      opacity: 0,
      y: 20,
      duration: 0.4,
      ease: "power2.out"
    }, "-=0.3")
    .from(statusDotsRef.current, {
      scale: 0,
      opacity: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: "back.out(1.7)"
    }, "-=0.4");

    // Floating animation for logo
    gsap.to(logoRef.current, {
      y: -10,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    // Pulsing dots
    statusDotsRef.current.forEach((dot, i) => {
      if (dot) {
        gsap.to(dot, {
          scale: 1.5,
          opacity: 0.3,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.3
        });
      }
    });

    // Button pulse effect
    gsap.to(buttonRef.current, {
      boxShadow: "0 0 40px rgba(59, 130, 246, 0.6)",
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

  }, [isLoaded]);

  // Three.js Scene
  useEffect(() => {
    if (typeof window === 'undefined') return;

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

    // Create gear-like torus shapes (industrial theme)
    const torusGeo1 = new THREE.TorusGeometry(2, 0.4, 16, 32);
    const torus1 = new THREE.Mesh(torusGeo1, createMetallicMaterial(0x0ea5e9, 0x0284c7));
    torus1.position.set(-5, 3, -10);
    torus1.castShadow = true;
    scene.add(torus1);
    const torus1Wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(torusGeo1),
      createWireframeMaterial(0x38bdf8)
    );
    torus1.add(torus1Wire);
    geometries.push({ mesh: torus1, speedX: 0.008, speedY: 0.004, isGear: true });

    const torusGeo2 = new THREE.TorusGeometry(1.5, 0.3, 16, 24);
    const torus2 = new THREE.Mesh(torusGeo2, createMetallicMaterial(0x3b82f6, 0x1e40af));
    torus2.position.set(5, -2, -8);
    torus2.castShadow = true;
    scene.add(torus2);
    const torus2Wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(torusGeo2),
      createWireframeMaterial(0x60a5fa)
    );
    torus2.add(torus2Wire);
    geometries.push({ mesh: torus2, speedX: -0.01, speedY: 0.005, isGear: true });

    // Torus Knot (factory machine part look)
    const torusKnotGeo = new THREE.TorusKnotGeometry(1.2, 0.35, 100, 16);
    const torusKnot = new THREE.Mesh(torusKnotGeo, createMetallicMaterial(0x06b6d4, 0x0891b2));
    torusKnot.position.set(0, 4, -12);
    torusKnot.castShadow = true;
    scene.add(torusKnot);
    const torusKnotWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(torusKnotGeo),
      createWireframeMaterial(0x22d3ee)
    );
    torusKnot.add(torusKnotWire);
    geometries.push({ mesh: torusKnot, speedX: 0.003, speedY: 0.007, isGear: false });

    // Icosahedron
    const icosaGeo = new THREE.IcosahedronGeometry(1.8, 0);
    const icosa = new THREE.Mesh(icosaGeo, createMetallicMaterial(0x0284c7, 0x075985));
    icosa.position.set(4, 2, -11);
    icosa.castShadow = true;
    scene.add(icosa);
    const icosaWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(icosaGeo),
      createWireframeMaterial(0x0ea5e9)
    );
    icosa.add(icosaWire);
    geometries.push({ mesh: icosa, speedX: 0.004, speedY: 0.006, isGear: false });

    // Octahedron
    const octaGeo = new THREE.OctahedronGeometry(1.5, 0);
    const octa = new THREE.Mesh(octaGeo, createMetallicMaterial(0x38bdf8, 0x0369a1));
    octa.position.set(-3, -2, -9);
    octa.castShadow = true;
    scene.add(octa);
    const octaWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(octaGeo),
      createWireframeMaterial(0x7dd3fc)
    );
    octa.add(octaWire);
    geometries.push({ mesh: octa, speedX: 0.005, speedY: 0.004, isGear: false });

    // Large gear in background
    const gearGeo = new THREE.TorusGeometry(3.5, 0.5, 8, 40);
    const gear = new THREE.Mesh(gearGeo, createMetallicMaterial(0x64748b, 0x475569));
    gear.position.set(0, 0, -18);
    gear.castShadow = true;
    scene.add(gear);
    const gearWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(gearGeo),
      createWireframeMaterial(0x94a3b8)
    );
    gear.add(gearWire);
    geometries.push({ mesh: gear, speedX: 0.002, speedY: 0.002, isGear: true });

    // Particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
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
          // Gears rotate on Z axis (like real gears)
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
  }, []);

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

  // Modal animation
  useEffect(() => {
    if (showModal && modalContentRef.current) {
      gsap.fromTo(
        modalContentRef.current,
        { scale: 0.8, opacity: 0, y: 50 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.7)' }
      );
    }
  }, [showModal]);

  const handleStartClick = () => {
    gsap.timeline()
      .to(buttonRef.current, { scale: 0.95, duration: 0.1, ease: "power2.in" })
      .to(buttonRef.current, { scale: 1.05, duration: 0.2, ease: "elastic.out(1, 0.3)" })
      .to(buttonRef.current, { scale: 1, duration: 0.1, ease: "power2.out" });

    setTimeout(() => setShowModal(true), 300);
  };

  const handleButtonHover = (isEntering) => {
    gsap.to(buttonRef.current, {
      scale: isEntering ? 1.05 : 1,
      duration: 0.3,
      ease: isEntering ? "back.out(1.7)" : "power2.out"
    });
  };

  const validateNickname = (value) => {
    if (value.length < 2) return 'הכינוי חייב להכיל לפחות 2 תווים';
    if (value.length > 15) return 'הכינוי יכול להכיל עד 15 תווים';
    return '';
  };

  const handleNicknameChange = (e) => {
    const value = e.target.value;
    setNickname(value);
    if (error) setError(validateNickname(value));
  };

  const handleSubmitNickname = async () => {
    const validationError = validateNickname(nickname);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsStarting(true);
    try {
      await startGame(nickname.trim());
      router.push('/games/play');
    } catch (err) {
      console.error('Error starting game:', err);
      setError('שגיאה בהתחלת המשחק. נסו שוב.');
      setIsStarting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSubmitNickname();
  };

  const closeModal = () => {
    gsap.to(modalContentRef.current, {
      scale: 0.8,
      opacity: 0,
      y: 50,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => setShowModal(false)
    });
  };

  if (authLoading) {
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
        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          {/* Factory Logo */}
          <div ref={logoRef} className="mb-6">
            <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl shadow-2xl flex items-center justify-center">
              <div className="absolute inset-2 bg-white/20 backdrop-blur-sm rounded-2xl" />
              <svg className="relative z-10 w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1
            ref={titleRef}
            className="text-4xl md:text-5xl font-black text-slate-800 mb-2 text-center"
          >
            חדר הבריחה הדיגיטלי
          </h1>
          <p
            ref={subtitleRef}
            className="text-lg md:text-xl text-slate-500 font-medium text-center mb-6"
          >
            המפעל של הנדסת תעשייה
          </p>

          {/* Explanation Card */}
          <div
            ref={cardRef}
            className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200/50 max-w-md mx-auto mb-6"
          >
            <div className="text-center space-y-4">
              <p
                ref={el => textLinesRef.current[0] = el}
                className="text-xl md:text-2xl font-bold text-slate-800"
              >
                ברוכים הבאים למפעל!
              </p>
              <p
                ref={el => textLinesRef.current[1] = el}
                className="text-base md:text-lg text-slate-600 leading-relaxed"
              >
                נתקעתם בפנים ויש רק דרך אחת לצאת -
                <span className="text-blue-600 font-semibold"> לפתור שלוש חידות</span>.
              </p>
              <p
                ref={el => textLinesRef.current[2] = el}
                className="text-base md:text-lg text-slate-600"
              >
                בכל חידה תקבלו הוראות. קראו, חשבו, פתרו.
              </p>
              <p
                ref={el => textLinesRef.current[3] = el}
                className="text-lg md:text-xl font-bold text-slate-800"
              >
                רק מי שיפצח את כולן יצליח לברוח.
              </p>
              <div
                ref={el => textLinesRef.current[4] = el}
                className="pt-2"
              >
                <span className="text-xl md:text-2xl font-black text-blue-600">
                  מוכנים?
                </span>
              </div>
            </div>
          </div>

          {/* Start Button */}
          <button
            ref={buttonRef}
            onClick={handleStartClick}
            onMouseEnter={() => handleButtonHover(true)}
            onMouseLeave={() => handleButtonHover(false)}
            className="group relative px-10 py-4 md:px-12 md:py-5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl text-white text-lg md:text-xl font-bold shadow-2xl transition-all duration-300"
          >
            <span className="relative z-10 flex items-center gap-3">
              יאללה, בואו נתחיל!
              <svg className="w-6 h-6 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>

          {/* Back Button */}
          <button
            ref={backButtonRef}
            onClick={() => router.push('/dashboard')}
            className="mt-4 text-slate-500 hover:text-slate-700 transition-colors text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            חזרה לדף הבית
          </button>

          {/* Status Dots */}
          <div className="flex gap-3 mt-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                ref={el => statusDotsRef.current[i] = el}
                className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Nickname Modal */}
      {showModal && (
        <div
          ref={modalRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={(e) => e.target === modalRef.current && closeModal()}
        >
          <div
            ref={modalContentRef}
            className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-sm border border-slate-200/50 shadow-2xl"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                איך קוראים לך?
              </h2>
              <p className="text-slate-500 text-sm">
                הכינוי שלך יופיע על המסך הגדול
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={nickname}
                  onChange={handleNicknameChange}
                  onKeyPress={handleKeyPress}
                  placeholder="הכינוי שלי..."
                  maxLength={15}
                  className={`w-full px-5 py-4 bg-slate-100 border-2 ${
                    error ? 'border-red-400' : 'border-slate-200 focus:border-blue-500'
                  } rounded-xl text-slate-800 placeholder-slate-400 text-lg text-center outline-none transition-colors`}
                  autoFocus
                />
                {error && (
                  <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
                )}
                <p className="text-slate-400 text-xs mt-2 text-center">
                  {nickname.length}/15 תווים
                </p>
              </div>

              <button
                onClick={handleSubmitNickname}
                disabled={isStarting || nickname.length < 2}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isStarting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    מתחיל...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    קדימה!
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                )}
              </button>

              <button
                onClick={closeModal}
                className="w-full py-3 text-slate-500 hover:text-slate-700 transition-colors text-sm"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
