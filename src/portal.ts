import * as Three from "three"
import * as Cannon from "@cocos/cannon"

import { Debug } from "./debug"
import { Physics } from "./physics"
import { toCannonVec, toThreeVec } from "./utils"
import { Wall } from "./wall"

export enum PortalColor {
  Orange, Blue
}

export interface PortalTriggerEvent extends Cannon.IEvent {
  portal: Portal
  event: "enter" | "exit"
}

export class PortalCollisionHandler {

  portalsEntered: boolean[] = [false, false]
  portals: (Portal | null)[] = []

  constructor(public body: Cannon.Body) {
    this.updateCollisionGroup()
    body.addEventListener(Portal.TriggerEventType, (event: PortalTriggerEvent) => {
      if (event.event === "enter") {
        this.enterPortal(event.portal)
      } else if (event.event === "exit") {
        this.exitPortal(event.portal)
      }
      this.updateCollisionGroup()
    })
  }

  enterPortal(portal: Portal) {
    this.portalsEntered[portal.color] = true
    this.portals[portal.color] = portal
    this.updateCollisionGroup()
  }

  exitPortal(portal: Portal) {
    this.portalsEntered[portal.color] = false
    this.portals[portal.color] = null
    this.updateCollisionGroup()
  }

  updateCollisionGroup() {
    this.body.collisionFilterGroup =
      Physics.Groups.Dynamic |
      (this.portalsEntered.some(x => x) ? 0 : Physics.Groups.Normal) |
      (this.portalsEntered[PortalColor.Blue] ? Physics.Groups.BluePortalWall : 0) |
      (this.portalsEntered[PortalColor.Orange] ? Physics.Groups.OrangePortalWall : 0)

    this.body.collisionFilterMask =
      Physics.Groups.Normal |
      (this.portalsEntered[PortalColor.Blue] ? 0 : Physics.Groups.BluePortalWall) |
      (this.portalsEntered[PortalColor.Orange] ? 0 : Physics.Groups.OrangePortalWall)
  }

  update() {
    let plane: Three.Plane | undefined = undefined
    for (let portal of this.portals) {
      if (!portal) continue

      plane = portal.getClippingPlane(plane)
      const pos = toThreeVec(this.body.position)

      if (pos.clone().sub(plane.coplanarPoint(new Three.Vector3())).dot(plane.normal) < 0) {
        // Object is behind portal

        this.portalsEntered[portal.color == PortalColor.Blue ? PortalColor.Orange : PortalColor.Blue] = true
        this.updateCollisionGroup()
        console.log("col after portal: ", this.body.collisionFilterGroup)

        pos.applyMatrix4(portal.portalTransform)
        this.body.position.set(pos.x, pos.y, pos.z)

        const vel = toThreeVec(this.body.velocity)
        const speed = vel.length()

        vel.transformDirection(portal.portalTransform).multiplyScalar(speed)
        this.body.velocity.set(vel.x, vel.y, vel.z)

        const quat = new Three.Quaternion()
        quat.setFromRotationMatrix(portal.portalTransform)
        this.body.quaternion.mult(new Cannon.Quaternion(quat.x, quat.y, quat.z, quat.w), this.body.quaternion)
      }
    }
  }

}

export class Portal {

  static textures: {
    blueBorder: Three.Texture
    orangeBorder: Three.Texture
    mask: Three.Texture
  }

  static TriggerEventType = "portal-trigger"

  static create(wall: Wall, position: Three.Vector3, normal: Three.Vector3, up: Three.Vector3, color: PortalColor): Portal {
    const border = (color == PortalColor.Blue) ? Portal.textures.blueBorder : Portal.textures.orangeBorder
    const portal = new Portal(wall, color, Portal.textures.mask, border)
    portal.mesh.position.copy(position)

    if (normal.distanceToSquared(new Three.Vector3(0, 1, 0)) > 0.001 &&
      normal.distanceToSquared(new Three.Vector3(0, -1, 0)) > 0.001) {
      up.set(0, 1, 0) // Only rotate to face away from player on horizontal surfaces
    }

    up.projectOnPlane(normal).normalize()
    const trans = new Three.Matrix4()
    trans.makeBasis(up.clone().cross(normal), up, normal)
    portal.mesh.setRotationFromMatrix(trans)

    return portal
  }

