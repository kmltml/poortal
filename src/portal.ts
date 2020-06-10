import * as Three from "three"
import { Debug } from "./debug"

export enum PortalColor {
  Orange, Blue
}

export class Portal {

  static textures: {
    blueBorder: Three.Texture
    orangeBorder: Three.Texture
    mask: Three.Texture
  }

  static create(wall: Three.Mesh, position: Three.Vector3, normal: Three.Vector3, up: Three.Vector3, color: PortalColor): Portal {
    const border = (color == PortalColor.Blue) ? Portal.textures.blueBorder : Portal.textures.orangeBorder
    const portal = new Portal(wall, color, Portal.textures.mask, border)
    portal.mesh.position.copy(position)

    if (normal.distanceToSquared(new Three.Vector3(0, 1, 0)) > 0.001 &&
      normal.distanceToSquared(new Three.Vector3(0, -1, 0)) > 0.001) {
      up.set(0, 1, 0) // Only rotate to face away from player on horizontal surfaces
    }

    up.projectOnPlane(normal).normalize()
    const trans = new Three.Matrix4()
    trans.makeBasis(up.clone().cross(normal), up, normal)
    portal.mesh.setRotationFromMatrix(trans)

    return portal
  }

  constructor(public wall: Three.Mesh, public color: PortalColor, mask: Three.Texture, overlay: Three.Texture, ) {

    this.renderTexture = new Three.WebGLRenderTarget(window.innerWidth, window.innerHeight)
    this.backTexture = new Three.WebGLRenderTarget(window.innerWidth, window.innerHeight)

    this.material = new Three.ShaderMaterial({
      transparent: true,
      uniforms: {
        map: { value: this.backTexture.texture },
        mask: { value: mask },
        overlay: { value: overlay },
        resolution: { value: new Three.Vector2(window.innerWidth, window.innerHeight) }
      },
      vertexShader:
`
varying vec2 texCoords;

void main() {
  texCoords = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`,
      fragmentShader:
`
uniform sampler2D map;
uniform sampler2D mask;
uniform sampler2D overlay;
uniform vec2 resolution;


varying vec2 texCoords;

void main() {
  float mask_val = texture2D(mask, texCoords).r;
  gl_FragColor = texture2D(map, gl_FragCoord.xy / resolution) * mask_val;
  vec4 overlay_texel = texture2D(overlay, texCoords);
  gl_FragColor = mix(gl_FragColor, overlay_texel, overlay_texel.a);
}
`
    })
    this.mesh = new Three.Mesh(Portal.geometry, this.material)
  }

  static Width = 1.0
  static Height = 2.0
  static MaxDepth = 20

  static geometry: Three.Geometry =
      new Three.PlaneGeometry(Portal.Width, Portal.Height)

  mesh: Three.Mesh
  renderTexture: Three.WebGLRenderTarget
  backTexture: Three.WebGLRenderTarget
  material: Three.ShaderMaterial
  camera: Three.PerspectiveCamera = new Three.PerspectiveCamera()

  portalTransform: Three.Matrix4 = new Three.Matrix4()

  _otherPortal?: Portal
  get otherPortal(): Portal {
    return this._otherPortal!
  }

  set otherPortal(p: Portal) {
    this._otherPortal = p
    this.mesh.updateMatrixWorld()
    p.mesh.updateMatrixWorld()
    this.updatePortalTransform()
  }

  updatePortalTransform() {
    this.portalTransform
      .getInverse(this.mesh.matrixWorld) // To local
      .premultiply(new Three.Matrix4().makeRotationY(Math.PI)) // Rotate to move behind portal
      .premultiply(this.otherPortal.mesh.matrixWorld) // From local to world
  }

  updateCamera(playerCamera: Three.PerspectiveCamera): void {
    this.camera.copy(playerCamera)
    playerCamera.getWorldPosition(this.camera.position)

    this.camera.applyMatrix4(this.portalTransform)
  }


  swapTargets() {
    const temp = this.backTexture
    this.backTexture = this.renderTexture
    this.renderTexture = temp

    this.material.uniforms.map.value = this.backTexture.texture
  }

  computeViewBoundingBox(playerCamera: Three.PerspectiveCamera, viewSize: Three.Vector2): Three.Box2 {
    playerCamera.updateMatrixWorld()
    let points = [
      new Three.Vector3(-Portal.Width / 2, -Portal.Height / 2, 0),
      new Three.Vector3( Portal.Width / 2, -Portal.Height / 2, 0),
      new Three.Vector3( Portal.Width / 2,  Portal.Height / 2, 0),
      new Three.Vector3(-Portal.Width / 2,  Portal.Height / 2, 0),
    ].map(p => this.mesh.localToWorld(p).project(playerCamera))

    if (points.every(p => p.x > 1)
      || points.every(p => p.x < -1)
      || points.every(p => p.y > 1)
      || points.every(p => p.y < -1)
      || points.every(p => p.z > 1)
      || points.every(p => p.z < -1)) {
      const box = new Three.Box2()
      box.makeEmpty()
      return box
    }
    if(points.some(p => p.z > 1)) {
      // Ugly, but i have no other ideas
      return new Three.Box2(new Three.Vector2(0, 0), viewSize)
    }

    points.forEach(p => p.clamp(new Three.Vector3(-1, -1, -1), new Three.Vector3(1, 1, 1)))

    let points2 = points.map(p =>
          new Three.Vector2(p.x, p.y)
            .addScalar(1.0)
            .multiply(viewSize)
            .multiplyScalar(0.5)
            .clamp(new Three.Vector2(), viewSize))

    const box = new Three.Box2()
    box.setFromPoints(points2)

    return box
  }

  render(playerCamera: Three.PerspectiveCamera, scene: Three.Scene, renderer: Three.WebGLRenderer): void {
    const rec = (camera: Three.PerspectiveCamera, depth: number, box?: Three.Box2) => {
      if (this.color == PortalColor.Blue) {
        Debug.instance.portalDepth.blue = depth
      } else {
        Debug.instance.portalDepth.orange = depth
      }

      const scissorBox = this.computeViewBoundingBox(camera, renderer.getSize(new Three.Vector2()))

      if (box) {
        scissorBox.intersect(box)
      }

      if (scissorBox.isEmpty()) {
        return;
      }

      const boxSize = scissorBox.getSize(new Three.Vector2())

      if (boxSize.x < 2.0 || boxSize.y < 2.0) {
        return
      }

      this.updateCamera(camera)

      if (depth < Portal.MaxDepth) {
        const savedCamera = this.camera
        this.camera = this.camera.clone()
        rec(savedCamera, depth + 1, scissorBox)
        this.camera = savedCamera
      }

      renderer.setRenderTarget(this.renderTexture)
      renderer.clear()
      renderer.setScissor(scissorBox.min.x, scissorBox.min.y, boxSize.x, boxSize.y)
      renderer.setScissorTest(true)

      this.otherPortal.wall.visible = false

      renderer.render(scene, this.camera)

      this.otherPortal.wall.visible = true

      renderer.setScissorTest(false)
      renderer.setRenderTarget(null) // reset render target

      this.swapTargets()
    }

    rec(playerCamera, 0)
  }

}
