(function () {
  const canvas = document.getElementById('hero-shader-canvas');
  if (!canvas) return;

  function syncSize() {
    const w = canvas.clientWidth || 1280;
    const h = canvas.clientHeight || 720;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(syncSize).observe(canvas);
  }
  syncSize();

  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return;

  const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

  // "Pragmatic Cyber" hero: a procedural circuit/network graph on deep-navy,
  // with signal pulses traveling the connections. Ties visually to what
  // VAMIT actually does (connecting systems, automation, data flow) rather
  // than a decorative motif with no relation to the brand.
  const fs = `precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

// distance from p to segment a-b, plus how far along the segment (0=a, 1=b)
float segDist(vec2 p, vec2 a, vec2 b, out float s) {
    vec2 ab = b - a;
    float t = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0);
    s = t;
    return length(p - (a + ab * t));
}

// jittered node position within a grid cell (cell-space units)
vec2 nodePos(vec2 cell) {
    vec2 j = vec2(hash(cell + 11.0), hash(cell + 37.0));
    return cell + 0.22 + j * 0.56;
}

bool hasNode(vec2 cell) { return hash(cell + 3.0) < 0.72; }

// one directed connection from the node in cellA to the node in cellB;
// only drawn if both ends have a node and this cell "rolls" a link.
// returns dim base line + a traveling cyan signal pulse.
vec3 connection(vec2 p, vec2 cellA, vec2 cellB, float seed, float speed, vec3 lineCol, vec3 pulseCol) {
    if (!hasNode(cellA) || !hasNode(cellB)) return vec3(0.0);
    if (hash(cellA + seed) > 0.4) return vec3(0.0);

    vec2 a = nodePos(cellA);
    vec2 b = nodePos(cellB);
    float s;
    float d = segDist(p, a, b, s);

    float line = smoothstep(0.007, 0.0, d);
    float pulsePos = fract(u_time * speed + hash(cellA + seed + 5.0) * 10.0);
    float pulse = smoothstep(0.09, 0.0, abs(s - pulsePos)) * smoothstep(0.009, 0.0, d);

    return lineCol * line * 0.55 + pulseCol * pulse * 1.6;
}

void main() {
    vec2 uv = v_texCoord;
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 p = uv * aspect;

    vec3 color = vec3(0.051, 0.078, 0.129); // --ink #0D1421
    vec3 lineCol = vec3(0.176, 0.229, 0.31); // --border-dark #2D3A4F
    vec3 cyan = vec3(0.0, 0.961, 1.0);        // --cyan #00F5FF

    // faint blueprint grid for the "technical terminal" backdrop
    vec2 gridUv = p * 22.0;
    vec2 gridF = abs(fract(gridUv - 0.5) - 0.5);
    float gridLine = 1.0 - smoothstep(0.0, 0.03, min(gridF.x, gridF.y));
    color += vec3(0.06, 0.09, 0.13) * gridLine * 0.5;

    // slow drift so the network isn't perfectly static
    float t = u_time * 0.03;
    vec2 gp = p * 6.0 + vec2(t, t * 0.7);
    vec2 cell = floor(gp);

    for (float dx = -1.0; dx <= 1.0; dx += 1.0) {
        for (float dy = -1.0; dy <= 1.0; dy += 1.0) {
            vec2 c = cell + vec2(dx, dy);

            color += connection(gp, c, c + vec2(1.0, 0.0), 1.0, 0.15, lineCol, cyan);
            color += connection(gp, c, c + vec2(0.0, 1.0), 2.0, 0.11, lineCol, cyan);

            if (hasNode(c)) {
                vec2 n = nodePos(c);
                float nd = length(gp - n);
                color += cyan * smoothstep(0.05, 0.0, nd) * 0.9;
                color += cyan * smoothstep(0.16, 0.0, nd) * 0.10;
            }
        }
    }

    // mouse: soft glow only
    vec2 mouse = (u_mouse / u_resolution) * aspect;
    float mDist = length(p - mouse);
    color += cyan * (smoothstep(0.35, 0.0, mDist) * 0.07);

    // gentle vignette for depth
    float vig = smoothstep(1.15, 0.15, length(uv - 0.5));
    color *= mix(0.72, 1.0, vig);

    gl_FragColor = vec4(color, 1.0);
}`;

  function compileShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(prog, 'a_position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uRes = gl.getUniformLocation(prog, 'u_resolution');
  const uMouse = gl.getUniformLocation(prog, 'u_mouse');

  const mouse = { x: canvas.width / 2, y: canvas.height / 2 };
  window.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width && rect.height) {
      mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
      mouse.y = (1.0 - (event.clientY - rect.top) / rect.height) * canvas.height;
    }
  });

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function draw(t) {
    if (typeof ResizeObserver === 'undefined') syncSize();
    gl.viewport(0, 0, canvas.width, canvas.height);
    if (uTime) gl.uniform1f(uTime, t * 0.001);
    if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
    if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  if (reduceMotion) {
    draw(0); // single static frame, no animation loop
  } else {
    (function render(t) {
      draw(t);
      requestAnimationFrame(render);
    })(0);
  }
})();
