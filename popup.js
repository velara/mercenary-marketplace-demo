function registerSettings() {
	// Create the setting for disabling/re-enabling the popup.
	game.settings.register("pf2e-mercenary-marketplace-demo", "popupVis", {
		name: "One-Time Popup",
		scope: "client",
		config: false,
		type: Boolean,
		default: true
})
};

async function openIntroduction (){
	const journals = await game.packs.get("pf2e-mercenary-marketplace-demo.mmDemo-journals").getDocuments();
	const introduction = journals.filter(e => e.id == "1s34nyLF4vYUxsHX")[0]
	introduction.sheet.render(true)
	game.settings.set("pf2e-mercenary-marketplace-demo", "popupVis", false)
}

/*Hooks*/
Hooks.once("init", () => {
	// If the Pathfinder Tokens: Character Gallery isn't installed replace the art mapping with a blank file.
	if (!game.modules.get('pf2e-tokens-characters')){
		game.modules.get('pf2e-mercenary-marketplace-demo')?.updateSource({flags: {'compendiumArtMappings': {'pf2e': {"mapping":"modules/pf2e-mercenary-marketplace-demo/blank-art-map.json",
		"credit":"Portrait and Token art from Pathfinder Tokens: Character Gallery"
	}}}});
	}
	//Wait until the game is initialized, then register the settings created previously.
	registerSettings();
});

//One time popup
Hooks.once('ready', async function () {
    if (game.user.isGM) {
        if (game.settings.get("pf2e-mercenary-marketplace-demo", "popupVis") == true) {
            let d = new Dialog({
                title: "Mercenary Marketplace Demo Activated",

                content: `
                <p>
								Thank you for picking up the Mercenary Marketplace Demo!
								</p>
								<p>This module would not have been possible without the feedback from Amanda, InfamousSky, and SkepticRobot.</p>
								<p>
                Please click the introduction button to discover what the demo has to offer.
                </p>
                `,
                buttons: {
                    one: {
                        icon: '<i class="fas fa-clipboard-list"></i>',
                        label: "Introduction",
												callback: () => openIntroduction()
                    },
                    two: {
                        icon: '<i class="fas fa-times-circle"></i>',
                        label: "Close",
                        callback: () => game.settings.set("pf2e-mercenary-marketplace-demo", "popupVis", false)
                    },
                },



            },{ width: 450});
            d.render(true);
        }
    }
})

/* -------------------------------------------- */
/*  Journal Entry Styling 		                  */
/* -------------------------------------------- */

Hooks.on("renderJournalSheet", (app, html, data) => {
  if ( app.document.getFlag("pf2e-mercenary-marketplace-demo", "ismmDemo") === true ) {
    html = html[0];
    html.classList.remove("pf2e");
    html.classList.add("pf2e-mmDemo");
  }
});


/*Class - Crew Image Override*/
class CrewToken {
  static SCOPE = "pf2e-mercenary-marketplace-demo";
  static FLAG_IS_CREW = "is-crew";
	static FLAG_UNIQUE_BACKGROUND = "unique-background"
	static FLAG_ORIGINAL_SCALE = "original-scale"
  static FLAG_MODIFIED = "token-modified-from";
  static FLAG_BACKGROUND = "background";
	static FLAG_AUTO_CREW = "autocrew";
  static DEFAULT_BACKGROUND = "modules/pf2e-mercenary-marketplace-demo/assets/crewdefault.webp";

  // Toggle(actors: []Actor) toggles the texture modification effect for tokens associated to the actor
  static Toggle(actors) {
    actors.forEach((actor) => {
      actor.setFlag(
        CrewToken.SCOPE,
        CrewToken.FLAG_IS_CREW,
        !actor.getFlag(CrewToken.SCOPE, CrewToken.FLAG_IS_CREW),
      );
    });
  }
// Toggles the crew flag for new crew NPCs dragged from the compendium.
	static async AutoApplyCrewFlag(li){
		if(game.settings.get(CrewToken.SCOPE, CrewToken.FLAG_AUTO_CREW)){
		const id = li._id;
		const actor = game.actors.get(id);
		if(actor.traits.has('crew')){
			await actor.setFlag(CrewToken.SCOPE, CrewToken.FLAG_IS_CREW, true);
		}
	}
 }

  // SelectBackground(initialPath: string) launches a file picker to select a background frame for crew-tokens
  static async SelectBackground(actors, initialPath = "/modules/pf2e-mercenary-marketplace-demo/assets/") {
    let fp = new foundry.applications.apps.FilePicker.implementation();
    fp.type = "image";
    if (initialPath !== "") {
      fp.browse(initialPath);
    }
    fp.callback = (path) => {
      CrewToken.SetBackground(actors, path);
    };
    fp.render();
  }

  // SetBackground(path: string) sets the background frame image to use path.
  static SetBackground(actors, path) {
		actors.forEach((actor) => {
      actor.setFlag(
        CrewToken.SCOPE,
        CrewToken.FLAG_UNIQUE_BACKGROUND,
        path,
      );
    });
    canvas.tokens.objects.children.forEach((token) => {
      CrewToken._resetToken(token);
      token.renderFlags.set({redraw:true})
    });
  }

  // _onSetup() initializes setting storage
  static _onSetup() {
    game.settings.register(CrewToken.SCOPE, CrewToken.FLAG_BACKGROUND, {
      name: "Crew Token Background",
      hint: "Default image to use as a frame/background for Crews",
      scope: "world",
      config: true,
      requiresReload: true,
			filePicker: "img",
      type: String,
      default: CrewToken.DEFAULT_BACKGROUND,
    });
		game.settings.register(CrewToken.SCOPE, CrewToken.FLAG_AUTO_CREW, {
			name: "Automatically Apply Crew Frame",
			hint: "Automatically apply the default crew frame to crews dragged from the compendium",
			scope: "world",
			config: true,
			type: Boolean,
			default: true,
		});
  }

