import Game from 'bhse19/game';
import * as PIXI from "pixi.js";

var CHECKPOINT = 10;
var TIME_PER_TURN = 50;


/* For my use:

this.game.width, this.height -- self-explanatory
this.game.robots -- list of active objects.
    this.game.robots[i].unit = 0 means planet
    this.game.robots[i].unit = 1 means voyager
this.game.teams -- maps ids to teams (0, 1)
this.game.karbonite -- how much karbonite each player has
this.game.influence -- map of what belongs to whom
this.game.karbonite_map -- map of karbonite values
this.game.map -- passability map.

*/


class Visualizer {
    constructor(div, replay, turn_callback, width=840, height=672) {
        this.replay = replay;

        // Parse replay seed
        var seed = 0;
        for (let i = 0; i<4; i++) seed += (this.replay[i+2] << (24-8*i));

        this.game = new Game(seed, 0, 0, false, false);
        this.checkpoints = [this.game.copy()];
        this.turn = 0;
        this.running = false;
        this.turn_callback = turn_callback || false;

        this.width = width;
        this.height = height;
        this.shouldDestroy = false;

        // # millisecs extra wait per turn for nicer viewing or suspense.
        this.extraWait = 0;

        this.container = document.getElementById(div);

        this.populateCheckpoints();
        this.initViewer();

        this.draw();
    }

