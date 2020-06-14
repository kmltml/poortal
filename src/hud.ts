import * as Three from "three"

import { Player } from "./player"
import { PortalColor } from "./portal"

export class Hud {

  static Quad = new Three.PlaneGeometry()

  private scene = new Three.Scene()

  private camera: Three.OrthographicCamera

  private textures: {
    crosshair: Three.Texture,
    portalActiveOrange: Three.Texture,
    portalInactiveOrange: Three.Texture,
    portalActiveBlue: Three.Texture,
    portalInactiveBlue: Three.Texture,
  }

  private crosshair: Three.Mesh
  private bluePortalIndicatorMaterial: Three.MeshBasicMaterial
  private orangePortalIndicatorMaterial: Three.MeshBasicMaterial

  constructor(public player: Player, renderer: Three.WebGLRenderer, textureLoader: Three.TextureLoader) {
    const size = renderer.getSize(new Three.Vector2())
    this.camera = new Three.OrthographicCamera(-size.x / 2, size.x / 2, size.y / 2, -size.y / 2, 0, 1)

    this.textures = {
      crosshair: textureLoader.load("tex/hud/crosshair.png"),
      portalActiveOrange: textureLoader.load("tex/hud/portal-active-orange.png"),
      portalInactiveOrange: textureLoader.load("tex/hud/portal-inactive-orange.png"),
      portalActiveBlue: textureLoader.load("tex/hud/portal-active-blue.png"),
      portalInactiveBlue: textureLoader.load("tex/hud/portal-inactive-blue.png"),
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
    this.crosshair.scale.set(32, 32, 1.0)
    this.scene.add(this.crosshair)

    this.bluePortalIndicatorMaterial = new Three.MeshBasicMaterial({
      side: Three.DoubleSide,
      map: this.textures.portalInactiveBlue,
      transparent: true
    })
    const bluePortalIndicator = new Three.Mesh(Hud.Quad, this.bluePortalIndicatorMaterial)
    bluePortalIndicator.position.set(0, 0, 0)
    bluePortalIndicator.scale.set(64, 128, 1)
    this.scene.add(bluePortalIndicator)

    this.orangePortalIndicatorMaterial = new Three.MeshBasicMaterial({
      side: Three.DoubleSide,
      map: this.textures.portalInactiveOrange,
      transparent: true
    })
    const orangePortalIndicator = new Three.Mesh(Hud.Quad, this.orangePortalIndicatorMaterial)
    orangePortalIndicator.position.set(0, 0, 0)
    orangePortalIndicator.scale.set(64, 128, 1)
    this.scene.add(orangePortalIndicator)

  }

  render(renderer: Three.WebGLRenderer) {
    renderer.clearDepth()

    this.bluePortalIndicatorMaterial.map =
      this.player.portals[PortalColor.Blue] ? this.textures.portalActiveBlue : this.textures.portalInactiveBlue

    this.orangePortalIndicatorMaterial.map =
      this.player.portals[PortalColor.Orange] ? this.textures.portalActiveOrange : this.textures.portalInactiveOrange

    renderer.render(this.scene, this.camera)
  }

}
