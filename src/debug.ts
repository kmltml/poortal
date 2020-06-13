import dat = require("dat.gui")

export class Debug {

  private static _instance?: Debug

  gui: dat.GUI = new dat.GUI()

  folders = {
    portalDepth: this.gui.addFolder("Portal Depth"),
    player: this.gui.addFolder("Player")
  }

  portalDepth = {
    blue: 0,
    orange: 0
  }

  player = {
    speed: 0.1,
    onGround: false
  }

  static get instance(): Debug {
    if (Debug._instance === undefined) {
      Debug._instance = new Debug()
    }
    return Debug._instance
  }

  constructor() {
    this.folders.portalDepth.add(this.portalDepth, "blue").listen()
    this.folders.portalDepth.add(this.portalDepth, "orange").listen()
    this.folders.portalDepth.open()

    this.folders.player.add(this.player, "speed").listen()
    this.folders.player.add(this.player, "onGround").listen()
    this.folders.player.open()

    this.gui.show()
  }

}
