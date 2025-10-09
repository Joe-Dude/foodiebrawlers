import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  score: number;
  lives: number;
  boomerangs: number;
  isAI?: boolean;
  aiState?: {
    moveTimer: number;
    targetX: number;
    targetY: number;
    shootTimer: number;
  };
}

interface Boomerang {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  owner: number | null;
  returning: boolean;
  active: boolean;
  dropped: boolean;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [winner, setWinner] = useState<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, canvasX: 0, canvasY: 0 });
  const cameraRef = useRef({ x: 0, y: 0 });
  
  const WORLD_WIDTH = 1600;
  const WORLD_HEIGHT = 1200;
  const VIEWPORT_WIDTH = 800;
  const VIEWPORT_HEIGHT = 600;
  
  const gameStateRef = useRef({
    players: [
      { x: 200, y: 400, vx: 0, vy: 0, radius: 20, color: "#B347E8", score: 0, lives: 3, boomerangs: 2, isAI: false },
      { 
        x: 1400, 
        y: 800, 
        vx: 0, 
        vy: 0, 
        radius: 20, 
        color: "#F43F5E", 
        score: 0, 
        lives: 3,
        boomerangs: 2,
        isAI: true,
        aiState: { moveTimer: 0, targetX: 1400, targetY: 800, shootTimer: 0 }
      },
    ] as Player[],
    boomerangs: [] as Boomerang[],
    obstacles: [
      { x: 350, y: 250, width: 100, height: 100 },
      { x: 200, y: 450, width: 80, height: 80 },
      { x: 520, y: 150, width: 80, height: 80 },
      { x: 700, y: 400, width: 120, height: 120 },
      { x: 1100, y: 300, width: 100, height: 100 },
      { x: 900, y: 700, width: 90, height: 90 },
      { x: 1300, y: 500, width: 110, height: 110 },
      { x: 400, y: 800, width: 100, height: 100 },
      { x: 800, y: 900, width: 80, height: 80 },
      { x: 1200, y: 150, width: 95, height: 95 },
      { x: 600, y: 600, width: 85, height: 85 },
    ] as Obstacle[],
    keys: {} as Record<string, boolean>,
  });

  const startGame = () => {
    gameStateRef.current.players[0] = { x: 200, y: 400, vx: 0, vy: 0, radius: 20, color: "#B347E8", score: 0, lives: 3, boomerangs: 2, isAI: false };
    gameStateRef.current.players[1] = { 
      x: 1400, 
      y: 800, 
      vx: 0, 
      vy: 0, 
      radius: 20, 
      color: "#F43F5E", 
      score: 0, 
      lives: 3,
      boomerangs: 2,
      isAI: true,
      aiState: { moveTimer: 0, targetX: 1400, targetY: 800, shootTimer: 0 }
    };
    gameStateRef.current.boomerangs = [];
    setWinner(null);
    setGameState("playing");
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      gameStateRef.current.keys[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameStateRef.current.keys[e.key.toLowerCase()] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.canvasX = e.clientX - rect.left;
      mouseRef.current.canvasY = e.clientY - rect.top;
    };

    const handleClick = () => {
      if (gameState !== "playing") return;
      
      const player = gameStateRef.current.players[0];
      if (player.boomerangs <= 0) return;

      const camera = cameraRef.current;
      const worldX = mouseRef.current.canvasX + camera.x;
      const worldY = mouseRef.current.canvasY + camera.y;

      const angle = Math.atan2(worldY - player.y, worldX - player.x);
      
      player.boomerangs--;
      gameStateRef.current.boomerangs.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * 8,
        vy: Math.sin(angle) * 8,
        angle: 0,
        owner: 0,
        returning: false,
        active: true,
        dropped: false,
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    canvasRef.current?.addEventListener("click", handleClick);

    const gameLoop = () => {
      if (gameState !== "playing") return;

      const { players, boomerangs, obstacles, keys } = gameStateRef.current;

      // Update player 1 (WASD)
      const speed = 4;
      if (keys["w"]) players[0].vy = -speed;
      else if (keys["s"]) players[0].vy = speed;
      else players[0].vy *= 0.8;
      
      if (keys["a"]) players[0].vx = -speed;
      else if (keys["d"]) players[0].vx = speed;
      else players[0].vx *= 0.8;

      // AI for robot player
      const robot = players[1];
      if (robot.isAI && robot.aiState) {
        robot.aiState.moveTimer--;
        robot.aiState.shootTimer--;

        // Pick new random target occasionally
        if (robot.aiState.moveTimer <= 0) {
          robot.aiState.targetX = 100 + Math.random() * (WORLD_WIDTH - 200);
          robot.aiState.targetY = 100 + Math.random() * (WORLD_HEIGHT - 200);
          robot.aiState.moveTimer = 60 + Math.random() * 120;
        }

        // Move toward target
        const dx = robot.aiState.targetX - robot.x;
        const dy = robot.aiState.targetY - robot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 20) {
          robot.vx = (dx / dist) * speed * 0.8;
          robot.vy = (dy / dist) * speed * 0.8;
        } else {
          robot.vx *= 0.8;
          robot.vy *= 0.8;
        }

        // Try to shoot at player
        if (robot.aiState.shootTimer <= 0 && robot.boomerangs > 0) {
          const player = players[0];
          const shootAngle = Math.atan2(player.y - robot.y, player.x - robot.x);
          
          robot.boomerangs--;
          boomerangs.push({
            x: robot.x,
            y: robot.y,
            vx: Math.cos(shootAngle) * 8,
            vy: Math.sin(shootAngle) * 8,
            angle: 0,
            owner: 1,
            returning: false,
            active: true,
            dropped: false,
          });
          
          robot.aiState.shootTimer = 80 + Math.random() * 60;
        }

        // AI picks up dropped boomerangs
        boomerangs.forEach((boom) => {
          if (boom.dropped && robot.boomerangs < 2) {
            const dist = Math.sqrt((boom.x - robot.x) ** 2 + (boom.y - robot.y) ** 2);
            if (dist < robot.radius + 15) {
              boom.active = false;
              robot.boomerangs++;
            }
          }
        });
      }

      // Update player positions
      players.forEach((player) => {
        player.x += player.vx;
        player.y += player.vy;

        // Boundary collision
        if (player.x - player.radius < 0) player.x = player.radius;
        if (player.x + player.radius > WORLD_WIDTH) player.x = WORLD_WIDTH - player.radius;
        if (player.y - player.radius < 0) player.y = player.radius;
        if (player.y + player.radius > WORLD_HEIGHT) player.y = WORLD_HEIGHT - player.radius;

        // Pick up dropped boomerangs
        if (!player.isAI) {
          boomerangs.forEach((boom) => {
            if (boom.dropped && player.boomerangs < 2) {
              const dist = Math.sqrt((boom.x - player.x) ** 2 + (boom.y - player.y) ** 2);
              if (dist < player.radius + 15) {
                boom.active = false;
                player.boomerangs++;
              }
            }
          });
        }

        // Obstacle collision
        obstacles.forEach((obs) => {
          if (
            player.x + player.radius > obs.x &&
            player.x - player.radius < obs.x + obs.width &&
            player.y + player.radius > obs.y &&
            player.y - player.radius < obs.y + obs.height
          ) {
            // Simple pushback
            const overlapX = Math.min(
              player.x + player.radius - obs.x,
              obs.x + obs.width - (player.x - player.radius)
            );
            const overlapY = Math.min(
              player.y + player.radius - obs.y,
              obs.y + obs.height - (player.y - player.radius)
            );

            if (overlapX < overlapY) {
              if (player.x < obs.x + obs.width / 2) player.x = obs.x - player.radius;
              else player.x = obs.x + obs.width + player.radius;
            } else {
              if (player.y < obs.y + obs.height / 2) player.y = obs.y - player.radius;
              else player.y = obs.y + obs.height + player.radius;
            }
          }
        });
      });

      // Update boomerangs
      boomerangs.forEach((boom) => {
        if (!boom.active || boom.dropped) return;

        boom.x += boom.vx;
        boom.y += boom.vy;
        boom.angle += 0.3;

        if (boom.owner !== null) {
          const owner = players[boom.owner];
          const dist = Math.sqrt((boom.x - owner.x) ** 2 + (boom.y - owner.y) ** 2);

          // Start returning after traveling distance
          if (!boom.returning && dist > 250) {
            boom.returning = true;
          }

          if (boom.returning) {
            const angle = Math.atan2(owner.y - boom.y, owner.x - boom.x);
            boom.vx += Math.cos(angle) * 0.3;
            boom.vy += Math.sin(angle) * 0.3;

            // Catch boomerang
            if (dist < owner.radius + 15 && owner.boomerangs < 2) {
              boom.active = false;
              owner.boomerangs++;
            } else if (dist < 10 && owner.boomerangs >= 2) {
              // Drop if inventory full
              boom.dropped = true;
              boom.owner = null;
              boom.vx = 0;
              boom.vy = 0;
            }
          }

          // Check collision with other player
          const otherPlayerIdx = 1 - boom.owner;
          const otherPlayer = players[otherPlayerIdx];
          const playerDist = Math.sqrt((boom.x - otherPlayer.x) ** 2 + (boom.y - otherPlayer.y) ** 2);
          
          if (playerDist < otherPlayer.radius + 10) {
            boom.dropped = true;
            boom.owner = null;
            boom.vx = 0;
            boom.vy = 0;
            otherPlayer.lives--;
            owner.score++;

            if (otherPlayer.lives <= 0) {
              setWinner(boom.owner);
              setGameState("gameover");
            }

            // Reset positions
            players[0].x = 200;
            players[0].y = 400;
            players[0].vx = 0;
            players[0].vy = 0;
            players[1].x = 1400;
            players[1].y = 800;
            players[1].vx = 0;
            players[1].vy = 0;
          }

          // Drop if returning too long (failed catch)
          if (boom.returning && dist > 400) {
            boom.dropped = true;
            boom.owner = null;
            boom.vx = 0;
            boom.vy = 0;
          }
        }

        // Deactivate if out of bounds
        if (boom.x < 0 || boom.x > WORLD_WIDTH || boom.y < 0 || boom.y > WORLD_HEIGHT) {
          boom.active = false;
        }
      });

      // Update camera to follow player
      const player = players[0];
      cameraRef.current.x = player.x - VIEWPORT_WIDTH / 2;
      cameraRef.current.y = player.y - VIEWPORT_HEIGHT / 2;
      
      // Clamp camera to world bounds
      cameraRef.current.x = Math.max(0, Math.min(WORLD_WIDTH - VIEWPORT_WIDTH, cameraRef.current.x));
      cameraRef.current.y = Math.max(0, Math.min(WORLD_HEIGHT - VIEWPORT_HEIGHT, cameraRef.current.y));

      // Render
      ctx.clearRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

      // Background
      const gradient = ctx.createLinearGradient(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
      gradient.addColorStop(0, "#1A1F3A");
      gradient.addColorStop(1, "#2D1B4E");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

      // Apply camera transform
      ctx.save();
      ctx.translate(-cameraRef.current.x, -cameraRef.current.y);

      // Obstacles
      obstacles.forEach((obs) => {
        ctx.fillStyle = "#2A3347";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#000";
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.shadowBlur = 0;
      });

      // Players
      players.forEach((player) => {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = player.color;
        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Draw boomerangs in hands
        for (let i = 0; i < player.boomerangs; i++) {
          const offsetX = i === 0 ? -15 : 15;
          ctx.save();
          ctx.translate(player.x + offsetX, player.y);
          ctx.rotate(Math.PI / 4);
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#3DD8FF";
          ctx.fillStyle = "#3DD8FF";
          ctx.fillRect(-8, -3, 16, 6);
          ctx.fillRect(-3, -8, 6, 16);
          ctx.restore();
        }
      });

      // Boomerangs (flying and dropped)
      boomerangs.forEach((boom) => {
        if (!boom.active) return;
        
        ctx.save();
        ctx.translate(boom.x, boom.y);
        if (!boom.dropped) {
          ctx.rotate(boom.angle);
        }
        ctx.shadowBlur = boom.dropped ? 5 : 15;
        ctx.shadowColor = "#3DD8FF";
        ctx.fillStyle = boom.dropped ? "#2AB8CC" : "#3DD8FF";
        ctx.globalAlpha = boom.dropped ? 0.7 : 1;
        ctx.fillRect(-15, -5, 30, 10);
        ctx.fillRect(-5, -15, 10, 30);
        ctx.restore();
      });

      // Reset transform for UI
      ctx.restore();

      // UI elements (lives and boomerangs count)
      players.forEach((player, idx) => {
        ctx.fillStyle = "#fff";
        ctx.font = "16px sans-serif";
        const text = `P${idx + 1}: ${player.lives}♥ | ${player.boomerangs}🪃`;
        ctx.fillText(text, idx === 0 ? 20 : VIEWPORT_WIDTH - 120, 30);
      });

      requestAnimationFrame(gameLoop);
    };

    if (gameState === "playing") {
      gameLoop();
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      canvasRef.current?.removeEventListener("click", handleClick);
    };
  }, [gameState]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[hsl(var(--game-bg-start))] to-[hsl(var(--game-bg-end))] p-8">
      <h1 className="text-6xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
        Boomerang Battle
      </h1>

      {gameState === "start" && (
        <Card className="p-8 text-center space-y-6 bg-card/50 backdrop-blur border-2 border-primary/20">
          <h2 className="text-3xl font-bold">Welcome!</h2>
          <div className="space-y-4 text-left">
            <div>
              <h3 className="text-xl font-bold text-primary mb-2">You (Purple)</h3>
              <p className="text-muted-foreground">Move: W A S D</p>
              <p className="text-muted-foreground">Throw: Click Mouse</p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-accent mb-2">Robot Enemy (Pink)</h3>
              <p className="text-muted-foreground">AI-controlled opponent</p>
            </div>
          </div>
          <Button onClick={startGame} size="lg" className="text-lg px-8">
            Start Game
          </Button>
        </Card>
      )}

      {gameState === "playing" && (
        <div className="text-center">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="border-4 border-primary/30 rounded-lg shadow-2xl shadow-primary/20"
          />
          <p className="mt-4 text-muted-foreground text-sm">Camera follows you! Explore the larger arena.</p>
        </div>
      )}

      {gameState === "gameover" && (
        <Card className="p-8 text-center space-y-6 bg-card/50 backdrop-blur border-2 border-accent/20">
          <h2 className="text-4xl font-bold">Game Over!</h2>
          <p className="text-2xl">
            <span className={winner === 0 ? "text-primary" : "text-accent"}>
              {winner === 0 ? "You" : "Robot"}
            </span>{" "}
            {winner === 0 ? "Win! 🎉" : "Wins! 🤖"}
          </p>
          <Button onClick={startGame} size="lg" className="text-lg px-8">
            Play Again
          </Button>
        </Card>
      )}
    </div>
  );
};
