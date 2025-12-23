// @ts-nocheck
'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Dashboard() {
  const router = useRouter();
  const mountRef = useRef(null);
  const logoRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const menuRef = useRef(null);
  const menuItemsRef = useRef([]);
  const statusDotsRef = useRef([]);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState(null);

  // Check auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/');
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribe();
  }, [router]);

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
    .from(statusDotsRef.current, {
      scale: 0,
      opacity: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: "back.out(1.7)"
    }, "-=0.3")
    .from(menuRef.current, {
      y: 100,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.5")
    .from(menuItemsRef.current, {
      scale: 0,
      rotation: 180,
      opacity: 0,
      duration: 0.6,
      stagger: 0.08,
      ease: "back.out(1.7)"
    }, "-=0.4");

    gsap.to(logoRef.current, {
      y: -10,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

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

    const icosaGeo = new THREE.IcosahedronGeometry(2.5, 0);
    const icosa = new THREE.Mesh(icosaGeo, createMetallicMaterial(0x0ea5e9, 0x0284c7));
    icosa.position.set(0, 3, -8);
    icosa.castShadow = true;
    scene.add(icosa);
    
    const icosaWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(icosaGeo),
      createWireframeMaterial(0x38bdf8)
    );
    icosa.add(icosaWire);
    geometries.push({ mesh: icosa, speedX: 0.004, speedY: 0.006 });

    const torusKnotGeo = new THREE.TorusKnotGeometry(1.5, 0.4, 100, 16);
    const torusKnot = new THREE.Mesh(torusKnotGeo, createMetallicMaterial(0x3b82f6, 0x1e40af));
    torusKnot.position.set(-4, -1, -10);
    torusKnot.castShadow = true;
    scene.add(torusKnot);
    
    const torusWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(torusKnotGeo),
      createWireframeMaterial(0x60a5fa)
    );
    torusKnot.add(torusWire);
    geometries.push({ mesh: torusKnot, speedX: 0.003, speedY: 0.007 });

    const octaGeo = new THREE.OctahedronGeometry(2, 0);
    const octa = new THREE.Mesh(octaGeo, createMetallicMaterial(0x06b6d4, 0x0891b2));
    octa.position.set(4, 2, -12);
    octa.castShadow = true;
    scene.add(octa);
    
    const octaWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(octaGeo),
      createWireframeMaterial(0x22d3ee)
    );
    octa.add(octaWire);
    geometries.push({ mesh: octa, speedX: 0.005, speedY: 0.004 });

    const dodecaGeo = new THREE.DodecahedronGeometry(1.8, 0);
    const dodeca = new THREE.Mesh(dodecaGeo, createMetallicMaterial(0x0284c7, 0x075985));
    dodeca.position.set(3, -3, -9);
    dodeca.castShadow = true;
    scene.add(dodeca);
    
    const dodecaWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(dodecaGeo),
      createWireframeMaterial(0x0ea5e9)
    );
    dodeca.add(dodecaWire);
    geometries.push({ mesh: dodeca, speedX: 0.006, speedY: 0.005 });

    const tetraGeo = new THREE.TetrahedronGeometry(2.2, 0);
    const tetra = new THREE.Mesh(tetraGeo, createMetallicMaterial(0x38bdf8, 0x0369a1));
    tetra.position.set(-3, 1, -11);
    tetra.castShadow = true;
    scene.add(tetra);
    
    const tetraWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(tetraGeo),
      createWireframeMaterial(0x7dd3fc)
    );
    tetra.add(tetraWire);
    geometries.push({ mesh: tetra, speedX: 0.007, speedY: 0.003 });

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

      geometries.forEach(({ mesh, speedX, speedY }) => {
        mesh.rotation.x += speedX;
        mesh.rotation.y += speedY;
        mesh.position.y += Math.sin(time + mesh.position.x) * 0.015;
      });

      particlesMesh.rotation.y += 0.0005;

      camera.position.x += (mousePos.x * 1.5 - camera.position.x) * 0.03;
      camera.position.y += (mousePos.y * 1.5 + 2 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, -8);

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
    const handleMove = (e: MouseEvent | TouchEvent) => {
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

  const handleMenuHover = (index: number, isEntering: boolean) => {
    const item = menuItemsRef.current[index];
    if (!item) return;

    if (isEntering) {
      gsap.to(item, {
        scale: 1.15,
        rotation: 5,
        duration: 0.3,
        ease: "back.out(1.7)"
      });
    } else {
      gsap.to(item, {
        scale: 1,
        rotation: 0,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  };

  const handleMenuClick = (id: string, index: number) => {
    setSelectedMenu(id);
    
    const item = menuItemsRef.current[index];
    if (!item) return;

    gsap.timeline()
      .to(item, { scale: 0.9, duration: 0.1, ease: "power2.in" })
      .to(item, { scale: 1.1, duration: 0.3, ease: "elastic.out(1, 0.3)" })
      .to(item, { scale: 1, duration: 0.2, ease: "power2.out" });

    menuItemsRef.current.forEach((otherItem, i) => {
      if (i !== index && otherItem) {
        gsap.to(otherItem, {
          scale: 0.95,
          opacity: 0.7,
          duration: 0.2,
          ease: "power2.out",
          yoyo: true,
          repeat: 1
        });
      }
    });

    // Navigation based on menu item
    switch (id) {
      case 'games':
        router.push('/games');
        break;
      case 'logout':
        signOut(auth).then(() => router.push('/'));
        break;
      // Other menu items will be added later
    }
  };

  const menuItems = [
    { id: 'games', icon: '🎮', label: 'משחקים', color: 'bg-blue-500' },
    { id: 'feedback', icon: '💬', label: 'משוב', color: 'bg-sky-500' },
    { id: 'register', icon: '🎓', label: 'הרשמה', color: 'bg-cyan-500' },
    { id: 'info', icon: 'ℹ️', label: 'מידע', color: 'bg-blue-600' },
    { id: 'logout', icon: '🚪', label: 'יציאה', color: 'bg-slate-500' }
  ];

  return (
    <div dir="rtl" className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Three.js Canvas - Full Screen */}
      <div ref={mountRef} className="absolute inset-0 z-0" />
      
      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col h-full safe-area-inset">
        {/* Top Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-8">
          {/* Logo */}
          <div ref={logoRef} className="mb-8">
            <div className="relative w-28 h-28 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl shadow-2xl flex items-center justify-center">
              <div className="absolute inset-2 bg-white/20 backdrop-blur-sm rounded-2xl" />
            </div>
          </div>

          {/* Title */}
          <h1 
            ref={titleRef}
            className="text-5xl md:text-6xl font-black text-slate-800 mb-3 text-center"
          >
            ברוכים הבאים
          </h1>
          <p 
            ref={subtitleRef}
            className="text-xl md:text-2xl text-slate-500 font-medium text-center"
          >
            יום פתוח | הנדסת תעשייה וניהול
          </p>

          {/* Status Dots */}
          <div className="flex gap-3 mt-10">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i}
                ref={el => statusDotsRef.current[i] = el}
                className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"
              />
            ))}
          </div>
        </div>

        {/* Bottom Menu */}
        <div className="pb-safe px-4 pb-8">
          <div 
            ref={menuRef}
            className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-slate-200/50 max-w-lg mx-auto"
          >
            <div className="grid grid-cols-5 gap-4">
              {menuItems.map((item, index) => (
                <button
                  key={item.id}
                  ref={el => menuItemsRef.current[index] = el}
                  onClick={() => handleMenuClick(item.id, index)}
                  onMouseEnter={() => handleMenuHover(index, true)}
                  onMouseLeave={() => handleMenuHover(index, false)}
                  onTouchStart={() => handleMenuHover(index, true)}
                  onTouchEnd={() => handleMenuHover(index, false)}
                  className={`group flex flex-col items-center gap-2 p-4 rounded-2xl transition-colors duration-300 ${
                    selectedMenu === item.id ? 'bg-slate-100' : ''
                  }`}
                >
                  <div className={`relative w-14 h-14 ${item.color} rounded-xl flex items-center justify-center shadow-md`}>
                    <span className="text-3xl">{item.icon}</span>
                    {selectedMenu === item.id && (
                      <div className="absolute -inset-1 bg-blue-400/30 rounded-xl animate-ping" />
                    )}
                  </div>
                  
                  <span className="text-xs font-semibold text-slate-700 text-center leading-tight">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}