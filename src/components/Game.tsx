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
  owner: number;
  returning: boolean;
  active: boolean;
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
  
  const gameStateRef = useRef({
    players: [
      { x: 150, y: 300, vx: 0, vy: 0, radius: 20, color: "#B347E8", score: 0, lives: 3, isAI: false },
      { 
        x: 650, 
        y: 300, 
        vx: 0, 
        vy: 0, 
        radius: 20, 
        color: "#F43F5E", 
        score: 0, 
        lives: 3,
        isAI: true,
        aiState: { moveTimer: 0, targetX: 650, targetY: 300, shootTimer: 0 }
      },
    ] as Player[],
    boomerangs: [] as Boomerang[],
    obstacles: [
      { x: 350, y: 250, width: 100, height: 100 },
      { x: 200, y: 450, width: 80, height: 80 },
      { x: 520, y: 150, width: 80, height: 80 },
    ] as Obstacle[],
    keys: {} as Record<string, boolean>,
  });

  const startGame = () => {
    gameStateRef.current.players[0] = { x: 150, y: 300, vx: 0, vy: 0, radius: 20, color: "#B347E8", score: 0, lives: 3, isAI: false };
    gameStateRef.current.players[1] = { 
      x: 650, 
      y: 300, 
      vx: 0, 
      vy: 0, 
      radius: 20, 
      color: "#F43F5E", 
      score: 0, 
      lives: 3,
      isAI: true,
      aiState: { moveTimer: 0, targetX: 650, targetY: 300, shootTimer: 0 }
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
      if (gameStateRef.current.boomerangs.filter(b => b.owner === 0 && b.active).length > 0) return;

      const angle = Math.atan2(
        mouseRef.current.canvasY - player.y,
        mouseRef.current.canvasX - player.x
      );
      
      gameStateRef.current.boomerangs.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * 8,
        vy: Math.sin(angle) * 8,
        angle: 0,
        owner: 0,
        returning: false,
        active: true,
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
          robot.aiState.targetX = 100 + Math.random() * 600;
          robot.aiState.targetY = 100 + Math.random() * 400;
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
        if (robot.aiState.shootTimer <= 0 && boomerangs.filter(b => b.owner === 1 && b.active).length === 0) {
          const player = players[0];
          const shootAngle = Math.atan2(player.y - robot.y, player.x - robot.x);
          
          boomerangs.push({
            x: robot.x,
            y: robot.y,
            vx: Math.cos(shootAngle) * 8,
            vy: Math.sin(shootAngle) * 8,
            angle: 0,
            owner: 1,
            returning: false,
            active: true,
          });
          
          robot.aiState.shootTimer = 80 + Math.random() * 60;
        }
      }

      // Update player positions
      players.forEach((player) => {
        player.x += player.vx;
        player.y += player.vy;

        // Boundary collision
        if (player.x - player.radius < 0) player.x = player.radius;
        if (player.x + player.radius > 800) player.x = 800 - player.radius;
        if (player.y - player.radius < 0) player.y = player.radius;
        if (player.y + player.radius > 600) player.y = 600 - player.radius;

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
        if (!boom.active) return;

        boom.x += boom.vx;
        boom.y += boom.vy;
        boom.angle += 0.3;

        const owner = players[boom.owner];
        const dist = Math.sqrt((boom.x - owner.x) ** 2 + (boom.y - owner.y) ** 2);

        // Start returning after traveling distance
        if (!boom.returning && dist > 200) {
          boom.returning = true;
        }

        if (boom.returning) {
          const angle = Math.atan2(owner.y - boom.y, owner.x - boom.x);
          boom.vx += Math.cos(angle) * 0.3;
          boom.vy += Math.sin(angle) * 0.3;

          // Catch boomerang
          if (dist < owner.radius + 10) {
            boom.active = false;
          }
        }

        // Check collision with other player
        const otherPlayer = players[1 - boom.owner];
        const playerDist = Math.sqrt((boom.x - otherPlayer.x) ** 2 + (boom.y - otherPlayer.y) ** 2);
        
        if (playerDist < otherPlayer.radius + 10) {
          boom.active = false;
          otherPlayer.lives--;
          owner.score++;

          if (otherPlayer.lives <= 0) {
            setWinner(boom.owner);
            setGameState("gameover");
          }

          // Reset positions
          players[0].x = 150;
          players[0].y = 300;
          players[1].x = 650;
          players[1].y = 300;
        }

        // Deactivate if out of bounds
        if (boom.x < 0 || boom.x > 800 || boom.y < 0 || boom.y > 600) {
          boom.active = false;
        }
      });

      // Render
      ctx.clearRect(0, 0, 800, 600);

      // Background
      const gradient = ctx.createLinearGradient(0, 0, 800, 600);
      gradient.addColorStop(0, "#1A1F3A");
      gradient.addColorStop(1, "#2D1B4E");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 800, 600);

      // Obstacles
      obstacles.forEach((obs) => {
        ctx.fillStyle = "#2A3347";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#000";
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.shadowBlur = 0;
      });

      // Players
      players.forEach((player, idx) => {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = player.color;
        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Lives
        ctx.fillStyle = "#fff";
        ctx.font = "14px sans-serif";
        ctx.fillText(`P${idx + 1}: ${player.lives}♥`, idx === 0 ? 20 : 720, 30);
      });

      // Boomerangs
      boomerangs.forEach((boom) => {
        if (!boom.active) return;
        
        ctx.save();
        ctx.translate(boom.x, boom.y);
        ctx.rotate(boom.angle);
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#3DD8FF";
        ctx.fillStyle = "#3DD8FF";
        ctx.fillRect(-15, -5, 30, 10);
        ctx.fillRect(-5, -15, 10, 30);
        ctx.restore();
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
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border-4 border-primary/30 rounded-lg shadow-2xl shadow-primary/20"
        />
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
