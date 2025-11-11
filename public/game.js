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

  // Glass - Premium looking with better reflections
  const glassGroup = new THREE.Group();

  const glassGeometry = new THREE.CylinderGeometry(0.45, 0.4, 1.8, 32, 1, true);
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xe8f4ff,
    transparent: true,
    opacity: 0.15,
    roughness: 0.05,
    metalness: 0.0,
    transmission: 0.98,
    thickness: 1.0,
    envMapIntensity: 1.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    ior: 1.5
  });
  const glassMesh = new THREE.Mesh(glassGeometry, glassMaterial);
  glassMesh.castShadow = true;
  glassMesh.receiveShadow = true;
  glassGroup.add(glassMesh);

  // Glass rim (thicker top edge)
  const rimGeometry = new THREE.TorusGeometry(0.45, 0.04, 16, 32);
  const rimMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xd0e8ff,
    transparent: true,
    opacity: 0.4,
    roughness: 0.1,
    metalness: 0.2
  });
  const rim = new THREE.Mesh(rimGeometry, rimMaterial);
  rim.position.y = 0.9;
  glassGroup.add(rim);

  // Glass bottom
  const bottomGeometry = new THREE.CircleGeometry(0.4, 32);
  const bottomMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xe8f4ff,
    transparent: true,
    opacity: 0.3,
    roughness: 0.1,
    metalness: 0.1
  });
  const bottom = new THREE.Mesh(bottomGeometry, bottomMaterial);
  bottom.rotation.x = -Math.PI / 2;
  bottom.position.y = -0.9;
  glassGroup.add(bottom);

  // Sparkle effect on glass edge
  const sparkleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
  const sparkleMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.8
  });
  const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial);
  sparkle.position.set(0.4, 0.6, 0);
  glassGroup.add(sparkle);

  glass = glassGroup;
  glass.position.set(0, 1.1, 0);
  tray.add(glass);

  // Water - More vibrant and dynamic
  const waterGeometry = new THREE.CylinderGeometry(0.43, 0.38, 1.7, 32);
  const waterMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x3dbbff,
    transparent: true,
    opacity: 0.8,
    roughness: 0.1,
    metalness: 0.2,
    envMapIntensity: 1.0,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2
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
  // Create cute worker-style characters

  // Player 1 (Cat worker) - Left side
  const catGroup = new THREE.Group();

  // Body (using cylinder instead of capsule for compatibility)
  const catBodyGeom = new THREE.CylinderGeometry(0.25, 0.25, 0.5, 16);
  const catBodyMat = new THREE.MeshStandardMaterial({ color: 0xff6b9d, roughness: 0.7 });
  const catBody = new THREE.Mesh(catBodyGeom, catBodyMat);
  catBody.castShadow = true;
  catGroup.add(catBody);

  // Head
  const catHeadGeom = new THREE.SphereGeometry(0.22, 16, 16);
  const catHeadMat = new THREE.MeshStandardMaterial({ color: 0xffc0cb, roughness: 0.6 });
  const catHead = new THREE.Mesh(catHeadGeom, catHeadMat);
  catHead.position.y = 0.5;
  catHead.castShadow = true;
  catGroup.add(catHead);

  // Cat ears
  const earGeom = new THREE.ConeGeometry(0.1, 0.2, 8);
  const earMat = new THREE.MeshStandardMaterial({ color: 0xff9ab8 });
  const earLeft = new THREE.Mesh(earGeom, earMat);
  earLeft.position.set(-0.12, 0.65, 0);
  earLeft.rotation.z = -0.3;
  catGroup.add(earLeft);

  const earRight = new THREE.Mesh(earGeom, earMat);
  earRight.position.set(0.12, 0.65, 0);
  earRight.rotation.z = 0.3;
  catGroup.add(earRight);

  // Hard hat (safety first!)
  const hatGeom = new THREE.CylinderGeometry(0.25, 0.28, 0.15, 16);
  const hatMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.4, metalness: 0.3 });
  const hat = new THREE.Mesh(hatGeom, hatMat);
  hat.position.y = 0.7;
  catGroup.add(hat);

  const hatTopGeom = new THREE.SphereGeometry(0.25, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const hatTop = new THREE.Mesh(hatTopGeom, hatMat);
  hatTop.position.y = 0.78;
  catGroup.add(hatTop);

  // Arms (using cylinder for compatibility)
  const armGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8);
  const armMat = new THREE.MeshStandardMaterial({ color: 0xff6b9d });
  const armLeft = new THREE.Mesh(armGeom, armMat);
  armLeft.position.set(-0.35, 0.1, 0);
  armLeft.rotation.z = 0.5;
  armLeft.castShadow = true;
  catGroup.add(armLeft);

  const armRight = new THREE.Mesh(armGeom, armMat);
  armRight.position.set(0.35, 0.1, 0);
  armRight.rotation.z = -0.5;
  armRight.castShadow = true;
  catGroup.add(armRight);

  characters.left = catGroup;
  characters.left.position.set(-1.8, 0.6, 0);
  tray.add(characters.left);

  // Player 2 (Bunny worker) - Right side
  const bunnyGroup = new THREE.Group();

  // Body (using cylinder for compatibility)
  const bunnyBodyGeom = new THREE.CylinderGeometry(0.25, 0.25, 0.5, 16);
  const bunnyBodyMat = new THREE.MeshStandardMaterial({ color: 0x87ceeb, roughness: 0.7 });
  const bunnyBody = new THREE.Mesh(bunnyBodyGeom, bunnyBodyMat);
  bunnyBody.castShadow = true;
  bunnyGroup.add(bunnyBody);

  // Head
  const bunnyHeadGeom = new THREE.SphereGeometry(0.22, 16, 16);
  const bunnyHeadMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
  const bunnyHead = new THREE.Mesh(bunnyHeadGeom, bunnyHeadMat);
  bunnyHead.position.y = 0.5;
  bunnyHead.castShadow = true;
  bunnyGroup.add(bunnyHead);

  // Bunny ears (long! using cylinder for compatibility)
  const bunnyEarGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.35, 8);
  const bunnyEarMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 });
  const bunnyEarLeft = new THREE.Mesh(bunnyEarGeom, bunnyEarMat);
  bunnyEarLeft.position.set(-0.1, 0.75, 0);
  bunnyEarLeft.rotation.z = -0.2;
  bunnyGroup.add(bunnyEarLeft);

  const bunnyEarRight = new THREE.Mesh(bunnyEarGeom, bunnyEarMat);
  bunnyEarRight.position.set(0.1, 0.75, 0);
  bunnyEarRight.rotation.z = 0.2;
  bunnyGroup.add(bunnyEarRight);

  // Hard hat
  const bunnyHatGeom = new THREE.CylinderGeometry(0.25, 0.28, 0.15, 16);
  const bunnyHatMat = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.4, metalness: 0.3 });
  const bunnyHat = new THREE.Mesh(bunnyHatGeom, bunnyHatMat);
  bunnyHat.position.y = 0.7;
  bunnyGroup.add(bunnyHat);

  const bunnyHatTopGeom = new THREE.SphereGeometry(0.25, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const bunnyHatTop = new THREE.Mesh(bunnyHatTopGeom, bunnyHatMat);
  bunnyHatTop.position.y = 0.78;
  bunnyGroup.add(bunnyHatTop);

  // Arms
  const bunnyArmLeft = new THREE.Mesh(armGeom, new THREE.MeshStandardMaterial({ color: 0x87ceeb }));
  bunnyArmLeft.position.set(-0.35, 0.1, 0);
  bunnyArmLeft.rotation.z = 0.5;
  bunnyArmLeft.castShadow = true;
  bunnyGroup.add(bunnyArmLeft);

  const bunnyArmRight = new THREE.Mesh(armGeom, new THREE.MeshStandardMaterial({ color: 0x87ceeb }));
  bunnyArmRight.position.set(0.35, 0.1, 0);
  bunnyArmRight.rotation.z = -0.5;
  bunnyArmRight.castShadow = true;
  bunnyGroup.add(bunnyArmRight);

  characters.right = bunnyGroup;
  characters.right.position.set(1.8, 0.6, 0);
  tray.add(characters.right);
}

