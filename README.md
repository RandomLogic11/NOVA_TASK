# 🌌 DJS NOVA — Real-Time Space Quiz Competition

An interactive, Kahoot-style real-time quiz application built for **DJS NOVA**, featuring a live realistic top-view Solar System background, signature DJS NOVA logo loading sequence, live synchronized participant-admin quiz rooms, real-time live polls, dynamic timers, and a cosmic leaderboard.

---

## ✨ Features

- **Live Realistic Solar System Simulation**:
  - Sun positioned at the leftmost center with realistic multi-layer coronal plasma and pulsating flares.
  - Top view of concentric orbital tracks with all 9 celestial bodies (Mercury, Venus, Earth with Moon, Mars, Jupiter, Saturn with rings and Cassini Division, Uranus, Neptune, and Pluto as the final orbiting body).
  - Smooth continuous counter-clockwise orbital movement at realistic relative velocities.
  - 3D terminator shadows and atmospheric glows based on sunlight direction.
- **Signature DJS NOVA Loading Screen**:
  - Accurate emblem rendering with the photorealistic cratered lunar surface for the letter 'O' and the orbital trajectory sweep.
  - Continuous 360-degree rotating star above the 'A' serving as the mission loading indicator.
- **Translucent Dark Blue HUD**:
  - Glassmorphic rounded rectangular mission panel with glowing cyan borders.
  - Centered without touching screen borders.
- **Real-Time Multiplayer (Socket.IO)**:
  - **Participant Access**: Code `NOVA` with validation (invalid codes trigger *"No such quiz exists"*). Prompt for astronaut callsign/nickname.
  - **Admin Deck Access**: Protected with passkey `DNOVA`.
  - **Waiting Bay**: Real-time radar, cadet avatars, and headcount. Admin cannot start the quiz unless at least 1 participant is in the waiting room.
  - **10 Curated Space Questions**: Sun's mass, Andromeda galaxy, Olympus Mons, speed of light, planetary trivia, and cosmic age.
  - **Live Poll Display**: Instant bar chart update as participants submit answers in real time without page reloads.
  - **Synchronized Countdown Timer**: 20-second timer per question with danger pulse state.
  - **Cosmic Leaderboard**: 3-place podium (Gold 👑, Silver, Bronze) and full ranking telemetry with speed bonuses.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

### 3. Open in Browser
Visit `http://localhost:3000`.

- **To Join as Participant**: Click **Take Quiz**, enter Code `NOVA` and your nickname.
- **To Host as Admin**: Click **Monitor Quiz**, enter Passkey `DNOVA`.

---

## 🧪 Run Automated Tests
```bash
node test-quiz.js
```
