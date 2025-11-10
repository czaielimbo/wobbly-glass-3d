// Socket.io connection
const socket = io();

// Game state
let roomCode = null;
let playerNumber = null;
let gameState = {
  trayAngle: 0,
  waterLevel: 100,
  position: 10,
  isPlaying: false,
  obstacles: [],
  obstaclesDodged: 0
};

// Input state
let myTilt = 0;
const TILT_SPEED = 0.5;
const MAX_TILT = 20;

// Three.js variables
let scene, camera, renderer;
let tray, glass, water, table;
let characters = { left: null, right: null };
let obstaclesGroup = [];
let waterWobble = 0;
let clock;

// UI Elements
const startScreen = document.getElementById('start-screen');
const waitingScreen = document.getElementById('waiting-screen');
const readyScreen = document.getElementById('ready-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const gameHud = document.getElementById('game-hud');
const roomCodeDisplay = document.getElementById('room-code-display');

// Button event listeners
document.getElementById('create-room-btn').addEventListener('click', () => {
  socket.emit('createRoom');
});

document.getElementById('join-room-btn').addEventListener('click', () => {
  document.getElementById('join-input').style.display = 'flex';
});

document.getElementById('join-submit-btn').addEventListener('click', () => {
  const code = document.getElementById('room-code-input').value.trim().toUpperCase();
  if (code.length === 4) {
    socket.emit('joinRoom', code);
  }
});

document.getElementById('start-game-btn').addEventListener('click', () => {
  socket.emit('startGame', roomCode);
});

document.getElementById('play-again-btn').addEventListener('click', () => {
  location.reload();
});

// Socket event handlers
socket.on('roomCreated', (data) => {
  roomCode = data.roomCode;
  playerNumber = data.playerNumber;
  roomCodeDisplay.textContent = roomCode;
  showScreen(waitingScreen);
});

socket.on('roomJoined', (data) => {
  roomCode = data.roomCode;
  playerNumber = data.playerNumber;
  showScreen(readyScreen);
});

socket.on('bothPlayersReady', () => {
  showScreen(readyScreen);
});

socket.on('gameStarted', (state) => {
  gameState = state;
  hideAllScreens();
  gameHud.style.display = 'flex';
});

socket.on('updateGame', (state) => {
  gameState = state;
  updateHUD();
});

socket.on('gameOver', (result) => {
  gameHud.style.display = 'none';
  const title = document.getElementById('result-title');
  const message = document.getElementById('result-message');

  if (result.winner) {
    title.textContent = '🎉 Success! 🎉';
    title.className = 'win';
    message.textContent = `You made it with ${Math.round(result.waterLevel)}% water and dodged ${result.obstaclesDodged} obstacles!`;
  } else {
    title.textContent = '💧 Oh no! You spilled! 💧';
    title.className = 'lose';
    message.textContent = 'Try to work together and balance better next time!';
  }

  showScreen(gameoverScreen);
});

socket.on('playerLeft', () => {
  alert('Other player disconnected 😢');
  location.reload();
});

socket.on('error', (msg) => {
  alert(msg);
});

// Helper functions
function showScreen(screen) {
  hideAllScreens();
  screen.classList.add('active');
}

function hideAllScreens() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
}

function updateHUD() {
  document.getElementById('water-level').textContent = Math.round(gameState.waterLevel);
  document.getElementById('progress').textContent = Math.round(gameState.position);
  document.getElementById('obstacles-dodged').textContent = gameState.obstaclesDodged || 0;
}

// ===== THREE.JS 3D GAME =====