    initViewer() {
        this.grid_width = this.height;
        this.grid_height = this.height;
        this.graph_width = this.width - this.grid_width;
        this.graph_height = this.height*.8;
        this.MAP_WIDTH = this.game.width;
        this.MAP_HEIGHT = this.game.height;

        this.w_pressed = false;
        this.a_pressed = false;
        this.s_pressed = false;
        this.d_pressed = false;
        this.p_pressed = false;



        // Figure out how to convert between local and screen coordinates
        this.calculated_offset = false;
        this.pixi_x_offset = 0;
        this.pixi_y_offset = 0;

        this.active_id = 0;
        this.active_x = -1;
        this.active_y = -1;
        this.mouse_x = -1;
        this.mouse_y = -1;

        this.x1 = 0;
        this.y1 = 0;
        this.x2 = this.MAP_WIDTH;
        this.y2 = this.MAP_HEIGHT;
 
        this.stage = new PIXI.Container();
        this.stage.interactive = true;

        this.strategic = false; // By default, don't use strategic view.

        this.scaling_factor = this.grid_width / 672;

        this.stage.click = function(e) {
            var point = e.data.getLocalPosition(this.stage);
            this.active_x = Math.floor(this.x1 + (this.x2-this.x1) * point.x / this.grid_width);
            this.active_y = Math.floor(this.y1 + (this.y2-this.y1) * point.y / this.grid_height);
        }.bind(this);

        /*
        this.stage.mousemove = function(e) {
            var point = e.data.getLocalPosition(this.stage);
            this.mouse_x = this.x1 + (this.x2-this.x1) * point.x / this.grid_width;
            this.mouse_y = this.y1 + (this.y2-this.y1) * point.y / this.grid_height;
            if (!this.calculated_offset) {
                this.pixi_x_offset = -point.x;
                this.pixi_y_offset = -point.y;
            }
        }.bind(this);

        document.addEventListener('mousemove', function(event) {
            if (!this.calculated_offset && this.pixi_x_offset !== 0) { // pixi has registered something, go!
                this.pixi_x_offset += event.clientX;
                this.pixi_y_offset += event.clientY;
                this.calculated_offset = true;
            }
        }.bind(this));*/
        /*
        this.container.addEventListener('wheel', function(event) {
            var p_x = event.clientX-this.pixi_x_offset, p_y = event.clientY-this.pixi_y_offset
            if (this.calculated_offset && p_x >= 0 && p_x <= this.grid_width && p_y >= 0 && p_y <= this.grid_height) {
                // Nice-ify event
                // commenting because browsers suck:
                    // const WHEEL_MOVE = event.deltaY / 120;
                const WHEEL_MOVE = event.deltaY > 0 ? 1 : -1;
                const ZOOM = Math.pow(3/4, WHEEL_MOVE);
                
                // Calculate new bounds
                const OLD_WIDTH = this.x2-this.x1, OLD_HEIGHT = this.y2-this.y1;
                const NEW_WIDTH = Math.min(this.MAP_WIDTH, Math.max(8, ZOOM*OLD_WIDTH)), NEW_HEIGHT = Math.min(this.MAP_HEIGHT, Math.max(8, ZOOM*OLD_HEIGHT));
                const ZOOM_X = NEW_WIDTH / OLD_WIDTH, ZOOM_Y = NEW_HEIGHT / OLD_HEIGHT;
                // Keep tile of focus right where it is.
                this.x1 = Math.round(this.mouse_x - (this.mouse_x-this.x1)*ZOOM_X);
                this.y1 = Math.round(this.mouse_y - (this.mouse_y-this.y1)*ZOOM_Y);
                this.x2 = Math.round(this.mouse_x + (this.x2-this.mouse_x)*ZOOM_X);
                this.y2 = Math.round(this.mouse_y + (this.y2-this.mouse_y)*ZOOM_Y);
                
                // Correct horizontal bounds.
                if(this.x1 < 0) {
                    this.x2 -= this.x1;
                    this.x1 = 0;
                }
                else if(this.x2 > this.MAP_WIDTH) {
                    this.x1 -= this.x2-this.MAP_WIDTH;
                    this.x2 = this.MAP_WIDTH;
                }
                
                // Correct vertical bounds
                if(this.y1 < 0) {
                    this.y2 -= this.y1;
                    this.y1 = 0;
                }
                else if(this.y2 > this.MAP_HEIGHT) {
                    this.y1 -= this.y2-this.MAP_HEIGHT;
                    this.y2 = this.MAP_HEIGHT;
                }
            } event.preventDefault();
        }.bind(this));
        */

        document.onkeypress = function(k) {
            var charCode = (typeof k.which == "number") ? k.which : k.keyCode
            if (charCode === 96 || charCode === 192) {// `
                this.strategic = !this.strategic;
                console.log('toggled strategic view');
            }
            if (charCode === 87 || charCode === 119) {
                this.w_pressed = true;
            }
            if (charCode === 65 || charCode === 97) {
                this.a_pressed = true;
            }
            if (charCode === 83 || charCode === 115) {
                this.s_pressed = true;
            }
            if (charCode === 68 || charCode === 100) {
                this.d_pressed = true;
            }
            if (charCode === 80 || charCode === 112) {
                this.p_pressed = true;
            }
        }.bind(this);
        document.onkeyup = function(k) {
            var charCode = (typeof k.which == "number") ? k.which : k.keyCode
            if (charCode === 87 || charCode === 119) {
                this.w_pressed = false;
            }
            if (charCode === 65 || charCode === 97) {
                this.a_pressed = false;
            }
            if (charCode === 83 || charCode === 115) {
                this.s_pressed = false;
            }
            if (charCode === 68 || charCode === 100) {
                this.d_pressed = false;
            }
            if (charCode === 80 || charCode === 112) {
                this.p_pressed = false;
            }
        }.bind(this);

        this.mapGraphics = new PIXI.Graphics();
        this.stage.addChild(this.mapGraphics);

        this.graphGraphics = new PIXI.Graphics();
        this.stage.addChild(this.graphGraphics);

        this.renderer = PIXI.autoDetectRenderer(0, 0, { backgroundColor: 0x222222, antialias: false, transparent: false, resolution: devicePixelRatio, autoResize: true});

        // Clear container before draw
        this.container.innerHTML = '';
        this.container.append(this.renderer.view);

        // Reset the renderer
        this.renderer.resize(this.width, this.height);

        /*

        Since this is for a hackathon, and I'm not even sure sprites would be better
        I have elected not to implement them. If I am given assets and people want sprites
        that can be accomplished pretty quickly.

        */
        /*
        // Sprites!
        this.spritestage = new PIXI.Container();
        this.stage.addChild(this.spritestage);

        // Initialize normal textures
        this.textures = new Array(6);
        this.textures[0] = PIXI.Texture.from('assets/img/castle.png');
        this.textures[1] = PIXI.Texture.from('assets/img/church.png');
        this.textures[2] = PIXI.Texture.from('assets/img/pilgrim.png');
        this.textures[3] = PIXI.Texture.from('assets/img/crusader.png');
        this.textures[4] = PIXI.Texture.from('assets/img/prophet.png');
        this.textures[5] = PIXI.Texture.from('assets/img/preacher.png');
        // Create large pools of sprites from which to draw
        this.sprite_pools = new Array(6);
        for (let i = 0; i < 6; i++) this.sprite_pools[i] = [];
        for (let i = 0; i < 6; i++) { // Castles
            var sprite = new PIXI.Sprite(this.textures[0]);
            sprite.anchor = new PIXI.Point(0.5, 0.5);
            sprite.visible = false;
            sprite.mask = this.grid_mask;
            this.spritestage.addChild(sprite);
            this.sprite_pools[0].push(sprite);
        }
        for (let i = 1; i < 6; i++) for (let j = 0; j < 4096; j++) { // Other
            sprite = new PIXI.Sprite(this.textures[i]);
            sprite.anchor = new PIXI.Point(0.5, 0.5);
            sprite.visible = false;
            sprite.mask = this.grid_mask;
            this.spritestage.addChild(sprite);
            this.sprite_pools[i].push(sprite);
        }
        // Initialize strategic textures
        this.strategic_textures = new Array(6);
        this.strategic_textures[0] = PIXI.Texture.from('assets/img/s_castle.png');
        this.strategic_textures[1] = PIXI.Texture.from('assets/img/s_church.png');
        this.strategic_textures[2] = PIXI.Texture.from('assets/img/s_pilgrim.png');
        this.strategic_textures[3] = PIXI.Texture.from('assets/img/s_crusader.png');
        this.strategic_textures[4] = PIXI.Texture.from('assets/img/s_prophet.png');
        this.strategic_textures[5] = PIXI.Texture.from('assets/img/s_preacher.png');
        // Create large pools of strategic sprites from which to draw
        this.strategic_sprite_pools = new Array(6);
        for (let i = 0; i < 6; i++) this.strategic_sprite_pools[i] = [];
        for (let i = 0; i < 6; i++) { // Castles
            var sprite = new PIXI.Sprite(this.strategic_textures[0]);
            sprite.anchor = new PIXI.Point(0.5, 0.5);
            sprite.mask = this.grid_mask;
            sprite.visible = false;
            this.spritestage.addChild(sprite);
            this.strategic_sprite_pools[0].push(sprite);
        }
        
        for (let i = 1; i < 6; i++) for (let j = 0; j < 4096; j++) { // Other
            sprite = new PIXI.Sprite(this.strategic_textures[i]);
            sprite.anchor = new PIXI.Point(0.5, 0.5);
            sprite.mask = this.grid_mask;
            sprite.visible = false;
            this.spritestage.addChild(sprite);
            this.strategic_sprite_pools[i].push(sprite);
        }
        */

        

        // Borders and such for the graphs
        this.IND_G_WIDTH = this.graph_width*.8 / 2;
        this.LR_BORDER = (this.graph_width - 2*this.IND_G_WIDTH) / 3;
        this.T_BORDER_HEIGHT = this.graph_height * 0.14;
        this.KF_BORDER_HEIGHT = this.graph_height * 0.05;
        this.B_BORDER_HEIGHT = this.graph_height * 0.1;
        this.IND_G_HEIGHT = this.graph_height - (2*this.KF_BORDER_HEIGHT+this.T_BORDER_HEIGHT+this.B_BORDER_HEIGHT);

        // Deal with text
        this.textstage = new PIXI.Container();
        this.stage.addChild(this.textstage);
   
        this.red_karbtext = new PIXI.Text('', { fontFamily: "\"Courier New\", Courier, monospace", fontSize: 20*this.scaling_factor, fill: '0xFF0000' });
        this.red_karbtext.position = new PIXI.Point(this.grid_width+this.LR_BORDER, this.graph_height-this.B_BORDER_HEIGHT+5);
        this.textstage.addChild(this.red_karbtext);
        this.blue_karbtext = new PIXI.Text('', { fontFamily: "\"Courier New\", Courier, monospace", fontSize: 20*this.scaling_factor, fill: '0x4444FF' });
        this.blue_karbtext.position = new PIXI.Point(this.grid_width+this.LR_BORDER, this.graph_height-this.B_BORDER_HEIGHT/2);
        this.textstage.addChild(this.blue_karbtext);

        this.roundtext = new PIXI.Text('', { fontFamily: "\"Courier New\", Courier, monospace", fontSize: 12*this.scaling_factor, fill: '0xFFFFFF' });
        this.roundtext.position = new PIXI.Point(this.grid_width+10, 10);
        this.textstage.addChild(this.roundtext);
        this.infotext = new PIXI.Text('Click somewhere for information!', { fontFamily: "\"Courier New\", Courier, monospace", fontSize: 12*this.scaling_factor, fill: '0xFFFFFF',  wordWrap: true, wordWrapWidth: this.graph_width });
        this.infotext.position = new PIXI.Point(this.grid_width+10, this.graph_height);
        this.textstage.addChild(this.infotext);
    }

