import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { prefersReducedMotion, useBackdrop } from '../lib/backdrop';
import { lakeTexture } from '../lib/textures';
import { fadeUp, IN_VIEW } from '../lib/motion';
import { process } from '../lib/profile';

/** The wide cinematic beat in the middle of the page — a slow Ken Burns push. */
export default function ProcessSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, IN_VIEW);
  const bg = useBackdrop('section3-bg.jpg', lakeTexture);
  const still = prefersReducedMotion();

  return (
    <section
      id="process"
      ref={ref}
      style={{
        background: 'black',
        padding: '10rem 1.5rem 14rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {bg && (
        <motion.img
          src={bg}
          alt=""
          aria-hidden="true"
          animate={
            still
              ? { scale: 1.06 }
              : { scale: [1.06, 1.12, 1.06], x: ['0%', '-2%', '0%'], y: ['0%', '-1.5%', '0%'] }
          }
          transition={still ? { duration: 0 } : { duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center center',
            transformOrigin: 'center center',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* seven-stop top/bottom fade */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background:
            'linear-gradient(to bottom, black 0%, rgba(0,0,0,0.75) 10%, rgba(0,0,0,0.4) 20%, rgba(0,0,0,0) 38%, rgba(0,0,0,0) 72%, rgba(0,0,0,0.6) 88%, black 100%)',
        }}
      />
      {/* side vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background:
            'linear-gradient(to right, black 0%, rgba(0,0,0,0) 18%, rgba(0,0,0,0) 82%, black 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background: 'rgba(0,0,0,0.38)',
        }}
      />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: '64rem', margin: '0 auto', textAlign: 'center' }}>
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate={inView ? 'visible' : 'hidden'}>
          <span className="section-badge">{process.badge}</span>
        </motion.div>

        <motion.h2
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(2.5rem, 6.5vw, 5rem)',
            letterSpacing: '-0.04em',
            lineHeight: 0.92,
            margin: '0.5rem 0 1.5rem',
          }}
        >
          {process.title[0]}
          <br />
          {process.title[1]}
        </motion.h2>

        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          style={{
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 300,
            fontSize: '1rem',
            lineHeight: 1.7,
            color: 'rgba(255,255,255,0.66)',
            maxWidth: '36rem',
            margin: '0 auto',
          }}
        >
          {process.body}
        </motion.p>
      </div>
    </section>
  );
}