function init() {
  clock = new THREE.Clock();

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffeef8);
  scene.fog = new THREE.Fog(0xe0c3fc, 10, 50);

  // Camera
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 8, 15);
  camera.lookAt(0, 0, 0);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById('game-container').appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 5);
  dirLight.castShadow = true;
  dirLight.shadow.camera.left = -20;
  dirLight.shadow.camera.right = 20;
  dirLight.shadow.camera.top = 20;
  dirLight.shadow.camera.bottom = -20;
  scene.add(dirLight);

  const pointLight = new THREE.PointLight(0xff9ad5, 0.5, 50);
  pointLight.position.set(-5, 5, 5);
  scene.add(pointLight);

  // Table/Ground
  const tableGeometry = new THREE.BoxGeometry(40, 0.5, 8);
  const tableMaterial = new THREE.MeshStandardMaterial({
    color: 0xd2b48c,
    roughness: 0.7,
    metalness: 0.1
  });
  table = new THREE.Mesh(tableGeometry, tableMaterial);
  table.position.y = -2;
  table.receiveShadow = true;
  scene.add(table);

  // Path markers
  createPathMarkers();

  // Tray
  const trayGroup = new THREE.Group();
  const trayGeometry = new THREE.BoxGeometry(3, 0.15, 1.5);
  const trayMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b5a3c,
    roughness: 0.6
  });
  const trayMesh = new THREE.Mesh(trayGeometry, trayMaterial);
  trayMesh.castShadow = true;
  trayGroup.add(trayMesh);

  // Tray handles
  const handleGeometry = new THREE.TorusGeometry(0.2, 0.05, 8, 16, Math.PI);
  const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
  const handleLeft = new THREE.Mesh(handleGeometry, handleMaterial);
  handleLeft.position.set(-1.6, 0, 0);
  handleLeft.rotation.z = Math.PI / 2;
  trayGroup.add(handleLeft);

  const handleRight = new THREE.Mesh(handleGeometry, handleMaterial);
  handleRight.position.set(1.6, 0, 0);
  handleRight.rotation.z = -Math.PI / 2;
  trayGroup.add(handleRight);

  tray = trayGroup;
  tray.position.y = 0;
  scene.add(tray);

  // Glass
  const glassGroup = new THREE.Group();

  const glassGeometry = new THREE.CylinderGeometry(0.4, 0.35, 1.5, 16, 1, true);
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xc8e6ff,
    transparent: true,
    opacity: 0.3,
    roughness: 0.1,
    metalness: 0.1,
    transmission: 0.9,
    thickness: 0.5
  });
  const glassMesh = new THREE.Mesh(glassGeometry, glassMaterial);
  glassMesh.castShadow = true;
  glassGroup.add(glassMesh);

  // Glass bottom
  const bottomGeometry = new THREE.CircleGeometry(0.35, 16);
  const bottomMaterial = new THREE.MeshStandardMaterial({
    color: 0xc8e6ff,
    transparent: true,
    opacity: 0.5
  });
  const bottom = new THREE.Mesh(bottomGeometry, bottomMaterial);
  bottom.rotation.x = -Math.PI / 2;
  bottom.position.y = -0.75;
  glassGroup.add(bottom);

  glass = glassGroup;
  glass.position.set(0, 1, 0);
  tray.add(glass);

  // Water
  const waterGeometry = new THREE.CylinderGeometry(0.38, 0.33, 1.4, 16);
  const waterMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x64c8ff,
    transparent: true,
    opacity: 0.7,
    roughness: 0.2,
    metalness: 0.1
  });
  water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.position.y = 0;
  glass.add(water);

  // Characters (emoji as sprites)
  createCharacters();

  // Window resize handler
  window.addEventListener('resize', onWindowResize, false);

  // Start animation loop
  animate();
}

function createPathMarkers() {
  // Start marker
  const startGeometry = new THREE.ConeGeometry(0.3, 0.6, 4);
  const startMaterial = new THREE.MeshStandardMaterial({ color: 0x96dc82 });
  const startMarker = new THREE.Mesh(startGeometry, startMaterial);
  startMarker.position.set(-15, -1.5, 0);
  startMarker.castShadow = true;
  scene.add(startMarker);

  // Goal marker
  const goalGeometry = new THREE.ConeGeometry(0.3, 0.6, 4);
  const goalMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 });
  const goalMarker = new THREE.Mesh(goalGeometry, goalMaterial);
  goalMarker.position.set(15, -1.5, 0);
  goalMarker.castShadow = true;
  scene.add(goalMarker);

  // Path line
  const points = [];
  points.push(new THREE.Vector3(-15, -1.7, 0));
  points.push(new THREE.Vector3(15, -1.7, 0));
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xc8c8dc, linewidth: 2 });
  const line = new THREE.Line(lineGeometry, lineMaterial);
  scene.add(line);
}

function createCharacters() {
  // Create simple 3D character representations
  const charGeometry = new THREE.SphereGeometry(0.3, 16, 16);

  // Cat (left) - pink
  const catMaterial = new THREE.MeshStandardMaterial({ color: 0xffc0cb });
  characters.left = new THREE.Mesh(charGeometry, catMaterial);
  characters.left.castShadow = true;
  characters.left.position.set(-2, 0.5, 0);
  tray.add(characters.left);

  // Bunny (right) - white
  const bunnyMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  characters.right = new THREE.Mesh(charGeometry, bunnyMaterial);
  characters.right.castShadow = true;
  characters.right.position.set(2, 0.5, 0);
  tray.add(characters.right);
}

