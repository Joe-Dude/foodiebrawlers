import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type CharacterType = 'boba' | 'coffee' | 'juice' | 'soda' | 'smoothie' | 'milkshake' | 'pizza' | 'burger' | 'taco' | 'hotdog' | 'donut' | 'cupcake' | 'icecream' | 'ramen' | 'sushi' | 'cookie' | 'pretzel' | 'popcorn' | 'nachos' | 'fries' | 'waffle' | 'pancake' | 'croissant' | 'muffin' | 'bagel' | 'sandwich';
type GameMode = 'solos' | 'teams';
type TeamSize = 4 | 6;
type Difficulty = 'easy' | 'medium' | 'hard';
type MapType = 'classic' | 'pillars' | 'open' | 'maze' | 'corners' | 'cross' | 'diamond' | 'rings' | 'scattered' | 'boxes' | 'walls' | 'chambers' | 'grid' | 'plus' | 'circle' | 'zigzag' | 'lanes' | 'fortress' | 'temple' | 'arena' | 'colosseum' | 'dungeon' | 'castle' | 'garden';

const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;
const PLAYER_SIZE = 30;
const PLAYER_SPEED = 4.5;
const DASH_SPEED = 18;
const DASH_DURATION = 60;
const DASH_COOLDOWN = 800;
const BOOMERANG_SIZE = 25;
const BOOMERANG_SPEED = 7;
const BOOMERANG_RANGE = 250;
const MELEE_RANGE = 45;
const MELEE_DURATION = 150;
const MELEE_COOLDOWN = 400;
const WIN_SCORE = 10;
const ROUNDS_TO_UNLOCK = 5;
const CHARACTER_TYPES: CharacterType[] = ['boba', 'coffee', 'juice', 'soda', 'smoothie', 'milkshake', 'pizza', 'burger', 'taco', 'hotdog', 'donut', 'cupcake', 'icecream', 'ramen', 'sushi', 'cookie', 'pretzel', 'popcorn', 'nachos', 'fries', 'waffle', 'pancake', 'croissant', 'muffin', 'bagel', 'sandwich'];

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
  open: [],
  maze: [
    {x: 200, y: 100, w: 300, h: 40}, {x: 600, y: 100, w: 40, h: 200},
    {x: 780, y: 100, w: 300, h: 40}, {x: 640, y: 300, w: 40, h: 200},
    {x: 200, y: 580, w: 300, h: 40}, {x: 780, y: 420, w: 300, h: 40},
  ],
  corners: [
    {x: 100, y: 100, w: 200, h: 100}, {x: 980, y: 100, w: 200, h: 100},
    {x: 100, y: 520, w: 200, h: 100}, {x: 980, y: 520, w: 200, h: 100},
  ],
  cross: [
    {x: 540, y: 100, w: 200, h: 200}, {x: 540, y: 420, w: 200, h: 200},
    {x: 200, y: 280, w: 200, h: 160}, {x: 880, y: 280, w: 200, h: 160},
  ],
  diamond: [
    {x: 540, y: 60, w: 200, h: 60}, {x: 200, y: 330, w: 200, h: 60},
    {x: 880, y: 330, w: 200, h: 60}, {x: 540, y: 600, w: 200, h: 60},
  ],
  rings: [
    {x: 350, y: 200, w: 580, h: 40}, {x: 350, y: 480, w: 580, h: 40},
    {x: 350, y: 200, w: 40, h: 320}, {x: 890, y: 200, w: 40, h: 320},
  ],
  scattered: [
    {x: 150, y: 150, w: 80, h: 80}, {x: 400, y: 100, w: 60, h: 120},
    {x: 800, y: 150, w: 100, h: 70}, {x: 1050, y: 100, w: 80, h: 100},
    {x: 200, y: 450, w: 90, h: 90}, {x: 950, y: 500, w: 110, h: 80},
  ],
  boxes: [
    {x: 250, y: 150, w: 100, h: 100}, {x: 930, y: 150, w: 100, h: 100},
    {x: 250, y: 470, w: 100, h: 100}, {x: 930, y: 470, w: 100, h: 100},
    {x: 590, y: 310, w: 100, h: 100},
  ],
  walls: [
    {x: 400, y: 100, w: 40, h: 520}, {x: 840, y: 100, w: 40, h: 520},
    {x: 200, y: 340, w: 200, h: 40}, {x: 880, y: 340, w: 200, h: 40},
  ],
  chambers: [
    {x: 320, y: 100, w: 40, h: 250}, {x: 320, y: 370, w: 40, h: 250},
    {x: 920, y: 100, w: 40, h: 250}, {x: 920, y: 370, w: 40, h: 250},
    {x: 560, y: 280, w: 160, h: 160},
  ],
  grid: [
    {x: 300, y: 180, w: 40, h: 360}, {x: 640, y: 180, w: 40, h: 360},
    {x: 980, y: 180, w: 40, h: 360}, {x: 180, y: 300, w: 920, h: 40},
    {x: 180, y: 420, w: 920, h: 40},
  ],
  plus: [
    {x: 540, y: 50, w: 200, h: 250}, {x: 540, y: 420, w: 200, h: 250},
    {x: 180, y: 280, w: 360, h: 160}, {x: 740, y: 280, w: 360, h: 160},
  ],
  circle: [
    {x: 440, y: 150, w: 400, h: 50}, {x: 440, y: 520, w: 400, h: 50},
    {x: 440, y: 150, w: 50, h: 420}, {x: 790, y: 150, w: 50, h: 420},
  ],
  zigzag: [
    {x: 100, y: 120, w: 300, h: 40}, {x: 880, y: 240, w: 300, h: 40},
    {x: 100, y: 360, w: 300, h: 40}, {x: 880, y: 480, w: 300, h: 40},
    {x: 100, y: 600, w: 300, h: 40},
  ],
  lanes: [
    {x: 360, y: 50, w: 40, h: 620}, {x: 880, y: 50, w: 40, h: 620},
    {x: 200, y: 200, w: 160, h: 40}, {x: 920, y: 480, w: 160, h: 40},
  ],
  fortress: [
    {x: 150, y: 150, w: 150, h: 50}, {x: 980, y: 150, w: 150, h: 50},
    {x: 150, y: 520, w: 150, h: 50}, {x: 980, y: 520, w: 150, h: 50},
    {x: 540, y: 100, w: 200, h: 40}, {x: 540, y: 580, w: 200, h: 40},
  ],
  temple: [
    {x: 200, y: 250, w: 50, h: 220}, {x: 1030, y: 250, w: 50, h: 220},
    {x: 450, y: 250, w: 50, h: 220}, {x: 780, y: 250, w: 50, h: 220},
    {x: 540, y: 100, w: 200, h: 100}, {x: 540, y: 520, w: 200, h: 100},
  ],
  arena: [
    {x: 300, y: 100, w: 680, h: 40}, {x: 300, y: 580, w: 680, h: 40},
    {x: 300, y: 100, w: 40, h: 520}, {x: 940, y: 100, w: 40, h: 520},
  ],
  colosseum: [
    {x: 250, y: 80, w: 780, h: 50}, {x: 250, y: 590, w: 780, h: 50},
    {x: 250, y: 80, w: 50, h: 560}, {x: 980, y: 80, w: 50, h: 560},
    {x: 590, y: 310, w: 100, h: 100},
  ],
  dungeon: [
    {x: 200, y: 200, w: 40, h: 320}, {x: 400, y: 200, w: 40, h: 320},
    {x: 840, y: 200, w: 40, h: 320}, {x: 1040, y: 200, w: 40, h: 320},
    {x: 540, y: 80, w: 200, h: 80}, {x: 540, y: 560, w: 200, h: 80},
  ],
  castle: [
    {x: 150, y: 100, w: 120, h: 520}, {x: 1010, y: 100, w: 120, h: 520},
    {x: 420, y: 280, w: 40, h: 160}, {x: 820, y: 280, w: 40, h: 160},
    {x: 540, y: 50, w: 200, h: 80},
  ],
  garden: [
    {x: 200, y: 180, w: 80, h: 80}, {x: 380, y: 180, w: 80, h: 80},
    {x: 820, y: 180, w: 80, h: 80}, {x: 1000, y: 180, w: 80, h: 80},
    {x: 200, y: 460, w: 80, h: 80}, {x: 380, y: 460, w: 80, h: 80},
    {x: 820, y: 460, w: 80, h: 80}, {x: 1000, y: 460, w: 80, h: 80},
  ]
};

