import * as Cannon from "@cocos/cannon"
import * as Three from "three"

export function toCannonVec(v: { x: number, y: number, z: number }): Cannon.Vec3 {
  return new Cannon.Vec3(v.x, v.y, v.z)
}

export function toThreeVec(v: { x: number, y: number, z: number }): Three.Vector3 {
  return new Three.Vector3(v.x, v.y, v.z)
}
