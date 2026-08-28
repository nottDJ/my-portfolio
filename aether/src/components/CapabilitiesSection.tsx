import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Eye, Package, Sparkles, Zap } from 'lucide-react';
import GlassCard from './GlassCard';
import { useBackdrop } from '../lib/backdrop';
import { duskTexture } from '../lib/textures';
import { fadeUp, IN_VIEW } from '../lib/motion';
import { capabilities } from '../lib/profile';

const ICONS = {
  Eye: <Eye size={19} strokeWidth={1.5} />,
  Sparkles: <Sparkles size={19} strokeWidth={1.5} />,
  Zap: <Zap size={19} strokeWidth={1.5} />,
  Package: <Package size={19} strokeWidth={1.5} />,
};

export default function CapabilitiesSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, IN_VIEW);
  const bg = useBackdrop('features-bg.jpg', duskTexture);

  return (
    <section
      id="capabilities"
      ref={ref}
      style={{
        background: 'black',
        padding: '7rem 1.5rem 9rem',
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
            opacity: 0.6,
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
          background: 'rgba(0,0,0,0.30)',
        }}
      />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: '56rem', margin: '0 auto', textAlign: 'center' }}>
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate={inView ? 'visible' : 'hidden'}>
          <span className="section-badge">{capabilities.badge}</span>
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
            fontSize: 'clamp(2.25rem, 5.5vw, 4rem)',
            letterSpacing: '-0.04em',
            lineHeight: 0.95,
            margin: '0.5rem 0 3.5rem',
          }}
        >
          {capabilities.title[0]}
          <br />
          {capabilities.title[1]}
        </motion.h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
            maxWidth: '48rem',
            margin: '0 auto',
            textAlign: 'left',
          }}
        >
          {capabilities.cards.map((card, i) => (
            <GlassCard
              key={card.title}
              index={i}
              icon={ICONS[card.icon as keyof typeof ICONS]}
              title={card.title}
              body={card.body}
              visible={inView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
