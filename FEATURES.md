# Wobbly Glass 3D - Feature Overview

## 3D Graphics Upgrade

### Visual Features
- **Three.js WebGL Rendering**: Fully 3D game environment
- **PBR Materials**: Physically-based rendering for realistic glass and water
- **Dynamic Lighting**:
  - Ambient light for overall illumination
  - Directional light with shadows
  - Pink point light for cute atmosphere
- **Soft Shadows**: PCF shadow mapping for smooth, realistic shadows
- **Atmospheric Fog**: Depth perception with distance fog
- **Transparent Glass**: Realistic glass material with transmission and thickness

### 3D Models
- **Wooden Tray**: Brown wooden serving tray with curved handles
- **Glass**: Cylindrical glass with transparent walls and bottom
- **Water**: Dynamic 3D water with realistic wobble physics
- **Characters**: Pink sphere (cat) and white sphere (bunny)
- **Table/Surface**: Long wooden table surface
- **Path Markers**: Green cone (start) and gold cone (goal)

## Obstacle System

### Obstacle Types
1. **Box Obstacles** (Pink cubes)
   - Size: 1x1.5x1 units
   - Color: #ff6b9d

2. **Sphere Obstacles** (Pink spheres)
   - Radius: 0.6 units
   - Color: #c44569

### Obstacle Mechanics
- **Random Generation**: Obstacles spawn randomly as boxes or spheres
- **Progressive Spawning**: New obstacles appear as you progress
- **Distance-Based Culling**: Old obstacles are removed after passing
- **Collision Detection**: Checks tray tilt when near obstacles
- **Penalty System**: -5% water for hitting obstacles while tilted
- **Dodge Tracking**: Counts successfully dodged obstacles

## Physics & Movement

### Water Physics
- **Scale Animation**: Water height scales based on remaining percentage
- **Wobble Effect**: Sine wave rotation based on tilt amount
- **Opacity Pulsing**: Visual feedback when spilling (tilt > 15°)
- **Position Adjustment**: Water stays centered in glass as it depletes

### Tray Physics
- **Dual Control**: Average of both players' tilt inputs
- **Rotation**: Z-axis rotation based on combined tilt
- **Forward Movement**: Moves along X-axis when balanced
- **Camera Follow**: Smooth camera tracking with offset

### Character Animation
- **Bounce Effect**: Gentle sine/cosine wave bounce
- **Phase Offset**: Characters bounce at different times
- **Attachment**: Characters attached to tray (move with it)

## Game Flow

### Screens
1. **Start Screen**: Create or join room options
2. **Waiting Screen**: Display room code, wait for player 2
3. **Ready Screen**: Both players ready, controls shown
4. **Gameplay**: Full 3D game with HUD overlay
5. **Game Over**: Win/lose screen with statistics

### HUD Elements
- Water Level: Real-time percentage
- Progress: Distance traveled (0-100%)
- Obstacles Dodged: Running count

## Technical Implementation

### Performance Optimizations
- **Efficient Rendering**: Only render when needed
- **Object Pooling**: Reuse obstacle geometries
- **Culling**: Remove off-screen obstacles
- **Smooth Animation**: RequestAnimationFrame loop
- **Delta Time**: Frame-rate independent physics

### Network Sync
- **Real-time Updates**: Socket.io for low-latency sync
- **State Broadcasting**: Server broadcasts to both players
- **Obstacle Sync**: Collision detected client-side, validated server-side
- **Score Tracking**: Server-authoritative obstacle counting

### Input Handling
- **Keyboard State**: Persistent key tracking
- **Smooth Control**: Gradual tilt increase/decrease
- **Auto-Center**: Tilt returns to neutral when keys released
- **Player Separation**: Different keys for each player

## Visual Effects

### Lighting Setup
- Base ambient: 60% white light
- Directional: 80% white light from top-right
- Accent: 50% pink point light from left

### Material Properties
- **Glass**: 30% opacity, 90% transmission, low roughness
- **Water**: 70% opacity, blue tint, slight metalness
- **Wood**: Tan color, 60-70% roughness
- **Obstacles**: Solid pink, standard roughness

### Shadow Configuration
- Shadow map size: Default
- Shadow camera bounds: 40x40 units
- Shadow type: PCF Soft Shadows
- Objects casting: Tray, glass, characters, obstacles
- Objects receiving: Table surface

## Game Balance

### Difficulty Curve
- Starting position: 10% (near start)
- Goal position: 90% (near end)
- Obstacle spawn: Every 4-7 units
- Max obstacles on screen: 5
- Water loss per frame (tilted): -2%
- Water loss per obstacle hit: -5%

### Win/Lose Conditions
- **Win**: Reach 90% progress with water > 0%
- **Lose**: Water reaches 0% at any point

## Future Enhancement Ideas

### Graphics
- Particle effects for water droplets
- Ripple shader for water surface
- Environment mapping for reflections
- Post-processing (bloom, SSAO)

### Gameplay
- Multiple difficulty levels
- Power-up pickups
- Moving obstacles
- Different liquid types (colors/physics)

### Features
- Replay system
- Ghost players (previous runs)
- Time trials
- Daily challenges
