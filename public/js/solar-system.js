/**
 * DJS NOVA - Realistic Live Solar System Engine
 * Top-view simulation with the Sun at the leftmost center and Pluto as the outermost planet.
 * Features realistic planetary shading, atmospheres, rings, orbital tracks, and lighting.
 */

class SolarSystemEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.dpr = window.devicePixelRatio || 1;
    this.width = 0;
    this.height = 0;
    
    // Background starfield
    this.stars = [];
    this.nebulaClouds = [];
    
    // Solar corona animation phase
    this.coronaPhase = 0;
    
    // Planet definitions: distances, sizes, speeds, colors, textures
    this.initPlanets();
    this.initStars();
    
    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);
    
    window.addEventListener('resize', this.resize);
    this.resize();
    requestAnimationFrame(this.render);
  }

  initPlanets() {
    // Relative speeds roughly proportional to real physics, scaled for engaging visual motion
    // Initial angles randomized so planets are scattered around their orbits
    this.planets = [
      {
        name: 'Mercury',
        distFactor: 0.12,
        radius: 5,
        speed: 0.0075,
        angle: Math.random() * Math.PI * 2,
        color: '#9e9fa5',
        type: 'rocky',
        craters: true
      },
      {
        name: 'Venus',
        distFactor: 0.19,
        radius: 8.5,
        speed: 0.0052,
        angle: Math.random() * Math.PI * 2,
        color: '#e3bb7b',
        atmosphere: 'rgba(230, 195, 130, 0.4)',
        type: 'gas-clouds'
      },
      {
        name: 'Earth',
        distFactor: 0.28,
        radius: 9.5,
        speed: 0.0040,
        angle: Math.random() * Math.PI * 2,
        color: '#2b82c9',
        landColor: '#387346',
        clouds: true,
        atmosphere: 'rgba(90, 180, 255, 0.5)',
        hasMoon: true,
        moonDist: 18,
        moonAngle: 0
      },
      {
        name: 'Mars',
        distFactor: 0.38,
        radius: 7,
        speed: 0.0032,
        angle: Math.random() * Math.PI * 2,
        color: '#c1440e',
        iceCap: true,
        type: 'rocky'
      },
      {
        name: 'Jupiter',
        distFactor: 0.51,
        radius: 20,
        speed: 0.0018,
        angle: Math.random() * Math.PI * 2,
        color: '#c88b3a',
        type: 'banded-gas',
        hasGreatRedSpot: true
      },
      {
        name: 'Saturn',
        distFactor: 0.65,
        radius: 17,
        speed: 0.0013,
        angle: Math.random() * Math.PI * 2,
        color: '#e2bf7d',
        type: 'banded-gas',
        hasRings: true,
        ringInner: 23,
        ringOuter: 40
      },
      {
        name: 'Uranus',
        distFactor: 0.77,
        radius: 12,
        speed: 0.0009,
        angle: Math.random() * Math.PI * 2,
        color: '#7be5e8',
        atmosphere: 'rgba(123, 229, 232, 0.35)',
        hasFaintRing: true
      },
      {
        name: 'Neptune',
        distFactor: 0.88,
        radius: 11.5,
        speed: 0.0007,
        angle: Math.random() * Math.PI * 2,
        color: '#274687',
        atmosphere: 'rgba(65, 115, 235, 0.45)',
        type: 'deep-gas'
      },
      {
        name: 'Pluto',
        distFactor: 0.97,
        radius: 4.5,
        speed: 0.0005,
        angle: Math.random() * Math.PI * 2,
        color: '#bba793',
        hasHeartTombaugh: true,
        type: 'ice-dwarf'
      }
    ];
  }

  initStars() {
    this.stars = [];
    const count = 260;
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.8 + 0.4,
        alpha: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.03 + 0.008,
        twinklePhase: Math.random() * Math.PI * 2,
        color: ['#ffffff', '#d4e5ff', '#ffeacc', '#a3d1ff'][Math.floor(Math.random() * 4)]
      });
    }

    // Space nebulae dust clouds
    this.nebulaClouds = [
      { x: 0.35, y: 0.2, r: 350, color: 'rgba(30, 45, 110, 0.14)' },
      { x: 0.75, y: 0.7, r: 420, color: 'rgba(60, 20, 100, 0.12)' },
      { x: 0.15, y: 0.85, r: 300, color: 'rgba(10, 80, 140, 0.15)' }
    ];
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);

    // Sun position: Leftmost center
    this.sunX = -40;
    this.sunY = this.height / 2;
    this.sunRadius = Math.min(this.height * 0.36, 170);

    // Maximum orbital span reaches across the screen to accommodate Pluto
    this.maxOrbitSpan = (this.width - this.sunX) * 0.95;
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.coronaPhase += 0.025;

    this.drawDeepSpace();
    this.drawOrbits();
    this.drawSun();
    this.drawPlanets();

    requestAnimationFrame(this.render);
  }

  drawDeepSpace() {
    // Deep cosmic background gradient
    const bgGrad = this.ctx.createRadialGradient(
      this.width * 0.2, this.height * 0.5, 50,
      this.width * 0.5, this.height * 0.5, Math.max(this.width, this.height)
    );
    bgGrad.addColorStop(0, '#0a1024');
    bgGrad.addColorStop(0.5, '#050917');
    bgGrad.addColorStop(1, '#02040a');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Nebula dust
    for (const neb of this.nebulaClouds) {
      const g = this.ctx.createRadialGradient(
        neb.x * this.width, neb.y * this.height, 10,
        neb.x * this.width, neb.y * this.height, neb.r
      );
      g.addColorStop(0, neb.color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      this.ctx.fillStyle = g;
      this.ctx.beginPath();
      this.ctx.arc(neb.x * this.width, neb.y * this.height, neb.r, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Twinkling stars
    for (const star of this.stars) {
      star.twinklePhase += star.twinkleSpeed;
      const currentAlpha = star.alpha * (0.65 + 0.35 * Math.sin(star.twinklePhase));
      this.ctx.fillStyle = star.color;
      this.ctx.globalAlpha = currentAlpha;
      this.ctx.beginPath();
      this.ctx.arc(star.x * this.width, star.y * this.height, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1.0;
  }

  drawOrbits() {
    this.ctx.save();
    for (let i = 0; i < this.planets.length; i++) {
      const p = this.planets[i];
      const orbitRadius = this.sunRadius + (this.maxOrbitSpan - this.sunRadius) * p.distFactor;

      // Draw faint, elegant orbital track line
      this.ctx.strokeStyle = 'rgba(100, 160, 255, 0.12)';
      this.ctx.lineWidth = 1;
      this.ctx.setLineDash([4, 6]);
      this.ctx.beginPath();
      this.ctx.arc(this.sunX, this.sunY, orbitRadius, -Math.PI / 2, Math.PI / 2);
      this.ctx.stroke();

      // Planet label (subtle and high-tech)
      this.ctx.setLineDash([]);
      this.ctx.fillStyle = 'rgba(160, 200, 255, 0.35)';
      this.ctx.font = '10px "Space Grotesk", sans-serif';
      this.ctx.fillText(p.name.toUpperCase(), this.sunX + orbitRadius - 15, this.sunY + 16);
    }
    this.ctx.restore();
  }

  drawSun() {
    this.ctx.save();

    // 1. Far outer corona glow
    const outerGlow = this.ctx.createRadialGradient(
      this.sunX, this.sunY, this.sunRadius * 0.7,
      this.sunX, this.sunY, this.sunRadius * 2.8
    );
    outerGlow.addColorStop(0, 'rgba(255, 170, 40, 0.38)');
    outerGlow.addColorStop(0.4, 'rgba(255, 100, 10, 0.16)');
    outerGlow.addColorStop(0.8, 'rgba(255, 60, 0, 0.05)');
    outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = outerGlow;
    this.ctx.beginPath();
    this.ctx.arc(this.sunX, this.sunY, this.sunRadius * 2.8, 0, Math.PI * 2);
    this.ctx.fill();

    // 2. Dynamic solar flares / spicules
    const rays = 24;
    for (let r = 0; r < rays; r++) {
      const angle = (r / rays) * Math.PI * 2 + this.coronaPhase * 0.2;
      const flareLen = this.sunRadius * (1.15 + 0.18 * Math.sin(this.coronaPhase * 2 + r * 1.5));
      const fx = this.sunX + Math.cos(angle) * flareLen;
      const fy = this.sunY + Math.sin(angle) * flareLen;

      const gFlare = this.ctx.createRadialGradient(
        this.sunX, this.sunY, this.sunRadius * 0.9,
        fx, fy, flareLen * 0.4
      );
      gFlare.addColorStop(0, 'rgba(255, 200, 80, 0.25)');
      gFlare.addColorStop(1, 'rgba(255, 60, 0, 0)');

      this.ctx.fillStyle = gFlare;
      this.ctx.beginPath();
      this.ctx.arc(fx, fy, this.sunRadius * 0.3, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 3. Main Sun sphere with multi-stage radial gradient
    const sunGrad = this.ctx.createRadialGradient(
      this.sunX + this.sunRadius * 0.2, this.sunY, this.sunRadius * 0.1,
      this.sunX, this.sunY, this.sunRadius
    );
    sunGrad.addColorStop(0, '#ffffff');       // Incandescent white core
    sunGrad.addColorStop(0.2, '#fff199');     // Bright yellow
    sunGrad.addColorStop(0.55, '#ffaa00');    // Solar amber
    sunGrad.addColorStop(0.85, '#ff5500');    // Active chromosphere orange
    sunGrad.addColorStop(1, '#c41c00');       // Deep solar edge

    this.ctx.fillStyle = sunGrad;
    this.ctx.beginPath();
    this.ctx.arc(this.sunX, this.sunY, this.sunRadius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawPlanets() {
    for (let i = 0; i < this.planets.length; i++) {
      const p = this.planets[i];
      const orbitRadius = this.sunRadius + (this.maxOrbitSpan - this.sunRadius) * p.distFactor;

      // Increment orbit angle (all in counter-clockwise direction)
      p.angle -= p.speed;
      if (p.angle < -Math.PI * 2) p.angle += Math.PI * 2;

      // Position in 2D space
      const px = this.sunX + Math.cos(p.angle) * orbitRadius;
      const py = this.sunY + Math.sin(p.angle) * orbitRadius;

      // Skip drawing if completely offscreen
      if (px < -50 || px > this.width + 50 || py < -50 || py > this.height + 50) {
        continue;
      }

      this.ctx.save();
      this.ctx.translate(px, py);

      // Draw rings behind Saturn before drawing body
      if (p.hasRings) {
        this.drawSaturnRings(p, false);
      }

      // Draw planet body with realistic spherical gradient and terminator shadow
      this.drawPlanetBody(p, px, py);

      // Draw rings in front of Saturn
      if (p.hasRings) {
        this.drawSaturnRings(p, true);
      }

      // Draw Earth's Moon
      if (p.hasMoon) {
        p.moonAngle += 0.035;
        const mx = Math.cos(p.moonAngle) * p.moonDist;
        const my = Math.sin(p.moonAngle) * p.moonDist;
        
        // Moon orbit trail
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.lineWidth = 0.5;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.moonDist, 0, Math.PI * 2);
        this.ctx.stroke();

        // Moon body
        this.ctx.fillStyle = '#dcdde1';
        this.ctx.beginPath();
        this.ctx.arc(mx, my, 2.2, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    }
  }

  drawPlanetBody(p, px, py) {
    const r = p.radius;

    // Angle pointing from Sun to this planet
    const sunAngle = Math.atan2(py - this.sunY, px - this.sunX);

    // Realistic multi-stop spherical texture
    const bodyGrad = this.ctx.createRadialGradient(
      -Math.cos(sunAngle) * r * 0.45,
      -Math.sin(sunAngle) * r * 0.45,
      r * 0.1,
      0,
      0,
      r
    );

    if (p.name === 'Earth') {
      bodyGrad.addColorStop(0, '#6fc2ff');
      bodyGrad.addColorStop(0.3, '#1d6bb8');
      bodyGrad.addColorStop(0.65, '#0b3970');
      bodyGrad.addColorStop(1, '#021024');
    } else if (p.name === 'Jupiter') {
      bodyGrad.addColorStop(0, '#f2d39b');
      bodyGrad.addColorStop(0.4, '#c28136');
      bodyGrad.addColorStop(0.7, '#8f4f1d');
      bodyGrad.addColorStop(1, '#3b1c06');
    } else if (p.name === 'Mars') {
      bodyGrad.addColorStop(0, '#f2784b');
      bodyGrad.addColorStop(0.5, '#b83b16');
      bodyGrad.addColorStop(0.8, '#701e09');
      bodyGrad.addColorStop(1, '#240802');
    } else if (p.name === 'Venus') {
      bodyGrad.addColorStop(0, '#fff0c7');
      bodyGrad.addColorStop(0.45, '#e0b36a');
      bodyGrad.addColorStop(0.8, '#9c6f28');
      bodyGrad.addColorStop(1, '#382207');
    } else if (p.name === 'Neptune') {
      bodyGrad.addColorStop(0, '#6ba2f2');
      bodyGrad.addColorStop(0.5, '#2558ba');
      bodyGrad.addColorStop(0.8, '#102e75');
      bodyGrad.addColorStop(1, '#051238');
    } else if (p.name === 'Uranus') {
      bodyGrad.addColorStop(0, '#b8f4f7');
      bodyGrad.addColorStop(0.5, '#56cbd1');
      bodyGrad.addColorStop(0.85, '#267b80');
      bodyGrad.addColorStop(1, '#0b2f33');
    } else if (p.name === 'Saturn') {
      bodyGrad.addColorStop(0, '#faebb7');
      bodyGrad.addColorStop(0.4, '#d6ba78');
      bodyGrad.addColorStop(0.75, '#997f43');
      bodyGrad.addColorStop(1, '#3d3013');
    } else if (p.name === 'Mercury') {
      bodyGrad.addColorStop(0, '#d1d2d6');
      bodyGrad.addColorStop(0.5, '#8c8d94');
      bodyGrad.addColorStop(0.85, '#4e4f54');
      bodyGrad.addColorStop(1, '#1b1b1d');
    } else {
      // Pluto
      bodyGrad.addColorStop(0, '#edd8c5');
      bodyGrad.addColorStop(0.5, '#a68c76');
      bodyGrad.addColorStop(0.85, '#614d3b');
      bodyGrad.addColorStop(1, '#211811');
    }

    this.ctx.fillStyle = bodyGrad;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, r, 0, Math.PI * 2);
    this.ctx.fill();

    // Specific planetary surface features
    if (p.name === 'Earth') {
      // Continental patches
      this.ctx.fillStyle = 'rgba(46, 125, 50, 0.7)';
      this.ctx.beginPath();
      this.ctx.ellipse(-r * 0.15, -r * 0.15, r * 0.45, r * 0.3, 0.4, 0, Math.PI * 2);
      this.ctx.fill();

      // Cloud swirl bands
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      this.ctx.beginPath();
      this.ctx.ellipse(r * 0.1, r * 0.2, r * 0.6, r * 0.18, -0.2, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (p.name === 'Jupiter') {
      // Atmospheric storm bands
      this.ctx.strokeStyle = 'rgba(110, 45, 15, 0.55)';
      this.ctx.lineWidth = 2.2;
      this.ctx.beginPath();
      this.ctx.arc(0, -r * 0.35, r * 0.9, -0.6, 0.6);
      this.ctx.stroke();

      this.ctx.strokeStyle = 'rgba(180, 85, 30, 0.55)';
      this.ctx.beginPath();
      this.ctx.arc(0, r * 0.3, r * 0.9, -0.6, 0.6);
      this.ctx.stroke();

      // Great Red Spot
      this.ctx.fillStyle = '#b33917';
      this.ctx.beginPath();
      this.ctx.ellipse(-r * 0.2, r * 0.35, r * 0.28, r * 0.18, 0, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (p.name === 'Mars' && p.iceCap) {
      // North polar ice cap
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      this.ctx.beginPath();
      this.ctx.arc(0, -r * 0.75, r * 0.32, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (p.name === 'Pluto' && p.hasHeartTombaugh) {
      // Tombaugh Regio "Heart of Pluto"
      this.ctx.fillStyle = 'rgba(255, 240, 220, 0.65)';
      this.ctx.beginPath();
      this.ctx.ellipse(-r * 0.2, 0, r * 0.4, r * 0.3, 0.2, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Realistic atmospheric rim glow (Rayleigh scattering)
    if (p.atmosphere) {
      this.ctx.strokeStyle = p.atmosphere;
      this.ctx.lineWidth = 1.6;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, r + 0.8, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    // Realistic Terminator Dark Shadow (sunlight comes from Sun on the left)
    const shadowGrad = this.ctx.createRadialGradient(
      Math.cos(sunAngle) * r * 0.6,
      Math.sin(sunAngle) * r * 0.6,
      r * 0.2,
      Math.cos(sunAngle) * r * 0.2,
      Math.sin(sunAngle) * r * 0.2,
      r
    );
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.78)');
    shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.45)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    this.ctx.fillStyle = shadowGrad;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, r + 0.5, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawSaturnRings(p, frontOnly) {
    this.ctx.save();
    this.ctx.rotate(0.42); // Saturn's realistic axial ring tilt

    const inner = p.ringInner;
    const outer = p.ringOuter;
    const yRatio = 0.32; // Elliptical 3D tilt

    this.ctx.lineWidth = 1.4;

    // Draw multi-layered realistic rings with Cassini Division
    const startAngle = frontOnly ? 0 : Math.PI;
    const endAngle = frontOnly ? Math.PI : Math.PI * 2;

    // Ring A (outer)
    this.ctx.strokeStyle = 'rgba(215, 185, 130, 0.5)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, outer, outer * yRatio, 0, startAngle, endAngle);
    this.ctx.stroke();

    // Ring B (broad, dense)
    this.ctx.strokeStyle = 'rgba(240, 215, 160, 0.65)';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, (inner + outer) * 0.5 - 2, ((inner + outer) * 0.5 - 2) * yRatio, 0, startAngle, endAngle);
    this.ctx.stroke();

    // Cassini Division (dark gap)
    this.ctx.strokeStyle = 'rgba(10, 15, 30, 0.85)';
    this.ctx.lineWidth = 1.2;
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, outer - 4, (outer - 4) * yRatio, 0, startAngle, endAngle);
    this.ctx.stroke();

    this.ctx.restore();
  }
}

// Global hook
window.SolarSystemEngine = SolarSystemEngine;