    draw() { // for later perhaps making strategic view

        if (this.shouldDestroy) return;

        // Not using sprites
        // var spritepools = this.strategic ? this.strategic_sprite_pools : this.sprite_pools;

        this.mapGraphics.clear();

        // where to put the map sprite
        const VIEW_WIDTH = this.x2-this.x1,
            VIEW_HEIGHT = this.y2-this.y1;

        var draw_width = this.grid_width / VIEW_WIDTH;
        var draw_height = this.grid_height / VIEW_HEIGHT;

        this.OBSTACLE = '0xFFFF00'; // Bright yellow obstacles!

        function componentToHex(c) {
            var hex = c.toString(16);
            return hex.length == 1 ? "0" + hex : hex;
        }
        function toHex(r,g,b,alpha) {
            return "0x" + componentToHex(Math.round(r*alpha)) + componentToHex(Math.round(g*alpha)) + componentToHex(Math.round(b*alpha));
        }
   
        // Draw tiles
        var influence = [0, 0]
        this.mapGraphics.lineStyle(0, 0x000000); // reset line style to nada
        for (let y = this.y1; y < this.y2; y++) for (let x = this.x1; x < this.x2; x++) {
            const MAX_KARB_BRIGHTNESS = 100;
            const MAX_KARB_VAL = 7
            var color; // This can be optimized a bit if necessary, but I have a hunch it won't be the bottleneck.
            if (!this.game.map[y][x]) color = this.OBSTACLE;
            else if (this.p_pressed || this.game.influence[y][x] === -1) {
                color = toHex(MAX_KARB_BRIGHTNESS,MAX_KARB_BRIGHTNESS,MAX_KARB_BRIGHTNESS, 0.4+0.6*this.game.karbonite_map[y][x] / MAX_KARB_VAL);
            }
            else if (this.game.influence[y][x] === 0) {
                color = toHex(MAX_KARB_BRIGHTNESS,0,0, 0.4+0.6*this.game.karbonite_map[y][x] / MAX_KARB_VAL);
                influence[0]++;
            }
            else if (this.game.influence[y][x] === 1) {
                color = toHex(0,0,MAX_KARB_BRIGHTNESS, 0.4+0.6*this.game.karbonite_map[y][x] / MAX_KARB_VAL);
                influence[1]++;
            }
            this.mapGraphics.beginFill(color)
            this.mapGraphics.drawRect((x-this.x1)*draw_width, (y-this.y1)*draw_height, draw_width, draw_height);
            this.mapGraphics.endFill();
        }


        // Draw units (non-sprite version)
        var num_robots = [0, 0]; // Count for statistics

        // Hopefully pixi resolves overlap within a graphics the way I think it does
        // otherwise I will need to mess with order within the stage.
        for (let i = 0; i < this.game.robots.length; i++) {
            let robot = this.game.robots[i];
            // Only draw if in screen bounds
            if (robot.x >= this.x1 && robot.x < this.x2 && robot.y >= this.y1 && robot.y < this.y2) {
                let x = robot.x-this.x1;
                let y = robot.y-this.y1;
                this.mapGraphics.beginFill(robot.team === 0 ? '0xFF1111' : '0x1111FF');
                if (robot.unit === 1) {
                    num_robots[robot.team] += 1;
                    this.mapGraphics.lineStyle(2, 0x000000);
                    const SIZE_FACTOR = 0.75;
                    const BORDER = (1 - SIZE_FACTOR) / 2;
                    this.mapGraphics.drawRect((x+BORDER)*draw_width, (y+BORDER)*draw_height, SIZE_FACTOR*draw_width, SIZE_FACTOR*draw_height);
                    this.mapGraphics.lineStyle(0, 0x000000);
                }
                else this.mapGraphics.drawRect(draw_width*x, draw_height*y, draw_width, draw_height);
                this.mapGraphics.endFill();
            }
        }


        // Gridlines
        this.mapGraphics.lineStyle(this.scaling_factor, this.OBSTACLE);
        for(var y = this.y1; y <= this.y2; y++) {
            this.mapGraphics.moveTo(0, (y-this.y1)*draw_height);
            this.mapGraphics.lineTo(this.grid_width, (y-this.y1)*draw_height);
        }
        for(var x = this.x1; x <= this.x2; x++){
            this.mapGraphics.moveTo((x-this.x1)*draw_width, 0);
            this.mapGraphics.lineTo((x-this.x1)*draw_width, this.grid_height);
        }

        // Draw graphs
        this.graphGraphics.clear();

        this.KARBONITE = '0x22BB22'
        this.UNITS = '0x00CCCC'
        
        // Indicate karbonite vs robot sections of graphs
        this.graphGraphics.lineStyle(0);
        this.graphGraphics.beginFill(this.KARBONITE);
        this.graphGraphics.drawRect(this.grid_width+this.LR_BORDER, this.T_BORDER_HEIGHT, this.IND_G_WIDTH, this.KF_BORDER_HEIGHT);
        this.graphGraphics.drawRect(this.grid_width+this.LR_BORDER, this.graph_height-this.B_BORDER_HEIGHT-this.KF_BORDER_HEIGHT, this.IND_G_WIDTH, this.KF_BORDER_HEIGHT);
        this.graphGraphics.endFill();
        this.graphGraphics.beginFill(this.UNITS);
        this.graphGraphics.drawRect(this.grid_width+this.IND_G_WIDTH+2*this.LR_BORDER, this.T_BORDER_HEIGHT, this.IND_G_WIDTH, this.KF_BORDER_HEIGHT);
        this.graphGraphics.drawRect(this.grid_width+this.IND_G_WIDTH+2*this.LR_BORDER, this.graph_height-this.B_BORDER_HEIGHT-this.KF_BORDER_HEIGHT, this.IND_G_WIDTH, this.KF_BORDER_HEIGHT);
        this.graphGraphics.endFill();
        // Figure out scaling for the graphs.
        const KARB_LINE = 65536;
        const INFLUENCE_LINE = 100;
        var MAX_KARB = Math.ceil(Math.max(5, this.game.karbonite[0]/KARB_LINE, this.game.karbonite[1]/KARB_LINE));
        var MAX_INFLUENCE = Math.ceil(Math.max(5, influence[0]/INFLUENCE_LINE, influence[1]/INFLUENCE_LINE));
        // Then, draw! I'm so sorry this is so disgusting. We do, in order, red karb, red units, blue karb, and blue units.
        // This puts those in the right places.
        this.graphGraphics.beginFill('0xFF0000');
        this.graphGraphics.drawRect(this.grid_width+this.LR_BORDER,
            this.T_BORDER_HEIGHT+this.KF_BORDER_HEIGHT+this.IND_G_HEIGHT*(1-this.game.karbonite[0]/MAX_KARB/KARB_LINE),
            this.IND_G_WIDTH/2, this.IND_G_HEIGHT*this.game.karbonite[0]/MAX_KARB/KARB_LINE);
        this.graphGraphics.drawRect(this.grid_width+this.IND_G_WIDTH+2*this.LR_BORDER,
            this.T_BORDER_HEIGHT+this.KF_BORDER_HEIGHT+this.IND_G_HEIGHT*(1-influence[0]/MAX_INFLUENCE/INFLUENCE_LINE),
            this.IND_G_WIDTH/2, this.IND_G_HEIGHT*influence[0]/MAX_INFLUENCE/INFLUENCE_LINE);
        this.graphGraphics.endFill();
        this.graphGraphics.beginFill('0x0000FF');
        this.graphGraphics.drawRect(this.grid_width+this.IND_G_WIDTH/2+this.LR_BORDER,
            this.T_BORDER_HEIGHT+this.KF_BORDER_HEIGHT+this.IND_G_HEIGHT*(1-this.game.karbonite[1]/MAX_KARB/KARB_LINE),
            this.IND_G_WIDTH/2, this.IND_G_HEIGHT*this.game.karbonite[1]/MAX_KARB/KARB_LINE);
        this.graphGraphics.drawRect(this.grid_width+this.IND_G_WIDTH*3/2+2*this.LR_BORDER,
            this.T_BORDER_HEIGHT+this.KF_BORDER_HEIGHT+this.IND_G_HEIGHT*(1-influence[1]/MAX_INFLUENCE/INFLUENCE_LINE),
            this.IND_G_WIDTH/2, this.IND_G_HEIGHT*influence[1]/MAX_INFLUENCE/INFLUENCE_LINE);
        this.graphGraphics.endFill();

        // Draw markers in graphs.
        this.graphGraphics.lineStyle(2, '0xFFFFFF');
        for(var k = 1; k < MAX_KARB; k++) {
            this.graphGraphics.moveTo(this.grid_width+this.LR_BORDER, this.T_BORDER_HEIGHT+this.KF_BORDER_HEIGHT+k/MAX_KARB*this.IND_G_HEIGHT);
            this.graphGraphics.lineTo(this.grid_width+this.LR_BORDER+this.IND_G_WIDTH,this.T_BORDER_HEIGHT+this.KF_BORDER_HEIGHT+k/MAX_KARB*this.IND_G_HEIGHT);
        }
        for(var f = 1; f < MAX_INFLUENCE; f++){
            this.graphGraphics.moveTo(this.grid_width+2*this.LR_BORDER+this.IND_G_WIDTH, this.T_BORDER_HEIGHT+this.KF_BORDER_HEIGHT+f/MAX_INFLUENCE*this.IND_G_HEIGHT);
            this.graphGraphics.lineTo(this.grid_width+2*this.LR_BORDER+2*this.IND_G_WIDTH,this.T_BORDER_HEIGHT+this.KF_BORDER_HEIGHT+f/MAX_INFLUENCE*this.IND_G_HEIGHT);
        }

        // Round text
        this.roundtext.text  = "Round  : "+this.game.round+"\n"
        this.roundtext.text += "Robin  : "+(isFinite(this.game.robin)?this.game.robin:0)+"\n";
        this.roundtext.text += "Turn   : "+this.turn+"\n"
        var www = ((this.game.winner === 0 || this.game.winner === 1)?(this.game.winner===0?'red':'blue'):"???");
        if (this.w_pressed) {
            www = (this.replay[0] == 0) ? 'red' : 'blue';
        }
        this.roundtext.text += "Winner : "+www+"\n";

        // Draw text for the stats
        var numspacesred = 5- this.game.karbonite[0].toString().length + 2
        var numspacesblue = 5- this.game.karbonite[1].toString().length + 2
        this.red_karbtext.text = ''+this.game.karbonite[0]+' '.repeat(numspacesred)+influence[0];
        this.blue_karbtext.text = ''+this.game.karbonite[1]+' '.repeat(numspacesblue)+influence[1];

        // Handle click and infotext
        if (this.active_x !== -1) {
            console.log('got here');
            this.infotext.text = "Clicked (" + this.active_x + ", " + this.active_y + ")\n";

            // Find robot using x, y
            console.log(this.game.shadow, this.active_y, this.active_x);
            this.active_id = this.game.shadow[this.active_y][this.active_x];

            if (this.active_id === 0) {
                this.infotext.text  = "position   : ("+this.active_x+", "+this.active_y+")\n";
                this.infotext.text += "passable   : "+this.game.map[this.active_y][this.active_x]+"\n";
                this.infotext.text += "karbonite  : "+this.game.karbonite_map[this.active_y][this.active_x]+"\n";
            }

            this.active_x = -1;
            this.active_y = -1;
        }
        if (this.active_id !== 0) {
            let robot = this.game.getItem(this.active_id);
            if (robot == null) {
                this.infotext.text = 'Click somewhere for information!';
            }
            else {
                this.infotext.text  = "position  : ("+robot.x+", "+robot.y+")\n";
                this.infotext.text += "id        : "+robot.id+"\n";
                this.infotext.text += "team      : "+["red", "blue"][robot.team]+"\n";
                this.infotext.text += "unit      : "+["planet", "voyager"][robot.unit]+"\n";
                this.infotext.text += "signal    : "+robot.signal+"\n";
            }
        }


        // Draw units (sprite version)
        /*
        var units = new Array(6);
        for (let i = 0; i < 6; i++) units[i] = [];
        for (let i = 0; i < this.game.robots.length; i++) {
            units[this.game.robots[i].unit].push(this.game.robots[i]);
        }

        for (let i = 0; i < 6; i++) {
            var counter = 0;
            for (let j = 0; j < units[i].length; j++) {
                let robot = units[i][j];
                let s = spritepools[i][counter];
                s.visible = true;
                s.width = draw_width;
                s.height = draw_height;
                s.position = new PIXI.Point(draw_width*(robot.x-this.x1+.5), draw_height*(robot.y-this.y1+.5));
                s.tint = robot.team === 0 ? 0xFF0000 : 0x0000FF;
                counter++;
            }
        }
        */
       
        // Render!
        this.renderer.render(this.stage);
       
        // Reset all sprite pools to be invisible
        // for (let i = 0; i < 6; i++) for (let j = 0; j < spritepools[i].length && spritepools[i][j].visible; j++) spritepools[i][j].visible = false; // Other
        
        // Move frame
        const PAN_SPEED = 1;
        if (this.w_pressed) {
            this.y1 -= PAN_SPEED;
            this.y2 -= PAN_SPEED;
        }
        if (this.a_pressed) {
            this.x1 -= PAN_SPEED;
            this.x2 -= PAN_SPEED;
        }
        if (this.s_pressed) {
            this.y1 += PAN_SPEED;
            this.y2 += PAN_SPEED;
        }
        if (this.d_pressed) {
            this.x1 += PAN_SPEED;
            this.x2 += PAN_SPEED;
        }
        // Correct horizontal bounds.
        if(this.x1 < 0) {
            this.x2 -= this.x1;
            this.x1 = 0;
        }
        else if(this.x2 > this.MAP_WIDTH) {
            this.x1 -= this.x2-this.MAP_WIDTH;
            this.x2 = this.MAP_WIDTH;
        }
        // Correct vertical bounds
        if(this.y1 < 0) {
            this.y2 -= this.y1;
            this.y1 = 0;
        }
        else if(this.y2 > this.MAP_HEIGHT) {
            this.y1 -= this.y2-this.MAP_HEIGHT;
            this.y2 = this.MAP_HEIGHT;
        }

        this.animframe = requestAnimationFrame(function() {
            setTimeout(this.draw.bind(this),33);
        }.bind(this));
    }

