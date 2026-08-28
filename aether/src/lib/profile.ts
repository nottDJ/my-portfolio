/**
 * Every piece of copy on the page lives here. Edit this file to re-skin the
 * site — the components read from it and never hard-code names or wording.
 */

export const profile = {
  name: 'DIVIJ',
  role: 'Frontend Developer & Designer',
  tagline: 'Frontend development and design for the extraordinary.',
  email: 'divij.contact@gmail.com',
  phone: '+91 9385594003',
  resume: 'resume.pdf',
  formspree: 'https://formspree.io/f/mjkgaazr',
  socials: {
    github: 'https://github.com/nottDJ',
    linkedin: 'https://www.linkedin.com/in/divij-profile',
    instagram: 'https://www.instagram.com/nott_dj_/',
  },
};

export const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact' },
];

export const hero = {
  badge: 'Available for freelance and internships.',
  /** Two lines — the particle heading renders one per row. */
  title: ['Websites Worth', 'Remembering'],
  subtext:
    "I'm Divij — a frontend developer and designer building fast, considered web experiences. Computer Science at SRM University, five-plus projects shipped.",
};

export const about = {
  badge: 'About Me',
  title: ['Interfaces that feel', 'authored, not assembled.'],
  body: 'A Computer Science Engineering student at SRM University with a foundation in Python and a real appetite for the craft of the web. Five-plus projects shipped, a bias toward clarity, and a habit of sweating the details nobody is supposed to notice.',
  stack: ['HTML', 'CSS', 'JavaScript', 'PHP', 'Python', 'Java', 'C++', 'PostgreSQL'],
};

export const process = {
  badge: 'How I Work',
  title: ['You imagine it.', 'I shape it.'],
  body: 'From first sketch to deploy, every build moves through the same loop — understand, design, prototype, refine — until the thing feels inevitable rather than assembled.',
};

export const capabilities = {
  badge: 'Capabilities',
  title: ['Built with beauty', 'and performance in balance.'],
  cards: [
    {
      icon: 'Eye',
      title: 'Interface & Visual Design',
      body: 'Layouts, type, and atmosphere composed with intent. Every pixel earns the space it takes up.',
    },
    {
      icon: 'Sparkles',
      title: 'Motion & Interaction',
      body: 'Canvas, WebGL, and scroll-driven motion used to make a page feel alive instead of merely animated.',
    },
    {
      icon: 'Zap',
      title: 'Fast Iteration',
      body: 'Ambitious directions explored quickly without losing polish. Rapid cycles, high fidelity, always.',
    },
    {
      icon: 'Package',
      title: 'Production-Ready Front-End',
      body: 'Responsive, accessible builds that ship — clean markup, sane state, no handoff headaches.',
    },
  ],
} as const;

export const projects = {
  badge: 'Selected Work',
  title: ['Things I have', 'designed and built.'],
  items: [
    {
      icon: 'Boxes',
      title: 'ArchX3D — 2D Floor Plans to 3D Walkthroughs',
      body: 'An automated pipeline that converts 2D DXF architectural drawings into 3D GLB models and rendered walkthrough videos. Combines geometric processing with generative AI for scene interpretation.',
      stack: ['Python', 'Blender', 'Gemini API', 'Next.js'],
      href: 'https://github.com/nottDJ/ArchX3D',
    },
    {
      icon: 'ScanFace',
      title: 'Face Recognition Attendance System',
      body: 'A desktop attendance system that identifies students from a live camera feed and logs each one as present exactly once per lecture hour. Includes webcam enrolment for adding new students and writes a dated attendance record to CSV.',
      stack: ['Python', 'face_recognition', 'OpenCV', 'Tkinter'],
      href: 'https://github.com/nottDJ/Face-Recognition',
    },
    {
      icon: 'Newspaper',
      title: 'Fake News Detection System',
      body: 'A multimodal fact-checking application. Accepts articles as text, images, or audio — extracting content via OCR and speech-to-text — then verifies claims against Wikipedia and live web sources using an LLM. Deployed as a Flask web app.',
      stack: ['Python', 'Flask', 'OpenAI API', 'Tesseract OCR', 'OpenCV', 'SpeechRecognition'],
      href: 'https://github.com/nottDJ/Fake-News-Detection-System',
    },
    {
      icon: 'Waves',
      title: 'AI-Driven Smart Sluice Management',
      body: 'A Streamlit tool that classifies irrigation-lake condition and estimates maintenance cost with a Random Forest regressor, giving tendering bodies an independent baseline to judge bids against. Currently a prototype trained on procedurally generated data — the README documents that limitation rather than glossing it.',
      stack: ['Python', 'scikit-learn', 'Pandas', 'Streamlit'],
      href: 'https://github.com/nottDJ/smart-sluice-ai',
    },
  ],
} as const;

export const contact = {
  badge: 'Begin',
  title: ['Your next website', 'starts here.'],
  body: 'Have a project in mind? Send it over and I will come back to you with a direction, a timeline, and an honest read on scope.',
};
