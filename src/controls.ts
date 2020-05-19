import { Camera, Vector3, Vector2, Euler, MathUtils } from "three"

export class Controls {

  orientation: Euler = new Euler(0, 0, 0, "ZYX")
  camera: Camera
  speed = 0.1

  private keys = {
    forward: false,
    back: false,
    left: false,
    right: false
  }

  private mouseDelta: Vector2 = new Vector2()

  constructor(camera: Camera) {
    this.camera = camera
  }

  install(): void {
    window.addEventListener("keydown", event => this.onKeyDown(event))
    window.addEventListener("keyup", event => this.onKeyUp(event))
    window.addEventListener("mousemove", event => this.onMouseMove(event))
  }

  update(): void {
    let dx = 0
    let dz = 0

    if (this.keys.forward) {
      dz -= 1
    }
    if (this.keys.back) {
      dz += 1
    }

    if (this.keys.left) {
      dx -= 1
    }
    if (this.keys.right) {
      dx += 1
    }

    const posChange = new Vector2(dx, dz).normalize()
    posChange.multiplyScalar(this.speed)

    this.camera.position.add(this.forwardDirection().multiplyScalar(posChange.y))
    this.camera.position.add(this.rightDirection().multiplyScalar(posChange.x))

    this.mouseDelta.multiplyScalar(0.01)

    this.orientation.y -= this.mouseDelta.x

    this.orientation.x -= this.mouseDelta.y
    this.orientation.x = MathUtils.clamp(this.orientation.x, -Math.PI / 2, Math.PI / 2)
    this.mouseDelta.set(0, 0)

    this.camera.setRotationFromEuler(this.orientation)
  }

  forwardDirection(): Vector3 {
    const forward = new Vector3(0, 0, 1)
    forward.applyAxisAngle(new Vector3(0, 1, 0), this.orientation.y)
    return forward
  }

  rightDirection(): Vector3 {
    const right = new Vector3(1, 0, 0)
    right.applyAxisAngle(new Vector3(0, 1, 0), this.orientation.y)
    return right
  }

  onKeyDown(event: KeyboardEvent): void {
    switch(event.key) {
      case "w":
        this.keys.forward = true
        break
      case "s":
        this.keys.back = true
        break
      case "a":
        this.keys.left = true
        break
      case "d":
        this.keys.right = true
        break
    }
  }

  onKeyUp(event: KeyboardEvent): void {
    switch(event.key) {
      case "w":
        this.keys.forward = false
        break
      case "s":
        this.keys.back = false
        break
      case "a":
        this.keys.left = false
        break
      case "d":
        this.keys.right = false
        break
    }
  }

  onMouseMove(event: MouseEvent): void {
    this.mouseDelta = new Vector2(event.movementX, event.movementY)
  }


}
