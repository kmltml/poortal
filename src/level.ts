import { Vector3, Euler, Object3D, BoxGeometry, Mesh, MeshPhysicalMaterial, MeshPhongMaterial } from "three"
import * as Cannon from "@cocos/cannon"

import { Physics } from "./physics"
import { Wall } from "./wall"
import { UserData } from "./userdata"

export interface Level {

  startPosition: Vector3
  blocks: Block[]

}

export interface Block {
  size: Vector3
  position: Vector3
  rotation?: Euler
  portalProof?: boolean
}

export function createLevel(level: Level, root: Object3D, physics: Physics): void {
  const blockMaterial = new MeshPhysicalMaterial({
    color: 0xdddddd,
    roughness: 0.5,
  })
  const portalProofMaterial = new MeshPhysicalMaterial({
    color: 0xaa9999,
    roughness: 0.2,
  })
  const blockGeo = new BoxGeometry(1, 1, 1)

  const physMaterial = new Cannon.Material("wall")
  physMaterial.friction = 0

  for (let block of level.blocks) {
    const mesh = new Mesh(blockGeo, block.portalProof ? portalProofMaterial : blockMaterial)
    mesh.scale.copy(block.size)
    mesh.position.copy(block.position)
    if (block.rotation) {
      mesh.setRotationFromEuler(block.rotation)
    }
    root.add(mesh)

    const body = new Cannon.Body({
      type: Cannon.Body.STATIC,
      mass: 0,
      shape: new Cannon.Box(new Cannon.Vec3(block.size.x / 2, block.size.y / 2, block.size.z / 2)),
      position: new Cannon.Vec3(block.position.x, block.position.y, block.position.z),
      material: physMaterial
    })
    if (block.rotation) {
      body.quaternion.setFromEuler(block.rotation.x, block.rotation.y, block.rotation.z)
    }

    physics.world.addBody(body)

    const wall = new Wall(mesh, body)
    mesh.userData = <UserData> {
      canAcceptPortals: !block.portalProof,
      wall: wall
    }
  }
}
