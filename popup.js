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

Hooks.once("init", () => {
	//Wait until the game is initialized, then register the settings created previously.
	registerSettings();
});

async function openIntroduction (){
	const journals = await game.packs.get("pf2e-mercenary-marketplace-demo.mmDemo-journals").getDocuments();
	const introduction = journals.filter(e => e.id == "1s34nyLF4vYUxsHX")[0]
	introduction.sheet.render(true)
	game.settings.set("pf2e-mercenary-marketplace-demo", "popupVis", false)
}
Hooks.once('ready', async function () {
    if (game.user.isGM) {
        if (game.settings.get("pf2e-mercenary-marketplace-demo", "popupVis") == true) {
            let d = new Dialog({
                title: "Mercenary Marketplace Volume 1 Activated",

                content: `
                <p>
								Thank you for purchasing Mercenary Marketplace Volume 1!
								</p>
								<p>This module would not have been possible without the feedback from Amanda, InfamousSky, and SkepticRobot.</p>
								<p>
                Please click the introduction button to discover all your new content.
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