  constructor(public wall: Wall, public color: PortalColor, mask: Three.Texture, overlay: Three.Texture, ) {

    this.renderTexture = new Three.WebGLRenderTarget(window.innerWidth, window.innerHeight)
    this.backTexture = new Three.WebGLRenderTarget(window.innerWidth, window.innerHeight)

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
      vertexShader:
`
#include <clipping_planes_pars_vertex>
#include <uv_pars_vertex>

void main() {
  #include <begin_vertex>
  #include <uv_vertex>
  #include <project_vertex>
  #include <clipping_planes_vertex>
}
`,
      fragmentShader:
`
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
    })
    this.mesh = new Three.Mesh(Portal.geometry, this.material)
    const lightColor = color == PortalColor.Blue ? 0x00bfff : 0xffbd00
    const light = new Three.PointLight(lightColor, 0.3, 3)
    this.mesh.add(light)

    this.trigger = new Cannon.Body({
      shape: new Cannon.Box(new Cannon.Vec3(Portal.Width / 2, Portal.Height / 2, Portal.TriggerDepth)),
      type: Cannon.Body.STATIC,
      collisionFilterMask: Physics.Groups.Dynamic,
      collisionFilterGroup: Physics.Groups.Normal | Physics.Groups.BluePortalWall | Physics.Groups.OrangePortalWall
    })
    this.trigger.shapes[0].collisionResponse = false

    const frameMaterial = new Cannon.Material("portal-frame")
    frameMaterial.friction = 0
    frameMaterial.restitution = 0
    this.frame = new Cannon.Body({
      type: Cannon.Body.STATIC,
      material: frameMaterial,
      collisionFilterMask: this.color == PortalColor.Blue ? Physics.Groups.BluePortalWall : Physics.Groups.OrangePortalWall,
      collisionFilterGroup: -1
    })
    this.frame.addShape(
      new Cannon.Box(new Cannon.Vec3(Portal.FrameThickness, Portal.Height / 2, Portal.FrameThickness)),
      new Cannon.Vec3(-Portal.Width / 2 - Portal.FrameThickness, 0, -Portal.FrameThickness)
    )
    this.frame.addShape(
      new Cannon.Box(new Cannon.Vec3(Portal.FrameThickness, Portal.Height / 2, Portal.FrameThickness)),
      new Cannon.Vec3(Portal.Width / 2 + Portal.FrameThickness, 0, -Portal.FrameThickness)
    )
    this.frame.addShape(
      new Cannon.Box(new Cannon.Vec3(Portal.Width / 2, Portal.FrameThickness, Portal.FrameThickness)),
      new Cannon.Vec3(0, -Portal.Height / 2 - Portal.FrameThickness, -Portal.FrameThickness)
    )
    this.frame.addShape(
      new Cannon.Box(new Cannon.Vec3(Portal.Width / 2, Portal.FrameThickness, Portal.FrameThickness)),
      new Cannon.Vec3(0, Portal.Height / 2 + Portal.FrameThickness, -Portal.FrameThickness)
    )
  }

  static FrameThickness = 0.2
  static Width = 1.0
  static Height = 2.0
  static MaxDepth = 20
  static TriggerDepth = 1.0

  static geometry: Three.Geometry =
      new Three.PlaneGeometry(Portal.Width, Portal.Height)

  mesh: Three.Mesh
  renderTexture: Three.WebGLRenderTarget
  backTexture: Three.WebGLRenderTarget
  material: Three.ShaderMaterial
  camera: Three.PerspectiveCamera = new Three.PerspectiveCamera()
  trigger: Cannon.Body
  frame: Cannon.Body
  triggeredBodies: Cannon.Body[] = []

  portalTransform: Three.Matrix4 = new Three.Matrix4()

  _otherPortal?: Portal
  get otherPortal(): Portal {
    return this._otherPortal!
  }

  set otherPortal(p: Portal) {
    this._otherPortal = p
    this.mesh.updateMatrixWorld()
    p.mesh.updateMatrixWorld()
    this.updatePortalTransform()
  }

  updatePortalTransform() {
    this.portalTransform
      .getInverse(this.mesh.matrixWorld) // To local
      .premultiply(new Three.Matrix4().makeRotationY(Math.PI)) // Rotate to move behind portal
      .premultiply(this.otherPortal.mesh.matrixWorld) // From local to world
  }

  updateCamera(playerCamera: Three.PerspectiveCamera): void {
    this.camera.copy(playerCamera)
    playerCamera.getWorldPosition(this.camera.position)
    playerCamera.getWorldQuaternion(this.camera.quaternion)
    this.camera.setRotationFromQuaternion(this.camera.quaternion)

    this.camera.applyMatrix4(this.portalTransform)
  }

  patchPhysics(physics: Physics) {
    const meshQuaternion = this.mesh.getWorldQuaternion(new Three.Quaternion())

    this.trigger.position.copy(toCannonVec(
      this.mesh.localToWorld(new Three.Vector3(0, 0, Portal.TriggerDepth - 0.3))
    ))
    this.trigger.quaternion.set(
      meshQuaternion.x, meshQuaternion.y, meshQuaternion.z, meshQuaternion.w
    )
    physics.world.addBody(this.trigger)

    this.frame.position.copy(toCannonVec(this.mesh.getWorldPosition(new Three.Vector3())))
    this.frame.quaternion.set(
      meshQuaternion.x, meshQuaternion.y, meshQuaternion.z, meshQuaternion.w
    )
    physics.world.addBody(this.frame)

    this.wall.openPortal(this.color)

    this.trigger.shapes[0].addEventListener("triggered", (event: Cannon.ITriggeredEvent) => {
      if (event.event == "onTriggerEnter") {
        event.otherBody.dispatchEvent(<PortalTriggerEvent> {
          type: Portal.TriggerEventType,
          event: "enter",
          portal: this,
          target: event.otherBody
        })

        this.triggeredBodies.push(event.otherBody)

      } else if (event.event == "onTriggerExit") {
        event.otherBody.dispatchEvent(<PortalTriggerEvent> {
          type: Portal.TriggerEventType,
          event: "exit",
          portal: this,
          target: event.otherBody
        })

        this.triggeredBodies = this.triggeredBodies.filter(b => b !== event.otherBody)
      }
    })
  }

  unpatchPhysics(physics: Physics) {
    physics.world.remove(this.trigger)
    physics.world.remove(this.frame)
    this.wall.closePortal(this.color)
    this.triggeredBodies.forEach(b => b.dispatchEvent(<PortalTriggerEvent> {
      type: Portal.TriggerEventType,
      event: "exit",
      portal: this,
      target: b
    }))
  }


  swapTargets() {
    const temp = this.backTexture
    this.backTexture = this.renderTexture
    this.renderTexture = temp

    this.material.uniforms.map.value = this.backTexture.texture
  }

  computeViewBoundingBox(playerCamera: Three.PerspectiveCamera, viewSize: Three.Vector2): Three.Box2 {
    playerCamera.updateMatrixWorld()
    let points = [
      new Three.Vector3(-Portal.Width / 2, -Portal.Height / 2, 0),
      new Three.Vector3( Portal.Width / 2, -Portal.Height / 2, 0),
      new Three.Vector3( Portal.Width / 2,  Portal.Height / 2, 0),
      new Three.Vector3(-Portal.Width / 2,  Portal.Height / 2, 0),
    ].map(p => this.mesh.localToWorld(p).project(playerCamera))

    if (points.every(p => p.x > 1)
      || points.every(p => p.x < -1)
      || points.every(p => p.y > 1)
      || points.every(p => p.y < -1)
      || points.every(p => p.z > 1)
      || points.every(p => p.z < -1)) {
      const box = new Three.Box2()
      box.makeEmpty()
      return box
    }
    if(points.some(p => p.z > 1)) {
      // Ugly, but i have no other ideas
      return new Three.Box2(new Three.Vector2(0, 0), viewSize)
    }

    points.forEach(p => p.clamp(new Three.Vector3(-1, -1, -1), new Three.Vector3(1, 1, 1)))

    let points2 = points.map(p =>
          new Three.Vector2(p.x, p.y)
            .addScalar(1.0)
            .multiply(viewSize)
            .multiplyScalar(0.5)
            .clamp(new Three.Vector2(), viewSize))

    const box = new Three.Box2()
    box.setFromPoints(points2)

    return box
  }

  getClippingPlane(plane: Three.Plane = new Three.Plane()): Three.Plane {
    plane.setFromNormalAndCoplanarPoint(
      this.mesh.getWorldDirection(new Three.Vector3()),
      this.mesh.getWorldPosition(new Three.Vector3())
    )
    return plane
  }

  render(playerCamera: Three.PerspectiveCamera, scene: Three.Scene, renderer: Three.WebGLRenderer): void {
    const rec = (camera: Three.PerspectiveCamera, depth: number, box?: Three.Box2) => {
      if (this.color == PortalColor.Blue) {
        Debug.instance.portalDepth.blue = depth
      } else {
        Debug.instance.portalDepth.orange = depth
      }

      const scissorBox = this.computeViewBoundingBox(camera, renderer.getSize(new Three.Vector2()))

      if (box) {
        scissorBox.intersect(box)
      }

      if (scissorBox.isEmpty()) {
        return;
      }

      const boxSize = scissorBox.getSize(new Three.Vector2())

      if (boxSize.x < 2.0 || boxSize.y < 2.0) {
        return
      }

      this.updateCamera(camera)

      if (depth < Portal.MaxDepth) {
        const savedCamera = this.camera
        this.camera = this.camera.clone()
        rec(savedCamera, depth + 1, scissorBox)
        this.camera = savedCamera
      } else {
        renderer.setRenderTarget(this.backTexture)
        renderer.clear()
      }

      renderer.setRenderTarget(this.renderTexture)
      renderer.clear()
      renderer.setScissor(scissorBox.min.x, scissorBox.min.y, boxSize.x, boxSize.y)
      renderer.setScissorTest(true)

      renderer.render(scene, this.camera)

      renderer.setScissorTest(false)

      this.swapTargets()
    }

    this.otherPortal.getClippingPlane(renderer.clippingPlanes[0])
    rec(playerCamera, 0)
    renderer.setRenderTarget(null) // reset render target

  }

}
