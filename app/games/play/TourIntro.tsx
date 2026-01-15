'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import './TourIntro.css';

interface TourIntroProps {
  onStart: () => void;
}

export default function TourIntro({ onStart }: TourIntroProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const shape1Ref = useRef<HTMLDivElement>(null);
  const shape2Ref = useRef<HTMLDivElement>(null);
  const shape3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Timeline for entrance animations
    const tl = gsap.timeline();

    // Icon animation
    tl.to('.tour-intro-icon', {
      opacity: 1,
      scale: 1,
      duration: 0.6,
      ease: 'back.out(1.7)'
    });

    // Title
    tl.to('.tour-intro-title', {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power2.out'
    }, '-=0.3');

    // Subtitle
    tl.to('.tour-intro-subtitle', {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power2.out'
    }, '-=0.3');

    // Info card
    tl.to('.tour-intro-card', {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out'
    }, '-=0.2');

    // Button
    tl.to('.tour-intro-btn', {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power2.out'
    }, '-=0.2');

    // Background shapes animation
    if (shape1Ref.current) {
      gsap.to(shape1Ref.current, {
        x: 20,
        y: 20,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    }

    if (shape2Ref.current) {
      gsap.to(shape2Ref.current, {
        x: -15,
        y: -15,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    }

    if (shape3Ref.current) {
      gsap.to(shape3Ref.current, {
        x: 10,
        y: -10,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    }

    return () => {
      tl.kill();
    };
  }, []);

  const handleStart = () => {
    // Exit animation
    gsap.to(contentRef.current, {
      opacity: 0,
      scale: 0.9,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: onStart
    });
  };

  return (
    <div className="tour-intro-screen">
      {/* Background shapes */}
      <div className="tour-intro-bg-shapes">
        <div ref={shape1Ref} className="tour-intro-shape tour-intro-shape-1" />
        <div ref={shape2Ref} className="tour-intro-shape tour-intro-shape-2" />
        <div ref={shape3Ref} className="tour-intro-shape tour-intro-shape-3" />
      </div>

      {/* Rotating gear */}
      <div className="tour-intro-gear-container">
        <div className="tour-intro-gear">⚙️</div>
      </div>

      {/* Main content */}
      <div ref={contentRef} className="tour-intro-content">
        <div className="tour-intro-icon">🏭</div>

        <h1 className="tour-intro-title">חדר הבריחה הדיגיטלי</h1>

        <p className="tour-intro-subtitle">מכללת עזריאלי - הנדסת תעשייה וניהול</p>

        <div className="tour-intro-card">
          <h3>🎯 איך זה עובד?</h3>
          <p>
            ברוכים הבאים למפעל החכם!
            במהלך הסיור מחכים לכם <span className="tour-intro-highlight">3 אתגרי חשיבה</span>.
          </p>
          <p>
            בכל תחנה ייפתח לכם משחק מעולם הנדסת תעשייה וניהול.
            קראו את ההוראות, חשבו, פתרו - ותצאו מהמפעל בהצלחה!
          </p>

          <div className="tour-intro-puzzles">
            <div className="tour-intro-puzzle-tag">🚚 מאסטר המסלולים</div>
            <div className="tour-intro-puzzle-tag">🏍️ מאסטר המשלוחים</div>
            <div className="tour-intro-puzzle-tag">📦 חבילה למשלוח</div>
          </div>
        </div>

        <button className="tour-intro-btn" onClick={handleStart}>
          <span>יאללה, בואו נתחיל!</span>
          <span className="tour-intro-btn-icon">🚀</span>
        </button>
      </div>
    </div>
  );
}
