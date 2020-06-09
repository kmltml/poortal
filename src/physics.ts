import * as Cannon from "@cocos/cannon"

export interface PhysicalObject {

  body: Cannon.Body

  synchronizeMesh(): void

}

export class Physics {

  world = new Cannon.World()

  private dynamicObjects: PhysicalObject[] = []

  constructor() {
    this.world.gravity.set(0, -9.8, 0)
  }

  update() {
    this.world.step(1.0 / 60.0)
    this.dynamicObjects.forEach(o => o.synchronizeMesh())
  }

  add(obj: PhysicalObject) {
    this.world.addBody(obj.body)
    this.dynamicObjects.push(obj)
  }

}
