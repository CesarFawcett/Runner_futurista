/**
 * Runner Futurista - Core Engine
 * Estética Neón / Cyberpunk
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const coinsEl = document.getElementById('coins');
const highScoreEl = document.getElementById('high-score');
const startMenu = document.getElementById('start-menu');
const gameOverMenu = document.getElementById('game-over-menu');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const finalScoreEl = document.getElementById('final-score');
const finalCoinsEl = document.getElementById('final-coins');

// Constantes de Configuración
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const GROUND_Y_OFFSET = 50;
const INITIAL_GAME_SPEED = 4;

// Estado del Juego
let gameActive = false;
let gameSpeed = INITIAL_GAME_SPEED;
let score = 0;
let coins = 0;
let highScore = localStorage.getItem('neonRunnerHighScore') || 0;
let animationId;

// Entidades
let player;
let obstacles = [];
let collectibles = [];
let particles = [];
let stars = [];

// Clase Jugador
class Player {
    constructor() {
        this.width = 40;
        this.height = 40;
        this.x = 80;
        this.y = canvas.height - GROUND_Y_OFFSET - this.height;
        this.dy = 0;
        this.isJumping = false;
        this.energy = 0;
        this.maxEnergy = 3;
        this.color = '#00f2ff';
        this.trail = [];
    }

    draw() {
        // Dibujar Estela (Trail)
        this.trail.forEach((pos, index) => {
            ctx.globalAlpha = index / this.trail.length * 0.5;
            ctx.fillStyle = this.color;
            ctx.fillRect(pos.x, pos.y, this.width, this.height);
        });
        ctx.globalAlpha = 1;

        // Cuerpo del Jugador (Neon Square)
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Detalle interno
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x + 5, this.y + 5, this.width - 10, this.height - 10);
        ctx.shadowBlur = 0;
    }

    update() {
        // Aplicar movimiento primero
        this.y += this.dy;

        // Gravedad y colisión con el suelo
        if (this.y + this.height < canvas.height - GROUND_Y_OFFSET) {
            this.dy += GRAVITY;
            this.isJumping = true;
        } else {
            this.dy = 0;
            this.isJumping = false;
            this.y = canvas.height - GROUND_Y_OFFSET - this.height;
        }

        // Actualizar estela
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 5) this.trail.shift();
    }

    jump() {
        if (!this.isJumping) {
            this.dy = JUMP_FORCE;
            this.isJumping = true;
        } else if (this.energy > 0) {
            this.dy = JUMP_FORCE;
            this.energy--;
            updateEnergyUI();
            createJumpParticles(this.x + this.width/2, this.y + this.height);
        }
    }
}

// Clase Obstáculo
class Obstacle {
    constructor() {
        this.width = 30 + Math.random() * 40;
        this.height = 40 + Math.random() * 60;
        this.x = canvas.width;
        this.y = canvas.height - GROUND_Y_OFFSET - this.height;
        this.color = '#ff0055';
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Detalle neón
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
        ctx.shadowBlur = 0;
    }

    update() {
        this.x -= gameSpeed;
    }
}

// Clase Moneda
class Coin {
    constructor() {
        this.size = 15;
        this.x = canvas.width;
        this.y = (canvas.height - GROUND_Y_OFFSET - 100) - Math.random() * 150;
        this.color = '#ffd700';
        this.angle = 0;
    }

    draw() {
        this.angle += 0.1;
        const scaleX = Math.cos(this.angle);
        
        ctx.save();
        ctx.translate(this.x + this.size/2, this.y + this.size/2);
        ctx.scale(Math.abs(scaleX), 1);
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
        ctx.shadowBlur = 0;
    }

    update() {
        this.x -= gameSpeed;
    }
}

// Inicialización del Canvas
function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    highScoreEl.innerText = `HIGH: ${String(Math.floor(highScore)).padStart(4, '0')}`;
    updateEnergyUI();
}

function updateEnergyUI() {
    const slots = document.querySelectorAll('.energy-slot');
    slots.forEach((slot, index) => {
        if (index < player.energy) {
            slot.classList.add('filled');
        } else {
            slot.classList.remove('filled');
        }
    });
}

function createJumpParticles(x, y) {
    for(let i=0; i<8; i++) {
        particles.push({
            x: x,
            y: y,
            dx: (Math.random() - 0.5) * 4,
            dy: (Math.random() * 2),
            size: Math.random() * 3 + 1,
            life: 20,
            color: '#00f2ff'
        });
    }
}

// Generar Fondo (Estrellas)
function createStars() {
    stars = [];
    for(let i=0; i<100; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2,
            speed: Math.random() * 0.5 + 0.1
        });
    }
}

function drawBackground() {
    // Cielo
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#050510');
    gradient.addColorStop(1, '#101030');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Estrellas
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
        ctx.fillRect(star.x, star.y, star.size, star.size);
        star.x -= star.speed;
        if (star.x < 0) star.x = canvas.width;
    });

    // Suelo de Rejilla (Grid Floor)
    ctx.strokeStyle = 'rgba(112, 0, 255, 0.3)';
    ctx.lineWidth = 1;
    const groundY = canvas.height - GROUND_Y_OFFSET;
    
    // Línea de tierra
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.stroke();

    // Líneas de perspectiva (opcional para estilo 80s)
    for(let i=0; i<canvas.width; i+=40) {
        ctx.beginPath();
        ctx.moveTo(i, groundY);
        ctx.lineTo(i - 200, canvas.height);
        ctx.stroke();
    }
}

// Lógica de Spawning
let spawnTimer = 0;
function handleSpawning() {
    spawnTimer++;
    // Spawning Obstáculos
    if (spawnTimer % 100 === 0) {
        if (Math.random() > 0.3) {
            obstacles.push(new Obstacle());
        }
    }
    // Spawning Monedas
    if (spawnTimer % 60 === 0) {
        if (Math.random() > 0.5) {
            collectibles.push(new Coin());
        }
    }
}

// Bucle Principal
function gameLoop() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    player.update();
    player.draw();

    handleSpawning();

    // Procesar Obstáculos
    obstacles.forEach((obs, index) => {
        obs.update();
        obs.draw();

        // Colisión
        if (
            player.x < obs.x + obs.width &&
            player.x + player.width > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + player.height > obs.y
        ) {
            endGame();
        }

        // Eliminar fuera de pantalla
        if (obs.x + obs.width < 0) {
            obstacles.splice(index, 1);
        }
    });

    // Procesar Monedas
    collectibles.forEach((coin, index) => {
        coin.update();
        coin.draw();

        // Recolección
        const dist = Math.hypot(
            (player.x + player.width/2) - (coin.x + coin.size/2),
            (player.y + player.height/2) - (coin.y + coin.size/2)
        );

        if (dist < 30) {
            coins += 10;
            coinsEl.innerText = `COINS: ${coins}`;
            
            // Cargar energía de doble salto
            if (player.energy < player.maxEnergy) {
                player.energy++;
                updateEnergyUI();
            }

            collectibles.splice(index, 1);
            score += 50; 
        }

        if (coin.x + coin.size < 0) {
            collectibles.splice(index, 1);
        }
    });

    // Incrementar puntuación
    score += 1;
    
    // Escalar velocidad cada 1000 puntos
    const speedBoost = Math.floor(score / 1000) * 0.5;
    gameSpeed = INITIAL_GAME_SPEED + speedBoost;
    
    scoreEl.innerText = `SCORE: ${String(Math.floor(score)).padStart(4, '0')}`;

    // Procesar Partículas
    particles.forEach((p, index) => {
        p.x += p.dx;
        p.y += p.dy;
        p.life--;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 20;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        if (p.life <= 0) particles.splice(index, 1);
    });
    ctx.globalAlpha = 1;

    animationId = requestAnimationFrame(gameLoop);
}

// Controladores de Estado
function startGame() {
    gameActive = true;
    score = 0;
    coins = 0;
    gameSpeed = INITIAL_GAME_SPEED;
    obstacles = [];
    collectibles = [];
    particles = [];
    spawnTimer = 0; 
    player = new Player();
    
    startMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    
    scoreEl.innerText = 'SCORE: 0000';
    coinsEl.innerText = 'COINS: 0';
    
    createStars();
    gameLoop();
}

function endGame() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    
    finalScoreEl.innerText = Math.floor(score);
    finalCoinsEl.innerText = coins;
    gameOverMenu.classList.remove('hidden');

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('neonRunnerHighScore', highScore);
        highScoreEl.innerText = `HIGH: ${String(Math.floor(highScore)).padStart(4, '0')}`;
    }
}

// Eventos
window.addEventListener('resize', resize);
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (!gameActive && startMenu.classList.contains('hidden') === false) {
            startGame();
        } else if (gameActive) {
            player.jump();
        } else if (!gameActive && !gameOverMenu.classList.contains('hidden')) {
            startGame();
        }
    }
});

canvas.addEventListener('mousedown', () => {
    if (gameActive) player.jump();
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Inicio
resize();
createStars();
drawBackground();
