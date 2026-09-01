import { useRef, useEffect } from 'react';

const VERTEX_SHADER = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
  v_uv = a_pos;
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform float u_time;
uniform vec2 u_res;
uniform float u_spread;
uniform float u_speed;
uniform vec2 u_mouse;

varying vec2 v_uv;

#define PI 3.14159265359
#define TAU 6.28318530718
#define SQRT2 1.41421356238

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash2(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  float m1 = mix(a, b, f.x);
  float m2 = mix(c, d, f.x);
  return mix(m1, m2, f.y);
}

float fbm(vec2 p, int octaves) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 14; i++) {
    if (i >= octaves) break;
    v += a * vnoise(p);
    p = rot * p * 2.0 + vec2(100.0);
    a *= 0.5;
  }
  return v;
}

float ridged(vec2 p, int octaves) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 14; i++) {
    if (i >= octaves) break;
    float n = vnoise(p);
    n = 1.0 - abs(n * 2.0 - 1.0);
    n = n * n;
    v += a * n;
    p = rot * p * 2.0 + vec2(100.0);
    a *= 0.5;
  }
  return v;
}

float warpedFbm(vec2 p, float t, float warpStr, int oct) {
  vec2 q;
  q.x = fbm(p + vec2(1.7, 9.2) + t * 0.15, oct);
  q.y = fbm(p + vec2(8.3, 2.8) + t * 0.12, oct);
  vec2 r;
  r.x = fbm(p + warpStr * q + vec2(3.1, 7.4) + t * 0.1, oct);
  r.y = fbm(p + warpStr * q + vec2(5.6, 1.9) + t * 0.08, oct);
  return fbm(p + warpStr * r + t * 0.05, oct);
}

vec2 curlWarp(vec2 p, float t) {
  float eps = 0.01;
  float n1 = warpedFbm(p + vec2(0.0, eps), t, 1.5, 5);
  float n2 = warpedFbm(p - vec2(0.0, eps), t, 1.5, 5);
  float n3 = warpedFbm(p + vec2(eps, 0.0), t, 1.5, 5);
  float n4 = warpedFbm(p - vec2(eps, 0.0), t, 1.5, 5);
  float cx = (n1 - n2) / (2.0 * eps);
  float cy = (n3 - n4) / (2.0 * eps);
  return vec2(cx, cy);
}

vec2 concentricFluids(vec2 uv, float t, float scale) {
  vec2 p = uv * scale;
  float r = length(p);
  float a = atan(p.y, p.x);
  vec2 displacement = vec2(0.0);
  float totalWeight = 0.0;

  vec2 layerCenters[4];
  layerCenters[0] = vec2(0.15, -0.2);
  layerCenters[1] = vec2(-0.25, 0.1);
  layerCenters[2] = vec2(0.3, 0.25);
  layerCenters[3] = vec2(-0.1, -0.35);

  float layerSpeeds[4];
  layerSpeeds[0] = 0.6;
  layerSpeeds[1] = -0.4;
  layerSpeeds[2] = 0.35;
  layerSpeeds[3] = -0.55;

  for (int i = 0; i < 4; i++) {
    vec2 c = layerCenters[i];
    vec2 rel = uv - c;
    float lr = length(rel);
    float la = atan(rel.y, rel.x);
    float w = exp(-lr * lr * 3.0);
    float sp = layerSpeeds[i];
    vec2 tangential = vec2(-sin(la), cos(la));
    float flow = sin(la * 3.0 + t * sp + lr * 5.0) * 0.015 * w;
    float rot = cos(la * 2.0 - t * sp * 0.7 + lr * 4.0) * 0.012 * w;
    displacement += (flow * tangential + rot * vec2(cos(la), sin(la))) * smoothstep(0.5, 0.0, lr);
    totalWeight += w * smoothstep(0.5, 0.0, lr);
  }

  if (totalWeight > 0.1) {
    displacement /= totalWeight * 1.5;
  }

  displacement += curlWarp(uv * 1.5, t) * 0.03;
  return displacement;
}