const SPAWN_POINTS = [
  {x: 150, y: 150},
  {x: BASE_WIDTH - 150, y: 150},
  {x: 150, y: BASE_HEIGHT - 150},
  {x: BASE_WIDTH - 150, y: BASE_HEIGHT - 150},
  {x: BASE_WIDTH / 2, y: 150},
  {x: BASE_WIDTH / 2, y: BASE_HEIGHT - 150},
  {x: 150, y: BASE_HEIGHT / 2},
  {x: BASE_WIDTH - 150, y: BASE_HEIGHT / 2}
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
  dashCooldown: number;
  dx: number;
  dy: number;
  stunTimer: number;
  deathTimer: number;
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
  isBlocking: boolean;
  blockCooldown: number;
  revivalTimer: number;
  reviver: Player | null;

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
    this.dashCooldown = 0;
    this.dx = 0;
    this.dy = 0;
    this.stunTimer = 0;
    this.deathTimer = 0;
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
    this.isBlocking = false;
    this.blockCooldown = 0;
    this.revivalTimer = 0;
    this.reviver = null;
  }

  update(keys: Record<string, boolean>, mousePos: {x: number, y: number}, 
         players: Player[], boomerangs: Boomerang[], obstacles: Obstacle[], 
         createParticle: (x: number, y: number, color: string, count?: number, decay?: number, speed?: number) => void) {
    // Drop boomerangs immediately when stunTimer reaches elimination threshold
    if (this.stunTimer > 0 && this.stunTimer <= 1000 / 60 && !this.isEliminated) {
      // Drop all boomerangs at current position before elimination
      if (this.boomerangCount > 0) {
        for (let i = 0; i < this.boomerangCount; i++) {
          boomerangs.push(
            Object.assign(new Boomerang(this.x + this.width / 2, this.y + this.height / 2, 0, 0, this), { isDropped: true })
          );
        }
        this.boomerangCount = 0;
      }
      this.deathTimer = 2000;
      this.isEliminated = true;
    }
    
    if (this.isEliminated && this.deathTimer > 0) {
      this.deathTimer -= 1000/60;
    }
    
    if (this.isEliminated) {
      // Check for revival in team mode
      if (this.deathTimer <= 0) {
        const revivers = players.filter(p => p.team === this.team && !p.isEliminated);
        let beingRevived = false;
        for (const reviver of revivers) {
          const dist = Math.hypot(reviver.x - this.x, reviver.y - this.y);
          if (dist < PLAYER_SIZE * 2) {
            beingRevived = true;
            this.reviver = reviver;
            this.revivalTimer += 1000/60;
            if (this.revivalTimer >= 2000) {
              // Revive!
              this.isEliminated = false;
              this.stunTimer = 0;
              this.deathTimer = 0;
              this.revivalTimer = 0;
              this.reviver = null;
              this.boomerangCount = 1;
              createParticle(this.x + this.width / 2, this.y + this.height / 2, this.color, 50, 0.95, 6);
            }
            break;
          }
        }
        if (!beingRevived) {
          this.revivalTimer = 0;
          this.reviver = null;
        }
      }
      return;
    }
    
    if (this.hitTimer > 0) this.hitTimer -= 1000/60;
    if (this.hitCooldown > 0) this.hitCooldown -= 1000/60;
    if (this.dashCooldown > 0) this.dashCooldown -= 1000/60;
    if (this.blockCooldown > 0) this.blockCooldown -= 1000/60;
    if (this.hitTimer <= 0) this.isHitting = false;
    if (this.blockCooldown <= 0) this.isBlocking = false;

    if (this.isBot) {
      this.handleBotAI(players, boomerangs, obstacles);
    } else {
      this.handlePlayerInput(keys, mousePos, createParticle, obstacles);
    }
  }

  performHit() {
    const meleeCooldown = this.isBot ? (this.difficulty === 'hard' ? 300 : MELEE_COOLDOWN) : MELEE_COOLDOWN;
    if (this.hitCooldown <= 0 && !this.isDashing && this.stunTimer <= 0 && this.boomerangCount > 0) {
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
      return;
    }

    // Check for fallen teammates to revive (medium and hard bots only)
    if ((this.difficulty === 'medium' || this.difficulty === 'hard')) {
      const fallenTeammates = players.filter(p => 
        p.team === this.team && 
        p.isEliminated && 
        p.deathTimer <= 0 && 
        !p.isBot === false // only revive other bots or player
      );
      
      if (fallenTeammates.length > 0) {
        // Find closest fallen teammate
        let closestFallen: Player | null = null;
        let closestFallenDist = Infinity;
        
        fallenTeammates.forEach(fallen => {
          const dist = Math.hypot(this.x - fallen.x, this.y - fallen.y);
          if (dist < closestFallenDist) {
            closestFallenDist = dist;
            closestFallen = fallen;
          }
        });
        
        // If a fallen teammate is within reasonable range and no immediate threats
        if (closestFallen && closestFallenDist < 300) {
          const immediateEnemies = players.filter(p => 
            p.team !== this.team && 
            !p.isEliminated && 
            Math.hypot(this.x - p.x, this.y - p.y) < 200
          );
          
          // Prioritize revival if safe (hard bots) or mostly safe (medium bots)
          const shouldRevive = this.difficulty === 'hard' 
            ? immediateEnemies.length === 0
            : immediateEnemies.length === 0 || Math.random() < 0.3;
          
          if (shouldRevive) {
            // Move towards fallen teammate
            const distX = closestFallen.x - this.x;
            const distY = closestFallen.y - this.y;
            const distance = Math.hypot(distX, distY);
            
            if (distance > 0 && !this.isHitting && !this.isDashing) {
              const moveX = distX / distance;
              const moveY = distY / distance;
              const newX = this.x + moveX * this.speed;
              const newY = this.y + moveY * this.speed;
              
              if (!this.isCollidingWithObstacle(newX, newY, obstacles)) {
                this.x = newX;
                this.y = newY;
                this.lastMoveDir = { x: moveX, y: moveY };
              }
            }
            
            // Update aim direction towards fallen teammate
            if (distance > 0) {
              this.lastAimDir = { x: distX / distance, y: distY / distance };
            }
            
            this.checkBoundaries();
            this.checkObstacleCollision(obstacles);
            return; // Skip normal combat behavior while reviving
          }
        }
      }
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

    // Find the greatest threat: prioritize enemies with boomerangs incoming or close enemies
    const alivePlayers = players.filter(p => !p.isEliminated);
    let enemyTarget: Player | null = null;
    let closestEnemyDist = Infinity;
    let greatestThreat: Player | null = null;
    let greatestThreatScore = -Infinity;

    // Check for incoming boomerangs from enemies
    const incomingBoomerangs = boomerangs.filter(b => 
      !b.isDropped && b.owner.team !== this.team && b.isReturning === false
    );
    
    players.filter(p => p.team !== this.team && !p.isEliminated).forEach(opponent => {
      const dist = Math.hypot(this.x - opponent.x, this.y - opponent.y);
      
      // Calculate threat score based on multiple factors
      let threatScore = 0;
      
      // Closer enemies are more threatening
      threatScore += (1000 - dist) / 10;
      
      // Enemies with boomerangs are more threatening
      if (opponent.boomerangCount > 0) {
        threatScore += 100;
      }
      
      // Enemies actively throwing at us are most threatening
      const boomerangsFromOpponent = incomingBoomerangs.filter(b => b.owner === opponent);
      boomerangsFromOpponent.forEach(b => {
        const boomDist = Math.hypot(b.x - (this.x + this.width/2), b.y - (this.y + this.height/2));
        if (boomDist < 200) {
          threatScore += 200 - boomDist;
        }
      });
      
      // Very close enemies are immediate threats
      if (dist < 150) {
        threatScore += 150;
      }
      
      if (threatScore > greatestThreatScore) {
        greatestThreatScore = threatScore;
        greatestThreat = opponent;
      }
      
      if (dist < closestEnemyDist) {
        closestEnemyDist = dist;
        enemyTarget = opponent;
      }
    });
    
    // Use greatest threat if found, otherwise use closest enemy
    enemyTarget = greatestThreat || enemyTarget;
    if (enemyTarget) {
      closestEnemyDist = Math.hypot(this.x - enemyTarget.x, this.y - enemyTarget.y);
    }
    if (!enemyTarget) return;

    let finalTarget: Player | Boomerang = enemyTarget;
    
    // Hard bots rush enemies without boomerangs
    if (this.difficulty === 'hard' && enemyTarget.boomerangCount === 0 && this.boomerangCount > 0) {
      finalTarget = enemyTarget;
    } else if (boomerangTarget && this.boomerangCount === 0) {
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

    // Bot dashing based on difficulty
    const shouldDash = this.difficulty === 'hard' ? Math.random() < 0.05 : 
                      this.difficulty === 'medium' ? Math.random() < 0.02 : false;
    if (shouldDash && !this.isDashing && this.dashCooldown <= 0) {
      this.isDashing = true;
      this.dashTimer = DASH_DURATION;
      this.dashCooldown = DASH_COOLDOWN;
      this.dx = this.lastMoveDir.x;
      this.dy = this.lastMoveDir.y;
    }

    if (this.isDashing) {
      this.x += this.dx * DASH_SPEED;
      this.y += this.dy * DASH_SPEED;
      this.dashTimer -= 1000 / 60;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    }

    if (finalTarget === boomerangTarget) {
      if (distance > 0) {
        this.botMoveTarget = {x: distX/distance, y: distY/distance};
      }
    } else {
      this.botStateTimer -= 1000 / 60;
      if (this.botStateTimer <= 0) {
        const dodgeFreq = this.difficulty === 'medium' ? 0.7 : this.difficulty === 'easy' ? 0.2 : 0.4;
        this.botStateTimer = getRandom(this.difficulty === 'easy' ? 800 : 300, this.difficulty === 'easy' ? 1500 : 1000);
        const action = Math.random();
        if (distance > 0) {
          // Easy: mostly rush straight
          if (this.difficulty === 'easy') {
            this.botMoveTarget = {x: distX/distance, y: distY/distance};
          } else if (action < (1 - dodgeFreq)) {
            // Rush toward enemy
            this.botMoveTarget = {x: distX/distance, y: distY/distance};
            if (distance < (this.difficulty === 'hard' ? 250 : 200) && this.boomerangCount === 0) {
              this.botMoveTarget = {x: -this.botMoveTarget.x, y: -this.botMoveTarget.y};
            }
          } else {
            // Dodge/strafe
            this.botMoveTarget = {x: distY/distance, y: -(distX/distance)};
            if (Math.random() < 0.5) {
              this.botMoveTarget = {x: -this.botMoveTarget.x, y: -this.botMoveTarget.y};
            }
          }
        }
      }
    }

    if (!this.isHitting && !this.isDashing) {
      const moveX = this.botMoveTarget.x;
      const moveY = this.botMoveTarget.y;
      const magnitude = Math.hypot(moveX, moveY);
      if (magnitude > 0) {
        const newX = this.x + (moveX / magnitude) * this.speed;
        const newY = this.y + (moveY / magnitude) * this.speed;
        
        // All bots now strategically avoid obstacles
        if (this.isCollidingWithObstacle(newX, newY, obstacles)) {
          // Try alternative paths - perpendicular and diagonal options
          const altPaths = [
            {x: moveY, y: -moveX},  // perpendicular right
            {x: -moveY, y: moveX},  // perpendicular left
            {x: moveX * 0.7 + moveY * 0.7, y: moveY * 0.7 - moveX * 0.7},  // diagonal right
            {x: moveX * 0.7 - moveY * 0.7, y: moveY * 0.7 + moveX * 0.7},  // diagonal left
            {x: -moveX * 0.3 + moveY, y: -moveY * 0.3 - moveX},  // back and around
            {x: -moveX * 0.3 - moveY, y: -moveY * 0.3 + moveX}   // back and around other way
          ];
          
          let moved = false;
          for (const alt of altPaths) {
            const altMag = Math.hypot(alt.x, alt.y);
            if (altMag === 0) continue;
            const testX = this.x + (alt.x / altMag) * this.speed;
            const testY = this.y + (alt.y / altMag) * this.speed;
            if (!this.isCollidingWithObstacle(testX, testY, obstacles)) {
              this.x = testX;
              this.y = testY;
              this.lastMoveDir = { x: alt.x / altMag, y: alt.y / altMag };
              moved = true;
              break;
            }
          }
          
          // If no path found, reset state timer to recalculate target
          if (!moved) {
            this.botStateTimer = 0;
          }
        } else if (!this.isCollidingWithObstacle(newX, newY, obstacles)) {
          this.x = newX;
          this.y = newY;
          this.lastMoveDir = { x: moveX / magnitude, y: moveY / magnitude };
        } else {
          this.botStateTimer = 0;
        }
      }
    }

    // Bot throwing based on difficulty
    let throwChance = this.difficulty === 'easy' ? 0.2 : 
                       this.difficulty === 'medium' ? 0.012 : 0.018;
    const throwDistMin = this.difficulty === 'easy' ? 80 : this.difficulty === 'medium' ? 100 : 120;
    const throwDistMax = this.difficulty === 'easy' ? 500 : this.difficulty === 'medium' ? 450 : 400;
    
    if (this.boomerangCount > 0 && closestEnemyDist < throwDistMax && 
        closestEnemyDist > throwDistMin && Math.random() < throwChance) {
      this.boomerangCount--;
      boomerangs.push(new Boomerang(this.x + this.width / 2, this.y + this.height / 2, 
                                     this.lastAimDir.x, this.lastAimDir.y, this));
    }

    // Hard bots block incoming boomerangs with prediction
    if (this.difficulty === 'hard' && this.boomerangCount > 0 && !this.isBlocking && this.blockCooldown <= 0) {
      const incomingBoomerangs = boomerangs.filter(b => 
        !b.isDropped && b.owner.team !== this.team && b.isReturning === false
      );
      for (const b of incomingBoomerangs) {
        const dist = Math.hypot(b.x - (this.x + this.width/2), b.y - (this.y + this.height/2));
        
        // Calculate if boomerang is heading towards us
        const vecToUs = {
          x: (this.x + this.width/2) - b.x,
          y: (this.y + this.height/2) - b.y
        };
        const boomDir = {x: b.dx, y: b.dy};
        const dotProduct = vecToUs.x * boomDir.x + vecToUs.y * boomDir.y;
        
        // Block if boomerang is close and heading towards us, or very close
        if ((dist < 250 && dotProduct > 0.3) || dist < 120) {
          this.isBlocking = true;
          this.blockCooldown = 600;
          break;
        }
      }
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
    if (keys[this.controls.dash] && !this.isDashing && !this.isHitting && this.dashCooldown <= 0) {
      this.isDashing = true;
      this.dashTimer = DASH_DURATION;
      this.dashCooldown = DASH_COOLDOWN;
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
    } else if (this.isEliminated && this.deathTimer > 0) {
      ctx.globalAlpha = Math.max(0.1, this.deathTimer / 2000);
    } else if (this.isEliminated) {
      return;
    }

    if (this.isHitting && !preview) {
      const hitProgress = 1 - (this.hitTimer / MELEE_DURATION);
      const lungeDistance = Math.sin(hitProgress * Math.PI) * 15;
      const lungeX = this.lastAimDir.x * lungeDistance;
      const lungeY = this.lastAimDir.y * lungeDistance;
      ctx.translate(lungeX, lungeY);
    }

    switch(this.characterType) {
      case 'boba': this.drawBoba(ctx, preview); break;
      case 'coffee': this.drawCoffee(ctx, preview); break;
      case 'juice': this.drawJuiceBox(ctx, preview); break;
      case 'soda': this.drawSoda(ctx, preview); break;
      case 'smoothie': this.drawSmoothie(ctx, preview); break;
      case 'milkshake': this.drawMilkshake(ctx, preview); break;
      case 'pizza': this.drawPizza(ctx, preview); break;
      case 'burger': this.drawBurger(ctx, preview); break;
      case 'taco': this.drawTaco(ctx, preview); break;
      case 'hotdog': this.drawHotdog(ctx, preview); break;
      case 'donut': this.drawDonut(ctx, preview); break;
      case 'cupcake': this.drawCupcake(ctx, preview); break;
      case 'icecream': this.drawIcecream(ctx, preview); break;
      case 'ramen': this.drawRamen(ctx, preview); break;
      case 'sushi': this.drawSushi(ctx, preview); break;
      case 'cookie': this.drawCookie(ctx, preview); break;
      case 'pretzel': this.drawPretzel(ctx, preview); break;
      case 'popcorn': this.drawPopcorn(ctx, preview); break;
      case 'nachos': this.drawNachos(ctx, preview); break;
      case 'fries': this.drawFries(ctx, preview); break;
      case 'waffle': this.drawWaffle(ctx, preview); break;
      case 'pancake': this.drawPancake(ctx, preview); break;
      case 'croissant': this.drawCroissant(ctx, preview); break;
      case 'muffin': this.drawMuffin(ctx, preview); break;
      case 'bagel': this.drawBagel(ctx, preview); break;
      case 'sandwich': this.drawSandwich(ctx, preview); break;
    }

    if (this.boomerangCount > 0 && !preview && !this.isEliminated && this.deathTimer <= 0) {
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

    if (this.isEliminated && this.deathTimer > 0 && !preview) {
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      const eyeX1 = x + this.width * 0.3;
      const eyeX2 = x + this.width * 0.7;
      const eyeY = y + this.height * 0.4;
      const xSize = 3;
      
      ctx.beginPath();
      ctx.moveTo(eyeX1 - xSize, eyeY - xSize);
      ctx.lineTo(eyeX1 + xSize, eyeY + xSize);
      ctx.moveTo(eyeX1 + xSize, eyeY - xSize);
      ctx.lineTo(eyeX1 - xSize, eyeY + xSize);
      ctx.moveTo(eyeX2 - xSize, eyeY - xSize);
      ctx.lineTo(eyeX2 + xSize, eyeY + xSize);
      ctx.moveTo(eyeX2 + xSize, eyeY - xSize);
      ctx.lineTo(eyeX2 - xSize, eyeY + xSize);
      ctx.stroke();
    } else {
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
    }

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

    if (this.isBlocking && !preview) {
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;
      ctx.save();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 3;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.width * 0.8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (!preview && this.isEliminated && this.deathTimer <= 0 && this.revivalTimer > 0 && this.reviver) {
      ctx.save();
      const progress = this.revivalTimer / 2000;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2, this.y - 15, 8, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
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

  drawSoda(ctx: CanvasRenderingContext2D, preview = false) {
    const x = preview ? 0 : this.x;
    const y = preview ? 0 : this.y;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + this.width * 0.2, y, this.width * 0.6, this.height);
    
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.arc(x + this.width / 2, y + 5, this.width * 0.35, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(x + this.width * 0.25, y + this.height * 0.3, this.width * 0.5, this.height * 0.3);
  }

  drawSmoothie(ctx: CanvasRenderingContext2D, preview = false) {
    const x = preview ? 0 : this.x;
    const y = preview ? 0 : this.y;
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.moveTo(x + this.width * 0.2, y + this.height);
    ctx.lineTo(x + this.width * 0.8, y + this.height);
    ctx.lineTo(x + this.width * 0.7, y);
    ctx.lineTo(x + this.width * 0.3, y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#e9d5ff';
    ctx.beginPath();
    ctx.arc(x + this.width / 2, y + this.height * 0.4, 3, 0, Math.PI * 2);
    ctx.arc(x + this.width * 0.35, y + this.height * 0.6, 2.5, 0, Math.PI * 2);
    ctx.arc(x + this.width * 0.65, y + this.height * 0.5, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#f3e8ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + this.width * 0.6, y);
    ctx.lineTo(x + this.width * 0.6, y - 10);
    ctx.stroke();
  }

  drawMilkshake(ctx: CanvasRenderingContext2D, preview = false) {
    const x = preview ? 0 : this.x;
    const y = preview ? 0 : this.y;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(x + this.width * 0.25, y + this.height);
    ctx.lineTo(x + this.width * 0.75, y + this.height);
    ctx.lineTo(x + this.width * 0.65, y + this.height * 0.3);
    ctx.lineTo(x + this.width * 0.35, y + this.height * 0.3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(x + this.width / 2, y + this.height * 0.2, this.width * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(x + this.width / 2, y + this.height * 0.15, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + this.width * 0.65, y + this.height * 0.3);
    ctx.lineTo(x + this.width * 0.75, y);
    ctx.stroke();
  }

  drawPizza(ctx: CanvasRenderingContext2D, preview = false) {
    const x = preview ? 0 : this.x;
    const y = preview ? 0 : this.y;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(x + this.width / 2, y);
    ctx.lineTo(x + this.width, y + this.height);
    ctx.lineTo(x, y + this.height);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#dc2626';
    for (let i = 0; i < 3; i++) {
      const px = x + this.width * (0.3 + i * 0.2);
      const py = y + this.height * 0.6;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawBurger(ctx: CanvasRenderingContext2D, preview = false) {
    const x = preview ? 0 : this.x;
    const y = preview ? 0 : this.y;
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(x, y, this.width, 5);
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(x, y + 7, this.width, 6);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x, y + 14, this.width, 6);
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(x, y + 21, this.width, 9);
  }

  drawTaco(ctx: CanvasRenderingContext2D, preview = false) {
    const x = preview ? 0 : this.x;
    const y = preview ? 0 : this.y;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(x + this.width / 2, y + this.height / 2, this.width / 2, 0, Math.PI, true);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(x + 5, y + 10, this.width - 10, 8);
  }

  drawHotdog(ctx: CanvasRenderingContext2D, preview = false) {
    const x = preview ? 0 : this.x;
    const y = preview ? 0 : this.y;
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x, y + 8, this.width, 14);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x + 3, y + 10, this.width - 6, 10);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 12);
    ctx.quadraticCurveTo(x + 15, y + 10, x + 22, y + 12);
    ctx.stroke();
  }

  drawDonut(ctx: CanvasRenderingContext2D, preview = false) {
    const x = preview ? 0 : this.x;
    const y = preview ? 0 : this.y;
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(x + this.width / 2, y + this.height / 2, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(x + this.width / 2, y + this.height / 2, this.width / 4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawCupcake(ctx: CanvasRenderingContext2D, preview = false) {
    const x = preview ? 0 : this.x;
    const y = preview ? 0 : this.y;
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(x + this.width / 2, y + 10, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 15);
    ctx.lineTo(x + this.width - 5, y + 15);
    ctx.lineTo(x + this.width - 2, y + this.height);
    ctx.lineTo(x + 2, y + this.height);
    ctx.closePath();
    ctx.fill();
  }

  drawIcecream(ctx: CanvasRenderingContext2D, preview = false) {
    const x = preview ? 0 : this.x;
    const y = preview ? 0 : this.y;
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(x + this.width / 2, y + this.height);
    ctx.lineTo(x + 5, y + 12);
    ctx.lineTo(x + this.width - 5, y + 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(x + this.width / 2, y + 8, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  drawRamen(ctx: CanvasRenderingContext2D, preview = false) {
    const x = preview ? 0 : this.x;
    const y = preview ? 0 : this.y;
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x, y + 10, this.width, this.height - 10);
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 5 + i * 5, y + 12);
      ctx.quadraticCurveTo(x + 7 + i * 5, y + 18, x + 5 + i * 5, y + 24);
      ctx.stroke();
    }
  }

  drawSushi(ctx: CanvasRenderingContext2D, preview = false) {
    const x = preview ? 0 : this.x;
    const y = preview ? 0 : this.y;
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(x, y + 15, this.width, 10);
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(x + 3, y + 17, this.width - 6, 6);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x + 5, y + 5, this.width - 10, 8);
  }

  drawCookie(ctx: CanvasRenderingContext2D, preview = false) {
    const x = preview ? 0 : this.x;
    const y = preview ? 0 : this.y;
    ctx.fillStyle = '#c2410c';
    ctx.beginPath();
    ctx.arc(x + this.width / 2, y + this.height / 2, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#451a03';
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const px = x + this.width / 2 + Math.cos(angle) * 8;
      const py = y + this.height / 2 + Math.sin(angle) * 8;
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawPretzel(ctx: CanvasRenderingContext2D, preview = false) {
    const x = preview ? 0 : this.x;
    const y = preview ? 0 : this.y;
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 25);
    ctx.quadraticCurveTo(x + 15, y, x + 25, y + 25);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 25);
    ctx.quadraticCurveTo(x + 15, y + 30, x + 25, y + 25);
    ctx.stroke();
  }

  drawPopcorn(ctx: CanvasRenderingContext2D, preview = false) {
    const x = preview ? 0 : this.x;
    const y = preview ? 0 : this.y;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 10);
    ctx.lineTo(x + this.width - 5, y + 10);
    ctx.lineTo(x + this.width, y + this.height);
    ctx.lineTo(x, y + this.height);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fef3c7';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(x + 8 + i * 7, y + 8, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawNachos(ctx: CanvasRenderingContext2D, preview = false) {
    const x = preview ? 0 : this.x;
    const y = preview ? 0 : this.y;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(x + this.width / 2, y);
    ctx.lineTo(x + this.width, y + this.height);
    ctx.lineTo(x, y + this.height);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fb923c';
    ctx.beginPath();
    ctx.moveTo(x + this.width / 2, y + 5);
    ctx.lineTo(x + this.width - 5, y + this.height - 5);
    ctx.lineTo(x + 5, y + this.height - 5);
    ctx.closePath();
    ctx.fill();
  }

  drawFries(ctx: CanvasRenderingContext2D, preview = false) {
    const x = preview ? 0 : this.x;
    const y = preview ? 0 : this.y;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(x, y + 12);
    ctx.lineTo(x + this.width, y + 12);
    ctx.lineTo(x + this.width - 3, y + this.height);
    ctx.lineTo(x + 3, y + this.height);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x + 4, y, 4, 15);
    ctx.fillRect(x + 11, y + 3, 4, 12);
    ctx.fillRect(x + 18, y + 1, 4, 14);
  }

  drawWaffle(ctx: CanvasRenderingContext2D, preview = false) {
    const x = preview ? 0 : this.x;
    const y = preview ? 0 : this.y;
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(x, y, this.width, this.height);
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + (this.width / 3) * i, y);
      ctx.lineTo(x + (this.width / 3) * i, y + this.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y + (this.height / 3) * i);
      ctx.lineTo(x + this.width, y + (this.height / 3) * i);
      ctx.stroke();
    }
  }

  drawPancake(ctx: CanvasRenderingContext2D, preview = false) {
    const x = preview ? 0 : this.x;
    const y = preview ? 0 : this.y;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.ellipse(x + this.width / 2, y + 8, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + this.width / 2, y + 15, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + this.width / 2, y + 22, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawCroissant(ctx: CanvasRenderingContext2D, preview = false) {
    const x = preview ? 0 : this.x;
    const y = preview ? 0 : this.y;
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(x, y + this.height / 2);
    ctx.quadraticCurveTo(x + 10, y, x + this.width, y + this.height / 2);
    ctx.quadraticCurveTo(x + 10, y + this.height, x, y + this.height / 2);
    ctx.closePath();
    ctx.fill();
  }

  drawMuffin(ctx: CanvasRenderingContext2D, preview = false) {
    const x = preview ? 0 : this.x;
    const y = preview ? 0 : this.y;
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.arc(x + this.width / 2, y + 10, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c2410c';
    ctx.beginPath();
    ctx.moveTo(x + 3, y + 15);
    ctx.lineTo(x + this.width - 3, y + 15);
    ctx.lineTo(x + this.width - 2, y + this.height);
    ctx.lineTo(x + 2, y + this.height);
    ctx.closePath();
    ctx.fill();
  }

  drawBagel(ctx: CanvasRenderingContext2D, preview = false) {
    const x = preview ? 0 : this.x;
    const y = preview ? 0 : this.y;
    ctx.fillStyle = '#c2410c';
    ctx.beginPath();
    ctx.arc(x + this.width / 2, y + this.height / 2, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(x + this.width / 2, y + this.height / 2, this.width / 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawSandwich(ctx: CanvasRenderingContext2D, preview = false) {
    const x = preview ? 0 : this.x;
    const y = preview ? 0 : this.y;
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(x, y, this.width, 6);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(x, y + 7, this.width, 5);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x, y + 13, this.width, 5);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x, y + 19, this.width, 5);
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(x, y + 25, this.width, 6);
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
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showModeSelect, setShowModeSelect] = useState(false);
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showNextRound, setShowNextRound] = useState(false);
  const [showUnlockNotification, setShowUnlockNotification] = useState(false);
  const [unlockNotificationText, setUnlockNotificationText] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterType>('boba');
  const [selectedMode, setSelectedMode] = useState<GameMode>('solos');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const [selectedTeamSize, setSelectedTeamSize] = useState<TeamSize>(4);
  const [totalBrawlers, setTotalBrawlers] = useState(2);
  const [matchScores, setMatchScores] = useState<number[]>([]);
  const [winnerText, setWinnerText] = useState('You Win!');
  const [winnerSubtext, setWinnerSubtext] = useState('');
  const [scoreInfo, setScoreInfo] = useState<{name: string, score: number, color: string}[]>([]);
  const [botCursors, setBotCursors] = useState<{x: number, y: number, targetChar: CharacterType, selectTimer: number}[]>([]);
  const [botSelectedCharacters, setBotSelectedCharacters] = useState<CharacterType[]>([]);
  const [unlockedCharacters, setUnlockedCharacters] = useState<Set<CharacterType>>(new Set(['boba', 'coffee', 'juice', 'soda', 'smoothie', 'milkshake']));
  const [totalRoundsPlayed, setTotalRoundsPlayed] = useState(0);
  
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
    usedSpawnIndices: [] as number[],
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

      if (e.button === 0 && player.boomerangCount > 0 && !player.isBlocking) {
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

      if (e.button === 2 && player.boomerangCount > 0) {
        if (player.blockCooldown <= 0) {
          player.isBlocking = true;
          player.blockCooldown = 600;
        } else {
          player.performHit();
        }
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
    setTimeout(() => {
      CHARACTER_TYPES.forEach(charType => {
        const previewCanvas = document.getElementById(`${charType}-preview`) as HTMLCanvasElement;
        if (!previewCanvas) return;
        const pCtx = previewCanvas.getContext('2d');
        if (!pCtx) return;
        const width = previewCanvas.width;
        const height = previewCanvas.height;
        pCtx.clearRect(0, 0, width, height);
        
        const tempPlayer = new Player(0, 0, '#6b7280', {}, '', charType as CharacterType, 0, 1);
        
        pCtx.save();
        pCtx.translate(width / 2 - PLAYER_SIZE / 2, height / 2 - PLAYER_SIZE / 2);
        tempPlayer.draw(pCtx, true);
        pCtx.restore();
      });
    }, 100);
  };

  useEffect(() => {
    if (!showCharacterSelect) return;
    const numBots = selectedMode === 'solos' ? totalBrawlers - 1 : selectedTeamSize - 1;
    const availableChars = Array.from(unlockedCharacters);
    const usedChars = new Set<CharacterType>([selectedCharacter]);
    const selectedBotChars: CharacterType[] = [];
    
    for (let i = 0; i < numBots; i++) {
      const available = availableChars.filter(c => !usedChars.has(c));
      const char = available[Math.floor(Math.random() * available.length)] || availableChars[0];
      selectedBotChars.push(char);
      usedChars.add(char);
    }
    setBotSelectedCharacters(selectedBotChars);
    
    const newCursors = Array.from({length: numBots}, (_, i) => ({
      x: Math.random() * 800 + 100,
      y: Math.random() * 600 + 100,
      targetChar: selectedBotChars[i],
      selectTimer: Math.random() * 1000 + 1500 + i * 300
    }));
    setBotCursors(newCursors);

    const animateCursors = () => {
      setBotCursors(prev => prev.map((cursor) => {
        let newCursor = {...cursor};
        newCursor.selectTimer -= 16;

        if (newCursor.targetChar) {
          const charElement = document.getElementById(`${newCursor.targetChar}-preview`);
          if (charElement) {
            const rect = charElement.getBoundingClientRect();
            const modalRect = charElement.closest('.max-w-6xl')?.getBoundingClientRect();
            if (modalRect) {
              const targetX = rect.left - modalRect.left + rect.width / 2;
              const targetY = rect.top - modalRect.top + rect.height / 2;
              const dx = targetX - newCursor.x;
              const dy = targetY - newCursor.y;
              const dist = Math.hypot(dx, dy);
              if (dist < 5) {
                newCursor.x = targetX + (Math.random() - 0.5) * 10;
                newCursor.y = targetY + (Math.random() - 0.5) * 10;
              } else {
                newCursor.x += (dx / dist) * Math.min(5, dist);
                newCursor.y += (dy / dist) * Math.min(5, dist);
              }
            }
          }
        }
        return newCursor;
      }));
    };

    const interval = setInterval(animateCursors, 16);
    return () => clearInterval(interval);
  }, [showCharacterSelect, unlockedCharacters, selectedCharacter, selectedMode, selectedTeamSize, totalBrawlers]);

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
        const botType = botSelectedCharacters[i] || CHARACTER_TYPES[0];
        info.push({ name: `Bot ${i+1}`, color: botColors[i], character: botType, isBot: true, team: 2 + i });
      }
    } else {
      // Teams mode - configurable team size
      const playersPerTeam = selectedTeamSize / 2;
      
      // Add player's team
      for (let i = 1; i < playersPerTeam; i++) {
        const botType = botSelectedCharacters[i - 1] || CHARACTER_TYPES[0];
        info.push({ name: `Ally Bot ${i}`, color: playerTeamColor, character: botType, isBot: true, team: 1 });
      }
      
      // Add enemy team
      for (let i = 0; i < playersPerTeam; i++) {
        const botIndex = playersPerTeam - 1 + i;
        const botType = botSelectedCharacters[botIndex] || CHARACTER_TYPES[i];
        info.push({ name: `Enemy ${i + 1}`, color: botColors[0], character: botType, isBot: true, team: 2 });
      }
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
    gameStateRef.current.usedSpawnIndices = [];
    
    setupMap();

    gameStateRef.current.playerInfo.forEach((info, index) => {
      let x, y;
      if (selectedMode === 'teams') {
        if (info.team === 1) {
          x = 150 + (index % 2 * 50); y = BASE_HEIGHT / 2 - 50 + (index % 2 * 100);
        } else {
          x = BASE_WIDTH - 150 - (index % 2 * 50); y = BASE_HEIGHT / 2 - 50 + (index % 2 * 100);
        }
      } else {
        let spawnIndex;
        do {
          spawnIndex = Math.floor(Math.random() * SPAWN_POINTS.length);
        } while (gameStateRef.current.usedSpawnIndices.includes(spawnIndex));
        gameStateRef.current.usedSpawnIndices.push(spawnIndex);
        const spawn = SPAWN_POINTS[spawnIndex];
        x = spawn.x; y = spawn.y;
      }
      
      gameStateRef.current.players.push(
        new Player(x, y, info.color, info.isBot ? {} : { up: 'w', down: 's', left: 'a', right: 'd', dash: ' ' }, 
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
          // Check if blocking
          if (p.isBlocking && p.boomerangCount > 0) {
            b.isDropped = true;
            createParticle(b.x, b.y, p.color, 30, 0.93, 4);
          } else {
            p.stunTimer = 1000;
            createParticle(p.x + p.width/2, p.y + p.height/2, '#FBBF24', 50, 0.96, 5);
          }
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
      
      
      // Track rounds
      const newRoundsPlayed = totalRoundsPlayed + 1;
      setTotalRoundsPlayed(newRoundsPlayed);
      
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
    
    // Check for character unlocks at end of game
    let unlockedNewChar = false;
    if (totalRoundsPlayed % ROUNDS_TO_UNLOCK === 0) {
      const lockedChars = CHARACTER_TYPES.filter(char => !unlockedCharacters.has(char));
      if (lockedChars.length > 0) {
        const randomChar = lockedChars[Math.floor(Math.random() * lockedChars.length)];
        setUnlockedCharacters(prev => new Set([...prev, randomChar]));
        unlockedNewChar = true;
      }
    }
    
    // Show unlock notification
    const lockedChars = CHARACTER_TYPES.filter(char => !unlockedCharacters.has(char));
    const roundsUntilUnlock = ROUNDS_TO_UNLOCK - (totalRoundsPlayed % ROUNDS_TO_UNLOCK);
    
    if (unlockedNewChar) {
      setUnlockNotificationText(`🎉 New character unlocked! Play ${ROUNDS_TO_UNLOCK} more rounds to unlock another!`);
      setShowUnlockNotification(true);
    } else if (lockedChars.length > 0 && roundsUntilUnlock > 0) {
      setUnlockNotificationText(`Play ${roundsUntilUnlock} more round${roundsUntilUnlock === 1 ? '' : 's'} to unlock a new character!`);
      setShowUnlockNotification(true);
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
            <h1 className="text-6xl font-bold mb-6">Foodie Brawlers</h1>
            <p className="text-muted-foreground mb-10 text-lg">Dash, dodge, and brawl to become the last foodie standing!</p>
            <div className="flex flex-col gap-4">
              <Button 
                onClick={() => {
                  setShowStartModal(false);
                  setShowModeSelect(true);
                }} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 px-10 rounded-full text-2xl"
              >
                Start
              </Button>
              <Button 
                onClick={() => {
                  setShowStartModal(false);
                  setShowHowToPlay(true);
                }} 
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold py-4 px-10 rounded-full text-2xl"
              >
                How to Play
              </Button>
              <Button 
                onClick={() => {
                  setShowStartModal(false);
                  setShowOptions(true);
                }} 
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold py-4 px-10 rounded-full text-2xl"
              >
                Options
              </Button>
            </div>
          </div>
        </div>
      )}

      {showHowToPlay && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card text-card-foreground text-center p-10 rounded-2xl shadow-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-5xl font-bold mb-6">How to Play</h2>
            <div className="text-left space-y-6 mb-8">
              <div className="bg-muted/50 p-6 rounded-lg border border-border">
                <h3 className="font-bold text-2xl text-primary mb-3">Controls</h3>
                <div className="space-y-2">
                  <p className="text-foreground"><kbd className="font-sans bg-muted rounded px-2 py-1">W</kbd> <kbd className="font-sans bg-muted rounded px-2 py-1">A</kbd> <kbd className="font-sans bg-muted rounded px-2 py-1">S</kbd> <kbd className="font-sans bg-muted rounded px-2 py-1">D</kbd> - Move</p>
                  <p className="text-foreground"><kbd className="font-sans bg-muted rounded px-2 py-1">Left Click</kbd> - Throw Boomerang</p>
                  <p className="text-foreground"><kbd className="font-sans bg-muted rounded px-2 py-1">Right Click</kbd> - Block (with boomerang) or Melee Hit</p>
                  <p className="text-foreground"><kbd className="font-sans bg-muted rounded px-2 py-1">Spacebar</kbd> - Dash</p>
                </div>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg border border-border">
                <h3 className="font-bold text-2xl text-primary mb-3">Game Rules</h3>
                <ul className="list-disc list-inside space-y-2 text-foreground">
                  <li>Be the last brawler standing to win a round</li>
                  <li>First player to {WIN_SCORE} rounds wins the match</li>
                  <li>Throw boomerangs to stun opponents from distance</li>
                  <li>Block incoming boomerangs with right-click (requires boomerang)</li>
                  <li>Use melee attacks when close to enemies (or when no boomerang)</li>
                  <li>Dash to dodge attacks and reposition quickly</li>
                  <li>Pick up dropped boomerangs to reload</li>
                  <li>In team mode, stand near fallen teammates for 2 seconds to revive them</li>
                  <li>Play {ROUNDS_TO_UNLOCK} rounds to unlock new characters</li>
                </ul>
              </div>
            </div>
            <Button 
              onClick={() => {
                setShowHowToPlay(false);
                setShowStartModal(true);
              }} 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-8 rounded-full text-xl"
            >
              Back
            </Button>
          </div>
        </div>
      )}

      {showOptions && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card text-card-foreground text-center p-10 rounded-2xl shadow-2xl max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-5xl font-bold mb-6">Options</h2>
            <div className="bg-muted/50 p-6 rounded-lg border border-border mb-8">
              <h3 className="font-bold text-2xl text-primary mb-4">Bot Difficulty</h3>
              <div className="flex justify-center gap-3 flex-wrap">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(diff => (
                  <button
                    key={diff}
                    className={`border-2 px-6 py-3 rounded-full font-bold transition-all ${
                      selectedDifficulty === diff ? 'bg-secondary text-secondary-foreground border-secondary scale-110' : 'border-border hover:scale-105'
                    }`}
                    onClick={() => setSelectedDifficulty(diff)}
                  >
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </button>
                ))}
              </div>
              <div className="mt-4 text-sm text-muted-foreground space-y-1">
                <p><strong>Easy:</strong> Constantly throws boomerangs, rushes straight at enemies</p>
                <p><strong>Medium:</strong> Dodges often, throws carefully</p>
                <p><strong>Hard:</strong> Blocks all boomerangs, strategic movement, never loses boomerang</p>
              </div>
            </div>
            <Button 
              onClick={() => {
                setShowOptions(false);
                setShowStartModal(true);
              }} 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-8 rounded-full text-xl"
            >
              Back
            </Button>
          </div>
        </div>
      )}

      {showModeSelect && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card text-card-foreground text-center p-8 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-4xl font-bold mb-6">Select Game Mode</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <button
                className={`border-4 rounded-xl p-8 transition-all ${
                  selectedMode === 'solos' ? 'border-primary bg-primary/10 scale-105' : 'border-border hover:scale-105'
                }`}
                onClick={() => {
                  setSelectedMode('solos');
                  setTotalBrawlers(2);
                }}
              >
                <h3 className="text-3xl font-bold mb-3">Solos</h3>
                <p className="text-muted-foreground text-lg">Free-for-all battle!</p>
                <p className="text-muted-foreground mt-2">Every brawler for themselves</p>
              </button>
              <button
                className={`border-4 rounded-xl p-8 transition-all ${
                  selectedMode === 'teams' ? 'border-primary bg-primary/10 scale-105' : 'border-border hover:scale-105'
                }`}
                onClick={() => {
                  setSelectedMode('teams');
                  setSelectedTeamSize(4);
                }}
              >
                <h3 className="text-3xl font-bold mb-3">Teams</h3>
                <p className="text-muted-foreground text-lg">2v2 or 3v3 teamwork!</p>
                <p className="text-muted-foreground mt-2">Fight alongside allies</p>
              </button>
            </div>
            {selectedMode === 'teams' && (
              <div className="bg-muted/50 p-6 rounded-lg mb-6">
                <h4 className="text-xl font-bold mb-3 text-muted-foreground">Team Size</h4>
                <div className="flex justify-center gap-4">
                  <button
                    className={`border-2 px-8 py-4 rounded-full font-bold transition-all ${
                      selectedTeamSize === 4 ? 'bg-primary text-primary-foreground border-primary scale-110' : 'border-border hover:scale-105'
                    }`}
                    onClick={() => setSelectedTeamSize(4)}
                  >
                    2v2
                  </button>
                  <button
                    className={`border-2 px-8 py-4 rounded-full font-bold transition-all ${
                      selectedTeamSize === 6 ? 'bg-primary text-primary-foreground border-primary scale-110' : 'border-border hover:scale-105'
                    }`}
                    onClick={() => setSelectedTeamSize(6)}
                  >
                    3v3
                  </button>
                </div>
              </div>
            )}
            {selectedMode === 'solos' && (
              <div className="bg-muted/50 p-6 rounded-lg mb-6">
                <h4 className="text-xl font-bold mb-3 text-muted-foreground">Total Brawlers</h4>
                <div className="flex items-center justify-center gap-4">
                  <button
                    className="text-2xl font-bold bg-muted rounded-full w-10 h-10 flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
                    onClick={() => setTotalBrawlers(Math.max(2, totalBrawlers - 1))}
                    disabled={totalBrawlers <= 2}
                  >
                    -
                  </button>
                  <span className="text-3xl font-bold w-12 text-center">{totalBrawlers}</span>
                  <button
                    className="text-2xl font-bold bg-muted rounded-full w-10 h-10 flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
                    onClick={() => setTotalBrawlers(Math.min(6, totalBrawlers + 1))}
                    disabled={totalBrawlers >= 6}
                  >
                    +
                  </button>
                </div>
              </div>
            )}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => {
                  setShowModeSelect(false);
                  setShowStartModal(true);
                }}
                className="bg-muted hover:bg-muted/90 text-foreground font-bold py-4 px-8 rounded-full text-xl"
              >
                Back
              </Button>
              <Button
                onClick={() => {
                  setShowModeSelect(false);
                  setShowCharacterSelect(true);
                  setTimeout(drawCharacterPreviews, 100);
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 px-12 rounded-full text-2xl"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {showCharacterSelect && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card text-card-foreground text-center p-8 rounded-2xl shadow-2xl max-w-6xl w-full relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-4xl font-bold mb-3">Choose Your Fighter</h2>
            <p className="text-muted-foreground mb-6">Select from {CHARACTER_TYPES.length} unique brawlers! ({unlockedCharacters.size} unlocked)</p>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 mb-8 max-h-[400px] overflow-y-auto p-2">
              {CHARACTER_TYPES.map(char => {
                const isLocked = !unlockedCharacters.has(char);
                const isBotSelected = botSelectedCharacters.includes(char);
                return (
                  <div
                    key={char}
                    className={`border-4 rounded-xl p-3 transition-all relative ${
                      isLocked 
                        ? 'border-muted bg-muted/30 opacity-50 cursor-not-allowed' 
                        : selectedCharacter === char 
                          ? 'border-primary bg-primary/10 scale-110 cursor-pointer' 
                          : isBotSelected
                            ? 'border-accent bg-accent/10 cursor-pointer'
                            : 'border-transparent bg-muted hover:scale-105 cursor-pointer'
                    }`}
                    onClick={() => !isLocked && setSelectedCharacter(char)}
                  >
                    <canvas id={`${char}-preview`} width="60" height="60" className="mb-2 mx-auto"></canvas>
                    <p className="font-bold capitalize text-sm">{char}</p>
                    {isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl">🔒</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {botCursors.map((cursor, i) => (
              <div
                key={i}
                className="absolute pointer-events-none z-50"
                style={{
                  left: `${cursor.x}px`,
                  top: `${cursor.y}px`,
                  transition: 'all 0.1s ease-out'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" className="drop-shadow-lg">
                  <path
                    d="M3 3l7.5 18l2.5-8l8-2.5z"
                    fill={`hsl(${i * 60}, 70%, 50%)`}
                    stroke="white"
                    strokeWidth="2"
                  />
                </svg>
                <div className="text-xs font-bold text-white drop-shadow-lg ml-6 -mt-4">
                  Bot {i + 1}
                </div>
              </div>
            ))}

            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => {
                  setShowCharacterSelect(false);
                  setShowModeSelect(true);
                }}
                className="bg-muted hover:bg-muted/90 text-foreground font-bold py-4 px-8 rounded-full text-xl"
              >
                Back
              </Button>
              <Button
                onClick={() => {
                  setShowCharacterSelect(false);
                  startGame();
                }}
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold py-4 px-12 rounded-full text-2xl"
              >
                Brawl!
              </Button>
            </div>
          </div>
        </div>
      )}

      {showGameOver && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card text-card-foreground text-center p-8 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-5xl font-bold mb-4">{winnerText}</h2>
            <p className="text-muted-foreground mb-6">{winnerSubtext}</p>
            
            {showUnlockNotification && (
              <div className="bg-gradient-to-r from-primary/20 to-accent/20 border-2 border-primary rounded-xl p-4 mb-6 animate-pulse">
                <p className="text-xl font-bold text-primary">{unlockNotificationText}</p>
              </div>
            )}
            
            <div className="flex justify-center gap-4 flex-wrap">
              <Button
                onClick={() => {
                  setShowGameOver(false);
                  setShowUnlockNotification(false);
                  startGame();
                }}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold py-3 px-8 rounded-full text-xl"
              >
                Play Again
              </Button>
              <Button
                onClick={() => {
                  setShowGameOver(false);
                  setShowUnlockNotification(false);
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card text-card-foreground text-center p-8 rounded-2xl shadow-2xl max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-4xl font-bold mb-4">Round Over!</h2>
            <p className="text-lg mb-4 text-muted-foreground">First to {WIN_SCORE} wins</p>
            <div className="mb-6 space-y-2 text-lg max-h-[300px] overflow-y-auto">
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
