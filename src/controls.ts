import { Camera, Vector3, Vector2, Euler, MathUtils } from "three"

export class Controls {

  orientation: Euler = new Euler(0, 0, 0, "ZYX")
  camera: Camera
  speed = 3.0
  canvas: HTMLElement | null = null

  pointerLocked = false

  private keys = {
    forward: false,
    back: false,
    left: false,
    right: false,
    jump: false
  }

  private previousKeys = {
    jump: false
  }

  private buttons = {
    left: false,
    right: false
  }

  private previousButtons = {
    left: false,
    right: false
  }

  justPressed = {
    left: false,
    right: false
  }

  moveVec: Vector3 = new Vector3()

  jump: boolean = false

  private mouseDelta: Vector2 = new Vector2()

  constructor(camera: Camera) {
    this.camera = camera
  }

  install(canvas: HTMLElement): void {
    window.addEventListener("keydown", event => this.onKeyDown(event))
    window.addEventListener("keyup", event => this.onKeyUp(event))
    window.addEventListener("mousemove", event => this.onMouseMove(event))
    window.addEventListener("mousedown", event => this.onMouseDown(event))
    window.addEventListener("mouseup", event => this.onMouseUp(event))
    canvas.addEventListener("click", _ => this.tryLock())
    document.addEventListener("pointerlockchange", _ => this.onPointerLockChanged())
    this.canvas = canvas
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

    this.moveVec.copy(this.forwardDirection().multiplyScalar(posChange.y));
    this.moveVec.add(this.rightDirection().multiplyScalar(posChange.x))

    this.mouseDelta.multiplyScalar(0.01)

    this.orientation.y -= this.mouseDelta.x

    this.orientation.x -= this.mouseDelta.y
    this.orientation.x = MathUtils.clamp(this.orientation.x, -Math.PI / 2, Math.PI / 2)
    this.mouseDelta.set(0, 0)

    this.camera.setRotationFromEuler(this.orientation)

    this.jump = this.keys.jump && !this.previousKeys.jump
    this.previousKeys.jump = this.keys.jump

    this.justPressed.left = this.buttons.left && !this.previousButtons.left
    this.justPressed.right = this.buttons.right && !this.previousButtons.right

    this.previousButtons.left = this.buttons.left
    this.previousButtons.right = this.buttons.right
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
    if (!this.pointerLocked) return
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
      case " ":
        this.keys.jump = true
        break
    }
  }

  onKeyUp(event: KeyboardEvent): void {
    if (!this.pointerLocked) return
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
      case " ":
        this.keys.jump = false
        break
    }
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.pointerLocked) return
    this.mouseDelta = new Vector2(event.movementX, event.movementY)
  }

  onMouseDown(event: MouseEvent): void {
    if (!this.pointerLocked) return
    if (event.button === 0) {
      this.buttons.left = true
    } else if (event.button === 2) {
      this.buttons.right = true
    }
  }

  onMouseUp(event: MouseEvent): void {
    if (!this.pointerLocked) return
    if (event.button === 0) {
      this.buttons.left = false
    } else if (event.button === 2) {
      this.buttons.right = false
    }
  }

  tryLock(): void {
    if (!this.pointerLocked) {
      this.canvas!.requestPointerLock()
    }
  }

  onPointerLockChanged(): void {
    if(document.pointerLockElement === this.canvas) {
      console.log("Pointer locked")
      this.pointerLocked = true
    } else {
      console.log("Pointer unlocked")
      this.pointerLocked = false

      this.keys.forward = false
      this.keys.back = false
      this.keys.left = false
      this.keys.right = false
    }
  }

}
