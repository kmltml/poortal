var poortal = (function (exports, three, cannon, dat) {
	'use strict';

	three = three && Object.prototype.hasOwnProperty.call(three, 'default') ? three['default'] : three;
	cannon = cannon && Object.prototype.hasOwnProperty.call(cannon, 'default') ? cannon['default'] : cannon;
	dat = dat && Object.prototype.hasOwnProperty.call(dat, 'default') ? dat['default'] : dat;

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function unwrapExports (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var debug = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });

	class Debug {
	    constructor() {
	        this.gui = new dat.GUI();
	        this.folders = {
	            controls: this.gui.addFolder("Controls"),
	            portalDepth: this.gui.addFolder("Portal Depth"),
	            player: this.gui.addFolder("Player")
	        };
	        this.portalDepth = {
	            blue: 0,
	            orange: 0
	        };
	        this.player = {
	            speed: 0.1,
	            onGround: false
	        };
	        this.folders.controls.open();
	        this.folders.portalDepth.add(this.portalDepth, "blue").listen();
	        this.folders.portalDepth.add(this.portalDepth, "orange").listen();
	        this.folders.portalDepth.open();
	        this.folders.player.add(this.player, "speed").listen();
	        this.folders.player.add(this.player, "onGround").listen();
	        this.folders.player.open();
	        this.gui.show();
	    }
	    static get instance() {
	        if (Debug._instance === undefined) {
	            Debug._instance = new Debug();
	        }
	        return Debug._instance;
	    }
	}
	exports.Debug = Debug;
	});

	unwrapExports(debug);
	var debug_1 = debug.Debug;

	var physics = createCommonjsModule(function (module, exports) {
	var __importStar = (commonjsGlobal && commonjsGlobal.__importStar) || function (mod) {
	    if (mod && mod.__esModule) return mod;
	    var result = {};
	    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
	    result["default"] = mod;
	    return result;
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	const Cannon = __importStar(cannon);
	class Physics {
	    constructor() {
	        this.world = new Cannon.World();
	        this.dynamicObjects = [];
	        this.world.gravity.set(0, -9.8, 0);
	    }
	    update() {
	        this.world.step(1.0 / 60.0);
	        this.world.emitTriggeredEvents();
	        this.world.emitCollisionEvents();
	        this.dynamicObjects.forEach(o => o.synchronizeMesh());
	    }
	    add(obj) {
	        this.world.addBody(obj.body);
	        this.dynamicObjects.push(obj);
	    }
	}
	exports.Physics = Physics;
	Physics.Groups = {
	    Normal: 1,
	    Dynamic: 2,
	    BluePortalWall: 4,
	    OrangePortalWall: 8
	};
	});

	unwrapExports(physics);
	var physics_1 = physics.Physics;

	var utils = createCommonjsModule(function (module, exports) {
	var __importStar = (commonjsGlobal && commonjsGlobal.__importStar) || function (mod) {
	    if (mod && mod.__esModule) return mod;
	    var result = {};
	    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
	    result["default"] = mod;
	    return result;
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	const Cannon = __importStar(cannon);
	const Three = __importStar(three);
	function toCannonVec(v) {
	    return new Cannon.Vec3(v.x, v.y, v.z);
	}
	exports.toCannonVec = toCannonVec;
	function toThreeVec(v) {
	    return new Three.Vector3(v.x, v.y, v.z);
	}
	exports.toThreeVec = toThreeVec;
	});

	unwrapExports(utils);
	var utils_1 = utils.toCannonVec;
	var utils_2 = utils.toThreeVec;

	var portal_1 = createCommonjsModule(function (module, exports) {
	var __importStar = (commonjsGlobal && commonjsGlobal.__importStar) || function (mod) {
	    if (mod && mod.__esModule) return mod;
	    var result = {};
	    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
	    result["default"] = mod;
	    return result;
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	const Three = __importStar(three);
	const Cannon = __importStar(cannon);



	var PortalColor;
	(function (PortalColor) {
	    PortalColor[PortalColor["Orange"] = 0] = "Orange";
	    PortalColor[PortalColor["Blue"] = 1] = "Blue";
	})(PortalColor = exports.PortalColor || (exports.PortalColor = {}));
	class PortalCollisionHandler {
	    constructor(body) {
	        this.body = body;
	        this.portalsEntered = [false, false];
	        this.portals = [];
	        this.triggeredShapes = [[], []];
	        this.updateCollisionGroup();
	        body.addEventListener(Portal.TriggerEventType, (event) => {
	            if (event.event === "enter") {
	                this.enterPortal(event.portal, event.shape);
	            }
	            else if (event.event === "exit") {
	                this.exitPortal(event.portal, event.shape);
	            }
	            this.updateCollisionGroup();
	        });
	    }
	    enterPortal(portal, shape) {
	        if (shape === undefined || this.triggeredShapes[portal.color].indexOf(shape) == -1) {
	            if (shape !== undefined) {
	                this.triggeredShapes[portal.color].push(shape);
	            }
	            this.portalsEntered[portal.color] = true;
	            this.portals[portal.color] = portal;
	            this.updateCollisionGroup();
	        }
	    }
	    exitPortal(portal, shape) {
	        const index = shape === undefined ? -1 : this.triggeredShapes[portal.color].indexOf(shape);
	        if (index != -1 || shape === undefined) {
	            if (shape !== undefined) {
	                this.triggeredShapes[portal.color].splice(index, 1);
	            }
	            if (this.triggeredShapes.length > 0 || shape === undefined) {
	                this.portalsEntered[portal.color] = false;
	                this.portals[portal.color] = null;
	                this.triggeredShapes[portal.color].splice(0, this.triggeredShapes[portal.color].length);
	                this.updateCollisionGroup();
	            }
	        }
	    }
	    updateCollisionGroup() {
	        this.body.collisionFilterGroup =
	            physics.Physics.Groups.Dynamic |
	                (this.portalsEntered.some(x => x) ? 0 : physics.Physics.Groups.Normal) |
	                (this.portalsEntered[PortalColor.Blue] ? physics.Physics.Groups.BluePortalWall : 0) |
	                (this.portalsEntered[PortalColor.Orange] ? physics.Physics.Groups.OrangePortalWall : 0);
	        this.body.collisionFilterMask =
	            physics.Physics.Groups.Normal |
	                (this.portalsEntered[PortalColor.Blue] ? 0 : physics.Physics.Groups.BluePortalWall) |
	                (this.portalsEntered[PortalColor.Orange] ? 0 : physics.Physics.Groups.OrangePortalWall);
	    }
	    update() {
	        let plane = undefined;
	        for (let portal of this.portals) {
	            if (!portal || !portal.active)
	                continue;
	            plane = portal.getClippingPlane(plane);
	            const pos = utils.toThreeVec(this.body.position);
	            if (pos.clone().sub(plane.coplanarPoint(new Three.Vector3())).dot(plane.normal) < 0) {
	                // Object is behind portal
	                this.portalsEntered[portal.color == PortalColor.Blue ? PortalColor.Orange : PortalColor.Blue] = true;
	                this.updateCollisionGroup();
	                console.log("col after portal: ", this.body.collisionFilterGroup);
	                pos.applyMatrix4(portal.portalTransform);
	                this.body.position.set(pos.x, pos.y, pos.z);
	                const vel = utils.toThreeVec(this.body.velocity);
	                const speed = vel.length();
	                vel.transformDirection(portal.portalTransform).multiplyScalar(speed);
	                this.body.velocity.set(vel.x, vel.y, vel.z);
	                const quat = new Three.Quaternion();
	                quat.setFromRotationMatrix(portal.portalTransform);
	                const q = new Cannon.Quaternion(quat.x, quat.y, quat.z, quat.w);
	                q.mult(this.body.quaternion, this.body.quaternion);
	            }
	        }
	    }
	}
	exports.PortalCollisionHandler = PortalCollisionHandler;
	class Portal {
	    constructor(wall, color, mask, overlay) {
	        this.wall = wall;
	        this.color = color;
	        this.camera = new Three.PerspectiveCamera();
	        this.triggeredBodies = [];
	        this.portalTransform = new Three.Matrix4();
	        this.physicsPatched = false;
	        this.renderTexture = new Three.WebGLRenderTarget(window.innerWidth, window.innerHeight);
	        this.backTexture = new Three.WebGLRenderTarget(window.innerWidth, window.innerHeight);
	        this.material = new Three.ShaderMaterial({
	            transparent: true,
	            clipping: true,
	            uniforms: {
	                map: { value: this.backTexture.texture },
	                mask: { value: mask },
	                overlay: { value: overlay },
	                resolution: { value: new Three.Vector2(window.innerWidth, window.innerHeight) },
	                uvTransform: { value: new Three.Matrix3() }
	            },
	            defines: { "USE_UV": "" },
	            vertexShader: `
#include <clipping_planes_pars_vertex>
#include <uv_pars_vertex>

void main() {
  #include <begin_vertex>
  #include <uv_vertex>
  #include <project_vertex>
  #include <clipping_planes_vertex>
}
`,
	            fragmentShader: `
uniform sampler2D map;
uniform sampler2D mask;
uniform sampler2D overlay;
uniform vec2 resolution;

#include <clipping_planes_pars_fragment>
#include <uv_pars_fragment>

void main() {
  #include <clipping_planes_fragment>
  float mask_val = texture2D(mask, vUv).r;
  gl_FragColor = texture2D(map, gl_FragCoord.xy / resolution) * mask_val;
  vec4 overlay_texel = texture2D(overlay, vUv);
  gl_FragColor = mix(gl_FragColor, overlay_texel, overlay_texel.a);
}
`
	        });
	        this.mesh = new Three.Mesh(Portal.geometry, this.material);
	        const lightColor = color == PortalColor.Blue ? 0x00bfff : 0xffbd00;
	        const light = new Three.PointLight(lightColor, 0.3, 3);
	        this.mesh.add(light);
	        this.trigger = new Cannon.Body({
	            shape: new Cannon.Box(new Cannon.Vec3(Portal.Width / 2, Portal.Height / 2, Portal.TriggerDepth)),
	            type: Cannon.Body.STATIC,
	            collisionFilterMask: physics.Physics.Groups.Dynamic,
	            collisionFilterGroup: physics.Physics.Groups.Normal | physics.Physics.Groups.BluePortalWall | physics.Physics.Groups.OrangePortalWall
	        });
	        this.trigger.shapes[0].collisionResponse = false;
	        const frameMaterial = new Cannon.Material("portal-frame");
	        frameMaterial.friction = 0;
	        frameMaterial.restitution = 0;
	        this.frame = new Cannon.Body({
	            type: Cannon.Body.STATIC,
	            material: frameMaterial,
	            collisionFilterMask: this.color == PortalColor.Blue ? physics.Physics.Groups.BluePortalWall : physics.Physics.Groups.OrangePortalWall,
	            collisionFilterGroup: -1
	        });
	        this.frame.addShape(new Cannon.Box(new Cannon.Vec3(Portal.FrameThickness, Portal.Height / 2, Portal.FrameThickness)), new Cannon.Vec3(-Portal.Width / 2 - Portal.FrameThickness, 0, -Portal.FrameThickness));
	        this.frame.addShape(new Cannon.Box(new Cannon.Vec3(Portal.FrameThickness, Portal.Height / 2, Portal.FrameThickness)), new Cannon.Vec3(Portal.Width / 2 + Portal.FrameThickness, 0, -Portal.FrameThickness));
	        this.frame.addShape(new Cannon.Box(new Cannon.Vec3(Portal.Width / 2, Portal.FrameThickness, Portal.FrameThickness)), new Cannon.Vec3(0, -Portal.Height / 2 - Portal.FrameThickness, -Portal.FrameThickness));
	        this.frame.addShape(new Cannon.Box(new Cannon.Vec3(Portal.Width / 2, Portal.FrameThickness, Portal.FrameThickness)), new Cannon.Vec3(0, Portal.Height / 2 + Portal.FrameThickness, -Portal.FrameThickness));
	    }
	    static create(wall, position, normal, up, color) {
	        const border = (color == PortalColor.Blue) ? Portal.textures.blueBorder : Portal.textures.orangeBorder;
	        const portal = new Portal(wall, color, Portal.textures.mask, border);
	        portal.mesh.position.copy(position);
	        if (normal.distanceToSquared(new Three.Vector3(0, 1, 0)) > 0.001 &&
	            normal.distanceToSquared(new Three.Vector3(0, -1, 0)) > 0.001) {
	            up.set(0, 1, 0); // Only rotate to face away from player on horizontal surfaces
	        }
	        up.projectOnPlane(normal).normalize();
	        const trans = new Three.Matrix4();
	        trans.makeBasis(up.clone().cross(normal), up, normal);
	        portal.mesh.setRotationFromMatrix(trans);
	        return portal;
	    }
	    get otherPortal() {
	        return this._otherPortal;
	    }
	    set otherPortal(p) {
	        this._otherPortal = p;
	        if (p) {
	            this.mesh.updateMatrixWorld();
	            p.mesh.updateMatrixWorld();
	            this.updatePortalTransform();
	        }
	    }
	    get active() {
	        return this._otherPortal !== undefined;
	    }
	    updatePortalTransform() {
	        this.portalTransform
	            .getInverse(this.mesh.matrixWorld) // To local
	            .premultiply(new Three.Matrix4().makeRotationY(Math.PI)) // Rotate to move behind portal
	            .premultiply(this.otherPortal.mesh.matrixWorld); // From local to world
	    }
	    updateCamera(playerCamera) {
	        this.camera.copy(playerCamera);
	        playerCamera.getWorldPosition(this.camera.position);
	        playerCamera.getWorldQuaternion(this.camera.quaternion);
	        this.camera.setRotationFromQuaternion(this.camera.quaternion);
	        this.camera.applyMatrix4(this.portalTransform);
	    }
	    patchPhysics(physics) {
	        if (this.physicsPatched || !this.active) {
	            return; // Nothing to do
	        }
	        this.physicsPatched = true;
	        const meshQuaternion = this.mesh.getWorldQuaternion(new Three.Quaternion());
	        this.trigger.position.copy(utils.toCannonVec(this.mesh.localToWorld(new Three.Vector3(0, 0, Portal.TriggerDepth - 0.3))));
	        this.trigger.quaternion.set(meshQuaternion.x, meshQuaternion.y, meshQuaternion.z, meshQuaternion.w);
	        physics.world.addBody(this.trigger);
	        this.frame.position.copy(utils.toCannonVec(this.mesh.getWorldPosition(new Three.Vector3())));
	        this.frame.quaternion.set(meshQuaternion.x, meshQuaternion.y, meshQuaternion.z, meshQuaternion.w);
	        physics.world.addBody(this.frame);
	        this.wall.openPortal(this.color);
	        this.trigger.shapes[0].addEventListener("triggered", (event) => {
	            if (event.event == "onTriggerEnter" || event.event == "onTriggerStay") {
	                event.otherBody.dispatchEvent({
	                    type: Portal.TriggerEventType,
	                    event: "enter",
	                    portal: this,
	                    shape: event.otherShape,
	                    target: event.otherBody,
	                });
	                this.triggeredBodies.push(event.otherBody);
	            }
	            else if (event.event == "onTriggerExit") {
	                event.otherBody.dispatchEvent({
	                    type: Portal.TriggerEventType,
	                    event: "exit",
	                    portal: this,
	                    shape: event.otherShape,
	                    target: event.otherBody
	                });
	                this.triggeredBodies = this.triggeredBodies.filter(b => b !== event.otherBody);
	            }
	        });
	    }
	    unpatchPhysics(physics) {
	        if (!this.physicsPatched) {
	            return;
	        }
	        physics.world.remove(this.trigger);
	        physics.world.remove(this.frame);
	        this.wall.closePortal(this.color);
	        this.triggeredBodies.forEach(b => b.dispatchEvent({
	            type: Portal.TriggerEventType,
	            event: "exit",
	            portal: this,
	            target: b
	        }));
	    }
	    swapTargets() {
	        const temp = this.backTexture;
	        this.backTexture = this.renderTexture;
	        this.renderTexture = temp;
	        this.material.uniforms.map.value = this.backTexture.texture;
	    }
	    computeViewBoundingBox(playerCamera, viewSize) {
	        playerCamera.updateMatrixWorld();
	        let points = [
	            new Three.Vector3(-Portal.Width / 2, -Portal.Height / 2, 0),
	            new Three.Vector3(Portal.Width / 2, -Portal.Height / 2, 0),
	            new Three.Vector3(Portal.Width / 2, Portal.Height / 2, 0),
	            new Three.Vector3(-Portal.Width / 2, Portal.Height / 2, 0),
	        ].map(p => this.mesh.localToWorld(p).project(playerCamera));
	        if (points.every(p => p.x > 1)
	            || points.every(p => p.x < -1)
	            || points.every(p => p.y > 1)
	            || points.every(p => p.y < -1)
	            || points.every(p => p.z > 1)
	            || points.every(p => p.z < -1)) {
	            const box = new Three.Box2();
	            box.makeEmpty();
	            return box;
	        }
	        if (points.some(p => p.z > 1)) {
	            // Ugly, but i have no other ideas
	            return new Three.Box2(new Three.Vector2(0, 0), viewSize);
	        }
	        points.forEach(p => p.clamp(new Three.Vector3(-1, -1, -1), new Three.Vector3(1, 1, 1)));
	        let points2 = points.map(p => new Three.Vector2(p.x, p.y)
	            .addScalar(1.0)
	            .multiply(viewSize)
	            .multiplyScalar(0.5)
	            .clamp(new Three.Vector2(), viewSize));
	        const box = new Three.Box2();
	        box.setFromPoints(points2);
	        return box;
	    }
	    getClippingPlane(plane = new Three.Plane()) {
	        plane.setFromNormalAndCoplanarPoint(this.mesh.getWorldDirection(new Three.Vector3()), this.mesh.getWorldPosition(new Three.Vector3()));
	        return plane;
	    }
	    render(playerCamera, scene, renderer) {
	        const rec = (camera, depth, box) => {
	            if (this.color == PortalColor.Blue) {
	                debug.Debug.instance.portalDepth.blue = depth;
	            }
	            else {
	                debug.Debug.instance.portalDepth.orange = depth;
	            }
	            const scissorBox = this.computeViewBoundingBox(camera, renderer.getSize(new Three.Vector2()));
	            if (box) {
	                scissorBox.intersect(box);
	            }
	            if (scissorBox.isEmpty()) {
	                return;
	            }
	            const boxSize = scissorBox.getSize(new Three.Vector2());
	            if (boxSize.x < 2.0 || boxSize.y < 2.0) {
	                return;
	            }
	            this.updateCamera(camera);
	            if (depth < Portal.MaxDepth) {
	                const savedCamera = this.camera;
	                this.camera = this.camera.clone();
	                rec(savedCamera, depth + 1, scissorBox);
	                this.camera = savedCamera;
	            }
	            else {
	                renderer.setRenderTarget(this.backTexture);
	                renderer.clear();
	            }
	            renderer.setRenderTarget(this.renderTexture);
	            renderer.clear();
	            renderer.setScissor(scissorBox.min.x, scissorBox.min.y, boxSize.x, boxSize.y);
	            renderer.setScissorTest(true);
	            renderer.render(scene, this.camera);
	            renderer.setScissorTest(false);
	            this.swapTargets();
	        };
	        if (this.active) {
	            this.otherPortal.getClippingPlane(renderer.clippingPlanes[0]);
	            rec(playerCamera, 0);
	            renderer.setRenderTarget(null); // reset render target
	        }
	        else {
	            renderer.setRenderTarget(this.backTexture);
	            renderer.clear();
	            renderer.setRenderTarget(null);
	        }
	    }
	}
	exports.Portal = Portal;
	Portal.TriggerEventType = "portal-trigger";
	Portal.FrameThickness = 0.2;
	Portal.Width = 1.0;
	Portal.Height = 2.0;
	Portal.MaxDepth = 20;
	Portal.TriggerDepth = 1.0;
	Portal.geometry = new Three.PlaneGeometry(Portal.Width, Portal.Height);
	});

	unwrapExports(portal_1);
	var portal_2 = portal_1.PortalColor;
	var portal_3 = portal_1.PortalCollisionHandler;
	var portal_4 = portal_1.Portal;

	var wall = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });


	class Wall {
	    constructor(mesh, body) {
	        this.mesh = mesh;
	        this.body = body;
	        this.portalsOpen = [false, false];
	        this.updateCollisionGroup();
	    }
	    openPortal(color) {
	        this.portalsOpen[color] = true;
	        this.updateCollisionGroup();
	    }
	    closePortal(color) {
	        this.portalsOpen[color] = false;
	        this.updateCollisionGroup();
	    }
	    updateCollisionGroup() {
	        this.body.collisionFilterGroup =
	            (this.portalsOpen.some(x => x) ? 0 : physics.Physics.Groups.Normal) |
	                (this.portalsOpen[portal_1.PortalColor.Blue] ? physics.Physics.Groups.BluePortalWall : 0) |
	                (this.portalsOpen[portal_1.PortalColor.Orange] ? physics.Physics.Groups.OrangePortalWall : 0);
	        this.body.collisionFilterMask =
	            physics.Physics.Groups.Normal |
	                (this.portalsOpen[portal_1.PortalColor.Blue] ? 0 : physics.Physics.Groups.BluePortalWall) |
	                (this.portalsOpen[portal_1.PortalColor.Orange] ? 0 : physics.Physics.Groups.OrangePortalWall);
	    }
	}
	exports.Wall = Wall;
	});

	unwrapExports(wall);
	var wall_1 = wall.Wall;

	var level = createCommonjsModule(function (module, exports) {
	var __importStar = (commonjsGlobal && commonjsGlobal.__importStar) || function (mod) {
	    if (mod && mod.__esModule) return mod;
	    var result = {};
	    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
	    result["default"] = mod;
	    return result;
	};
	Object.defineProperty(exports, "__esModule", { value: true });

	const Cannon = __importStar(cannon);

	function createLevel(level, root, physics) {
	    const blockMaterial = new three.MeshPhysicalMaterial({
	        color: 0xdddddd,
	        roughness: 0.5,
	    });
	    const portalProofMaterial = new three.MeshPhysicalMaterial({
	        color: 0xaa9999,
	        roughness: 0.2,
	    });
	    const blockGeo = new three.BoxGeometry(1, 1, 1);
	    const physMaterial = new Cannon.Material("wall");
	    physMaterial.friction = 0;
	    for (let block of level.blocks) {
	        const mesh = new three.Mesh(blockGeo, block.portalProof ? portalProofMaterial : blockMaterial);
	        mesh.scale.copy(block.size);
	        mesh.position.copy(block.position);
	        if (block.rotation) {
	            mesh.setRotationFromEuler(block.rotation);
	        }
	        root.add(mesh);
	        const body = new Cannon.Body({
	            type: Cannon.Body.STATIC,
	            mass: 0,
	            shape: new Cannon.Box(new Cannon.Vec3(block.size.x / 2, block.size.y / 2, block.size.z / 2)),
	            position: new Cannon.Vec3(block.position.x, block.position.y, block.position.z),
	            material: physMaterial
	        });
	        if (block.rotation) {
	            body.quaternion.setFromEuler(block.rotation.x, block.rotation.y, block.rotation.z);
	        }
	        physics.world.addBody(body);
	        const wall$1 = new wall.Wall(mesh, body);
	        mesh.userData = {
	            canAcceptPortals: !block.portalProof,
	            wall: wall$1
	        };
	    }
	}
	exports.createLevel = createLevel;
	});

	unwrapExports(level);
	var level_1 = level.createLevel;

	var controls = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });


	class Controls {
	    constructor(camera) {
	        this.orientation = new three.Euler(0, 0, 0, "ZYX");
	        this.speed = 3.0;
	        this.mouseSensitivity = 0.01;
	        this.canvas = null;
	        this.pointerLocked = false;
	        this.keys = {
	            forward: false,
	            back: false,
	            left: false,
	            right: false,
	            jump: false,
	            reset: false
	        };
	        this.previousKeys = {
	            jump: false,
	            reset: false
	        };
	        this.buttons = {
	            left: false,
	            right: false
	        };
	        this.previousButtons = {
	            left: false,
	            right: false
	        };
	        this.justPressed = {
	            left: false,
	            right: false
	        };
	        this.moveVec = new three.Vector3();
	        this.jump = false;
	        this.reset = false;
	        this.mouseDelta = new three.Vector2();
	        this.camera = camera;
	        debug.Debug.instance.folders.controls.add(this, "speed");
	        debug.Debug.instance.folders.controls.add(this, "mouseSensitivity", 0.001, 0.02);
	    }
	    install(canvas) {
	        window.addEventListener("keydown", event => this.onKeyDown(event));
	        window.addEventListener("keyup", event => this.onKeyUp(event));
	        window.addEventListener("mousemove", event => this.onMouseMove(event));
	        window.addEventListener("mousedown", event => this.onMouseDown(event));
	        window.addEventListener("mouseup", event => this.onMouseUp(event));
	        canvas.addEventListener("click", _ => this.tryLock());
	        document.addEventListener("pointerlockchange", _ => this.onPointerLockChanged());
	        this.canvas = canvas;
	    }
	    update() {
	        let dx = 0;
	        let dz = 0;
	        if (this.keys.forward) {
	            dz -= 1;
	        }
	        if (this.keys.back) {
	            dz += 1;
	        }
	        if (this.keys.left) {
	            dx -= 1;
	        }
	        if (this.keys.right) {
	            dx += 1;
	        }
	        const posChange = new three.Vector2(dx, dz).normalize();
	        posChange.multiplyScalar(this.speed);
	        this.moveVec.copy(this.forwardDirection().multiplyScalar(posChange.y));
	        this.moveVec.add(this.rightDirection().multiplyScalar(posChange.x));
	        this.mouseDelta.multiplyScalar(this.mouseSensitivity);
	        this.orientation.y -= this.mouseDelta.x;
	        this.orientation.x -= this.mouseDelta.y;
	        this.orientation.x = three.MathUtils.clamp(this.orientation.x, -Math.PI / 2, Math.PI / 2);
	        this.mouseDelta.set(0, 0);
	        this.camera.setRotationFromEuler(this.orientation);
	        this.jump = this.keys.jump && !this.previousKeys.jump;
	        this.previousKeys.jump = this.keys.jump;
	        this.reset = this.keys.reset && !this.previousKeys.reset;
	        this.previousKeys.reset = this.keys.reset;
	        this.justPressed.left = this.buttons.left && !this.previousButtons.left;
	        this.justPressed.right = this.buttons.right && !this.previousButtons.right;
	        this.previousButtons.left = this.buttons.left;
	        this.previousButtons.right = this.buttons.right;
	    }
	    forwardDirection() {
	        const forward = new three.Vector3(0, 0, 1);
	        forward.applyAxisAngle(new three.Vector3(0, 1, 0), this.orientation.y);
	        forward.transformDirection(this.camera.parent.matrixWorld);
	        forward.y = 0;
	        return forward.normalize();
	    }
	    rightDirection() {
	        const right = new three.Vector3(1, 0, 0);
	        right.applyAxisAngle(new three.Vector3(0, 1, 0), this.orientation.y);
	        right.transformDirection(this.camera.parent.matrixWorld);
	        right.y = 0;
	        return right.normalize();
	    }
	    onKeyDown(event) {
	        if (!this.pointerLocked)
	            return;
	        switch (event.key) {
	            case "w":
	                this.keys.forward = true;
	                break;
	            case "s":
	                this.keys.back = true;
	                break;
	            case "a":
	                this.keys.left = true;
	                break;
	            case "d":
	                this.keys.right = true;
	                break;
	            case " ":
	                this.keys.jump = true;
	                break;
	            case "r":
	                this.keys.reset = true;
	                break;
	        }
	    }
	    onKeyUp(event) {
	        if (!this.pointerLocked)
	            return;
	        switch (event.key) {
	            case "w":
	                this.keys.forward = false;
	                break;
	            case "s":
	                this.keys.back = false;
	                break;
	            case "a":
	                this.keys.left = false;
	                break;
	            case "d":
	                this.keys.right = false;
	                break;
	            case " ":
	                this.keys.jump = false;
	                break;
	            case "r":
	                this.keys.reset = false;
	                break;
	        }
	    }
	    onMouseMove(event) {
	        if (!this.pointerLocked)
	            return;
	        this.mouseDelta = new three.Vector2(event.movementX, event.movementY);
	    }
	    onMouseDown(event) {
	        if (!this.pointerLocked)
	            return;
	        if (event.button === 0) {
	            this.buttons.left = true;
	        }
	        else if (event.button === 2) {
	            this.buttons.right = true;
	        }
	    }
	    onMouseUp(event) {
	        if (!this.pointerLocked)
	            return;
	        if (event.button === 0) {
	            this.buttons.left = false;
	        }
	        else if (event.button === 2) {
	            this.buttons.right = false;
	        }
	    }
	    tryLock() {
	        if (!this.pointerLocked) {
	            this.canvas.requestPointerLock();
	        }
	    }
	    onPointerLockChanged() {
	        if (document.pointerLockElement === this.canvas) {
	            console.log("Pointer locked");
	            this.pointerLocked = true;
	        }
	        else {
	            console.log("Pointer unlocked");
	            this.pointerLocked = false;
	            this.keys.forward = false;
	            this.keys.back = false;
	            this.keys.left = false;
	            this.keys.right = false;
	            this.keys.jump = false;
	            this.keys.reset = false;
	        }
	    }
	}
	exports.Controls = Controls;
	});

	unwrapExports(controls);
	var controls_1 = controls.Controls;

	var player = createCommonjsModule(function (module, exports) {
	var __importStar = (commonjsGlobal && commonjsGlobal.__importStar) || function (mod) {
	    if (mod && mod.__esModule) return mod;
	    var result = {};
	    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
	    result["default"] = mod;
	    return result;
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	const Three = __importStar(three);
	const Cannon = __importStar(cannon);




	class Player {
	    constructor(scene, physics) {
	        this.scene = scene;
	        this.physics = physics;
	        this.legs = new Cannon.Sphere(Player.CollisionRadius);
	        this.portals = [];
	        this.onGround = false;
	        this.helper = new Three.Box3Helper(new Three.Box3(new Three.Vector3(-Player.CollisionRadius, -Player.CollisionHeight / 2, -Player.CollisionRadius), new Three.Vector3(Player.CollisionRadius, Player.CollisionHeight / 2, Player.CollisionRadius)));
	        this.mesh = new Three.Group();
	        this.camera = new Three.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.01, 1000);
	        this.camera.position.set(0, Player.CameraHeight - Player.CollisionHeight / 2, 0);
	        this.mesh.add(this.camera);
	        // this.mesh.add(this.helper)
	        scene.add(this.mesh);
	        this.controls = new controls.Controls(this.camera);
	        const material = new Cannon.Material("player");
	        material.friction = 0;
	        material.restitution = 0;
	        this.body = new Cannon.Body({
	            fixedRotation: true,
	            mass: 50,
	            material: material
	        });
	        this.buildCapsule();
	        this.body.addEventListener("collide", (event) => {
	            if (event.selfShape == this.legs) {
	                if (event.event == "onCollisionEnter" || event.event == "onCollisionStay") {
	                    this.onGround = true;
	                }
	                else if (event.event == "onCollisionExit") {
	                    this.onGround = false;
	                }
	            }
	        });
	        this.portalHandler = new portal_1.PortalCollisionHandler(this.body);
	        this.portalHandler.updateCollisionGroup();
	    }
	    update() {
	        this.controls.update();
	        debug.Debug.instance.player.onGround = this.onGround;
	        if (this.controls.justPressed.left) {
	            this.openPortal(portal_1.PortalColor.Blue);
	        }
	        if (this.controls.justPressed.right) {
	            this.openPortal(portal_1.PortalColor.Orange);
	        }
	        if (this.onGround) {
	            this.body.velocity.x = this.controls.moveVec.x;
	            this.body.velocity.z = this.controls.moveVec.z;
	            if (this.controls.jump) {
	                this.body.velocity.y += 4;
	            }
	        }
	        if (this.controls.reset) {
	            for (let color of [portal_1.PortalColor.Blue, portal_1.PortalColor.Orange]) {
	                if (this.portals[color]) {
	                    this.scene.remove(this.portals[color].mesh);
	                    this.portals[color].unpatchPhysics(this.physics);
	                    this.portals[color] = undefined;
	                }
	            }
	        }
	        if (this.body.velocity.norm() >= Player.MaxSpeed) {
	            this.body.velocity.normalize();
	            this.body.velocity.mult(Player.MaxSpeed, this.body.velocity);
	        }
	        this.fixOrientation();
	        this.portalHandler.update();
	    }
	    fixOrientation() {
	        const worldUp = new Three.Vector3(0, 1, 0).transformDirection(this.mesh.matrixWorld);
	        let dot = worldUp.dot(new Three.Vector3(0, 1, 0));
	        if (dot > 0.999) {
	            this.body.quaternion.x = 0;
	            this.body.quaternion.z = 0;
	            this.body.angularVelocity.set(0, 0, 0);
	        }
	        else {
	            const axis = new Three.Vector3(0, 1, 0).cross(worldUp).normalize().multiplyScalar(-3.14);
	            this.body.angularVelocity.set(axis.x, axis.y, axis.z);
	        }
	    }
	    openPortal(color) {
	        const caster = new Three.Raycaster();
	        caster.setFromCamera({ x: 0, y: 0 }, this.camera);
	        if (this.portals[color]) {
	            // Allow slight repositioning of portals
	            this.portals[color].mesh.layers.disable(0);
	        }
	        const intersects = caster.intersectObjects(this.scene.children);
	        if (this.portals[color]) {
	            this.portals[color].mesh.layers.enable(0);
	        }
	        if (intersects.length != 0) {
	            const intersect = intersects[0];
	            const wallData = intersect.object.userData;
	            if (!wallData.canAcceptPortals) {
	                return;
	            }
	            if (!wallData.wall) {
	                return;
	            }
	            const normal = intersect.face.normal.clone();
	            normal.transformDirection(intersect.object.matrixWorld);
	            const pos = intersect.point;
	            pos.add(intersect.face.normal.clone().multiplyScalar(0.001));
	            const up = new Three.Vector3(0, 1, 0)
	                .applyQuaternion(this.camera.getWorldQuaternion(new Three.Quaternion()))
	                .multiplyScalar(normal.y)
	                .normalize();
	            const newPortal = portal_1.Portal.create(wallData.wall, intersect.point, normal, up, color);
	            if (this.portals[color]) {
	                this.scene.remove(this.portals[color].mesh);
	                this.portals[color].unpatchPhysics(this.physics);
	            }
	            this.scene.add(newPortal.mesh);
	            this.portals[color] = newPortal;
	            if (this.portals[0]) {
	                this.portals[0].otherPortal = this.portals[1];
	                this.portals[0].patchPhysics(this.physics);
	            }
	            if (this.portals[1]) {
	                this.portals[1].otherPortal = this.portals[0];
	                this.portals[1].patchPhysics(this.physics);
	            }
	        }
	    }
	    initPhysics() {
	        this.physics.add(this);
	    }
	    buildCapsule() {
	        this.body.addShape(new Cannon.Cylinder(Player.CollisionRadius, Player.CollisionRadius, Player.CollisionHeight - 2 * Player.CollisionRadius, 16));
	        this.body.addShape(this.legs, new Cannon.Vec3(0, -(Player.CollisionHeight / 2 - Player.CollisionRadius), 0));
	        this.body.addShape(new Cannon.Sphere(Player.CollisionRadius), new Cannon.Vec3(0, Player.CollisionHeight / 2 - Player.CollisionRadius));
	    }
	    synchronizeMesh() {
	        const newPos = this.body.position;
	        this.mesh.position.set(newPos.x, newPos.y, newPos.z);
	        const newQuat = this.body.quaternion;
	        this.mesh.setRotationFromQuaternion(new Three.Quaternion(newQuat.x, newQuat.y, newQuat.z, newQuat.w));
	        debug.Debug.instance.player.speed = this.body.velocity.norm();
	    }
	    setPosition(pos) {
	        this.mesh.position.copy(pos);
	        this.body.position.copy(utils.toCannonVec(pos));
	    }
	}
	exports.Player = Player;
	Player.CameraHeight = 1.5;
	Player.CollisionRadius = 0.3;
	Player.CollisionHeight = 1.7;
	Player.MaxSpeed = 30.0;
	});

	unwrapExports(player);
	var player_1 = player.Player;

	var hud = createCommonjsModule(function (module, exports) {
	var __importStar = (commonjsGlobal && commonjsGlobal.__importStar) || function (mod) {
	    if (mod && mod.__esModule) return mod;
	    var result = {};
	    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
	    result["default"] = mod;
	    return result;
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	const Three = __importStar(three);

	class Hud {
	    constructor(player, renderer, textureLoader) {
	        this.player = player;
	        this.scene = new Three.Scene();
	        const size = renderer.getSize(new Three.Vector2());
	        this.camera = new Three.OrthographicCamera(-size.x / 2, size.x / 2, size.y / 2, -size.y / 2, 0, 1);
	        this.textures = {
	            crosshair: textureLoader.load("tex/hud/crosshair.png"),
	            portalActiveOrange: textureLoader.load("tex/hud/portal-active-orange.png"),
	            portalInactiveOrange: textureLoader.load("tex/hud/portal-inactive-orange.png"),
	            portalActiveBlue: textureLoader.load("tex/hud/portal-active-blue.png"),
	            portalInactiveBlue: textureLoader.load("tex/hud/portal-inactive-blue.png"),
	        };
	        this.crosshair = new Three.Mesh(Hud.Quad, new Three.MeshBasicMaterial({
	            side: Three.DoubleSide,
	            map: this.textures.crosshair,
	            transparent: true
	        }));
	        this.crosshair.position.set(0, 0, 0);
	        this.crosshair.scale.set(32, 32, 1.0);
	        this.scene.add(this.crosshair);
	        this.bluePortalIndicatorMaterial = new Three.MeshBasicMaterial({
	            side: Three.DoubleSide,
	            map: this.textures.portalInactiveBlue,
	            transparent: true
	        });
	        const bluePortalIndicator = new Three.Mesh(Hud.Quad, this.bluePortalIndicatorMaterial);
	        bluePortalIndicator.position.set(0, 0, 0);
	        bluePortalIndicator.scale.set(64, 128, 1);
	        this.scene.add(bluePortalIndicator);
	        this.orangePortalIndicatorMaterial = new Three.MeshBasicMaterial({
	            side: Three.DoubleSide,
	            map: this.textures.portalInactiveOrange,
	            transparent: true
	        });
	        const orangePortalIndicator = new Three.Mesh(Hud.Quad, this.orangePortalIndicatorMaterial);
	        orangePortalIndicator.position.set(0, 0, 0);
	        orangePortalIndicator.scale.set(64, 128, 1);
	        this.scene.add(orangePortalIndicator);
	    }
	    render(renderer) {
	        renderer.clearDepth();
	        this.bluePortalIndicatorMaterial.map =
	            this.player.portals[portal_1.PortalColor.Blue] ? this.textures.portalActiveBlue : this.textures.portalInactiveBlue;
	        this.orangePortalIndicatorMaterial.map =
	            this.player.portals[portal_1.PortalColor.Orange] ? this.textures.portalActiveOrange : this.textures.portalInactiveOrange;
	        renderer.render(this.scene, this.camera);
	    }
	}
	exports.Hud = Hud;
	Hud.Quad = new Three.PlaneGeometry();
	});

	unwrapExports(hud);
	var hud_1 = hud.Hud;

	var initLevel = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });

	exports.initLevel = {
	    startPosition: new three.Vector3(-2, 1, 0),
	    blocks: [{
	            size: new three.Vector3(10, 1, 20),
	            position: new three.Vector3(0, -1, 0),
	        }, {
	            size: new three.Vector3(10, 1, 25),
	            position: new three.Vector3(0, 6, 2.5),
	        }, {
	            size: new three.Vector3(10, 6, 1),
	            position: new three.Vector3(0, 2.5, -10.5),
	        }, {
	            size: new three.Vector3(4, 6, 1),
	            position: new three.Vector3(-3, 2.5, 10.5),
	        }, {
	            size: new three.Vector3(1, 6, 20),
	            position: new three.Vector3(-5.5, 2.5, 0),
	        }, {
	            size: new three.Vector3(1, 6, 20),
	            position: new three.Vector3(5.5, 2.5, 0),
	        }, {
	            size: new three.Vector3(3, 3, 5),
	            position: new three.Vector3(0, 1, 0),
	        }, {
	            size: new three.Vector3(5, 1, 5),
	            position: new three.Vector3(2.5, -10, 12.5)
	        }, {
	            size: new three.Vector3(1, 15, 5),
	            position: new three.Vector3(5.5, -2, 12.5),
	            portalProof: true
	        }, {
	            size: new three.Vector3(1, 15, 5),
	            position: new three.Vector3(-0.5, -2, 12.5),
	            portalProof: true
	        }, {
	            size: new three.Vector3(5, 15, 1),
	            position: new three.Vector3(2.5, -2, 15.5),
	            portalProof: true
	        }, {
	            size: new three.Vector3(5, 8, 1),
	            position: new three.Vector3(2.5, -5.5, 9.5),
	            portalProof: true
	        }, {
	            size: new three.Vector3(3, 3, 3),
	            position: new three.Vector3(-4, -0.5, 10),
	            rotation: new three.Euler(Math.PI / 4, 0, 0)
	        }]
	};
	});

	unwrapExports(initLevel);
	var initLevel_1 = initLevel.initLevel;

	var main = createCommonjsModule(function (module, exports) {
	var __importStar = (commonjsGlobal && commonjsGlobal.__importStar) || function (mod) {
	    if (mod && mod.__esModule) return mod;
	    var result = {};
	    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
	    result["default"] = mod;
	    return result;
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	const Three = __importStar(three);






	exports.scene = new Three.Scene();
	exports.renderer = new Three.WebGLRenderer({
	    antialias: true
	});
	exports.renderer.autoClear = false;
	exports.renderer.setSize(window.innerWidth, window.innerHeight);
	exports.renderer.clippingPlanes = [new Three.Plane()];
	exports.physics = new physics.Physics();
	exports.player = new player.Player(exports.scene, exports.physics);
	exports.player.initPhysics();
	const textureLoader = new Three.TextureLoader();
	portal_1.Portal.textures = {
	    mask: textureLoader.load("tex/portal_mask.png"),
	    blueBorder: textureLoader.load("tex/portal_blue.png"),
	    orangeBorder: textureLoader.load("tex/portal_orange.png")
	};
	exports.hud = new hud.Hud(exports.player, exports.renderer, textureLoader);
	const stats = new Stats();
	stats.showPanel(0);
	document.body.appendChild(stats.dom);
	function init() {
	    document.body.appendChild(exports.renderer.domElement);
	    exports.scene.add(new Three.AmbientLight(0xffffff, 0.1));
	    const pointLight = new Three.PointLight(0xffffff, 0.5);
	    pointLight.position.set(-4, 5, -4);
	    exports.scene.add(pointLight);
	    const pointLight2 = new Three.PointLight(0xffffff, 0.5);
	    pointLight2.position.set(4, 5, 4);
	    exports.scene.add(pointLight2);
	    exports.player.setPosition(initLevel.initLevel.startPosition);
	    level.createLevel(initLevel.initLevel, exports.scene, exports.physics);
	    exports.player.controls.install(exports.renderer.domElement);
	    renderFrame();
	}
	function renderFrame() {
	    exports.player.update();
	    exports.physics.update();
	    stats.begin();
	    exports.renderer.clear();
	    for (let portal of exports.player.portals) {
	        if (portal) {
	            portal.render(exports.player.camera, exports.scene, exports.renderer);
	        }
	    }
	    exports.renderer.clippingPlanes[0]
	        .setFromNormalAndCoplanarPoint(new Three.Vector3(0, 0, 0), new Three.Vector3(0, 0, 0));
	    exports.renderer.render(exports.scene, exports.player.camera);
	    exports.hud.render(exports.renderer);
	    stats.end();
	    requestAnimationFrame(renderFrame);
	}
	init();
	});

	var main$1 = unwrapExports(main);
	var main_1 = main.scene;
	var main_2 = main.renderer;
	var main_3 = main.physics;
	var main_4 = main.player;
	var main_5 = main.hud;

	exports.default = main$1;
	exports.hud = main_5;
	exports.physics = main_3;
	exports.player = main_4;
	exports.renderer = main_2;
	exports.scene = main_1;

	return exports;

}({}, THREE, CANNON, dat));
