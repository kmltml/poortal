import * as Three from "three"
import { WebGLRenderTarget } from "three"

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

  static geometry: Three.Geometry =
      new Three.PlaneGeometry(0.8, 1.5)

  mesh: Three.Mesh
  renderTexture: WebGLRenderTarget
  backTexture: WebGLRenderTarget
  material: Three.ShaderMaterial
  camera: Three.PerspectiveCamera = new Three.PerspectiveCamera()
  cameraHelper = new Three.CameraHelper(this.camera)

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
  
  render(playerCamera: Three.PerspectiveCamera, scene: Three.Scene, renderer: Three.WebGLRenderer): void {
    this.updateCamera(playerCamera)
    this.otherPortal.wall.visible = false
    
    renderer.setRenderTarget(this.renderTexture)
    renderer.render(scene, this.camera)
    
    renderer.setRenderTarget(null) // reset render target
    this.otherPortal.wall.visible = true

    this.swapTargets()
  }

}
