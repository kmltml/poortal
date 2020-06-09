import { Vector3, Quaternion, Object3D, BoxGeometry, Mesh, MeshPhysicalMaterial, MeshPhongMaterial } from "three"
import * as Cannon from "@cocos/cannon"

import { Physics } from "./physics"

export interface Level {

  startPosition: Vector3
  blocks: Block[]

}

export interface Block {
  size: Vector3
  position: Vector3
  rotation: Quaternion
}

export function createLevel(level: Level, root: Object3D, physics: Physics): void {
  const blockMaterial = new MeshPhysicalMaterial({
    color: 0xdddddd,
    roughness: 0.5,
  })
  const blockGeo = new BoxGeometry(1, 1, 1)

  const physMaterial = new Cannon.Material("wall")
  physMaterial.friction = 0

  for (let block of level.blocks) {
    const mesh = new Mesh(blockGeo, blockMaterial)
    mesh.userData.canAcceptPortals = true
    mesh.scale.copy(block.size)
    mesh.position.copy(block.position)
    mesh.setRotationFromQuaternion(block.rotation)
    root.add(mesh)

    const body = new Cannon.Body({
      type: Cannon.Body.STATIC,
      mass: 0,
      shape: new Cannon.Box(new Cannon.Vec3(block.size.x / 2, block.size.y / 2, block.size.z / 2)),
      position: new Cannon.Vec3(block.position.x, block.position.y, block.position.z),
      material: physMaterial
    })

    physics.world.addBody(body)
  }
}
