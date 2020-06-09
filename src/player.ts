import * as Three from "three"
import * as Cannon from "@cocos/cannon"

import { Controls } from "./controls"
import { Physics, PhysicalObject } from "./physics"
import { Debug } from "./debug"
import { toThreeVec, toCannonVec } from "./utils"

export class Player implements PhysicalObject {

  static CameraHeight = 1.5
  static CollisionRadius = 0.3
  static CollisionHeight = 1.7

  mesh: Three.Object3D
  camera: Three.PerspectiveCamera
  body: Cannon.Body
  controls: Controls

  helper = new Three.Box3Helper(new Three.Box3(
    new Three.Vector3(-Player.CollisionRadius, -Player.CollisionHeight / 2, -Player.CollisionRadius),
    new Three.Vector3(Player.CollisionRadius, Player.CollisionHeight / 2, Player.CollisionRadius)
  ))

  constructor(scene: Three.Scene) {
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
    this.body.velocity.x = this.controls.moveVec.x
    this.body.velocity.z = this.controls.moveVec.z
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
