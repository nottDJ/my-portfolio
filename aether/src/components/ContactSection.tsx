import { useRef, useState, type FormEvent } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowUpRight, ChevronRight, Loader2, Send } from 'lucide-react';
import { asset } from '../lib/backdrop';
import { fadeUp, IN_VIEW } from '../lib/motion';
import { contact, profile } from '../lib/profile';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function ContactSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, IN_VIEW);
  const [status, setStatus] = useState<Status>('idle');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus('sending');
    try {
      const res = await fetch(profile.formspree, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  return (
    <section
      id="contact"
      ref={ref}
      style={{ background: 'black', padding: '7rem 1.5rem 10rem', position: 'relative' }}
    >
      <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate={inView ? 'visible' : 'hidden'}>
          <span className="section-badge">{contact.badge}</span>
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
            fontSize: 'clamp(2.75rem, 7vw, 4.75rem)',
            letterSpacing: '-0.04em',
            lineHeight: 0.92,
            margin: '0.5rem 0 1.5rem',
          }}
        >
          {contact.title[0]}
          <br />
          {contact.title[1]}
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
            maxWidth: '32rem',
            margin: '0 auto',
          }}
        >
          {contact.body}
        </motion.p>

        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.75rem',
            marginTop: '2.25rem',
          }}
        >
          <a
            href={`mailto:${profile.email}`}
            className="liquid-glass-strong"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              borderRadius: 9999,
              padding: '0.8rem 1.6rem',
              color: 'white',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            Email Me
            <ArrowUpRight size={16} strokeWidth={1.8} />
          </a>
          <a
            href={asset(profile.resume)}
            download="Divij_Resume.pdf"
            className="liquid-glass"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              borderRadius: 9999,
              padding: '0.8rem 1.6rem',
              color: 'rgba(255,255,255,0.82)',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 400,
            }}
          >
            Download CV
            <ChevronRight size={16} strokeWidth={1.6} />
          </a>
        </motion.div>

        {/* ── message form ─────────────────────────────────────────── */}
        <motion.form
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          onSubmit={onSubmit}
          action={profile.formspree}
          method="POST"
          className="glass-card"
          style={{ marginTop: '3.5rem', textAlign: 'left', maxWidth: '34rem', marginInline: 'auto' }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem',
            }}
          >
            <input className="glass-field" type="text" name="name" placeholder="Name" required />
            <input
              className="glass-field"
              type="email"
              name="_replyto"
              placeholder="Email"
              required
            />
          </div>
          <textarea
            className="glass-field"
            name="message"
            placeholder="What are you building?"
            rows={4}
            required
            style={{ marginTop: '0.75rem', resize: 'vertical', fontFamily: "'Barlow', sans-serif" }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              marginTop: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: '0.8rem',
                color:
                  status === 'error' ? 'rgba(255,140,140,0.9)' : 'rgba(255,255,255,0.45)',
                minHeight: '1rem',
              }}
            >
              {status === 'sent' && 'Thanks — I will get back to you shortly.'}
              {status === 'error' &&
                `Something went wrong. Email me directly at ${profile.email}.`}
              {(status === 'idle' || status === 'sending') && profile.email}
            </span>

            <button
              type="submit"
              disabled={status === 'sending'}
              className="liquid-glass-strong"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderRadius: 9999,
                padding: '0.65rem 1.35rem',
                color: 'white',
                fontFamily: "'Barlow', sans-serif",
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: status === 'sending' ? 'progress' : 'pointer',
                border: 'none',
              }}
            >
              {status === 'sending' ? 'Sending' : 'Send'}
              {status === 'sending' ? (
                <Loader2 size={15} strokeWidth={1.8} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Send size={15} strokeWidth={1.8} />
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </section>
  );
}
