import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import ParticleCanvas from './ParticleCanvas';
import { useBackdrop } from '../lib/backdrop';
import { mistTexture } from '../lib/textures';
import { fadeUp, IN_VIEW } from '../lib/motion';
import { about } from '../lib/profile';

export default function IntroSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, IN_VIEW);
  const bg = useBackdrop('intro-bg.jpg', mistTexture);

  return (
    <section
      id="about"
      ref={ref}
      style={{
        background: 'black',
        padding: '10rem 1.5rem 14rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {bg && (
        <img
          src={bg}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
            pointerEvents: 'none',
            opacity: 0.5,
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background:
            'linear-gradient(to bottom, black 0%, rgba(0,0,0,0) 18%, rgba(0,0,0,0) 82%, black 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background: 'rgba(0,0,0,0.28)',
        }}
      />
      <ParticleCanvas />

      <div style={{ position: 'relative', zIndex: 3, maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate={inView ? 'visible' : 'hidden'}>
          <span className="section-badge">{about.badge}</span>
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
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            letterSpacing: '-0.04em',
            lineHeight: 0.92,
            margin: '0.5rem 0 1.5rem',
          }}
        >
          {about.title[0]}
          <br />
          {about.title[1]}
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
            color: 'rgba(255,255,255,0.62)',
            maxWidth: '34rem',
            margin: '0 auto',
          }}
        >
          {about.body}
        </motion.p>

        <motion.ul
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '1.5rem 2.25rem',
            listStyle: 'none',
            margin: '3.5rem 0 0',
            padding: 0,
          }}
        >
          {about.stack.map((item) => (
            <li
              key={item}
              style={{
                fontFamily: "'Barlow', sans-serif",
                fontWeight: 300,
                fontSize: '0.875rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.42)',
              }}
            >
              {item}
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
