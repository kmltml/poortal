import * as Cannon from "@cocos/cannon"

export interface PhysicalObject {

  body: Cannon.Body

  synchronizeMesh(): void

}

export class Physics {

  static Groups = {
    Normal: 1,
    Dynamic: 2,
    BluePortalWall: 4,
    OrangePortalWall: 8
  }

  world = new Cannon.World()

  private dynamicObjects: PhysicalObject[] = []

  constructor() {
    this.world.gravity.set(0, -9.8, 0)
  }

  update() {
    this.world.step(1.0 / 60.0)

    this.world.emitTriggeredEvents()
    this.world.emitCollisionEvents()
    this.dynamicObjects.forEach(o => o.synchronizeMesh())
  }

  add(obj: PhysicalObject) {
    this.world.addBody(obj.body)
    this.dynamicObjects.push(obj)
  }

}
