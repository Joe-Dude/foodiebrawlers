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

class Player {
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

  constructor(x: number, y: number, color: string, controls: any, name: string, 
              characterType: CharacterType, team: number, playerNumber: number, 
              isBot = false, difficulty: Difficulty = 'medium') {
    this.x = x;
    this.y = y;
    this.name = name;
    this.isBot = isBot;
    this.characterType = characterType;
    this.width = PLAYER_SIZE;
    this.height = PLAYER_SIZE;
    this.color = color;
    this.controls = controls;
    this.boomerangCount = 1;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dx = 0;
    this.dy = 0;
    this.stunTimer = 0;
    this.lastMoveDir = { x: 1, y: 0 };
    this.lastAimDir = { x: 1, y: 0 };
    this.team = team;
    this.playerNumber = playerNumber;
    this.isEliminated = false;
    this.isHitting = false;
    this.hitTimer = 0;
    this.botStateTimer = 0;
    this.botMoveTarget = {x: 0, y: 0};
    this.difficulty = difficulty;
    this.speed = isBot ? PLAYER_SPEED * (difficulty === 'easy' ? 0.75 : difficulty === 'hard' ? 1.0 : 0.85) : PLAYER_SPEED;
    this.hitCooldown = 0;
    this.botThrowChance = difficulty === 'easy' ? 0.008 : difficulty === 'hard' ? 0.02 : 0.015;
  }

  update(keys: Record<string, boolean>, mousePos: {x: number, y: number}, 
         players: Player[], boomerangs: Boomerang[], obstacles: Obstacle[], 
         createParticle: (x: number, y: number, color: string, count?: number, decay?: number, speed?: number) => void) {
    if (this.isEliminated) return;
    
    if (this.hitTimer > 0) this.hitTimer -= 1000/60;
    if (this.hitCooldown > 0) this.hitCooldown -= 1000/60;
    if (this.hitTimer <= 0) this.isHitting = false;

    if (this.isBot) {
      this.handleBotAI(players, boomerangs, obstacles);
    } else {
      this.handlePlayerInput(keys, mousePos, createParticle, obstacles);
    }
  }

  performHit() {
    const meleeCooldown = this.isBot ? (this.difficulty === 'hard' ? 300 : MELEE_COOLDOWN) : MELEE_COOLDOWN;
    if (this.hitCooldown <= 0 && !this.isDashing && this.stunTimer <= 0) {
      this.isHitting = true;
      this.hitTimer = MELEE_DURATION;
      this.hitCooldown = meleeCooldown;
    }
  }

  handlePlayerInput(keys: Record<string, boolean>, mousePos: {x: number, y: number}, 
                    createParticle: (x: number, y: number, color: string, count?: number, decay?: number, speed?: number) => void,
                    obstacles: Obstacle[]) {
    if (this.stunTimer > 0) {
      this.stunTimer -= 1000 / 60;
      if (this.stunTimer <= 0) this.isEliminated = true;
      return;
    }

    if (this.isDashing) {
      this.x += this.dx * DASH_SPEED;
      this.y += this.dy * DASH_SPEED;
      this.dashTimer -= 1000 / 60;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
      createParticle(this.x + this.width / 2, this.y + this.height / 2, this.color, 10, 0.9, 2);
    } else if (!this.isHitting) {
      this.handleMovement(keys);
    }

    this.handleDash(keys);
    this.checkBoundaries();
    this.checkObstacleCollision(obstacles);

    // Update aim direction
    const aimX = mousePos.x - (this.x + this.width / 2);
    const aimY = mousePos.y - (this.y + this.height / 2);
    const mag = Math.hypot(aimX, aimY);
    if (mag > 0) {
      this.lastAimDir.x = aimX / mag;
      this.lastAimDir.y = aimY / mag;
    }
  }

