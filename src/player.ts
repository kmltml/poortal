import * as Three from "three"
import * as Cannon from "@cocos/cannon"

import { Controls } from "./controls"
import { Physics, PhysicalObject } from "./physics"
import { Debug } from "./debug"
import { toThreeVec, toCannonVec } from "./utils"
import { Portal, PortalColor, PortalCollisionHandler } from "./portal"
import { UserData } from "./userdata"

export class Player implements PhysicalObject {

  static CameraHeight = 1.5
  static CollisionRadius = 0.3
  static CollisionHeight = 1.7

  mesh: Three.Object3D
  camera: Three.PerspectiveCamera
  body: Cannon.Body
  controls: Controls

  portals: Portal[] = []

  helper = new Three.Box3Helper(new Three.Box3(
    new Three.Vector3(-Player.CollisionRadius, -Player.CollisionHeight / 2, -Player.CollisionRadius),
    new Three.Vector3(Player.CollisionRadius, Player.CollisionHeight / 2, Player.CollisionRadius)
  ))

  portalHandler: PortalCollisionHandler

  constructor(public scene: Three.Scene, public physics: Physics) {
    this.mesh = new Three.Group()

    this.camera = new Three.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.01, 1000)
    this.camera.position.set(0, Player.CameraHeight - Player.CollisionHeight / 2, 0)
    this.mesh.add(this.camera)

    // this.mesh.add(this.helper)
    scene.add(this.mesh)

    this.controls = new Controls(this.camera)

    const material = new Cannon.Material("player")
    material.friction = 0
    material.restitution = 0

    this.body = new Cannon.Body({
      fixedRotation: true,
      mass: 50,
      material: material
    })

    this.buildCapsule()

    this.portalHandler = new PortalCollisionHandler(this.body)
    this.portalHandler.updateCollisionGroup()
  }

  update() {
    this.controls.update()

    if (this.controls.justPressed.left) {
      this.openPortal(PortalColor.Blue)
    }
    if (this.controls.justPressed.right) {
      this.openPortal(PortalColor.Orange)
    }

    this.body.velocity.x = this.controls.moveVec.x
    this.body.velocity.z = this.controls.moveVec.z

    if (this.controls.jump) {
      this.body.velocity.y += 4
    }

    this.portalHandler.update()
  }

  openPortal(color: PortalColor) {
    const caster = new Three.Raycaster()
    caster.setFromCamera({x: 0, y: 0}, this.camera)

    if (this.portals[color]) {
      // Allow slight repositioning of portals
      this.portals[color].mesh.layers.disable(0)
    }

    const intersects = caster.intersectObjects(this.scene.children)

    if (this.portals[color]) {
      this.portals[color].mesh.layers.enable(0)
    }

    if (intersects.length != 0) {
      const intersect = intersects[0]
      const wallData = intersect.object.userData as UserData
      if (!wallData.canAcceptPortals) {
        return
      }
      if (!wallData.wall) {
        return
      }

      const pos = intersect.point
      pos.add(intersect.face!.normal.clone().multiplyScalar(0.001))
      const up = new Three.Vector3(0, 1, 0)
        .applyQuaternion(this.camera.quaternion)
        .multiplyScalar(intersect.face!.normal.y)
        .normalize()
      const newPortal = Portal.create(wallData.wall, intersect.point, intersect.face!.normal, up, color)

      this.scene.remove(this.portals[color].mesh)
      this.portals[color].unpatchPhysics(this.physics)

      this.scene.add(newPortal.mesh)
      this.portals[color] = newPortal

      newPortal.patchPhysics(this.physics)

      this.portals[0].otherPortal = this.portals[1]
      this.portals[1].otherPortal = this.portals[0]
    }
  }

  initPhysics() {
    this.physics.add(this)
  }

  buildCapsule() {
    this.body.addShape(new Cannon.Cylinder(
      Player.CollisionRadius, Player.CollisionRadius,
      Player.CollisionHeight - 2 * Player.CollisionRadius,
      16
    ))
    this.body.addShape(
      new Cannon.Sphere(Player.CollisionRadius),
      new Cannon.Vec3(0, -(Player.CollisionHeight / 2 - Player.CollisionRadius), 0)
    )
    this.body.addShape(
      new Cannon.Sphere(Player.CollisionRadius),
      new Cannon.Vec3(0, Player.CollisionHeight / 2 - Player.CollisionRadius)
    )
  }

  synchronizeMesh() {
    const newPos = this.body.position
    this.mesh.position.set(newPos.x, newPos.y, newPos.z)
    const newQuat = this.body.quaternion
    this.mesh.setRotationFromQuaternion(
      new Three.Quaternion(newQuat.x, newQuat.y, newQuat.z, newQuat.w)
    )
    Debug.instance.player.speed = this.body.velocity.norm()
  }

  setPosition(pos: Three.Vector3) {
    this.mesh.position.copy(pos)
    this.body.position.copy(toCannonVec(pos))
  }

}