float metallicHighlight(vec2 uv, float t, float scale) {
  vec2 p = uv * scale;
  float r = length(p);
  float a = atan(p.y, p.x);
  float h = 0.0;
  h += sin(a * 4.0 + t * 0.6 + r * 8.0) * 0.5;
  h += sin(a * 7.0 - t * 0.4 + r * 12.0) * 0.3;
  h = h * 0.5 + 0.5;
  h = pow(h, 3.0);
  return h * smoothstep(1.0, 0.0, r);
}

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(TAU * (c * t + d));
}

void main() {
  vec2 uv = v_uv * 0.5 + 0.5;
  float aspect = u_res.x / u_res.y;
  uv.x *= aspect;
  float t = u_time * u_speed;
  vec2 mouseOffset = (u_mouse - 0.5) * u_spread;

  vec2 displ1 = concentricFluids(uv - mouseOffset, t, 3.0);
  vec2 displ2 = concentricFluids(uv + mouseOffset * 0.7, t * 0.85 + 10.0, 3.5);

  vec2 fluidUV1 = uv + displ1 * 0.08;
  vec2 fluidUV2 = uv + displ2 * 0.06;
  float fluidMix = 0.5 + 0.5 * sin(t * 0.4);
  vec2 fluidUV = mix(fluidUV1, fluidUV2, fluidMix);

  float bandFreq = 12.0;
  float pattern = fbm(fluidUV * bandFreq + t * 0.05, 6);
  pattern = pow(pattern, 1.3);

  vec3 colA = vec3(0.5, 0.3, 0.1);
  vec3 colB = vec3(0.5, 0.4, 0.3);
  vec3 colC = vec3(1.0, 1.0, 0.9);
  vec3 colD = vec3(0.1, 0.2, 0.6);

  vec3 baseColor = palette(pattern, colA, colB, colC, colD);

  float texture2 = ridged(fluidUV * 8.0 + t * 0.03, 5);
  vec3 accentColor = palette(fract(texture2 * 0.5 + t * 0.02), vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.1, 0.3));

  vec3 col = mix(baseColor, accentColor, 0.15);

  float turbulence = length(displ1) * 8.0;
  float hLight = metallicHighlight(fluidUV, t, 3.0) * (0.5 + turbulence);

  col = mix(col, vec3(1.0, 0.95, 0.85), hLight * 0.7);

  vec2 vigUV = v_uv;
  float vig = 1.0 - dot(vigUV, vigUV) * 0.4;
  col *= vig;

  gl_FragColor = vec4(col, 1.0);
}
`;

export default function FluidShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) return;

    const dpr = Math.min(window.devicePixelRatio, 2);

    function resize() {
      if (!canvas || !gl) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();

    function compileShader(src: string, type: number) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return s;
    }

    const vs = compileShader(VERTEX_SHADER, gl.VERTEX_SHADER);
    const fs = compileShader(FRAGMENT_SHADER, gl.FRAGMENT_SHADER);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uSpread = gl.getUniformLocation(prog, 'u_spread');
    const uSpeed = gl.getUniformLocation(prog, 'u_speed');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    gl.uniform1f(uSpread, 0.4);
    gl.uniform1f(uSpeed, 0.3);

    let smoothMouseX = 0.5;
    let smoothMouseY = 0.5;

    function onMouseMove(e: MouseEvent) {
      mouseRef.current.x = e.clientX / window.innerWidth;
      mouseRef.current.y = 1.0 - e.clientY / window.innerHeight;
    }
    window.addEventListener('mousemove', onMouseMove);

    function onResize() {
      resize();
    }
    window.addEventListener('resize', onResize);

    const startTime = performance.now();

    function render() {
      if (!gl || !canvas) return;
      const elapsed = (performance.now() - startTime) / 1000;

      smoothMouseX += (mouseRef.current.x - smoothMouseX) * 0.05;
      smoothMouseY += (mouseRef.current.y - smoothMouseY) * 0.05;

      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, smoothMouseX, smoothMouseY);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    />
  );
}