  handleBotAI(players: Player[], boomerangs: Boomerang[], obstacles: Obstacle[]) {
    if (this.stunTimer > 0) {
      this.stunTimer -= 1000 / 60;
      if (this.stunTimer <= 0) this.isEliminated = true;
      return;
    }

    let boomerangTarget: Boomerang | null = null;
    if (this.boomerangCount < 2) {
      let closestBoomerangDist = Infinity;
      boomerangs.filter(b => b.isDropped).forEach(b => {
        const dist = Math.hypot(this.x - b.x, this.y - b.y);
        if (dist < closestBoomerangDist) {
          closestBoomerangDist = dist;
          boomerangTarget = b;
        }
      });
    }

    let enemyTarget: Player | null = null;
    let closestEnemyDist = Infinity;
    players.filter(p => p.team !== this.team && !p.isEliminated).forEach(opponent => {
      const dist = Math.hypot(this.x - opponent.x, this.y - opponent.y);
      if (dist < closestEnemyDist) {
        closestEnemyDist = dist;
        enemyTarget = opponent;
      }
    });
    if (!enemyTarget) return;

    let finalTarget: Player | Boomerang = enemyTarget;
    if (boomerangTarget && this.boomerangCount === 0) {
      finalTarget = boomerangTarget;
    } else if (boomerangTarget && this.boomerangCount === 1 && closestEnemyDist > 300) {
      if (this.difficulty !== 'easy') finalTarget = boomerangTarget;
    }

    const distX = finalTarget.x - this.x;
    const distY = finalTarget.y - this.y;
    const distance = Math.hypot(distX, distY);

    if (enemyTarget) {
      const aimDistX = enemyTarget.x - this.x;
      const aimDistY = enemyTarget.y - this.y;
      const aimDist = Math.hypot(aimDistX, aimDistY);
      if (aimDist > 0) {
        this.lastAimDir = { x: aimDistX / aimDist, y: aimDistY / aimDist };
      }
    }

    if (closestEnemyDist < MELEE_RANGE * 1.5) {
      this.performHit();
    }

    if (finalTarget === boomerangTarget) {
      if (distance > 0) {
        this.botMoveTarget = {x: distX/distance, y: distY/distance};
      }
    } else {
      this.botStateTimer -= 1000 / 60;
      if (this.botStateTimer <= 0) {
        this.botStateTimer = getRandom(500, 1500);
        const action = Math.random();
        if (distance > 0) {
          if (action < 0.6) {
            this.botMoveTarget = {x: distX/distance, y: distY/distance};
            if (distance < (this.difficulty === 'hard' ? 250 : 200) && this.boomerangCount === 0) {
              this.botMoveTarget = {x: -this.botMoveTarget.x, y: -this.botMoveTarget.y};
            }
          } else {
            this.botMoveTarget = {x: distY/distance, y: -(distX/distance)};
            if (Math.random() < 0.5) {
              this.botMoveTarget = {x: -this.botMoveTarget.x, y: -this.botMoveTarget.y};
            }
          }
        }
      }
    }

    if (!this.isHitting) {
      const moveX = this.botMoveTarget.x;
      const moveY = this.botMoveTarget.y;
      const magnitude = Math.hypot(moveX, moveY);
      if (magnitude > 0) {
        const newX = this.x + (moveX / magnitude) * this.speed;
        const newY = this.y + (moveY / magnitude) * this.speed;
        if (!this.isCollidingWithObstacle(newX, newY, obstacles)) {
          this.x = newX;
          this.y = newY;
        } else {
          this.botStateTimer = 0;
        }
        this.lastMoveDir = { x: moveX / magnitude, y: moveY / magnitude };
      }
    }

    if (this.boomerangCount > 0 && closestEnemyDist < 500 && closestEnemyDist > 100 && Math.random() < this.botThrowChance) {
      this.boomerangCount--;
      boomerangs.push(new Boomerang(this.x + this.width / 2, this.y + this.height / 2, 
                                     this.lastAimDir.x, this.lastAimDir.y, this));
    }

    this.checkBoundaries();
    this.checkObstacleCollision(obstacles);
  }

  isCollidingWithObstacle(x: number, y: number, obstacles: Obstacle[]) {
    for (const obstacle of obstacles) {
      if (x < obstacle.x + obstacle.width &&
          x + this.width > obstacle.x &&
          y < obstacle.y + obstacle.height &&
          y + this.height > obstacle.y) {
        return true;
      }
    }
    return false;
  }

  handleMovement(keys: Record<string, boolean>) {
    let moveX = 0;
    let moveY = 0;

    if (keys[this.controls.up]) moveY -= 1;
    if (keys[this.controls.down]) moveY += 1;
    if (keys[this.controls.left]) moveX -= 1;
    if (keys[this.controls.right]) moveX += 1;

    if (moveX !== 0 || moveY !== 0) {
      const magnitude = Math.sqrt(moveX * moveX + moveY * moveY);
      this.x += (moveX / magnitude) * this.speed;
      this.y += (moveY / magnitude) * this.speed;
      this.lastMoveDir = { x: moveX / magnitude, y: moveY / magnitude };
    }
  }

  handleDash(keys: Record<string, boolean>) {
    if (keys[this.controls.dash] && !this.isDashing && !this.isHitting) {
      this.isDashing = true;
      this.dashTimer = DASH_DURATION;
      this.dx = this.lastMoveDir.x;
      this.dy = this.lastMoveDir.y;
    }
  }

