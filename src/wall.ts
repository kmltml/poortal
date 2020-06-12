import * as Three from "three"
import * as Cannon from "@cocos/cannon"

import { PortalColor } from "./portal"
import { Physics } from "./physics"

export class Wall {

  portalsOpen: boolean[] = [false, false]

  constructor(public mesh: Three.Mesh, public body: Cannon.Body) {
    this.updateCollisionGroup()
  }

  openPortal(color: PortalColor) {
    this.portalsOpen[color] = true
    this.updateCollisionGroup()
  }

  closePortal(color: PortalColor) {
    this.portalsOpen[color] = false
    this.updateCollisionGroup()
  }

  updateCollisionGroup() {
    this.body.collisionFilterGroup =
      (this.portalsOpen.some(x => x) ? 0 : Physics.Groups.Normal) |
      (this.portalsOpen[PortalColor.Blue] ? Physics.Groups.BluePortalWall : 0) |
      (this.portalsOpen[PortalColor.Orange] ? Physics.Groups.OrangePortalWall : 0)

    this.body.collisionFilterMask =
      Physics.Groups.Normal |
      (this.portalsOpen[PortalColor.Blue] ? 0 : Physics.Groups.BluePortalWall) |
      (this.portalsOpen[PortalColor.Orange] ? 0 : Physics.Groups.OrangePortalWall)
  }

}
