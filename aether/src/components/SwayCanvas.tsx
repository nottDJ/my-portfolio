import { useEffect, useRef } from 'react';
import { loadTexture, prefersReducedMotion } from '../lib/backdrop';
import { HERO_SKYLINE, meadowTexture, type TextureSource } from '../lib/textures';

/**
 * The hero backdrop, rendered as a live WebGL surface.
 *
 * Two zones, split at the horizon:
 *   · below it, flower clusters sway on multi-frequency wind gusts, each
 *     cluster on its own phase, amplitude scaling with depth so the near field
 *     moves far more than the far field;
 *   · above it, the sky creeps through a very slow radial zoom from top-centre
 *     plus a little lateral drift, so the clouds seem to approach.
 *
 * Falls back to a strip-based Canvas 2D sway when WebGL is unavailable.
 */

const VERT = `
  attribute vec2 a_pos;
  varying vec2 v_uv;
  void main() {
    // v_uv.y runs 0 at the top of the image to 1 at the bottom.
    v_uv = vec2(a_pos.x * 0.5 + 0.5, -a_pos.y * 0.5 + 0.5);
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`;

const FRAG = `
  precision mediump float;
  uniform sampler2D u_tex;
  uniform float     u_time;
  uniform vec2      u_canvas;
  uniform vec2      u_image;
  uniform float     u_skyline;
  varying vec2      v_uv;

  // object-fit: cover, in UV space
  vec2 coverUV(vec2 uv) {
    float ca = u_canvas.x / max(u_canvas.y, 1.0);
    float ia = u_image.x  / max(u_image.y,  1.0);
    vec2 s = ca > ia ? vec2(1.0, ia / ca) : vec2(ca / ia, 1.0);
    return (uv - 0.5) * s + 0.5;
  }

  void main() {
    vec2  uv = coverUV(v_uv);
    float h  = 1.0 - uv.y;          // height above the bottom edge
    float skyLine = u_skyline;      // horizon: sky above, meadow below

    // ── CLOUD ZONE ────────────────────────────────────────────────────────
    float inSky = smoothstep(skyLine - 0.04, skyLine + 0.06, h);
    vec2  skyCenter = vec2(0.5, 0.0);   // top-centre, in image UV

    // Two very slow sines instead of a sawtooth, so the creep never snaps back.
    float breathe = sin(u_time * 0.0210) * 0.020
                  + sin(u_time * 0.0087) * 0.014;
    float zoomFactor = 1.0 - breathe * inSky;
    vec2  zoomedSkyUV = skyCenter + (uv - skyCenter) * zoomFactor;
    vec2  skyUV = mix(uv, zoomedSkyUV, inSky);

    float cloudDx = inSky * (
        sin(u_time * 0.045 + uv.x * 1.5) * 0.009
      + sin(u_time * 0.070 + uv.x * 0.8) * 0.005
    );

    // ── PLANT ZONE ────────────────────────────────────────────────────────
    float inPlant = 1.0 - smoothstep(skyLine - 0.07, skyLine + 0.02, h);
    float depth   = clamp((skyLine - h) / skyLine, 0.0, 1.0);  // 0 horizon → 1 foreground

    // Multi-frequency wind gusts — organic, not metronomic.
    float gust = sin(u_time * 0.38) * 0.50
               + sin(u_time * 0.61) * 0.30
               + sin(u_time * 0.97) * 0.20;

    // Cluster phase — roughly 8 clusters across, irregularly spaced.
    float clusterPhase = uv.x * 8.0
                       + sin(uv.x * 3.5) * 2.0
                       + h * 2.0;
    float clusterSway = sin(u_time * 1.10 + clusterPhase)             * 0.65
                      + sin(u_time * 1.80 + clusterPhase * 0.8 + 1.8) * 0.35;

    float plantAmp = pow(depth, 0.55) * 0.0058 * inPlant;
    float plantDx  = (gust * 0.58 + clusterSway * 0.42) * plantAmp;
    float plantDy  = sin(u_time * 0.75 + clusterPhase + 3.0) * plantAmp * 0.14;

    // ── COMBINE ───────────────────────────────────────────────────────────
    vec2 skyDelta  = (skyUV - uv) + vec2(cloudDx, 0.0);
    vec2 displaced = clamp(uv + vec2(plantDx, plantDy) + skyDelta, 0.0, 1.0);
    gl_FragColor = texture2D(u_tex, displaced);
  }
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('[SwayCanvas] shader failed:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

const texSize = (tex: TextureSource): [number, number] =>
  tex instanceof HTMLImageElement
    ? [tex.naturalWidth || tex.width, tex.naturalHeight || tex.height]
    : [tex.width, tex.height];

/* ------------------------------------------------------------------ */

function startWebGL(canvas: HTMLCanvasElement, tex: TextureSource, still: boolean) {
  const gl = (canvas.getContext('webgl', { alpha: false, antialias: false }) ??
    canvas.getContext('experimental-webgl', {
      alpha: false,
      antialias: false,
    })) as WebGLRenderingContext | null;
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;

  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('[SwayCanvas] link failed:', gl.getProgramInfoLog(prog));
    return null;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uCanvas = gl.getUniformLocation(prog, 'u_canvas');
  const uImage = gl.getUniformLocation(prog, 'u_image');
  gl.uniform1i(gl.getUniformLocation(prog, 'u_tex'), 0);
  gl.uniform1f(gl.getUniformLocation(prog, 'u_skyline'), HERO_SKYLINE);

  const [iw, ih] = texSize(tex);
  gl.uniform2f(uImage, iw, ih);

  const glTex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, glTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex);

  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const resize = () => {
    const w = Math.max(1, Math.round((canvas.offsetWidth || 1280) * dpr));
    const h = Math.max(1, Math.round((canvas.offsetHeight || 720) * dpr));
    if (canvas.width === w && canvas.height === h) return;
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uCanvas, w, h);
  };
  resize();

  let frame = 0;
  const draw = (t: number) => {
    gl.uniform1f(uTime, t / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  if (still) {
    draw(0);
  } else {
    const loop = (t: number) => {
      draw(t);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
  }

  const ro = new ResizeObserver(() => {
    resize();
    if (still) draw(0);
  });
  ro.observe(canvas);

  return () => {
    cancelAnimationFrame(frame);
    ro.disconnect();
    gl.deleteProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.deleteTexture(glTex);
    gl.deleteBuffer(buf);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}

/* ------------------------------------------------------------------ */

/** Strip-based sway for browsers without WebGL. */
function start2D(canvas: HTMLCanvasElement, tex: TextureSource, still: boolean) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const [iw, ih] = texSize(tex);
  const STRIPS = 96;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

  const resize = () => {
    canvas.width = Math.max(1, Math.round((canvas.offsetWidth || 1280) * dpr));
    canvas.height = Math.max(1, Math.round((canvas.offsetHeight || 720) * dpr));
  };
  resize();

  const draw = (ms: number) => {
    const cw = canvas.width;
    const ch = canvas.height;
    const t = ms / 1000;

    // cover-fit source rect
    const ca = cw / ch;
    const ia = iw / ih;
    let sw = iw;
    let sh = ih;
    if (ca > ia) sh = iw / ca;
    else sw = ih * ca;
    const sx = (iw - sw) / 2;
    const sy = (ih - sh) / 2;

    ctx.clearRect(0, 0, cw, ch);

    const gust =
      Math.sin(t * 0.38) * 0.5 + Math.sin(t * 0.61) * 0.3 + Math.sin(t * 0.97) * 0.2;

    for (let j = 0; j < STRIPS; j++) {
      const v = (j + 0.5) / STRIPS; // 0 top → 1 bottom
      const h = 1 - v;
      const inPlant = h < HERO_SKYLINE ? 1 : 0;
      const depth = Math.max(0, Math.min(1, (HERO_SKYLINE - h) / HERO_SKYLINE));

      let dx = 0;
      if (inPlant) {
        const phase = h * 2 + j * 0.11;
        dx =
          (gust * 0.58 + Math.sin(t * 1.1 + phase) * 0.42) *
          Math.pow(depth, 0.55) *
          cw *
          0.006;
      } else {
        dx = Math.sin(t * 0.045 + v * 1.5) * cw * 0.006;
      }

      ctx.drawImage(
        tex,
        sx,
        sy + (sh * j) / STRIPS,
        sw,
        sh / STRIPS,
        dx,
        (ch * j) / STRIPS,
        cw,
        ch / STRIPS + 1,
      );
    }
  };

  let frame = 0;
  if (still) {
    draw(0);
  } else {
    const loop = (ms: number) => {
      draw(ms);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
  }

  const ro = new ResizeObserver(() => {
    resize();
    if (still) draw(0);
  });
  ro.observe(canvas);

  return () => {
    cancelAnimationFrame(frame);
    ro.disconnect();
  };
}

export default function SwayCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let dispose: (() => void) | null = null;
    let alive = true;

    void loadTexture('hero-bg.jpg', meadowTexture).then((tex) => {
      if (!alive) return;
      const still = prefersReducedMotion();
      dispose = startWebGL(canvas, tex, still) ?? start2D(canvas, tex, still);
    });

    return () => {
      alive = false;
      dispose?.();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="hero-glow"
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  );
}
