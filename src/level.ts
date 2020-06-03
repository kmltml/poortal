import { Vector3, Quaternion, Object3D, BoxGeometry, Mesh, MeshPhysicalMaterial, MeshPhongMaterial } from "three"

export interface Level {

  startPosition: Vector3
  blocks: Block[]

}

export interface Block {
  size: Vector3
  position: Vector3
  rotation: Quaternion
}

export function createLevel(level: Level, root: Object3D): void {
  const blockMaterial = new MeshPhysicalMaterial({
    color: 0xdddddd,
    roughness: 0.5,
  })
  const blockGeo = new BoxGeometry(1, 1, 1)
  for (let block of level.blocks) {
    const mesh = new Mesh(blockGeo, blockMaterial)
    mesh.scale.copy(block.size)
    mesh.position.copy(block.position)
    mesh.setRotationFromQuaternion(block.rotation)
    root.add(mesh)
  }
}
