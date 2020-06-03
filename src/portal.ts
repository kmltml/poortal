import * as Three from "three"

export class Portal {

  constructor(public wall: Three.Mesh, mask: Three.Texture, overlay: Three.Texture) {

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

  static Width = 0.8
  static Height = 1.5
  
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

    

    this.camera.applyMatrix4(this.portalTransform)
  }


  swapTargets() {
    const temp = this.backTexture
    this.backTexture = this.renderTexture
    this.renderTexture = temp
    
    this.material.uniforms.map.value = this.backTexture.texture
  }

  computeViewBoundingBox(playerCamera: Three.PerspectiveCamera, viewSize: Three.Vector2): Three.Box2 {
    let points = [
      new Three.Vector3(-Portal.Width / 2, -Portal.Height / 2, 0),
      new Three.Vector3( Portal.Width / 2, -Portal.Height / 2, 0),
      new Three.Vector3( Portal.Width / 2,  Portal.Height / 2, 0),
      new Three.Vector3(-Portal.Width / 2,  Portal.Height / 2, 0),
    ].map(p => this.mesh.localToWorld(p).project(playerCamera))

    if(points.some(p => p.z > 1)) {
      // Ugly, but i have no other ideas
      return new Three.Box2(new Three.Vector2(0, 0), viewSize)
    }
    
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
    this.updateCamera(playerCamera)
    this.otherPortal.wall.visible = false

    const scissorBox = this.computeViewBoundingBox(playerCamera, renderer.getSize(new Three.Vector2()))
    
    const boxSize = scissorBox.getSize(new Three.Vector2())
    renderer.setRenderTarget(this.renderTexture)
    renderer.setScissor(scissorBox.min.x, scissorBox.min.y, boxSize.x, boxSize.y)
    renderer.setScissorTest(true)

    renderer.render(scene, this.camera)
    
    renderer.setScissorTest(false)    
    renderer.setRenderTarget(null) // reset render target
    this.otherPortal.wall.visible = true

    this.swapTargets()
  }

}
