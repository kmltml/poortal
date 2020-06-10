import * as Three from "three"
import * as Cannon from "@cocos/cannon"

import { Controls } from "./controls"
import { Physics, PhysicalObject } from "./physics"
import { Debug } from "./debug"
import { toThreeVec, toCannonVec } from "./utils"
import { Portal, PortalColor } from "./portal"

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

  constructor(public scene: Three.Scene) {
    this.mesh = new Three.Group()

    this.camera = new Three.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000)
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
      shape: new Cannon.Cylinder(Player.CollisionRadius, Player.CollisionRadius, Player.CollisionHeight, 16),
      material: material
    })
  }

  update() {
    this.controls.update()

    if (this.controls.justPressed.left) {
      console.log("open left")
      this.openPortal(PortalColor.Blue)
    }
    if (this.controls.justPressed.right) {
      console.log("open right")
      this.openPortal(PortalColor.Orange)
    }

    this.body.velocity.x = this.controls.moveVec.x
    this.body.velocity.z = this.controls.moveVec.z
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
      const wall = intersects[0]
      console.dir(wall)
      if (!wall.object.userData.canAcceptPortals) {
        return
      }

      const pos = wall.point
      pos.add(wall.face!.normal.clone().multiplyScalar(0.0001))
      const up = new Three.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion)
      const newPortal = Portal.create(wall.object as Three.Mesh, wall.point, wall.face!.normal, up, color)
      this.scene.remove(this.portals[color].mesh)
      this.scene.add(newPortal.mesh)
      this.portals[color] = newPortal

      this.portals[0].otherPortal = this.portals[1]
      this.portals[1].otherPortal = this.portals[0]
    }
  }

  initPhysics(physics: Physics) {
    physics.add(this)
  }

  synchronizeMesh() {
    const newPos = this.body.position
    this.mesh.position.set(newPos.x, newPos.y, newPos.z)
    Debug.instance.player.speed = this.body.velocity.norm()
  }

  setPosition(pos: Three.Vector3) {
    this.mesh.position.copy(pos)
    this.body.position.copy(toCannonVec(pos))
  }

}
