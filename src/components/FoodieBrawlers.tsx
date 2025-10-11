import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type CharacterType = 'boba' | 'coffee' | 'juice';
type GameMode = 'solos' | 'teams';
type Difficulty = 'easy' | 'medium' | 'hard';
type MapType = 'classic' | 'pillars' | 'open';

const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;
const PLAYER_SIZE = 30;
const PLAYER_SPEED = 3.5;
const DASH_SPEED = 18;
const DASH_DURATION = 120;
const BOOMERANG_SIZE = 25;
const BOOMERANG_SPEED = 7;
const BOOMERANG_RANGE = 250;
const MELEE_RANGE = 45;
const MELEE_DURATION = 150;
const MELEE_COOLDOWN = 400;
const WIN_SCORE = 3;
const CHARACTER_TYPES: CharacterType[] = ['boba', 'coffee', 'juice'];

const MAPS = {
  classic: [
    {x: 200, y: 150, w: 150, h: 40}, {x: 1280 - 350, y: 150, w: 150, h: 40},
    {x: 200, y: 720 - 190, w: 150, h: 40}, {x: 1280 - 350, y: 720 - 190, w: 150, h: 40},
    {x: 1280 / 2 - 100, y: 720 / 2 - 20, w: 200, h: 40},
    {x: 500, y: 300, w: 40, h: 120}, {x: 1280 - 540, y: 300, w: 40, h: 120},
  ],
  pillars: [
    {x: 250, y: 200, w: 50, h: 50}, {x: 1280 - 300, y: 200, w: 50, h: 50},
    {x: 250, y: 720 - 250, w: 50, h: 50}, {x: 1280 - 300, y: 720 - 250, w: 50, h: 50},
    {x: 615, y: 150, w: 50, h: 150}, {x: 615, y: 720 - 300, w: 50, h: 150},
  ],
  open: []
};

const SPAWN_POINTS = [
  {x: 150, y: 150},
  {x: BASE_WIDTH - 150, y: BASE_HEIGHT - 150},
  {x: 150, y: BASE_HEIGHT - 150},
  {x: BASE_WIDTH - 150, y: 150}
];

interface PlayerInfo {
  name: string;
  color: string;
  character: CharacterType;
  isBot: boolean;
  team: number;
}

interface Player {
  x: number;
  y: number;
  name: string;
  isBot: boolean;
  characterType: CharacterType;
  width: number;
  height: number;
  color: string;
  controls: any;
  boomerangCount: number;
  isDashing: boolean;
  dashTimer: number;
  dx: number;
  dy: number;
  stunTimer: number;
  lastMoveDir: {x: number, y: number};
  lastAimDir: {x: number, y: number};
  team: number;
  playerNumber: number;
  isEliminated: boolean;
  isHitting: boolean;
  hitTimer: number;
  botStateTimer: number;
  botMoveTarget: {x: number, y: number};
  difficulty: Difficulty;
  speed: number;
  hitCooldown: number;
  botThrowChance: number;
}

