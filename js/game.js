// Vector2d class declaration
let Vector2d = class {    
    constructor(x, y) {
        this._x = x;
        this._y = y;
    }

    get x() {
        return this._x;
    }

    get y() {
        return this._y;
    }

    static distance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;

        return Math.hypot(dx, dy);
    }

    static add(a, b) {
        const x = a.x + b.x;
        const y = a.y + b.y;

        return new Vector2d(x, y);
    }

    static mul(a, b) {
        const x = a.x * b.x;
        const y = a.y * b.y;

        return new Vector2d(x, y);
    }
}

Vector2d.Empty = new Vector2d(0, 0);

// Size2d class definition
let Size2d = class {
    constructor(width, height) {
        this._width = width;
        this._height = height;
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

    static add(a, b) {
        const width = a.width + b.width;
        const height = a.height + b.height;

        return new Size2d(width, height);
    }
}

let Rect2d = class {
    constructor(origin, size) {
        this._origin = origin;
        this._size = size;
    }

    get x() {
        return this._origin.x;
    }

    get y() {
        return this._origin.y;
    }

    get origin() {
        return this._origin;
    }

    get size() {
        return this._size;
    }

    get width() {
        return this._size.width;
    }

    get height() {
        return this._size.height;
    }

    get bottom() {
        return this._origin.y + this._size.height;
    }

    get right() {
        return this._origin.x + this._size.width;
    }

    get isEmpty() {
        return this._origin.x == this._origin.y && this._size.width == this._size.height == 0;
    }

    static add(a, b) {
        const origin = new Vector2d(a.x + b.x, a.y + b.y);
        return new Rect2d(origin, a.size);
    }

    static intersect(a, b) {
        const x1 = Math.max(a.x, b.x);
        const x2 = Math.min(a.x + a.width, b.x + b.width);
        const y1 = Math.max(a.y, b.y);
        const y2 = Math.min(a.y + a.height, b.y + b.height);

        if (x2 >= x1 && y2 >= y1){
            return new Rect2d(new Vector2d(x1, y1), new Size2d(x2 - x1, y2 - y1));
        }

        return Rect2d.Empty;
    }

    static dot(a, b) {
        return a.x * b.x + a.y * b.y;
    }
}

Rect2d.Empty = new Rect2d(Vector2d.Empty, new Size2d(0, 0));

// Background class declaration
let Background = class {
    constructor(options) {
        this.width = options.width;
        this.height = options.height;
        this.overlays = new Array(options.layers.length);

        for (var index = 0; index < options.layers.length; index++) {
            this.overlays[index] = new Image();
            this.overlays[index].src = options.layers[index].src;
        }
    }

    draw(ctx) {
        for (var index = 0; index < this.overlays.length; index++) {
            const overlay = this.overlays[index];
            ctx.drawImage(overlay, 0, 0, this.width, this.height);
        }
    }
}

let Floor = class {
    constructor(options) {
        this._tiles = options.tiles;
        this._index = options.index;
        this._position = options.position;
        this._width = options.width;
    }

    draw(ctx) {
        const tileWidth = this._tiles.tileSize.width;

        for (var index = 0, width = 0; width < this._width; index++, width += tileWidth) {
            const position = new Vector2d(this._position.x + tileWidth * index, this._position.y);
            this._tiles.drawTile(ctx, this._index, position);
        }
    }
}

// Tiles class declaration
let Tiles = class {
    constructor(options) {
        this._image = new Image();
        this._tileSize = options.tileSize;
        
        const self = this;

        this._columns = 0;
        this._rows = 0;
        this._tilesCount = 0;

        this._image.onload = function() {
            self._columns = Math.trunc(this.width / options.tileSize.width);
            self._rows = Math.trunc(this.height / options.tileSize.height);
            self._tilesCount = self._columns * self._rows;
        };

        this._image.src = options.src;
    }

    get columns() {
        return this._columns; 
    }

    get row() {
        return this._rows;
    }

    get tilesCount() {
        return this._tilesCount;
    }

    get tileSize() {
        return this._tileSize;
    }

    drawTile(ctx, idx, position) {
        if (idx >= this._tilesCount) {
            return ;
        }

        const row = Math.trunc(idx / this._columns);
        const column = idx % this._columns;
        const sx = this._tileSize.width * column;
        const sy = this._tileSize.height * row;

        ctx.drawImage(
            this._image,
            sx,
            sy,
            this._tileSize.width,
            this._tileSize.height,
            position.x,
            position.y,
            this._tileSize.width,
            this._tileSize.height
        );
    }
}

let Sprite = class {
    constructor(options) {
        this._tiles = options.tiles;
        this._index = options.index;
        this._position = options.position;
    }

    get position() {
        return this._position;
    }

    set position(value) {
        this._position = value;
    }

    draw(ctx) {
        this._tiles.drawTile(ctx, this._index, this._position);
    }
}

let AnimatedSprite = class extends Sprite {
    constructor(options) {
        super(options);
        this.set(options);
    }

    set(options) {
        this._frame = 0;
        this._from = options.from;
        this._to = options.to;
        this._index = options.from;
        this._direction = options.direction;
        this._throttle = options.throttle;
        this._repeat = !!options.repeat ? options.repeat : -1;
        this._count = 0;
        this._callback = !!options.callback ? options.callback : () => {};
    }

    update() {
        if (++this._frame < this._throttle) {
            return;
        }

        this._frame = 0;

        const index = this._index + this._direction;

        if (this._direction > 0) {
            if (index >= this._to) {
                
                this._callback();

                if (this._repeat > 0 && ++this._count >= this._repeat) {
                    return ;
                }

                this._index = this._from;
            }
            else {
                this._index = index;
            }
        }
        else {
            if (index <= this._to) {

                this._callback();

                if (this._repeat > 0 && ++this._count >= this._repeat) {
                    return ;
                }

                this._index = this._from;
            }
            else {
                this._index = index;
            }
        }
    }
}

// Abstract state class
let State = class {
    constructor(actor) {
        this._actor = actor;
    }

    enter() {

    }

    exit() {

    }

    update() {

    }

    handle(action, keyCode) {
        console.log("handle: " + action + ", " + keyCode);
    }
}

let HeroIdleState = class extends State {
    constructor(actor) {
        super(actor);
    }

    enter() {
        this._actor.sprite.set({
            from: 0,
            to: 6,
            direction: 1,
            throttle: 3
        });
    }

    handle(action, keyCode) {
        if (action == "keydown") {
            switch (keyCode) {
                case 65: {
                    this._actor.state = new HeroMoveBackwardState(this._actor);
                    break;
                }

                case 68: {
                    this._actor.state = new HeroMoveForwardState(this._actor);
                    break;
                }

                case 87: {
                    this._actor.state = new HeroJumpState(this._actor);
                    break;
                }

                case 32: {
                    this._actor.state = new HeroAttackState(this._actor);
                    break;
                }
            }
        }
    }
}

let HeroMoveBackwardState = class extends State {
    constructor(actor) {
        super(actor);
    }

    enter() {
        this._velocity = new Vector2d(-1.5, 0);
        this._actor.sprite.set({
            from: 23,
            to: 16,
            direction: -1,
            throttle: 1
        });
    }

    update() {
        this._actor.position = Vector2d.add(this._actor.position, this._velocity);
    }

    handle(action, keyCode) {
        if (action == "keyup") {
            if (keyCode == 65) {
                this._actor.state = new HeroIdleState(this._actor);
            }
        }
    }
}

let HeroMoveForwardState = class extends State {
    constructor(actor) {
        super(actor);
    }

    enter() {
        this._velocity = new Vector2d(1.5, 0);
        this._actor.sprite.set({
            from: 16,
            to: 23,
            direction: 1,
            throttle: 1
        });
    }

    update() {
        this._actor.position = Vector2d.add(this._actor.position, this._velocity);
    }

    handle(action, keyCode) {
        if (action == "keyup") {
            if (keyCode == 68) {
                this._actor.state = new HeroIdleState(this._actor);
            }
        }
    }
}

let HeroJumpState = class extends State {
    constructor(actor) {
        super(actor);
        this._gravity = new Vector2d(0, 2);
    }

    enter() {
       this._velocity = new Vector2d(0.3, -12);
    }

    update() {
        this._velocity = Vector2d.add(this._velocity, this._gravity);
        this._actor.position = Vector2d.add(this._actor.position, this._velocity);        

        if (this._actor.rigidRect.bottom >= 180) {
            this._actor.position = new Vector2d(this._actor.position.x, 124);
            this._actor.state = new HeroIdleState(this._actor);
        }
    }
}

let HeroAttackState = class extends State {
    constructor(actor) {
        super(actor);
    }

    enter() {
        const self = this;
        const offset = Vector2d.add(this._actor.position, new Vector2d(42, 34));

        this._actor.attackRect = new Rect2d(offset, new Size2d(12, 10));
        this._actor.sprite.set({
            from: 8,
            to: 13,
            direction: 1,
            throttle: 0,
            repeat: 1,
            callback: this.complete.bind(self)
        });

        this._actor.attack();
    }

    complete() {
        this._actor.state = new HeroIdleState(this._actor);
        this._actor.attackRect = null;
    }
}

let Actor = class {
    constructor() {
        this._sprite = null;
        this._state = null;
        this._rigidRect = null;
        this._attackRect = null;
        this._hp = 0;
        this._damage = 0;
    }

    get sprite() {
        return this._sprite;
    }

    get state() {
        return this._state;
    }

    set state(value) {
        if (this._state !== null) {
            this._state.exit();
        }

        this._state = value;

        if (this._state !== null) {
            this._state.enter();
        }
    }

    get position() {
        return this._sprite.position;
    }

    set position(value) {
        this._sprite.position = value;
    }

    get rigidRect() {
        return this._rigidRect;
    }

    get attackRect() {
        return this._attackRect;
    }

    set attackRect(value) {
        this._attackRect = value;
    }

    get damage() {
        return this._damage;
    }

    draw(ctx) {
        this._sprite.draw(ctx);
    }

    update() {
        this._state.update();
        this._sprite.update();
    }

    handle(action, keyCode) {
        this._state.handle(action, keyCode);
    }

    attack() {
        ;
    }

    onDamageTaken(value) {
        ;
    }

    onDied() {
        ;
    }

    isHit(rect) {
        if (!!this._rigidRect) {
            return !Rect2d.intersect(this._rigidRect, rect).isEmpty;
        }

        return false;
    }

    takeDamage(value) {
        const hp = this._hp - value;

        this.onDamageTaken(value);

        if (hp <= 0) {
            this._hp = 0;
            this.onDied();
        }
        else {
            this._hp = hp;
        }
    }
}

let Hero = class extends Actor {
    constructor(options) {
        super();

        this._callback = options.callback;
        this._hp = 120;
        this._damage = 30;
        this._sprite = new AnimatedSprite({
            tiles: new Tiles({
                src: "img/hero/character.png",
                tileSize: new Size2d(56, 56)
            }),
            from: 0,
            to: 6,
            direction: 1,
            throttle: 3,
            position: options.position
        });
        this._state = new HeroIdleState(this)

        const origin = Vector2d.add(options.position, new Vector2d(17, 23));
        this._rigidRect = new Rect2d(origin, new Size2d(24, 32));
    }

    get position() {
        return this._sprite.position;
    }

    set position(value) {
        const origin = Vector2d.add(value, new Vector2d(17, 23));
        this._sprite.position = value;
        this._rigidRect = new Rect2d(origin, new Size2d(24, 32));
    }

    /*get damage() {
        return this._damage;
    }*/

    draw(ctx) {
        super.draw(ctx);

        ctx.strokeStyle = "green";
        ctx.strokeRect(this._rigidRect.x, this._rigidRect.y, this._rigidRect.width, this._rigidRect.height);

        if (this._attackRect !== null) {
            ctx.strokeStyle = "red";
            ctx.strokeRect(this._attackRect.x, this._attackRect.y, this._attackRect.width, this._attackRect.height);
        }
    }

    attack() {
        this._callback();
    }

    onDamageTaken(value) {
        console.log("Damage of " + value + " taken from NPC");
    }

    onDied() {
        console.log("Hero were died");
    }
}

let NpcIdleState = class extends State {
    constructor(actor) {
        super(actor);
    }

    enter() {
        this._actor.sprite.set({
            from: 7,
            to: 2,
            direction: -1,
            throttle: 3
        });
    }

    handle(action, keyCode) {
        if (action == "keydown") {
            switch (keyCode) {
                case 39: {
                    this._actor.state = new NpcMoveBackwardState(this._actor);
                    break;
                }

                case 37: {
                    this._actor.state = new NpcMoveForwardState(this._actor);
                    break;
                }

                case 38: {
                    this._actor.state = new NpcJumpState(this._actor);
                    break;
                }

                case 13: {
                    this._actor.state = new NpcAttackState(this._actor);
                    break;
                }
            }
        }
    }
}

let NpcMoveForwardState = class extends State {
    constructor(actor) {
        super(actor);
    }

    enter() {
        this._velocity = new Vector2d(-1.5, 0);
        this._actor.sprite.set({
            from: 23,
            to: 16,
            direction: -1,
            throttle: 1
        });
    }

    update() {
        this._actor.position = Vector2d.add(this._actor.position, this._velocity);
    }

    handle(action, keyCode) {
        if (action == "keyup") {
            if (keyCode == 37) {
                this._actor.state = new NpcIdleState(this._actor);
            }
        }
    }
}

let NpcMoveBackwardState = class extends State {
    constructor(actor) {
        super(actor);
    }

    enter() {
        this._velocity = new Vector2d(1.5, 0);
        this._actor.sprite.set({
            from: 16,
            to: 23,
            direction: 1,
            throttle: 1
        });
    }

    update() {
        this._actor.position = Vector2d.add(this._actor.position, this._velocity);
    }

    handle(action, keyCode) {
        if (action == "keyup") {
            if (keyCode == 39) {
                this._actor.state = new NpcIdleState(this._actor);
            }
        }
    }
}

let NpcJumpState = class extends State {
    constructor(actor) {
        super(actor);
        this._gravity = new Vector2d(0, 2);
    }

    enter() {
       this._velocity = new Vector2d(-0.3, -12);
    }

    update() {
        this._velocity = Vector2d.add(this._velocity, this._gravity);
        this._actor.position = Vector2d.add(this._actor.position, this._velocity);        

        if (this._actor.rigidRect.bottom >= 180) {
            this._actor.position = new Vector2d(this._actor.position.x, 124);
            this._actor.state = new NpcIdleState(this._actor);
        }
    }
}

let NpcAttackState = class extends State {
    constructor(actor) {
        super(actor);
    }

    enter() {
        const self = this;
        const offset = Vector2d.add(this._actor.position, new Vector2d(2, 34));

        this._actor.attackRect = new Rect2d(offset, new Size2d(12, 10));
        this._actor.sprite.set({
            from: 13,
            to: 8,
            direction: -1,
            throttle: 0,
            repeat: 1,
            callback: this.complete.bind(self)
        });

        this._actor.attack();
    }

    complete() {
        this._actor.state = new NpcIdleState(this._actor);
        this._actor.attackRect = null;
    }
}

let NpcDiesState = class extends State {
    constructor(actor) {
        super(actor);
    }

    enter() {
        //const self = this;
        //const offset = Vector2d.add(this._actor.position, new Vector2d(2, 34));

        //this._actor.attackRect = new Rect2d(offset, new Size2d(12, 10));
        this._actor.sprite.set({
            from: 40,
            to: 32,
            direction: -1,
            throttle: 0,
            repeat: 1
            //callback: this.complete.bind(self)
        });

        //this._actor.attack();
    }

    /*complete() {
        this._actor.state = new NpcIdleState(this._actor);
        this._actor.attackRect = null;
    }*/
}

let Npc = class extends Actor {
    constructor(options) {
        super();

        this._callback = options.callback;
        this._hp = 100;
        this._damage = 20;
        this._sprite = new AnimatedSprite({
            tiles: new Tiles({
                src: "img/hero/npc.png",
                tileSize: new Size2d(56, 56)
            }),
            from: 7,
            to: 2,
            direction: -1,
            throttle: 3,
            position: options.position
        });
        this._state = new NpcIdleState(this)

        const origin = Vector2d.add(options.position, new Vector2d(15, 23));
        this._rigidRect = new Rect2d(origin, new Size2d(24, 32));
    }

    get position() {
        return this._sprite.position;
    }

    set position(value) {
        const origin = Vector2d.add(value, new Vector2d(15, 23));
        this._sprite.position = value;
        this._rigidRect = new Rect2d(origin, new Size2d(24, 32));
    }

    draw(ctx) {
        super.draw(ctx);

        ctx.strokeStyle = "green";
        ctx.strokeRect(this._rigidRect.x, this._rigidRect.y, this._rigidRect.width, this._rigidRect.height);

        if (this._attackRect !== null) {
            ctx.strokeStyle = "red";
            ctx.strokeRect(this._attackRect.x, this._attackRect.y, this._attackRect.width, this._attackRect.height);
        }
    }

    attack() {
        this._callback();
    }

    onDamageTaken(value) {
        console.log("Damage of " + value + " taken from Hero");
    }

    onDied() {
        this._state = new NpcDiesState(this);
    }
}

// Main Game class declaration
class Game {
    constructor(canvas) {
        this.frames = 0;
        this._canvas = canvas;
        this._context = canvas.getContext("2d");

        this._width = canvas.width;
        this._height = canvas.height;
    }

    init() {
        this._background = new Background({
            width: this._width,
            height: this._height - 24,
            layers: [
                {
                    src: "img/background/background_layer_1.png"
                },
                {
                    src: "img/background/background_layer_2.png"
                },
                {
                    src: "img/background/background_layer_3.png"
                }
            ]
        });

        this._floor = new Floor({
            tiles: new Tiles({
                src: "img/tileset/oak_woods_tileset.png",
                tileSize: new Size2d(24, 24)
            }),
            index: 1,
            position: new Vector2d(0, this._height - 24),
            width: this._width
        });

        this._shop = new AnimatedSprite({
            tiles: new Tiles({
                src: "img/decorations/shop_anim.png",
                tileSize: new Size2d(118, 128)
            }),
            from: 0,
            to: 6,
            direction: 1,
            throttle: 2,
            position: new Vector2d(134, 52)
        });

        const game = this;

        this._hero = new Hero({
            position: new Vector2d(24, 124),
            callback: this.heroAttack.bind(game)
        });

        this._npc = new Npc({
            position: new Vector2d(124, 124),
            callback: this.npcAttack.bind(game)
        });
    }

    draw() {
        this._frames++;

        this._context.clearRect(0, 0, this._width, this._height);
        
        this._background.draw(this._context);
        this._floor.draw(this._context);
        this._shop.draw(this._context);
        this._npc.draw(this._context);
        this._hero.draw(this._context);
    }

    update() {
        this._shop.update();
        this._hero.update();
        this._npc.update();
    }

    handle(action, event) {
        switch(action) {
            case "keydown" : {
                this._hero.handle(action, event);
                this._npc.handle(action, event);

                break
            }

            case "keyup" : {
                this._hero.handle(action, event);
                this._npc.handle(action, event);

                break
            }
        }
    }

    heroAttack() {
        if (this._npc.isHit(this._hero.attackRect)) {
            const damage = this._hero.damage;
            this._npc.takeDamage(damage);
        }
    }

    npcAttack() {
        if (this._hero.isHit(this._npc.attackRect)) {
            const damage = this._npc.damage;
            this._hero.takeDamage(damage);
        }
    }
}