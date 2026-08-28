import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Boxes, Newspaper, ScanFace, Waves } from 'lucide-react';
import GlassCard from './GlassCard';
import { fadeUp, IN_VIEW } from '../lib/motion';
import { projects } from '../lib/profile';

const ICONS = {
  Boxes: <Boxes size={19} strokeWidth={1.5} />,
  ScanFace: <ScanFace size={19} strokeWidth={1.5} />,
  Newspaper: <Newspaper size={19} strokeWidth={1.5} />,
  Waves: <Waves size={19} strokeWidth={1.5} />,
};

export default function ProjectsSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, IN_VIEW);

  return (
    <section
      id="projects"
      ref={ref}
      style={{ background: 'black', padding: '7rem 1.5rem 8rem', position: 'relative' }}
    >
      <div style={{ maxWidth: '56rem', margin: '0 auto', textAlign: 'center' }}>
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate={inView ? 'visible' : 'hidden'}>
          <span className="section-badge">{projects.badge}</span>
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
          {projects.title[0]}
          <br />
          {projects.title[1]}
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
          {projects.items.map((item, i) => (
            <GlassCard
              key={item.title}
              index={i}
              icon={ICONS[item.icon as keyof typeof ICONS]}
              title={item.title}
              body={item.body}
              stack={item.stack}
              href={item.href}
              visible={inView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