interface Boomerang {
  x: number;
  y: number;
  dx: number;
  dy: number;
  owner: Player;
  size: number;
  rotation: number;
  distanceTraveled: number;
  isReturning: boolean;
  isDropped: boolean;
  isPickedUp: boolean;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface Particle {
  particles: Array<{
    x: number;
    y: number;
    dx: number;
    dy: number;
    radius: number;
    alpha: number;
    color: string;
    decay: number;
  }>;
}

export const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showStartModal, setShowStartModal] = useState(true);
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showNextRound, setShowNextRound] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterType>('boba');
  const [selectedMap, setSelectedMap] = useState<MapType>('classic');
  const [selectedMode, setSelectedMode] = useState<GameMode>('solos');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const [totalBrawlers, setTotalBrawlers] = useState(2);
  const [matchScores, setMatchScores] = useState<number[]>([]);
  const [winnerText, setWinnerText] = useState('You Win!');
  const [winnerSubtext, setWinnerSubtext] = useState('');
  
  const gameStateRef = useRef({
    players: [] as Player[],
    boomerangs: [] as Boomerang[],
    obstacles: [] as Obstacle[],
    particles: [] as Particle[],
    playerInfo: [] as PlayerInfo[],
    isGameOver: true,
    isRoundOver: false,
    keys: {} as Record<string, boolean>,
    mousePos: {x: 0, y: 0},
    animationId: null as number | null,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
      const { width, height } = container.getBoundingClientRect();
      const aspectRatio = 16 / 9;
      let newWidth = width;
      let newHeight = width / aspectRatio;

      if (newHeight > height) {
        newHeight = height;
        newWidth = height * aspectRatio;
      }

      canvas.width = newWidth;
      canvas.height = newHeight;

      const baseWidth = 1280;
      const scale = canvas.width / baseWidth;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      gameStateRef.current.keys[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameStateRef.current.keys[e.key.toLowerCase()] = false;
    };

    const getMousePos = (evt: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const baseWidth = 1280;
      const viewScale = canvas.width / baseWidth;

      return {
        x: (evt.clientX - rect.left) * scaleX / viewScale,
        y: (evt.clientY - rect.top) * scaleY / viewScale
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      gameStateRef.current.mousePos = getMousePos(e);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleMouseDown = (e: MouseEvent) => {
      const { isGameOver, isRoundOver, players, boomerangs } = gameStateRef.current;
      if (isGameOver || isRoundOver || !players.length) return;
      
      const player = players.find(p => !p.isBot);
      if (!player) return;

      if (e.button === 0 && player.boomerangCount > 0) {
        player.boomerangCount--;
        const centerX = player.x + player.width / 2;
        const centerY = player.y + player.height / 2;
        const dirX = gameStateRef.current.mousePos.x - centerX;
        const dirY = gameStateRef.current.mousePos.y - centerY;
        const magnitude = Math.hypot(dirX, dirY);
        
        const normDx = magnitude > 0 ? dirX / magnitude : 1;
        const normDy = magnitude > 0 ? dirY / magnitude : 0;

        boomerangs.push(createBoomerang(centerX, centerY, normDx, normDy, player));
      }

      if (e.button === 2) {
        performHit(player);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('resize', resizeCanvas);

    resizeCanvas();
    drawCharacterPreviews(ctx);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('resize', resizeCanvas);
      
      if (gameStateRef.current.animationId) {
        cancelAnimationFrame(gameStateRef.current.animationId);
      }
    };
  }, []);

  // Helper functions
  function drawCharacterPreviews(ctx: CanvasRenderingContext2D) {
    // Implementation for character previews
    // For each character type, draw a simple colored circle or icon on the canvas with the id `${char}-preview`
    CHARACTER_TYPES.forEach(char => {
      const canvas = document.getElementById(`${char}-preview`) as HTMLCanvasElement | null;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = char === 'boba' ? 'rgb(255, 182, 193)' : char === 'coffee' ? 'rgb(111, 78, 55)' : 'rgb(255, 165, 0)';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'black';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(char.charAt(0).toUpperCase(), canvas.width / 2, canvas.height / 2 + 6);
    });
  }

  function createBoomerang(x: number, y: number, dx: number, dy: number, owner: Player): Boomerang {
    return {
      x, y, dx, dy, owner,
      size: BOOMERANG_SIZE,
      rotation: 0,
      distanceTraveled: 0,
      isReturning: false,
      isDropped: false,
      isPickedUp: false,
    };
  }

  function performHit(player: Player) {
    if (player.hitCooldown <= 0 && !player.isDashing && player.stunTimer <= 0) {
      player.isHitting = true;
      player.hitTimer = MELEE_DURATION;
      player.hitCooldown = MELEE_COOLDOWN;
    }
  }

  function startGame() {
    // Game initialization logic
    const players: Player[] = [];
    const boomerangs: Boomerang[] = [];
    const obstacles: Obstacle[] = [];
    const particles: Particle[] = [];
    const playerInfo: PlayerInfo[] = [];

    // Setup obstacles for selected map
    const mapObstacles = MAPS[selectedMap];
    mapObstacles.forEach(o => {
      obstacles.push({
        x: o.x,
        y: o.y,
        width: o.w,
        height: o.h,
        color: 'hsl(var(--obstacle))'
      });
    });

    // Setup players
    for (let i = 0; i < totalBrawlers; i++) {
      const spawn = SPAWN_POINTS[i];
      const isBot = selectedMode === 'solos' ? i !== 0 : i >= 2;
      const characterType = isBot ? CHARACTER_TYPES[Math.floor(Math.random() * CHARACTER_TYPES.length)] : selectedCharacter;
      const team = selectedMode === 'teams' ? (i < 2 ? 1 : 2) : 0;
      const color = team === 1 ? 'hsl(var(--player-1))' : team === 2 ? 'hsl(var(--player-2))' : 'hsl(var(--player-1))';

      players.push({
        x: spawn.x,
        y: spawn.y,
        name: `Player ${i + 1}`,
        isBot,
        characterType,
        width: PLAYER_SIZE,
        height: PLAYER_SIZE,
        color,
        controls: {}, // Could be defined for bots or human players
        boomerangCount: 1,
        isDashing: false,
        dashTimer: 0,
        dx: 0,
        dy: 0,
        stunTimer: 0,
        lastMoveDir: {x: 0, y: 0},
        lastAimDir: {x: 1, y: 0},
        team,
        playerNumber: i + 1,
        isEliminated: false,
        isHitting: false,
        hitTimer: 0,
        botStateTimer: 0,
        botMoveTarget: {x: spawn.x, y: spawn.y},
        difficulty: selectedDifficulty,
        speed: PLAYER_SPEED,
        hitCooldown: 0,
        botThrowChance: 0.01,
      });

      playerInfo.push({
        name: `Player ${i + 1}`,
        color,
        character: characterType,
        isBot,
        team,
      });
    }

    gameStateRef.current = {
      players,
      boomerangs,
      obstacles,
      particles,
      playerInfo,
      isGameOver: false,
      isRoundOver: false,
      keys: {},
      mousePos: {x: 0, y: 0},
      animationId: null,
    };

    setMatchScores(new Array(totalBrawlers).fill(0));
    setShowGameOver(false);
    setShowNextRound(false);

    requestAnimationFrame(gameLoop);
  }

  function resetRound() {
    // Round reset logic
    const gs = gameStateRef.current;
    gs.players.forEach((p, i) => {
      const spawn = SPAWN_POINTS[i];
      p.x = spawn.x;
      p.y = spawn.y;
      p.isEliminated = false;
      p.boomerangCount = 1;
      p.isDashing = false;
      p.dashTimer = 0;
      p.dx = 0;
      p.dy = 0;
      p.stunTimer = 0;
      p.isHitting = false;
      p.hitTimer = 0;
      p.hitCooldown = 0;
      p.botStateTimer = 0;
      p.botMoveTarget = {x: spawn.x, y: spawn.y};
    });
    gs.boomerangs.length = 0;
    gs.particles.length = 0;
    gs.isRoundOver = false;
    setShowNextRound(false);
    requestAnimationFrame(gameLoop);
  }

  function gameLoop() {
    const gs = gameStateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, BASE_HEIGHT);
    gradient.addColorStop(0, `hsl(var(--game-bg-start))`);
    gradient.addColorStop(1, `hsl(var(--game-bg-end))`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

    // Update and draw obstacles
    gs.obstacles.forEach(o => {
      ctx.fillStyle = o.color;
      ctx.fillRect(o.x, o.y, o.width, o.height);
    });

    // Update players
    gs.players.forEach(player => {
      if (player.isEliminated) return;

      // Handle stun timer
      if (player.stunTimer > 0) {
        player.stunTimer--;
      }

      // Handle hit cooldown
      if (player.hitCooldown > 0) {
        player.hitCooldown--;
      }

      // Handle hit timer
      if (player.isHitting) {
        player.hitTimer--;
        if (player.hitTimer <= 0) {
          player.isHitting = false;
        }
      }

      // Handle dash timer
      if (player.isDashing) {
        player.dashTimer--;
        if (player.dashTimer <= 0) {
          player.isDashing = false;
          player.speed = PLAYER_SPEED;
        }
      }

      // Movement input for human player
      if (!player.isBot) {
        let moveX = 0;
        let moveY = 0;
        if (gameStateRef.current.keys['w']) moveY -= 1;
        if (gameStateRef.current.keys['a']) moveX -= 1;
        if (gameStateRef.current.keys['s']) moveY += 1;
        if (gameStateRef.current.keys['d']) moveX += 1;

        const magnitude = Math.hypot(moveX, moveY);
        if (magnitude > 0) {
          moveX /= magnitude;
          moveY /= magnitude;
          player.lastMoveDir = {x: moveX, y: moveY};
        }

        player.dx = moveX * player.speed;
        player.dy = moveY * player.speed;

        // Dash with E key
        if (gameStateRef.current.keys['e'] && !player.isDashing && player.stunTimer <= 0) {
          player.isDashing = true;
          player.dashTimer = DASH_DURATION;
          player.speed = DASH_SPEED;
        }
      } else {
        // Bot AI movement and actions
        botBehavior(player);
      }

      // Update position
      player.x += player.dx;
      player.y += player.dy;

      // Collision with obstacles
      gs.obstacles.forEach(o => {
        if (rectIntersect(player.x, player.y, player.width, player.height, o.x, o.y, o.width, o.height)) {
          // Simple collision response: push player back
          if (player.dx > 0) player.x = o.x - player.width;
          if (player.dx < 0) player.x = o.x + o.width;
          if (player.dy > 0) player.y = o.y - player.height;
          if (player.dy < 0) player.y = o.y + o.height;
        }
      });

      // Keep player inside arena
      player.x = Math.max(0, Math.min(BASE_WIDTH - player.width, player.x));
      player.y = Math.max(0, Math.min(BASE_HEIGHT - player.height, player.y));

      // Draw player
      ctx.fillStyle = player.color;
      ctx.beginPath();
      ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width / 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw melee hit effect
      if (player.isHitting) {
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, MELEE_RANGE, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // Update boomerangs
    gs.boomerangs.forEach((b, index) => {
      if (b.isDropped) return;

      b.x += b.dx * BOOMERANG_SPEED;
      b.y += b.dy * BOOMERANG_SPEED;
      b.distanceTraveled += BOOMERANG_SPEED;

      // Rotate boomerang
      b.rotation += 0.3;

      // Check if boomerang reached max range and start returning
      if (!b.isReturning && b.distanceTraveled >= BOOMERANG_RANGE) {
        b.isReturning = true;
      }

      // If returning, move towards owner
      if (b.isReturning) {
        const centerX = b.owner.x + b.owner.width / 2;
        const centerY = b.owner.y + b.owner.height / 2;
        const dirX = centerX - b.x;
        const dirY = centerY - b.y;
        const mag = Math.hypot(dirX, dirY);
        if (mag > 0) {
          b.dx = dirX / mag;
          b.dy = dirY / mag;
        }
        // If close enough to owner, pick up boomerang
        if (mag < BOOMERANG_SIZE) {
          b.isPickedUp = true;
          b.owner.boomerangCount++;
          gs.boomerangs.splice(index, 1);
        }
      }

      // Collision with obstacles
      gs.obstacles.forEach(o => {
        if (rectIntersect(b.x, b.y, b.size, b.size, o.x, o.y, o.width, o.height)) {
          b.isReturning = true;
        }
      });

      // Collision with players (except owner)
      gs.players.forEach(p => {
        if (p === b.owner || p.isEliminated) return;
        if (rectIntersect(b.x, b.y, b.size, b.size, p.x, p.y, p.width, p.height)) {
          if (!p.isDashing && p.stunTimer <= 0) {
            p.stunTimer = 60;
            p.boomerangCount = Math.min(p.boomerangCount + 1, 1);
            b.isReturning = true;
          }
        }
      });

      // Draw boomerang
      ctx.save();
      ctx.translate(b.x + b.size / 2, b.y + b.size / 2);
      ctx.rotate(b.rotation);
      ctx.fillStyle = 'hsl(var(--boomerang-glow))';
      ctx.beginPath();
      ctx.moveTo(-b.size / 2, -b.size / 4);
      ctx.lineTo(b.size / 2, 0);
      ctx.lineTo(-b.size / 2, b.size / 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // Check round over conditions
    const alivePlayers = gs.players.filter(p => !p.isEliminated);
    if (alivePlayers.length <= 1 && !gs.isRoundOver) {
      gs.isRoundOver = true;
      if (alivePlayers.length === 1) {
        const winner = alivePlayers[0];
        const scores = [...matchScores];
        scores[winner.playerNumber - 1]++;
        setMatchScores(scores);
        setWinnerText(`${winner.name} Wins!`);
        setWinnerSubtext(`Team ${winner.team || winner.playerNumber} is victorious!`);
        if (scores[winner.playerNumber - 1] >= WIN_SCORE) {
          setShowGameOver(true);
          gs.isGameOver = true;
        } else {
          setShowNextRound(true);
        }
      } else {
        setWinnerText('Draw!');
        setWinnerSubtext('No one wins this round.');
        setShowNextRound(true);
      }
    }

    // Request next frame if game not over
    if (!gs.isGameOver) {
      gs.animationId = requestAnimationFrame(gameLoop);
    }
  }

  function rectIntersect(x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number) {
    return !(x2 > x1 + w1 || 
             x2 + w2 < x1 || 
             y2 > y1 + h1 ||
             y2 + h2 < y1);
  }

  function botBehavior(player: Player) {
    const gs = gameStateRef.current;
    if (player.isEliminated) return;

    player.botStateTimer--;
    if (player.botStateTimer <= 0) {
      // Pick a new random target position within arena
      player.botMoveTarget = {
        x: Math.random() * (BASE_WIDTH - player.width),
        y: Math.random() * (BASE_HEIGHT - player.height)
      };
      player.botStateTimer = 120 + Math.floor(Math.random() * 180);
    }

    // Move towards target
    const dirX = player.botMoveTarget.x - player.x;
    const dirY = player.botMoveTarget.y - player.y;
    const dist = Math.hypot(dirX, dirY);
    if (dist > 5) {
      player.dx = (dirX / dist) * player.speed;
      player.dy = (dirY / dist) * player.speed;
      player.lastMoveDir = {x: player.dx, y: player.dy};
    } else {
      player.dx = 0;
      player.dy = 0;
    }

    // Aim at nearest enemy
    const enemies = gs.players.filter(p => p !== player && !p.isEliminated && (selectedMode === 'teams' ? p.team !== player.team : true));
    if (enemies.length > 0) {
      let nearest = enemies[0];
      let nearestDist = Math.hypot(nearest.x - player.x, nearest.y - player.y);
      for (let i = 1; i < enemies.length; i++) {
        const e = enemies[i];
        const d = Math.hypot(e.x - player.x, e.y - player.y);
        if (d < nearestDist) {
          nearest = e;
          nearestDist = d;
        }
      }
      const aimX = nearest.x + nearest.width / 2 - (player.x + player.width / 2);
      const aimY = nearest.y + nearest.height / 2 - (player.y + player.height / 2);
      const mag = Math.hypot(aimX, aimY);
      if (mag > 0) {
        player.lastAimDir = {x: aimX / mag, y: aimY / mag};
      }

      // Decide to throw boomerang
      if (player.boomerangCount > 0 && Math.random() < player.botThrowChance) {
        player.boomerangCount--;
        gs.boomerangs.push(createBoomerang(player.x + player.width / 2, player.y + player.height / 2, player.lastAimDir.x, player.lastAimDir.y, player));
      }
    }

    // Randomly dash sometimes
    if (!player.isDashing && Math.random() < 0.005) {
      player.isDashing = true;
      player.dashTimer = DASH_DURATION;
      player.speed = DASH_SPEED;
    }
  }

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-[#f0f4f8]">
      <canvas 
        ref={canvasRef} 
        className="bg-white rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.1),0_6px_6px_rgba(0,0,0,0.1)]"
        style={{ aspectRatio: '16/9', maxWidth: '100%', maxHeight: '100%' }}
      />

      {/* Start Modal */}
      {showStartModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white text-center p-10 rounded-2xl shadow-2xl max-w-lg">
            <h1 className="text-6xl font-bold mb-4 text-gray-800">Foodie Brawlers</h1>
            <p className="text-gray-600 mb-8 text-lg">Dash, dodge, and brawl to become the last foodie standing!</p>
            <div className="flex justify-center text-left mb-8">
              <div className="bg-gray-50 p-6 rounded-lg border">
                <h3 className="font-bold text-2xl text-pink-500 mb-2">Controls</h3>
                <p><kbd className="font-sans bg-gray-200 rounded px-2 py-1">W</kbd> <kbd className="font-sans bg-gray-200 rounded px-2 py-1">A</kbd> <kbd className="font-sans bg-gray-200 rounded px-2 py-1">S</kbd> <kbd className="font-sans bg-gray-200 rounded px-2 py-1">D</kbd> - Move</p>
                <p><kbd className="font-sans bg-gray-200 rounded px-2 py-1">Left Click</kbd> - Throw Boomerang</p>
                <p><kbd className="font-sans bg-gray-200 rounded px-2 py-1">Right Click</kbd> - Melee Hit</p>
                <p><kbd className="font-sans bg-gray-200 rounded px-2 py-1">E</kbd> - Dash</p>
              </div>
            </div>
            <Button 
              onClick={() => {
                setShowStartModal(false);
                setShowCharacterSelect(true);
              }} 
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-10 rounded-full text-2xl"
            >
              Play
            </Button>
          </div>
        </div>
      )}

      {/* Character Select Modal */}
      {showCharacterSelect && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white text-center p-8 rounded-2xl shadow-2xl max-w-4xl w-full">
            <h2 className="text-4xl font-bold mb-6 text-gray-800">Game Setup</h2>
            
            <div className="grid grid-cols-2 gap-8">
              {/* Left Side */}
              <div>
                <h3 className="text-2xl font-bold mb-3 text-gray-700">Choose Your Fighter</h3>
                <div className="flex justify-center gap-6 mb-6">
                  {(['boba', 'coffee', 'juice'] as CharacterType[]).map(char => (
                    <div
                      key={char}
                      className={`border-4 rounded-xl p-4 cursor-pointer transition-all ${
                        selectedCharacter === char ? 'border-red-500 bg-red-100' : 'border-transparent bg-gray-100 hover:scale-105'
                      }`}
                      onClick={() => setSelectedCharacter(char)}
                    >
                      <canvas id={`${char}-preview`} width="80" height="80" className="mb-2"></canvas>
                      <p className="font-bold capitalize">{char}</p>
                    </div>
                  ))}
                </div>

                <h3 className="text-2xl font-bold mb-3 text-gray-700">Choose Your Arena</h3>
                <div className="flex justify-center gap-4">
                  {(['classic', 'pillars', 'open'] as MapType[]).map(map => (
                    <button
                      key={map}
                      className={`border-2 px-6 py-2 rounded-full font-bold transition-all ${
                        selectedMap === map ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedMap(map)}
                    >
                      {map.charAt(0).toUpperCase() + map.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Side */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-2xl font-bold mb-4 text-gray-700">Game Rules</h3>
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div>
                    <h4 className="text-xl font-bold mb-2 text-gray-600">Game Mode</h4>
                    <div className="flex justify-center gap-2">
                      <button
                        className={`border-2 px-4 py-2 rounded-full font-bold ${
                          selectedMode === 'solos' ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300'
                        }`}
                        onClick={() => {
                          setSelectedMode('solos');
                          setTotalBrawlers(2);
                        }}
                      >
                        Solos
                      </button>
                      <button
                        className={`border-2 px-4 py-2 rounded-full font-bold ${
                          selectedMode === 'teams' ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300'
                        }`}
                        onClick={() => {
                          setSelectedMode('teams');
                          setTotalBrawlers(4);
                        }}
                      >
                        Teams
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xl font-bold mb-2 text-gray-600">Total Brawlers</h4>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        className="text-xl font-bold bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center"
                        onClick={() => setTotalBrawlers(Math.max(2, totalBrawlers - 1))}
                        disabled={selectedMode === 'teams' || totalBrawlers <= 2}
                      >
                        -
                      </button>
                      <span className="text-2xl font-bold w-10 text-center">{totalBrawlers}</span>
                      <button
                        className="text-xl font-bold bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center"
                        onClick={() => setTotalBrawlers(Math.min(4, totalBrawlers + 1))}
                        disabled={selectedMode === 'teams' || totalBrawlers >= 4}
                      >
                        +
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedMode === 'teams' ? '2 vs 2' : 'Free-For-All'}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xl font-bold mb-2 text-gray-600">Bot Difficulty</h4>
                  <div className="flex justify-center gap-2">
                    {(['easy', 'medium', 'hard'] as Difficulty[]).map(diff => (
                      <button
                        key={diff}
                        className={`border-2 px-4 py-2 rounded-full font-bold ${
                          selectedDifficulty === diff ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300'
                        }`}
                        onClick={() => setSelectedDifficulty(diff)}
                      >
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={() => {
                setShowCharacterSelect(false);
                startGame();
              }}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-12 rounded-full text-2xl mt-8"
            >
              Brawl!
            </Button>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {showGameOver && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white text-center p-8 rounded-2xl shadow-2xl">
            <h2 className="text-5xl font-bold mb-4 text-gray-800">{winnerText}</h2>
            <p className="text-gray-600 mb-6">{winnerSubtext}</p>
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => {
                  setShowGameOver(false);
                  startGame();
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full text-xl"
              >
                Play Again
              </Button>
              <Button
                onClick={() => {
                  setShowGameOver(false);
                  setShowStartModal(true);
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-full text-xl"
              >
                Main Menu
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Next Round Modal */}
      {showNextRound && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white text-center p-8 rounded-2xl shadow-2xl max-w-md">
            <h2 className="text-4xl font-bold mb-4 text-gray-800">Round Over!</h2>
            <div className="mb-6 space-y-2 text-lg">
              {matchScores.map((score, i) => (
                <div key={i} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                  <span className="font-bold">Player {i + 1}</span>
                  <span className="font-bold text-2xl">{score}</span>
                </div>
              ))}
            </div>
            <Button
              onClick={() => {
                setShowNextRound(false);
                resetRound();
              }}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full text-xl"
            >
              Next Round
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
