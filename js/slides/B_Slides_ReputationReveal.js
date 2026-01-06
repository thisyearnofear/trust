/**
 * REPUTATION SUMMARY SLIDE
 * 
 * Merged from reputation_reveal + reputation_meaning
 * Appears after the game completes.
 * Shows: move breakdown + tier explanation + voting power.
 * Bridges game mechanics to governance voting.
 */

SLIDES.push({
	id: "reputation_summary",
	onstart: function (self) {

		var o = self.objects;
		const reputation = getGameReputation();
		const tier = reputation.getReputationTier();

		// Splash
		self.add({
			id: "splash",
			type: "Splash",
			blush: (tier.label === 'WellAligned')
		});

		// PART 1: Breakdown of what you did
		var summaryText = "<b>Your Game Record</b><br>";
		
		if (reputation.totalMoves === 0) {
			summaryText = Words.get("reputation_reveal_no_games");
		} else {
			const defections = reputation.totalMoves - reputation.cooperativeMoves;
			const cooperationRate = Math.round(reputation.calculateScore());
			
			summaryText += `You cooperated <b>${reputation.cooperativeMoves} times</b>, defected <b>${defections} times</b>.<br>`;
			summaryText += `That's a <b>${cooperationRate}% cooperation rate</b>.<br><br>`;
			
			// PART 2: What your tier means
			summaryText += `<span style="color: ${tier.cssClass === 'reputation-aligned' ? '#4CAF50' : (tier.cssClass === 'reputation-neutral' ? '#FFC107' : '#FF5E5E')};">`;
			summaryText += `<b>[${tier.label.toUpperCase()}]</b></span><br>`;
			
			if (tier.label === 'WellAligned') {
				summaryText += "<b>YOU are a Well-Aligned validator.</b> Your governance votes shape Bitcoin's game design.<br>";
			} else if (tier.label === 'Neutral') {
				summaryText += "<b>YOU are a Neutral participant.</b> Your votes influence Bitcoin's consensus rules.<br>";
			} else {
				summaryText += "<b>YOU are a Learning validator.</b> Your participation in game design shapes Bitcoin's future.<br>";
			}
			
			// PART 3: Voting power
			summaryText += `<br><i>Your voting power: <b>${reputation.getVotingPower()} votes</b></i>`;
		}

		self.add({
			id: "summary_text", type: "TextBox",
			x: 100, y: 80, width: 760, height: 350,
			text: summaryText,
			size: 13,
			align: "center"
		});

		// Continue button
		self.add({
			id: "button", type: "Button", x: 615, y: 450,
			text_id: "reputation_summary_btn",
			message: "slideshow/next"
		});

	},
	onend: function (self) {
		self.clear();
	}
});

