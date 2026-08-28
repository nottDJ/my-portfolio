import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, FileText } from 'lucide-react';
import AtmosphereCanvas from './AtmosphereCanvas';
import ParticleCanvas from './ParticleCanvas';
import ParticleTitle from './ParticleTitle';
import SwayCanvas from './SwayCanvas';
import { asset } from '../lib/backdrop';
import { hero, profile } from '../lib/profile';

/** Softly drifting light pools laid over the meadow. */
const ORBS = [
  {
    // sun, top-right, warm golden
    x: [0, 38, -18, 30, 0],
    y: [0, -22, 14, -10, 0],
    opacity: [0.75, 1, 0.8, 1, 0.75],
    duration: 10,
    delay: 0,
    style: {
      top: '-8%',
      right: '4%',
      width: 560,
      height: 560,
      background:
        'radial-gradient(circle, rgba(255,215,90,0.42) 0%, rgba(255,150,30,0.14) 45%, rgba(255,150,30,0) 72%)',
      filter: 'blur(60px)',
    },
  },
  {
    // cool sky band
    x: [0, 70, -40, 50, 0],
    y: [0, 18, -12, 8, 0],
    opacity: [0.55, 0.9, 0.6, 0.88, 0.55],
    duration: 14,
    delay: 1.5,
    style: {
      top: '-6%',
      left: '10%',
      width: 750,
      height: 280,
      background: 'radial-gradient(ellipse, rgba(120,200,255,0.22) 0%, rgba(120,200,255,0) 70%)',
      filter: 'blur(55px)',
    },
  },
  {
    // meadow glow, warm green-gold
    x: [-20, 30, -10, 40, -20],
    y: [0, -28, 10, -18, 0],
    opacity: [0.5, 0.88, 0.55, 0.9, 0.5],
    duration: 12,
    delay: 0.5,
    style: {
      bottom: '-12%',
      left: '15%',
      width: 680,
      height: 420,
      background:
        'radial-gradient(ellipse, rgba(155,215,100,0.22) 0%, rgba(200,235,80,0.06) 45%, rgba(200,235,80,0) 72%)',
      filter: 'blur(65px)',
    },
  },
  {
    // left warm rim
    x: [0, 22, -14, 18, 0],
    y: [0, -35, 20, -25, 0],
    opacity: [0.4, 0.72, 0.45, 0.68, 0.4],
    duration: 16,
    delay: 3,
    style: {
      top: '20%',
      left: '-6%',
      width: 380,
      height: 560,
      background: 'radial-gradient(ellipse, rgba(255,195,100,0.18) 0%, rgba(255,195,100,0) 70%)',
      filter: 'blur(55px)',
    },
  },
];

export default function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 0.6], [0, 45]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      id="home"
      ref={ref}
      style={{ height: '100vh', background: 'black', overflow: 'hidden', position: 'relative' }}
    >
      {/* ── background ─────────────────────────────────────────────── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.8, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <SwayCanvas />
        </motion.div>

        {/* sky blends up into the navbar */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom, black 0%, rgba(0,0,0,0.20) 28%, rgba(0,0,0,0) 52%)',
            pointerEvents: 'none',
          }}
        />

        {ORBS.map((orb, i) => (
          <motion.div
            key={i}
            animate={{ x: orb.x, y: orb.y, opacity: orb.opacity }}
            transition={{
              duration: orb.duration,
              delay: orb.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              borderRadius: '9999px',
              mixBlendMode: 'screen',
              pointerEvents: 'none',
              ...orb.style,
            }}
          />
        ))}

        {/* edge vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 82% 82% at 50% 50%, rgba(0,0,0,0) 32%, rgba(0,0,0,0.32) 66%, rgba(0,0,0,0.70) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* legibility wash */}
        <div
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.32)', pointerEvents: 'none' }}
        />
        {/* dark halo behind the title */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 55% 35% at 50% 40%, rgba(0,0,0,0.48) 0%, rgba(0,0,0,0) 75%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      <AtmosphereCanvas />
      <ParticleCanvas />

      {/* ── content ────────────────────────────────────────────────── */}
      <motion.div
        style={{
          y,
          opacity,
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '170px 1.5rem 0',
        }}
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="liquid-glass"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            borderRadius: 9999,
            padding: '0.35rem 0.9rem 0.35rem 0.35rem',
            marginBottom: '1.75rem',
          }}
        >
          <span
            style={{
              background: 'white',
              color: 'black',
              borderRadius: 9999,
              padding: '0.15rem 0.6rem',
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}
          >
            Open
          </span>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.82)' }}>{hero.badge}</span>
        </motion.div>

        <ParticleTitle lines={hero.title} />

        <motion.p
          initial={{ opacity: 0, filter: 'blur(8px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1, delay: 1.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            maxWidth: '38rem',
            margin: '0.25rem auto 0',
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 300,
            fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)',
            lineHeight: 1.6,
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          {hero.subtext}
        </motion.p>

        <motion.div
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.9, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.75rem',
            marginTop: '2rem',
          }}
        >
          <a
            href="#projects"
            className="liquid-glass-strong"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              borderRadius: 9999,
              padding: '0.75rem 1.5rem',
              color: 'white',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            View My Work
            <ArrowUpRight size={16} strokeWidth={1.8} />
          </a>
          <a
            href={asset(profile.resume)}
            download="Divij_Resume.pdf"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              borderRadius: 9999,
              padding: '0.75rem 1.5rem',
              color: 'rgba(255,255,255,0.75)',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 400,
              border: '1px solid rgba(255,255,255,0.14)',
            }}
          >
            Download CV
            <FileText size={16} strokeWidth={1.6} />
          </a>
        </motion.div>
      </motion.div>

      {/* bottom fade into black */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 360,
          zIndex: 5,
          pointerEvents: 'none',
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.85) 75%, black 100%)',
        }}
      />
    </section>
  );
}
