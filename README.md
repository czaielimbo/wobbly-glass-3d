# Wobbly Glass 3D

A cute cooperative 3D balance game for 2 players where you work together to carry a glass of water through obstacles without spilling!

## Game Overview

Two players must coordinate to tilt a tray and carry a glass across a 3D path. Each player controls one side - communication, balance, and obstacle avoidance are essential!

**Features:**
- **Stunning 3D Graphics**: Built with Three.js featuring realistic lighting and shadows
- **Dynamic Obstacles**: Dodge randomly generated obstacles as you progress
- **Real-time Multiplayer**: Using WebSockets (no database required!)
- **Physics-Based Water**: Realistic wobble and spill mechanics in 3D
- **Simple Matchmaking**: Room code system for easy friend connections
- **Progressive Difficulty**: More obstacles appear as you advance
- **Score Tracking**: Track obstacles dodged and water remaining

## How to Play

1. **Create or Join a Room**
   - Player 1 clicks "Create Room" and shares the 4-letter code
   - Player 2 clicks "Join Room" and enters the code

2. **Controls**
   - **Player 1 (Cat)**: Use `A` and `D` keys to tilt left/right
   - **Player 2 (Bunny)**: Use `←` and `→` arrow keys to tilt left/right

3. **Objective**
   - Work together to balance the tray in 3D space
   - Keep the glass from tilting too much (> 15 degrees = water spills!)
   - **Dodge obstacles** by keeping the tray level when passing them
   - Reach the goal line with water remaining to win
   - **Bonus**: Track how many obstacles you successfully dodge!

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm

### Install Dependencies

```bash
npm install
```

### Run the Server

```bash
npm start
```

The game will be available at `http://localhost:3002`

### For Local Multiplayer Testing

1. Start the server
2. Open `http://localhost:3002` in two browser windows (or tabs)
3. Create a room in one window, join with the code in the other
4. Click "Start Game" and work together to carry the glass!

## Tech Stack

- **Backend**: Node.js + Express + Socket.io
- **Frontend**: Three.js (WebGL 3D Graphics)
- **Styling**: CSS3 with modern UI design
- **Communication**: WebSocket (real-time, in-memory only)
- **Graphics**: PBR materials, dynamic lighting, shadows

## Game Mechanics

- **Tilt Calculation**: The tray angle is the average of both players' inputs
- **Spill Logic**: Water decreases when tray angle exceeds 15 degrees
- **Movement**: The glass moves forward when the tray is balanced (< 10 degrees tilt)
- **Obstacles**: Random boxes and spheres spawn along the path
- **Obstacle Collision**: Hitting obstacles while tilted causes extra water loss (-5%)
- **Obstacle Dodging**: Keep tray level to successfully pass obstacles
- **Camera Follow**: Dynamic camera tracks the tray's progress
- **Win Condition**: Reach 90% progress with water remaining
- **Lose Condition**: Water level reaches 0%

## Project Structure

```
glass/
├── server.js           # Express + Socket.io server with obstacle logic
├── package.json        # Dependencies and scripts
├── public/
│   ├── index.html     # Main HTML structure
│   ├── style.css      # Modern UI styling
│   └── game.js        # Three.js 3D engine + Socket.io client
└── README.md          # This file
```

## Deployment

This game can be easily deployed to platforms like:
- **Vercel** (recommended for Node.js apps)
- **Heroku**
- **Railway**
- **Render**

No database configuration needed - all game state is stored in memory!

## Future Ideas

- Multiple 3D environments (kitchen, picnic table, beach boardwalk)
- Power-ups (slow-mo, water refill, shield)
- Leaderboard for fastest completion and most obstacles dodged
- Single-player mode with AI partner
- Different beverages with particle effects (milk tea, lemonade, soda)
- Sound effects and ambient background music
- Mobile controls (gyroscope tilt)
- Replay system to watch your best runs

## Credits

Created as a fun cooperative game experiment. Feel free to customize and extend!

## License

ISC
