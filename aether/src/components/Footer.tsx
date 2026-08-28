import { GithubIcon, InstagramIcon, LinkedinIcon } from './BrandIcons';
import { profile } from '../lib/profile';

const LINKS = [
  { href: profile.socials.github, label: 'GitHub', Icon: GithubIcon },
  { href: profile.socials.linkedin, label: 'LinkedIn', Icon: LinkedinIcon },
  { href: profile.socials.instagram, label: 'Instagram', Icon: InstagramIcon },
];

export default function Footer() {
  return (
    <footer
      style={{
        background: 'black',
        padding: '3rem 1.5rem 4rem',
        textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <p
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: 'italic',
          fontSize: '1.75rem',
          margin: 0,
          letterSpacing: '-0.01em',
        }}
      >
        {profile.name}
      </p>

      <p
        style={{
          fontFamily: "'Barlow', sans-serif",
          fontWeight: 300,
          fontSize: '0.875rem',
          color: 'rgba(255,255,255,0.45)',
          margin: '0.5rem 0 1.5rem',
        }}
      >
        {profile.tagline}
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
        {LINKS.map(({ href, label, Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={label}
            className="liquid-glass"
            style={{
              width: '2.4rem',
              height: '2.4rem',
              borderRadius: 9999,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            <Icon size={15} />
          </a>
        ))}
      </div>

      <p
        style={{
          fontFamily: "'Barlow', sans-serif",
          fontWeight: 300,
          fontSize: '0.8rem',
          color: 'rgba(255,255,255,0.3)',
          margin: 0,
        }}
      >
        © {new Date().getFullYear()} {profile.name}. All rights reserved.
      </p>
    </footer>
  );
}