function createObstacle(zPos) {
  const obstacleGroup = new THREE.Group();

  // Random obstacle type
  const type = Math.random() > 0.5 ? 'box' : 'sphere';
  let obstacleMesh;

  if (type === 'box') {
    const geometry = new THREE.BoxGeometry(1, 1.5, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff6b9d });
    obstacleMesh = new THREE.Mesh(geometry, material);
  } else {
    const geometry = new THREE.SphereGeometry(0.6, 16, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0xc44569 });
    obstacleMesh = new THREE.Mesh(geometry, material);
  }

  obstacleMesh.castShadow = true;
  obstacleMesh.position.y = -1;
  obstacleGroup.add(obstacleMesh);

  obstacleGroup.position.z = zPos;
  obstacleGroup.userData.passed = false;

  scene.add(obstacleGroup);
  obstaclesGroup.push(obstacleGroup);

  return obstacleGroup;
}

function updateObstacles() {
  if (!gameState.isPlaying) return;

  // Create obstacles ahead
  const trayZ = mapRange(gameState.position, 0, 100, -15, 15);

  if (obstaclesGroup.length < 5) {
    const furthestZ = obstaclesGroup.length > 0
      ? Math.max(...obstaclesGroup.map(o => o.position.z))
      : trayZ + 5;

    if (furthestZ < 20) {
      createObstacle(furthestZ + Math.random() * 3 + 4);
    }
  }

  // Remove passed obstacles
  obstaclesGroup = obstaclesGroup.filter(obstacle => {
    if (obstacle.position.z < trayZ - 3) {
      scene.remove(obstacle);
      return false;
    }

    // Check if obstacle was dodged (passed without collision)
    if (!obstacle.userData.passed && obstacle.position.z < trayZ - 1) {
      obstacle.userData.passed = true;
      // This will be counted on server side
    }

    return true;
  });

  // Check collision with obstacles
  obstaclesGroup.forEach(obstacle => {
    const distance = Math.abs(obstacle.position.z - trayZ);
    if (distance < 1.5) {
      // Check if tray is tilted and might hit obstacle
      if (Math.abs(gameState.trayAngle) > 10) {
        // Collision! Spill more water
        socket.emit('obstacleHit', { roomCode });
      }
    }
  });
}

function animate() {
  requestAnimationFrame(animate);

  if (!gameState.isPlaying) {
    renderer.render(scene, camera);
    return;
  }

  const delta = clock.getDelta();
  waterWobble += delta * 2;

  // Update tray position and rotation
  const xPos = mapRange(gameState.position, 0, 100, -15, 15);
  tray.position.x = xPos;
  tray.rotation.z = THREE.MathUtils.degToRad(gameState.trayAngle);

  // Update water level and wobble
  const waterHeight = mapRange(gameState.waterLevel, 0, 100, 0.1, 1.4);
  water.scale.y = waterHeight;
  water.position.y = (waterHeight - 1.4) / 2;

  // Water wobble effect based on tilt
  const wobbleAmount = Math.abs(gameState.trayAngle) * 0.01;
  water.rotation.z = Math.sin(waterWobble) * wobbleAmount;

  // Spill particles when tilting heavily
  if (Math.abs(gameState.trayAngle) > 15) {
    // Visual feedback for spilling
    water.material.opacity = 0.5 + Math.sin(waterWobble * 5) * 0.2;
  } else {
    water.material.opacity = 0.7;
  }

  // Character bounce animation
  characters.left.position.y = 0.5 + Math.sin(waterWobble * 2) * 0.05;
  characters.right.position.y = 0.5 + Math.cos(waterWobble * 2) * 0.05;

  // Update obstacles
  updateObstacles();

  // Handle input
  handleInput();

  // Send tilt to server
  socket.emit('tilt', { roomCode, value: myTilt });

  // Camera follow
  camera.position.x = xPos * 0.3;
  camera.lookAt(xPos, 0, 0);

  renderer.render(scene, camera);
}

function handleInput() {
  if (playerNumber === 1) {
    // Player 1: A/D keys
    if (isKeyPressed('a') || isKeyPressed('A')) {
      myTilt = Math.max(myTilt - TILT_SPEED, -MAX_TILT);
    } else if (isKeyPressed('d') || isKeyPressed('D')) {
      myTilt = Math.min(myTilt + TILT_SPEED, MAX_TILT);
    } else {
      myTilt *= 0.9;
      if (Math.abs(myTilt) < 0.1) myTilt = 0;
    }
  } else if (playerNumber === 2) {
    // Player 2: Arrow keys
    if (isKeyPressed('ArrowLeft')) {
      myTilt = Math.max(myTilt - TILT_SPEED, -MAX_TILT);
    } else if (isKeyPressed('ArrowRight')) {
      myTilt = Math.min(myTilt + TILT_SPEED, MAX_TILT);
    } else {
      myTilt *= 0.9;
      if (Math.abs(myTilt) < 0.1) myTilt = 0;
    }
  }
}

// Keyboard handling
const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

function isKeyPressed(key) {
  return keys[key] === true;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function mapRange(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

// Initialize Three.js scene
init();