  // _onRefreshToken(token: Token) updates tokens that have been enabled via Toggle()
  static async _onRefreshToken(token) {
    const texture = token.mesh.texture;

    //Check data flags
    const isCrew =
      token?.actor?.getFlag(CrewToken.SCOPE, CrewToken.FLAG_IS_CREW) === true || false;
    const isModified =
      texture[`_${CrewToken.SCOPE}_${CrewToken.FLAG_MODIFIED}`] !== undefined;
    const background_path = token?.actor?.getFlag(CrewToken.SCOPE, CrewToken.FLAG_UNIQUE_BACKGROUND) || game.settings.get(
      CrewToken.SCOPE,
      CrewToken.FLAG_BACKGROUND,
    );

    //Clear modification if no longer crew
    if (!isCrew && isModified) {
				await token.document.update({ring:{subject:{scale:token.actor.getFlag(CrewToken.SCOPE,
					CrewToken.FLAG_ORIGINAL_SCALE)?.ringScale || token.document.ring.subject.scale}}});
				await token.document.update({texture:{scaleX:token.actor.getFlag(CrewToken.SCOPE,
					CrewToken.FLAG_ORIGINAL_SCALE)?.x || token.document.texture.scaleX, scaleY:token.actor.getFlag(CrewToken.SCOPE,
					CrewToken.FLAG_ORIGINAL_SCALE)?.y || token.document.texture.scaleY}});
      CrewToken._resetToken(token);
    }

    //Exit if not crew, or allready modified
    if (!isCrew || isModified) {
      return;
    }

    //Create compound sprite
	 if(token.actor.getFlag(CrewToken.SCOPE,
	 CrewToken.FLAG_ORIGINAL_SCALE) == undefined){
   if(token.document.texture.scaleX != 1 || token.document.texture.scaleY !=1){
		 await token.actor.setFlag(
			CrewToken.SCOPE,
			CrewToken.FLAG_ORIGINAL_SCALE,
			{x:token.document.texture.scaleX, y:token.document.texture.scaleY, ringScale:token.document.ring.subject.scale},
		)
	 };
 };
		const originalScaleX = token.actor.getFlag(CrewToken.SCOPE, CrewToken.FLAG_ORIGINAL_SCALE)?.x || token.document.texture.scaleX;
		const originalScaleY = token.actor.getFlag(CrewToken.SCOPE, CrewToken.FLAG_ORIGINAL_SCALE)?.y || token.document.texture.scaleY;
		const imgScale =  0.8 + ( Math.max(originalScaleX, originalScaleY) > 1 ? 0.2 : 0)//* Math.max(originalScaleX, originalScaleY)
    const imgScaleXYAdjust = (1 - imgScale) / 2
		const container = new PIXI.Container();
    var background = await foundry.canvas.loadTexture(background_path);
    const size = Math.max(texture.width, texture.height);
    const widthOffset = (size - texture.width)/2;
    const heightOffset = (size - texture.height)/2;
    const bg = new PIXI.Sprite(background);
    bg.width = size * 2
    bg.height = size * 2
    bg.x = 0;
    bg.y = 0;
    bg.zindex = -1;
    container.addChild(bg);
    const sprite1 = new PIXI.Sprite(texture);
    sprite1.x = (size + size*imgScaleXYAdjust + widthOffset);
    sprite1.y = (size + size*imgScaleXYAdjust + heightOffset);
    sprite1.width = size*imgScale;
    sprite1.height = size*imgScale;
    container.addChild(sprite1);
    const sprite2 = new PIXI.Sprite(texture);
    sprite2.x = (size*imgScaleXYAdjust + widthOffset);
    sprite2.y = (size*imgScaleXYAdjust + heightOffset);
    sprite2.width = size*imgScale;
    sprite2.height = size*imgScale;
    container.addChild(sprite2);
    const sprite3 = new PIXI.Sprite(texture);
    sprite3.x = size*imgScaleXYAdjust + widthOffset;
    sprite3.y = size + size*imgScaleXYAdjust + heightOffset;
		sprite3.width = size*imgScale;
    sprite3.height = size*imgScale;
    container.addChild(sprite3);
    const sprite4 = new PIXI.Sprite(texture);
    sprite4.x = size + size*imgScaleXYAdjust + widthOffset;
    sprite4.y = size*imgScaleXYAdjust + heightOffset;
		sprite4.width = size*imgScale;
    sprite4.height = size*imgScale;
    container.addChild(sprite4);

    //Generate new texure
    const compiled = canvas.app.renderer.generateTexture(container);
    compiled[`_${CrewToken.SCOPE}_${CrewToken.FLAG_MODIFIED}`] = texture;

    //Overide existing texture
    token.mesh.texture = compiled;
    token.mesh.object.refresh();
		await token.document.update({ring:{subject:{scale:1}}});
		await token.document.update({texture:{scaleX:1, scaleY:1}});

  }

  static async _resetToken(token) {
    const modifiedFrom =
      token.mesh.texture[`_${CrewToken.SCOPE}_${CrewToken.FLAG_MODIFIED}`];
    if (modifiedFrom != undefined) {
      token.mesh.texture = modifiedFrom;
      token.mesh.object.refresh();
    }
  }
}

globalThis.CrewToken = CrewToken;
Hooks.on("refreshToken", CrewToken._onRefreshToken);
Hooks.on("setup", CrewToken._onSetup);
Hooks.on('createActor', CrewToken.AutoApplyCrewFlag );