  checkBoundaries() {
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > BASE_WIDTH) this.x = BASE_WIDTH - this.width;
    if (this.y < 0) this.y = 0;
    if (this.y + this.height > BASE_HEIGHT) this.y = BASE_HEIGHT - this.height;
  }

  checkObstacleCollision(obstacles: Obstacle[]) {
    obstacles.forEach(obstacle => {
      if (this.x < obstacle.x + obstacle.width &&
          this.x + this.width > obstacle.x &&
          this.y < obstacle.y + obstacle.height &&
          this.y + this.height > obstacle.y) {
        const overlapX = (this.x + this.width / 2) - (obstacle.x + obstacle.width / 2);
        const overlapY = (this.y + this.height / 2) - (obstacle.y + obstacle.height / 2);
        const combinedHalfWidths = this.width / 2 + obstacle.width / 2;
        const combinedHalfHeights = this.height / 2 + obstacle.height / 2;

        if (Math.abs(overlapX) < combinedHalfWidths && Math.abs(overlapY) < combinedHalfHeights) {
          const overlapXAmount = combinedHalfWidths - Math.abs(overlapX);
          const overlapYAmount = combinedHalfHeights - Math.abs(overlapY);

          if (overlapXAmount < overlapYAmount) {
            this.x += overlapX > 0 ? overlapXAmount : -overlapXAmount;
          } else {
            this.y += overlapY > 0 ? overlapYAmount : -overlapYAmount;
          }
        }
      }
    });
  }

  draw(ctx: CanvasRenderingContext2D, preview = false) {
    const x = preview ? 0 : this.x;
    const y = preview ? 0 : this.y;

    ctx.save();
    ctx.fillStyle = this.color;
    if (this.stunTimer > 0) {
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 50) * 0.2;
    } else if (this.isEliminated) {
      ctx.globalAlpha = 0.4;
    }

    if (this.isHitting && !preview) {
      const hitProgress = 1 - (this.hitTimer / MELEE_DURATION);
      const lungeDistance = Math.sin(hitProgress * Math.PI) * 15;
      const lungeX = this.lastAimDir.x * lungeDistance;
      const lungeY = this.lastAimDir.y * lungeDistance;
      ctx.translate(lungeX, lungeY);
    }

    switch(this.characterType) {
      case 'boba':
        this.drawBoba(ctx, preview);
        break;
      case 'coffee':
        this.drawCoffee(ctx, preview);
        break;
      case 'juice':
        this.drawJuiceBox(ctx, preview);
        break;
    }

    if (this.boomerangCount > 0 && !preview) {
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;
      const angle = Math.atan2(this.lastAimDir.y, this.lastAimDir.x);
      
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);
      
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 4;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 8;
      
      const boomerangX1 = this.width / 2 - 2;
      const boomerangY1 = this.boomerangCount > 1 ? -BOOMERANG_SIZE / 4 : 0;
      ctx.beginPath();
      ctx.arc(boomerangX1, boomerangY1, BOOMERANG_SIZE / 3, Math.PI * 0.25, Math.PI * 1.75);
      ctx.stroke();
      
      if (this.boomerangCount > 1) {
        const boomerangX2 = this.width / 2 - 2;
        const boomerangY2 = BOOMERANG_SIZE / 4;
        ctx.beginPath();
        ctx.arc(boomerangX2, boomerangY2, BOOMERANG_SIZE / 3, Math.PI * 0.25, Math.PI * 1.75);
        ctx.stroke();
      }
      
      ctx.restore();
    }

    ctx.fillStyle = 'white';
    const eyeX1 = x + this.width * 0.3;
    const eyeX2 = x + this.width * 0.7;
    const eyeY = y + this.height * 0.4;
    ctx.beginPath();
    ctx.arc(eyeX1, eyeY, 4, 0, Math.PI * 2);
    ctx.arc(eyeX2, eyeY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'black';
    const pupilX1 = eyeX1 + this.lastAimDir.x * 1.5;
    const pupilY1 = eyeY + this.lastAimDir.y * 1.5;
    const pupilX2 = eyeX2 + this.lastAimDir.x * 1.5;
    const pupilY2 = eyeY + this.lastAimDir.y * 1.5;
    ctx.beginPath();
    ctx.arc(pupilX1, pupilY1, 2, 0, Math.PI * 2);
    ctx.arc(pupilX2, pupilY2, 2, 0, Math.PI * 2);
    ctx.fill();

    if (!preview) {
      ctx.save();
      ctx.font = "bold 16px 'Fredoka One'";
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      ctx.strokeText(this.playerNumber.toString(), this.x + this.width / 2, this.y - 8);
      ctx.fillStyle = 'white';
      ctx.fillText(this.playerNumber.toString(), this.x + this.width / 2, this.y - 8);
      ctx.restore();
    }

    if (this.isHitting && !preview) {
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;
      const angle = Math.atan2(this.lastAimDir.y, this.lastAimDir.x);
      const hitProgress = 1 - (this.hitTimer / MELEE_DURATION);
      
      ctx.save();
      ctx.globalAlpha = 0.8 * (1 - hitProgress);
      ctx.strokeStyle = "white";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, MELEE_RANGE * 0.8, angle - Math.PI/3, angle + Math.PI/3);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  drawBoba(ctx: CanvasRenderingContext2D, preview = false) {
    const x = preview ? 0 : this.x;
    const y = preview ? 0 : this.y;
    ctx.beginPath();
    ctx.moveTo(x, y + this.height);
    ctx.lineTo(x + this.width, y + this.height);
    ctx.lineTo(x + this.width * 0.9, y);
    ctx.lineTo(x + this.width * 0.1, y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#d1d5db';
    ctx.fillRect(x, y - 5, this.width, 5);
    
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.arc(x + this.width * 0.3, y + this.height * 0.8, 3, 0, Math.PI * 2);
    ctx.arc(x + this.width * 0.6, y + this.height * 0.85, 3.5, 0, Math.PI * 2);
    ctx.arc(x + this.width * 0.45, y + this.height * 0.7, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawCoffee(ctx: CanvasRenderingContext2D, preview = false) {
    const x = preview ? 0 : this.x;
    const y = preview ? 0 : this.y;
    ctx.fillStyle = '#8d6e63';
    ctx.beginPath();
    ctx.moveTo(x, y + this.height);
    ctx.lineTo(x + this.width, y + this.height);
    ctx.lineTo(x + this.width * 0.9, y);
    ctx.lineTo(x + this.width * 0.1, y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#a1887f';
    ctx.fillRect(x, y + this.height * 0.3, this.width, this.height * 0.4);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y - 5, this.width, 5);
  }

  drawJuiceBox(ctx: CanvasRenderingContext2D, preview = false) {
    const x = preview ? 0 : this.x;
    const y = preview ? 0 : this.y;
    ctx.fillStyle = '#ffb74d';
    ctx.fillRect(x, y, this.width, this.height);
    
    ctx.strokeStyle = '#fdd835';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + this.width * 0.7, y);
    ctx.lineTo(x + this.width * 0.7, y - 10);
    ctx.lineTo(x + this.width * 0.8, y - 15);
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.fillRect(x + 5, y + 5, this.width - 10, this.height - 10);
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.arc(x + this.width/2, y + this.height/2, 5, 0, Math.PI*2);
    ctx.fill();
  }
}

class Boomerang {
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

  constructor(x: number, y: number, dx: number, dy: number, owner: Player) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.owner = owner;
    this.size = BOOMERANG_SIZE;
    this.rotation = 0;
    this.distanceTraveled = 0;
    this.isReturning = false;
    this.isDropped = false;
    this.isPickedUp = false;
  }

  update(obstacles: Obstacle[]) {
    if (this.isDropped) return true;

    if (this.isReturning) {
      const dirX = this.owner.x + this.owner.width / 2 - this.x;
      const dirY = this.owner.y + this.owner.height / 2 - this.y;
      const magnitude = Math.sqrt(dirX * dirX + dirY * dirY);

      if (magnitude < this.size) {
        if (!this.owner.isEliminated && this.owner.boomerangCount < 2) this.owner.boomerangCount++;
        return false;
      }
      if (magnitude > 0) {
        this.dx = dirX / magnitude;
        this.dy = dirY / magnitude;
      }
    } else {
      this.distanceTraveled += BOOMERANG_SPEED;
      if (this.distanceTraveled >= BOOMERANG_RANGE) {
        this.isReturning = true;
      }
    }

    this.x += this.dx * BOOMERANG_SPEED;
    this.y += this.dy * BOOMERANG_SPEED;
    this.rotation += 0.3;
    
    if (this.x - this.size/2 < 0) { this.x = this.size/2; this.dx *= -1; this.isReturning = true; }
    if (this.x + this.size/2 > BASE_WIDTH) { this.x = BASE_WIDTH - this.size/2; this.dx *= -1; this.isReturning = true; }
    if (this.y - this.size/2 < 0) { this.y = this.size/2; this.dy *= -1; this.isReturning = true; }
    if (this.y + this.size/2 > BASE_HEIGHT) { this.y = BASE_HEIGHT - this.size/2; this.dy *= -1; this.isReturning = true; }

    obstacles.forEach(obstacle => {
      if (this.x + this.size/2 > obstacle.x &&
          this.x - this.size/2 < obstacle.x + obstacle.width &&
          this.y + this.size/2 > obstacle.y &&
          this.y - this.size/2 < obstacle.y + obstacle.height) {
        if (this.isReturning) {
          this.isDropped = true;
        } else {
          const prevX = this.x - this.dx * BOOMERANG_SPEED;
          const prevY = this.y - this.dy * BOOMERANG_SPEED;
          
          if (prevX + this.size/2 <= obstacle.x || prevX - this.size/2 >= obstacle.x + obstacle.width) {
            this.dx *= -1;
          }
          if (prevY + this.size/2 <= obstacle.y || prevY - this.size/2 >= obstacle.y + obstacle.height) {
            this.dy *= -1;
          }
          this.isReturning = true;
        }
      }
    });

    return true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.isDropped) {
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 4;
    } else {
      ctx.rotate(this.rotation);
      ctx.strokeStyle = this.owner.color;
      ctx.lineWidth = 5;
      ctx.shadowColor = this.owner.color;
      ctx.shadowBlur = 10;
    }
    
    ctx.beginPath();
    ctx.arc(0, 0, this.size / 2, 0, Math.PI * 1.5);
    ctx.stroke();
    ctx.restore();
  }
}

class Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = '#a8b2c5';
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

class Particle {
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

  constructor(x: number, y: number, color: string, count: number, decay: number, speed: number) {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.particles.push({
        x: x,
        y: y,
        dx: Math.cos(angle) * (Math.random() * speed),
        dy: Math.sin(angle) * (Math.random() * speed),
        radius: Math.random() * 3 + 1,
        alpha: 1,
        color: color,
        decay: decay,
      });
    }
  }

  update() {
    this.particles.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;
      p.alpha *= p.decay;
    });
    this.particles = this.particles.filter(p => p.alpha > 0.1);
    return this.particles.length > 0;
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
}

function getRandom(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showStartModal, setShowStartModal] = useState(true);
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showNextRound, setShowNextRound] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterType>('boba');
  const [selectedMode, setSelectedMode] = useState<GameMode>('solos');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const [totalBrawlers, setTotalBrawlers] = useState(2);
  const [matchScores, setMatchScores] = useState<number[]>([]);
  const [winnerText, setWinnerText] = useState('You Win!');
  const [winnerSubtext, setWinnerSubtext] = useState('');
  const [scoreInfo, setScoreInfo] = useState<{name: string, score: number, color: string}[]>([]);
  
  const gameStateRef = useRef({
    players: [] as Player[],
    boomerangs: [] as Boomerang[],
    obstacles: [] as Obstacle[],
    particles: [] as Particle[],
    playerInfo: [] as PlayerInfo[],
    matchScores: [] as number[],
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

        boomerangs.push(new Boomerang(centerX, centerY, normDx, normDy, player));
      }

      if (e.button === 2) {
        player.performHit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('resize', resizeCanvas);

    resizeCanvas();
    drawCharacterPreviews();

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

  const drawCharacterPreviews = () => {
    ['boba', 'coffee', 'juice'].forEach(charType => {
      const previewCanvas = document.getElementById(`${charType}-preview`) as HTMLCanvasElement;
      if (!previewCanvas) return;
      const pCtx = previewCanvas.getContext('2d');
      if (!pCtx) return;
      pCtx.clearRect(0, 0, 80, 80);
      
      const tempPlayer = new Player(0, 0, '#6b7280', {}, '', charType as CharacterType, 0, 1);
      
      pCtx.save();
      pCtx.translate(10, 10);
      pCtx.scale(2, 2);
      tempPlayer.draw(pCtx, true);
      pCtx.restore();
    });
  };

  const createParticle = (x: number, y: number, color: string, count = 20, decay = 0.95, speed = 4) => {
    gameStateRef.current.particles.push(new Particle(x, y, color, count, decay, speed));
  };

  const setupMap = () => {
    gameStateRef.current.obstacles = [];
    // Randomly select a map
    const mapNames = Object.keys(MAPS) as MapType[];
    const randomMap = mapNames[Math.floor(Math.random() * mapNames.length)];
    const mapData = MAPS[randomMap];
    mapData.forEach(o => {
      gameStateRef.current.obstacles.push(new Obstacle(o.x, o.y, o.w, o.h));
    });
  };

  const createPlayerInfo = () => {
    const playerTeamColor = '#f472b6';
    const botColors = ['#2dd4bf', '#f59e0b', '#8b5cf6'];
    const info: PlayerInfo[] = [];

    info.push({
      name: 'Player 1', color: playerTeamColor, character: selectedCharacter, isBot: false, team: 1
    });

    if (selectedMode === 'solos') {
      const botCount = totalBrawlers - 1;
      for (let i = 0; i < botCount; i++) {
        const botType = CHARACTER_TYPES[Math.floor(Math.random() * CHARACTER_TYPES.length)];
        info.push({ name: `Bot ${i+1}`, color: botColors[i], character: botType, isBot: true, team: 2 + i });
      }
    } else {
      let botType = CHARACTER_TYPES[Math.floor(Math.random() * CHARACTER_TYPES.length)];
      info.push({ name: 'Ally Bot', color: playerTeamColor, character: botType, isBot: true, team: 1 });
      botType = CHARACTER_TYPES[Math.floor(Math.random() * CHARACTER_TYPES.length)];
      info.push({ name: 'Enemy 1', color: botColors[0], character: botType, isBot: true, team: 2 });
      botType = CHARACTER_TYPES[Math.floor(Math.random() * CHARACTER_TYPES.length)];
      info.push({ name: 'Enemy 2', color: botColors[0], character: botType, isBot: true, team: 2 });
    }

    gameStateRef.current.playerInfo = info;
    gameStateRef.current.matchScores = new Array(info.length).fill(0);
    if (selectedMode === 'teams') gameStateRef.current.matchScores = [0, 0];
  };

  const resetRound = () => {
    // Reset all game state variables
    gameStateRef.current.isRoundOver = false;
    gameStateRef.current.boomerangs = [];
    gameStateRef.current.particles = [];
    gameStateRef.current.players = [];
    gameStateRef.current.keys = {};
    
    setupMap();
    
    let spawns = [...SPAWN_POINTS];
    shuffleArray(spawns);

    gameStateRef.current.playerInfo.forEach((info, index) => {
      const spawn = spawns[index % spawns.length];
      let x, y;
      if (selectedMode === 'teams') {
        if (info.team === 1) {
          x = 150 + (index % 2 * 50); y = BASE_HEIGHT / 2 - 50 + (index % 2 * 100);
        } else {
          x = BASE_WIDTH - 150 - (index % 2 * 50); y = BASE_HEIGHT / 2 - 50 + (index % 2 * 100);
        }
      } else {
        x = spawn.x; y = spawn.y;
      }
      
      gameStateRef.current.players.push(
        new Player(x, y, info.color, info.isBot ? {} : { up: 'w', down: 's', left: 'a', right: 'd', dash: 'e' }, 
                   info.name, info.character, info.team, index + 1, info.isBot, selectedDifficulty)
      );
    });
  };

  const checkCollisions = () => {
    const { players, boomerangs, obstacles } = gameStateRef.current;

    boomerangs.forEach(b => {
      if (b.isDropped) return;
      players.forEach(p => {
        if (p.team === b.owner.team || p.isDashing || p.stunTimer > 0) return;
        
        const hitDist = p.width / 2;
        if (Math.hypot(b.x - (p.x + p.width/2), b.y - (p.y + p.height/2)) < hitDist) {
          p.stunTimer = 1000;
          createParticle(p.x + p.width/2, p.y + p.height/2, '#FBBF24', 50, 0.96, 5);
        }
      });
    });

    players.forEach(attacker => {
      if (!attacker.isHitting) return;

      const attackerCenterX = attacker.x + attacker.width / 2;
      const attackerCenterY = attacker.y + attacker.height / 2;

      players.forEach(target => {
        if (attacker.team === target.team || target.stunTimer > 0 || target.isDashing) return;

        const targetCenterX = target.x + target.width / 2;
        const targetCenterY = target.y + target.height / 2;
        const dist = Math.hypot(attackerCenterX - targetCenterX, attackerCenterY - targetCenterY);
        
        if (dist < MELEE_RANGE) {
          const angleToTarget = Math.atan2(targetCenterY - attackerCenterY, targetCenterX - attackerCenterX);
          const attackAngle = Math.atan2(attacker.lastAimDir.y, attacker.lastAimDir.x);
          let angleDiff = Math.abs(attackAngle - angleToTarget);
          if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

          if (angleDiff < Math.PI / 2) {
            target.stunTimer = 500;
            createParticle(targetCenterX, targetCenterY, '#FFFFFF', 30, 0.9, 3);
          }
        }
      });

      boomerangs.forEach(b => {
        if (b.owner.team === attacker.team || b.isDropped) return;
        const dist = Math.hypot(attackerCenterX - b.x, attackerCenterY - b.y);
        if (dist < MELEE_RANGE) {
          b.isDropped = true;
          createParticle(b.x, b.y, '#FFFFFF', 15, 0.9, 2);
        }
      });
    });

    players.forEach(p => {
      if (p.boomerangCount < 2 && !p.isEliminated) {
        for (const b of boomerangs) {
          if (b.isDropped) {
            const distance = Math.hypot((p.x + p.width / 2) - b.x, (p.y + p.height / 2) - b.y);
            if (distance < p.width / 2 + b.size / 2) {
              p.boomerangCount++;
              b.isPickedUp = true;
              createParticle(b.x, b.y, '#FFFFFF', 15, 0.92, 3);
              break;
            }
          }
        }
      }
    });
  };

  const checkRoundOver = () => {
    if (gameStateRef.current.isRoundOver) return;
    
    const alivePlayers = gameStateRef.current.players.filter(p => !p.isEliminated);
    const aliveTeams = [...new Set(alivePlayers.map(p => p.team))];
    
    if (aliveTeams.length <= 1) {
      gameStateRef.current.isRoundOver = true;
      if (aliveTeams.length === 1) {
        const winningTeam = aliveTeams[0];
        if (selectedMode === 'teams') {
          gameStateRef.current.matchScores[winningTeam-1]++;
        } else {
          const winner = alivePlayers[0];
          const winnerIndex = gameStateRef.current.playerInfo.findIndex(p => p.team === winner.team);
          if (winnerIndex !== -1) gameStateRef.current.matchScores[winnerIndex]++;
        }
      }
      setTimeout(() => showNextRoundScreen(), 1500);
    }
  };

  const showNextRoundScreen = () => {
    if (gameStateRef.current.matchScores.some(score => score >= WIN_SCORE)) {
      endGame();
      return;
    }

    const info: {name: string, score: number, color: string}[] = [];
    if (selectedMode === 'teams') {
      info.push({name: 'Your Team', score: gameStateRef.current.matchScores[0], color: gameStateRef.current.playerInfo[0].color});
      info.push({name: 'Enemy Team', score: gameStateRef.current.matchScores[1], color: gameStateRef.current.playerInfo[2].color});
    } else {
      gameStateRef.current.playerInfo.forEach((p, index) => {
        info.push({
          name: p.name.replace('Player 1', 'You'),
          score: gameStateRef.current.matchScores[index],
          color: p.color
        });
      });
    }

    setScoreInfo(info);
    setMatchScores([...gameStateRef.current.matchScores]);
    setShowNextRound(true);
  };

  const endGame = () => {
    gameStateRef.current.isGameOver = true;
    
    if (selectedMode === 'teams') {
      const playerTeamWon = gameStateRef.current.matchScores[0] > gameStateRef.current.matchScores[1];
      setWinnerText(playerTeamWon ? 'Your Team Wins!' : 'Enemy Team Wins!');
      setWinnerSubtext(`Final Score: ${gameStateRef.current.matchScores[0]} to ${gameStateRef.current.matchScores[1]}.`);
    } else {
      let highScore = -1;
      let winnerIndex = -1;
      gameStateRef.current.matchScores.forEach((score, index) => {
        if (score > highScore) {
          highScore = score;
          winnerIndex = index;
        }
      });
      const winnerInfo = gameStateRef.current.playerInfo[winnerIndex];
      setWinnerText(`${winnerInfo.name.replace('Player 1', 'You')} Won!`);
      setWinnerSubtext(`With a final score of ${highScore}!`);
    }
    
    setShowGameOver(true);
  };

  const startGame = () => {
    // Cancel any existing game loop before starting a new one
    if (gameStateRef.current.animationId) {
      cancelAnimationFrame(gameStateRef.current.animationId);
    }
    
    // Complete reset of all game variables
    gameStateRef.current.players = [];
    gameStateRef.current.boomerangs = [];
    gameStateRef.current.obstacles = [];
    gameStateRef.current.particles = [];
    gameStateRef.current.keys = {};
    gameStateRef.current.matchScores = [];
    gameStateRef.current.isRoundOver = false;
    
    createPlayerInfo();
    gameStateRef.current.isGameOver = false;
    resetRound();
    gameLoop();
  };

  const gameLoop = () => {
    if (gameStateRef.current.isGameOver) return;

    const { players, boomerangs, particles, obstacles, keys, mousePos } = gameStateRef.current;
    
    players.forEach(p => p.update(keys, mousePos, players, boomerangs, obstacles, createParticle));
    gameStateRef.current.boomerangs = boomerangs.filter(b => b.update(obstacles) && !b.isPickedUp);
    gameStateRef.current.particles = particles.filter(p => p.update());
    checkCollisions();
    checkRoundOver();
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
      obstacles.forEach(o => o.draw(ctx));
      players.forEach(p => p.draw(ctx));
      boomerangs.forEach(b => b.draw(ctx));
      particles.forEach(p => p.draw(ctx));
    }

    gameStateRef.current.animationId = requestAnimationFrame(gameLoop);
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-background">
      <canvas 
        ref={canvasRef} 
        className="bg-card rounded-2xl shadow-2xl"
        style={{ aspectRatio: '16/9', maxWidth: '100%', maxHeight: '100%' }}
      />

      {showStartModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card text-card-foreground text-center p-10 rounded-2xl shadow-2xl max-w-lg">
            <h1 className="text-6xl font-bold mb-4">Foodie Brawlers</h1>
            <p className="text-muted-foreground mb-8 text-lg">Dash, dodge, and brawl to become the last foodie standing!</p>
            <div className="flex justify-center text-left mb-8">
              <div className="bg-muted/50 p-6 rounded-lg border border-border">
                <h3 className="font-bold text-2xl text-primary mb-2">Controls</h3>
                <p className="text-foreground"><kbd className="font-sans bg-muted rounded px-2 py-1">W</kbd> <kbd className="font-sans bg-muted rounded px-2 py-1">A</kbd> <kbd className="font-sans bg-muted rounded px-2 py-1">S</kbd> <kbd className="font-sans bg-muted rounded px-2 py-1">D</kbd> - Move</p>
                <p className="text-foreground"><kbd className="font-sans bg-muted rounded px-2 py-1">Left Click</kbd> - Throw Boomerang</p>
                <p className="text-foreground"><kbd className="font-sans bg-muted rounded px-2 py-1">Right Click</kbd> - Melee Hit</p>
                <p className="text-foreground"><kbd className="font-sans bg-muted rounded px-2 py-1">E</kbd> - Dash</p>
              </div>
            </div>
            <Button 
              onClick={() => {
                setShowStartModal(false);
                setShowCharacterSelect(true);
                setTimeout(drawCharacterPreviews, 100);
              }} 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 px-10 rounded-full text-2xl"
            >
              Play
            </Button>
          </div>
        </div>
      )}

      {showCharacterSelect && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card text-card-foreground text-center p-8 rounded-2xl shadow-2xl max-w-4xl w-full">
            <h2 className="text-4xl font-bold mb-6">Game Setup</h2>
            
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold mb-3">Choose Your Fighter</h3>
                <div className="flex justify-center gap-6 mb-6">
                  {(['boba', 'coffee', 'juice'] as CharacterType[]).map(char => (
                    <div
                      key={char}
                      className={`border-4 rounded-xl p-4 cursor-pointer transition-all ${
                        selectedCharacter === char ? 'border-primary bg-primary/10' : 'border-transparent bg-muted hover:scale-105'
                      }`}
                      onClick={() => setSelectedCharacter(char)}
                    >
                      <canvas id={`${char}-preview`} width="80" height="80" className="mb-2"></canvas>
                      <p className="font-bold capitalize">{char}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-muted/50 p-6 rounded-lg">
                <h3 className="text-2xl font-bold mb-4">Game Rules</h3>
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div>
                    <h4 className="text-xl font-bold mb-2 text-muted-foreground">Game Mode</h4>
                    <div className="flex justify-center gap-2">
                      <button
                        className={`border-2 px-4 py-2 rounded-full font-bold ${
                          selectedMode === 'solos' ? 'bg-secondary text-secondary-foreground border-secondary' : 'border-border'
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
                          selectedMode === 'teams' ? 'bg-secondary text-secondary-foreground border-secondary' : 'border-border'
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
                    <h4 className="text-xl font-bold mb-2 text-muted-foreground">Total Brawlers</h4>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        className="text-xl font-bold bg-muted rounded-full w-8 h-8 flex items-center justify-center disabled:opacity-50"
                        onClick={() => setTotalBrawlers(Math.max(2, totalBrawlers - 1))}
                        disabled={selectedMode === 'teams' || totalBrawlers <= 2}
                      >
                        -
                      </button>
                      <span className="text-2xl font-bold w-10 text-center">{totalBrawlers}</span>
                      <button
                        className="text-xl font-bold bg-muted rounded-full w-8 h-8 flex items-center justify-center disabled:opacity-50"
                        onClick={() => setTotalBrawlers(Math.min(4, totalBrawlers + 1))}
                        disabled={selectedMode === 'teams' || totalBrawlers >= 4}
                      >
                        +
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedMode === 'teams' ? '2 vs 2' : 'Free-For-All'}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xl font-bold mb-2 text-muted-foreground">Bot Difficulty</h4>
                  <div className="flex justify-center gap-2">
                    {(['easy', 'medium', 'hard'] as Difficulty[]).map(diff => (
                      <button
                        key={diff}
                        className={`border-2 px-4 py-2 rounded-full font-bold ${
                          selectedDifficulty === diff ? 'bg-secondary text-secondary-foreground border-secondary' : 'border-border'
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
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold py-4 px-12 rounded-full text-2xl mt-8"
            >
              Brawl!
            </Button>
          </div>
        </div>
      )}

      {showGameOver && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card text-card-foreground text-center p-8 rounded-2xl shadow-2xl">
            <h2 className="text-5xl font-bold mb-4">{winnerText}</h2>
            <p className="text-muted-foreground mb-6">{winnerSubtext}</p>
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => {
                  setShowGameOver(false);
                  startGame();
                }}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold py-3 px-8 rounded-full text-xl"
              >
                Play Again
              </Button>
              <Button
                onClick={() => {
                  setShowGameOver(false);
                  setShowStartModal(true);
                  gameStateRef.current.isGameOver = true;
                }}
                className="bg-muted hover:bg-muted/90 text-foreground font-bold py-3 px-8 rounded-full text-xl"
              >
                Main Menu
              </Button>
            </div>
          </div>
        </div>
      )}

      {showNextRound && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card text-card-foreground text-center p-8 rounded-2xl shadow-2xl max-w-md">
            <h2 className="text-4xl font-bold mb-4">Round Over!</h2>
            <p className="text-lg mb-4 text-muted-foreground">First to {WIN_SCORE} wins</p>
            <div className="mb-6 space-y-2 text-lg">
              {scoreInfo.map((info, i) => (
                <div key={i} className="flex justify-between items-center bg-muted/50 p-2 rounded">
                  <span className="font-bold" style={{color: info.color}}>{info.name}</span>
                  <span className="font-bold text-2xl">{info.score}</span>
                </div>
              ))}
            </div>
            <Button
              onClick={() => {
                setShowNextRound(false);
                resetRound();
                gameLoop();
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-8 rounded-full text-xl"
            >
              Next Round
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