    populateCheckpoints() {
        if (this.shouldDestroy) return;
        var last_checkpoint_turn = CHECKPOINT * (this.checkpoints.length-1);
        var final_checkpoint_turn = this.numTurns() - (this.numTurns()%CHECKPOINT); // checkpoint before/at numturns
        if (final_checkpoint_turn === last_checkpoint_turn) return; // have all possible checkpoints

        var last_checkpoint_game = this.checkpoints[this.checkpoints.length-1].copy();

        for (let i = last_checkpoint_turn+1; i<final_checkpoint_turn+1; i++) {
            // feed in the i-1th instruction
            var diff = this.replay.slice(6 + 8*(i-1), 6 + 8*i);
            last_checkpoint_game.enactTurn(diff);
            if (i%CHECKPOINT === 0) {
                this.checkpoints.push(last_checkpoint_game);
                break;
            }
        }

        setTimeout(this.populateCheckpoints.bind(this),50);
    }

    goToTurn(turn) {
        // Ignore if already at turn.
        if (turn === this.turn) return;

        // First, go to nearest earlier/equal checkpoint.
        var last_checkpoint_turn = turn - turn%CHECKPOINT;

        // If we are currently at or greater than last_checkpoint_turn (and less than turn),
        // just use that.  Otherwise, load from last checkpoint.

        if (this.turn < last_checkpoint_turn || this.turn >= turn) {
            this.game = this.checkpoints[last_checkpoint_turn/CHECKPOINT].copy();
            this.turn = last_checkpoint_turn;
        }

        // Now, while this.turn < turn, go forward.
        while (this.turn < turn) this.nextTurn();
    }

