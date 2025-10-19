// === SETUP CANVAS ===
const canvas = document.getElementById("gameCanvas");
const c = canvas.getContext("2d");

// Fungsi untuk set ukuran canvas penuh layar
function setCanvasSize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// Panggil sekali saat load awal
setCanvasSize();

// === KONSTANTA ===
const gravity = 0.7;

// === INISIALISASI SPRITE LATAR ===
const background = new Sprite({
  position: { x: 0, y: 0 },
  imageSrc: "./img/background.png",
});

const shop = new Sprite({
  position: { x: 600, y: 128 },
  imageSrc: "./img/shop.png",
  scale: 2.75,
  framesMax: 6,
});

// === PEMAIN (PLAYER 1) ===
const player = new Fighter({
  position: { x: canvas.width * 0.25, y: 0 },
  velocity: { x: 0, y: 0 },
  offset: { x: 0, y: 0 },
  imageSrc: "./img/samuraiMack/Idle.png",
  framesMax: 8,
  scale: 2.5,
  offset: { x: 215, y: 157 },
  sprites: {
    idle: { imageSrc: "./img/samuraiMack/Idle.png", framesMax: 8 },
    run: { imageSrc: "./img/samuraiMack/Run.png", framesMax: 8 },
    jump: { imageSrc: "./img/samuraiMack/Jump.png", framesMax: 2 },
    fall: { imageSrc: "./img/samuraiMack/Fall.png", framesMax: 2 },
    attack1: { imageSrc: "./img/samuraiMack/Attack1.png", framesMax: 6 },
    takeHit: {
      imageSrc: "./img/samuraiMack/Take Hit - white silhouette.png",
      framesMax: 4,
    },
    death: { imageSrc: "./img/samuraiMack/Death.png", framesMax: 6 },
  },
  attackBox: {
    offset: { x: 100, y: 50 },
    width: 160,
    height: 50,
  },
});

// === MUSUH (PLAYER 2) ===
const enemy = new Fighter({
  position: { x: canvas.width * 0.75, y: 0 },
  velocity: { x: 0, y: 0 },
  color: "blue",
  offset: { x: -50, y: 0 },
  imageSrc: "./img/kenji/Idle.png",
  framesMax: 4,
  scale: 2.5,
  offset: { x: 215, y: 167 },
  sprites: {
    idle: { imageSrc: "./img/kenji/Idle.png", framesMax: 4 },
    run: { imageSrc: "./img/kenji/Run.png", framesMax: 8 },
    jump: { imageSrc: "./img/kenji/Jump.png", framesMax: 2 },
    fall: { imageSrc: "./img/kenji/Fall.png", framesMax: 2 },
    attack1: { imageSrc: "./img/kenji/Attack1.png", framesMax: 4 },
    takeHit: { imageSrc: "./img/kenji/Take hit.png", framesMax: 3 },
    death: { imageSrc: "./img/kenji/Death.png", framesMax: 7 },
  },
  attackBox: {
    offset: { x: -170, y: 50 },
    width: 170,
    height: 50,
  },
});

// === POSISI RESPONSIVE ===
function updatePositions() {
  player.position.x = canvas.width * 0.25;
  player.position.y = canvas.height - 250;
  enemy.position.x = canvas.width * 0.75;
  enemy.position.y = canvas.height - 250;
  shop.position.x = canvas.width * 0.6;
}

// Panggil di awal
updatePositions();

// === EVENT RESIZE ===
function handleResize() {
  setCanvasSize();
  updatePositions();
}
window.addEventListener("resize", handleResize);

// === TIMER ===
decreaseTimer();

// === KEYBOARD STATE ===
const keys = {
  a: { pressed: false },
  d: { pressed: false },
  ArrowRight: { pressed: false },
  ArrowLeft: { pressed: false },
};

// === ANIMASI ===
function animate() {
  window.requestAnimationFrame(animate);

  // Latar belakang
  c.fillStyle = "black";
  c.fillRect(0, 0, canvas.width, canvas.height);

  // Gambar background agar menyesuaikan ukuran canvas
  c.drawImage(background.image, 0, 0, canvas.width, canvas.height);
  shop.update();

  // Layer kabut putih tipis
  c.fillStyle = "rgba(255, 255, 255, 0.15)";
  c.fillRect(0, 0, canvas.width, canvas.height);

  player.update();
  enemy.update();

  player.velocity.x = 0;
  enemy.velocity.x = 0;

  // Gerakan Player
  if (keys.a.pressed && player.lastKey === "a") {
    player.velocity.x = -5;
    player.switchSprite("run");
  } else if (keys.d.pressed && player.lastKey === "d") {
    player.velocity.x = 5;
    player.switchSprite("run");
  } else {
    player.switchSprite("idle");
  }

  if (player.velocity.y < 0) player.switchSprite("jump");
  else if (player.velocity.y > 0) player.switchSprite("fall");

  // Gerakan Enemy
  if (keys.ArrowLeft.pressed && enemy.lastKey === "ArrowLeft") {
    enemy.velocity.x = -5;
    enemy.switchSprite("run");
  } else if (keys.ArrowRight.pressed && enemy.lastKey === "ArrowRight") {
    enemy.velocity.x = 5;
    enemy.switchSprite("run");
  } else {
    enemy.switchSprite("idle");
  }

  if (enemy.velocity.y < 0) enemy.switchSprite("jump");
  else if (enemy.velocity.y > 0) enemy.switchSprite("fall");

  // Collision Detection
  if (
    rectangularCollision({ rectangle1: player, rectangle2: enemy }) &&
    player.isAttacking &&
    player.framesCurrent === 4
  ) {
    enemy.takeHit();
    player.isAttacking = false;
    gsap.to("#enemyHealth", { width: enemy.health + "%" });
  }

  if (player.isAttacking && player.framesCurrent === 4)
    player.isAttacking = false;

  if (
    rectangularCollision({ rectangle1: enemy, rectangle2: player }) &&
    enemy.isAttacking &&
    enemy.framesCurrent === 2
  ) {
    player.takeHit();
    enemy.isAttacking = false;
    gsap.to("#playerHealth", { width: player.health + "%" });
  }

  if (enemy.isAttacking && enemy.framesCurrent === 2) enemy.isAttacking = false;

  if (enemy.health <= 0 || player.health <= 0) {
    determineWinner({ player, enemy, timerId });
  }
}

animate();

// === KEYBOARD CONTROL ===
window.addEventListener("keydown", (event) => {
  if (!player.dead) {
    switch (event.key) {
      case "d":
        keys.d.pressed = true;
        player.lastKey = "d";
        break;
      case "a":
        keys.a.pressed = true;
        player.lastKey = "a";
        break;
      case "w":
        player.velocity.y = -20;
        break;
      case " ":
        player.attack();
        break;
    }
  }

  if (!enemy.dead) {
    switch (event.key) {
      case "ArrowRight":
        keys.ArrowRight.pressed = true;
        enemy.lastKey = "ArrowRight";
        break;
      case "ArrowLeft":
        keys.ArrowLeft.pressed = true;
        enemy.lastKey = "ArrowLeft";
        break;
      case "ArrowUp":
        enemy.velocity.y = -20;
        break;
      case "Control":
        enemy.attack();
        break;
    }
  }
});

window.addEventListener("keyup", (event) => {
  switch (event.key) {
    case "d":
      keys.d.pressed = false;
      break;
    case "a":
      keys.a.pressed = false;
      break;
    case "ArrowRight":
      keys.ArrowRight.pressed = false;
      break;
    case "ArrowLeft":
      keys.ArrowLeft.pressed = false;
      break;
  }
});
