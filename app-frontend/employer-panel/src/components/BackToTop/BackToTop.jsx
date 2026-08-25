import { useEffect, useState, useRef } from 'react';
import './BackToTop.css';

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isClicked, setIsClicked] = useState(false);
  const btnRef = useRef(null);

useEffect(() => {
  const handleScroll = () => {
    const scrollTop = window.scrollY;

    console.log('BACK TO TOP SCROLL:', scrollTop);

    setIsVisible(scrollTop > 50);
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  handleScroll();

  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}, []);

  const handleMouseMove = (e) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.setProperty('--tilt-x', `${y / 6}deg`);
    btn.style.setProperty('--tilt-y', `${-x / 6}deg`);
    btn.style.setProperty('--shift-x', `${x / 8}px`);
    btn.style.setProperty('--shift-y', `${y / 8}px`);
  };

  const handleMouseLeave = () => {
    const btn = btnRef.current;
    if (!btn) return;
    btn.style.setProperty('--tilt-x', `0deg`);
    btn.style.setProperty('--tilt-y', `0deg`);
    btn.style.setProperty('--shift-x', `0px`);
    btn.style.setProperty('--shift-y', `0px`);
  };

  const handleBackToTop = () => {
    setIsClicked(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setIsClicked(false), 600);
  };

  const circumference = 2 * Math.PI * 20;
  const offset = circumference - (scrollProgress / 100) * circumference;

  return (
    <button
      ref={btnRef}
      type="button"
      className={`back-to-top ${isVisible ? 'is-visible' : ''} ${isClicked ? 'is-clicked' : ''}`}
      onClick={handleBackToTop}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-label="Back to top"
      title="Back to top"
    >
      <span className="back-to-top__glow" />
      <svg className="back-to-top__ring" width="48" height="48" viewBox="0 0 44 44">
        <circle className="back-to-top__ring-bg" cx="22" cy="22" r="20" fill="none" strokeWidth="2" />
        <circle
          className="back-to-top__ring-progress"
          cx="22"
          cy="22"
          r="20"
          fill="none"
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <svg className="back-to-top__arrow" viewBox="0 0 24 24" width="18" height="18">
        <path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
};

export default BackToTop;