    goToRound(round) {
        // Find the first checkpoint with game.round greater than round, then take the one before it.
        // If no such checkpoint exists, take the last checkpoint and hope for the best.
        //this.game = this.checkpoints[this.checkpoints.length-1].copy();
        //this.turn = this.checkpoints.length*CHECKPOINT
        for (let i = 0; i<this.checkpoints.length; i++) {
            if (this.checkpoints[i].round > round) {
                //this.game = this.checkpoints[i-1].copy();
                //this.turn = (i-1)*CHECKPOINT;
                this.goToTurn((i-1)*CHECKPOINT);
                break;
            }
        }


        // Now, advance (bounded by the numTurns())
        /*for (let i = 0; i<this.numTurns(); i++) {
            if (this.game.round !== round) this.nextTurn();
        }*/

    }

    nextTurn() {
        var diff = this.replay.slice(6 + 8*this.turn, 6 + 8*(this.turn+1));
        this.game.enactTurn(diff);
        this.turn++;
        if (this.turn_callback) this.turn_callback(this.turn);
    }

    numTurns() {
        return (this.replay.length - 6)/8;
    }

    numRounds() {
        return 256;
    }

    startStop() {
        if (this.running) {
            clearInterval(this.interval);
            this.running = false;
        } else {
            this.running = true;
            this.interval = setInterval(function () {
                if (this.turn < this.numTurns()) this.goToTurn(this.turn + 1);
                else this.startStop();
            }.bind(this), this.extraWait); 
        }
    }

    renderGame() {
        // pass, this will come from michael
    }

    destroyVis() {
        if (this.running) this.startStop();

        this.shouldDestroy = true;

        cancelAnimationFrame(this.animframe);

        
        this.stage.destroy(true);
        this.stag = null;

        this.renderer.destroy(true);
        this.renderer = null;

        this.replay = null;
    }


}

export default Visualizer;