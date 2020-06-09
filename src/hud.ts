import * as Three from "three"

export class Hud {

  static Quad = new Three.PlaneGeometry()

  private scene = new Three.Scene()

  private camera: Three.OrthographicCamera

  private textures: {
    crosshair: Three.Texture
  }

  private crosshair: Three.Mesh

  constructor(renderer: Three.WebGLRenderer, textureLoader: Three.TextureLoader) {
    const size = renderer.getSize(new Three.Vector2())
    const aspect = size.y / size.x
    this.camera = new Three.OrthographicCamera(-1, 1, -aspect, aspect, 0, 1)

    this.textures = {
      crosshair: textureLoader.load("tex/hud/crosshair.png")
    }

    this.crosshair = new Three.Mesh(
      Hud.Quad,
      new Three.MeshBasicMaterial({
        side: Three.DoubleSide,
        map: this.textures.crosshair,
        transparent: true
      })
    )
    this.crosshair.position.set(0, 0, 0)
    this.crosshair.scale.set(0.05, 0.05, 1.0)
    this.scene.add(this.crosshair)

  }

  render(renderer: Three.WebGLRenderer) {
    renderer.clearDepth()

    renderer.render(this.scene, this.camera)
  }

}