function createObstacle(zPos) {
  const obstacleGroup = new THREE.Group();

  // Random obstacle type - platformer style!
  const rand = Math.random();
  let obstacleType;

  if (rand < 0.3) {
    obstacleType = 'crate'; // Wooden crate
  } else if (rand < 0.6) {
    obstacleType = 'barrel'; // Construction barrel
  } else if (rand < 0.8) {
    obstacleType = 'cone'; // Traffic cone
  } else {
    obstacleType = 'sign'; // Warning sign
  }

  if (obstacleType === 'crate') {
    // Wooden crate with stripes
    const crateGeom = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const crateMat = new THREE.MeshStandardMaterial({
      color: 0xd2691e,
      roughness: 0.9,
      metalness: 0.1
    });
    const crate = new THREE.Mesh(crateGeom, crateMat);
    crate.castShadow = true;

    // Stripes on crate
    const stripeGeom = new THREE.BoxGeometry(0.85, 0.15, 0.85);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const stripe1 = new THREE.Mesh(stripeGeom, stripeMat);
    stripe1.position.y = 0.25;
    crate.add(stripe1);

    const stripe2 = new THREE.Mesh(stripeGeom, stripeMat);
    stripe2.position.y = -0.25;
    crate.add(stripe2);

    crate.position.y = -0.8;
    crate.rotation.y = Math.random() * Math.PI;
    obstacleGroup.add(crate);

  } else if (obstacleType === 'barrel') {
    // Orange construction barrel
    const barrelGeom = new THREE.CylinderGeometry(0.35, 0.4, 1.2, 16);
    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      roughness: 0.7,
      metalness: 0.2
    });
    const barrel = new THREE.Mesh(barrelGeom, barrelMat);
    barrel.castShadow = true;

    // White stripes
    const stripeGeom = new THREE.CylinderGeometry(0.36, 0.41, 0.15, 16);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const stripe1 = new THREE.Mesh(stripeGeom, stripeMat);
    stripe1.position.y = 0.3;
    barrel.add(stripe1);

    const stripe2 = new THREE.Mesh(stripeGeom, stripeMat);
    stripe2.position.y = -0.3;
    barrel.add(stripe2);

    barrel.position.y = -0.8;
    obstacleGroup.add(barrel);

  } else if (obstacleType === 'cone') {
    // Traffic cone
    const coneGeom = new THREE.ConeGeometry(0.4, 1.0, 16);
    const coneMat = new THREE.MeshStandardMaterial({
      color: 0xff4500,
      roughness: 0.6
    });
    const cone = new THREE.Mesh(coneGeom, coneMat);
    cone.castShadow = true;

    // White stripes
    const stripeGeom = new THREE.ConeGeometry(0.41, 0.12, 16);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const stripe1 = new THREE.Mesh(stripeGeom, stripeMat);
    stripe1.position.y = 0.25;
    cone.add(stripe1);

    const stripe2 = new THREE.Mesh(stripeGeom, stripeMat);
    stripe2.position.y = -0.15;
    cone.add(stripe2);

    // Base
    const baseGeom = new THREE.CylinderGeometry(0.45, 0.45, 0.1, 16);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = -0.55;
    cone.add(base);

    cone.position.y = -0.9;
    obstacleGroup.add(cone);

  } else { // sign
    // Warning sign
    const poleGeom = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.y = -0.8;
    pole.castShadow = true;
    obstacleGroup.add(pole);

    // Sign board (diamond shape)
    const signGeom = new THREE.BoxGeometry(0.7, 0.7, 0.05);
    const signMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      roughness: 0.3,
      metalness: 0.4
    });
    const sign = new THREE.Mesh(signGeom, signMat);
    sign.rotation.z = Math.PI / 4; // Diamond rotation
    sign.position.y = -0.3;
    sign.castShadow = true;

    // Warning symbol (exclamation mark - using cylinder for compatibility)
    const warningGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.3, 8);
    const warningMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const warningMark = new THREE.Mesh(warningGeom, warningMat);
    warningMark.position.y = 0.05;
    warningMark.position.z = 0.03;
    sign.add(warningMark);

    const dotGeom = new THREE.SphereGeometry(0.06, 8, 8);
    const dot = new THREE.Mesh(dotGeom, warningMat);
    dot.position.y = -0.25;
    dot.position.z = 0.03;
    sign.add(dot);

    obstacleGroup.add(sign);
  }

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
  characters.left.position.y = 0.6 + Math.sin(waterWobble * 2) * 0.05;
  characters.right.position.y = 0.6 + Math.cos(waterWobble * 2) * 0.05;

  // Glass sparkle animation
  const sparkleChild = glass.children.find(child => child.material && child.material.type === 'MeshBasicMaterial');
  if (sparkleChild) {
    sparkleChild.material.opacity = 0.6 + Math.sin(waterWobble * 3) * 0.3;
    sparkleChild.position.x = 0.4 * Math.cos(waterWobble * 0.5);
    sparkleChild.position.z = 0.4 * Math.sin(waterWobble * 0.5);
  }

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
