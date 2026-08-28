import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { fadeUp } from '../lib/motion';

type Props = {
  index: number;
  icon: ReactNode;
  title: string;
  body: string;
  visible: boolean;
  /** Project cards carry a tech stack line and a repo link; capability cards don't. */
  stack?: readonly string[];
  href?: string;
};

export default function GlassCard({ index, icon, title, body, visible, stack, href }: Props) {
  return (
    <motion.div
      className="glass-card"
      custom={index + 2}
      variants={fadeUp}
      initial="hidden"
      animate={visible ? 'visible' : 'hidden'}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <span
        style={{
          position: 'absolute',
          top: '1.4rem',
          right: '1.5rem',
          fontFamily: "'Barlow', sans-serif",
          fontWeight: 300,
          fontSize: '0.8rem',
          color: 'rgba(255,255,255,0.20)',
          letterSpacing: '0.05em',
        }}
      >
        {String(index + 1).padStart(2, '0')}
      </span>

      <div
        style={{
          width: '2.75rem',
          height: '2.75rem',
          borderRadius: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.1rem',
          background:
            'linear-gradient(150deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 100%)',
          border: '1px solid rgba(255,255,255,0.10)',
          color: 'rgba(255,255,255,0.9)',
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          fontFamily: "'Barlow', sans-serif",
          fontWeight: 500,
          fontSize: '0.95rem',
          lineHeight: 1.4,
          color: 'white',
          margin: '0 0 0.5rem',
          paddingRight: '1.75rem',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: "'Barlow', sans-serif",
          fontWeight: 300,
          fontSize: '0.85rem',
          lineHeight: 1.65,
          color: 'rgba(255,255,255,0.45)',
          margin: 0,
        }}
      >
        {body}
      </p>

      {stack && stack.length > 0 && (
        <p
          style={{
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 400,
            fontSize: '0.72rem',
            letterSpacing: '0.06em',
            lineHeight: 1.7,
            color: 'rgba(255,255,255,0.34)',
            margin: '1.1rem 0 0',
          }}
        >
          {stack.join(' · ')}
        </p>
      )}

      {href && (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            alignSelf: 'flex-start',
            gap: '0.3rem',
            marginTop: 'auto',
            paddingTop: '1.25rem',
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 500,
            fontSize: '0.82rem',
            color: 'rgba(255,255,255,0.62)',
            textDecoration: 'none',
            transition: 'color 0.25s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.62)')}
        >
          View project
          <ArrowUpRight size={14} strokeWidth={1.8} />
        </a>
      )}
    </motion.div>
  );
}
