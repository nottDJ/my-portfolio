import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { navLinks, profile } from '../lib/profile';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed',
        top: '1.25rem',
        // Centred with auto margins, not translateX — Framer owns `transform`
        // for the entrance animation and would overwrite it.
        left: 0,
        right: 0,
        marginInline: 'auto',
        width: 'calc(100% - 2rem)',
        maxWidth: '56rem',
        zIndex: 50,
      }}
    >
      <div
        className="liquid-glass"
        style={{
          height: '3.5rem',
          borderRadius: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 0.5rem 0 1.35rem',
          boxShadow: scrolled
            ? '0 18px 50px rgba(0,0,0,0.55), inset 0 1px 1px rgba(255,255,255,0.10)'
            : '0 6px 20px rgba(0,0,0,0.25), inset 0 1px 1px rgba(255,255,255,0.10)',
          transition: 'box-shadow 0.45s ease',
        }}
      >
        <a
          href="#home"
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: 'italic',
            fontSize: '1.4rem',
            color: 'white',
            textDecoration: 'none',
            letterSpacing: '-0.01em',
            lineHeight: 1,
          }}
        >
          {profile.name}
        </a>

        <ul className="nav-links">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontWeight: 400,
                  fontSize: '0.875rem',
                  color: 'rgba(255,255,255,0.75)',
                  textDecoration: 'none',
                  transition: 'color 0.25s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#contact"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'white',
            color: 'black',
            borderRadius: 9999,
            padding: '0.55rem 1.05rem',
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 500,
            fontSize: '0.82rem',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Get in Touch
          <ArrowUpRight size={15} strokeWidth={2} />
        </a>
      </div>
    </motion.nav>
  );
}
