///////////////
// PARAMETERS //
///////////////

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

// Add your Last.fm credentials here, or pass them in the OBS browser source URL
const LASTFM_USER = urlParams.get("lastfm_user") || "YOUR_LASTFM_USERNAME";
const LASTFM_API_KEY = urlParams.get("lastfm_api_key") || "YOUR_LASTFM_API_KEY";

// Existing overlay parameters
const visibilityDuration = urlParams.get("duration") || 0;[cite: 2]
const hideAlbumArt = urlParams.has("hideAlbumArt");[cite: 2]

let currentState = false;[cite: 2]
let currentSongUri = "";[cite: 2]


//////////////////
// LAST.FM API  //
//////////////////

async function GetCurrentlyPlaying() {
	if (LASTFM_USER === "YOUR_LASTFM_USERNAME" || LASTFM_API_KEY === "YOUR_LASTFM_API_KEY") {
		console.error("Please configure your Last.fm username and API key.");
		return;
	}

	try {
		const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USER}&api_key=${LASTFM_API_KEY}&format=json&limit=1`;
		const response = await fetch(url);
	
		if (response.ok) {
			const data = await response.json();
			
			if (data.recenttracks && data.recenttracks.track && data.recenttracks.track.length > 0) {
				const track = data.recenttracks.track[0];
				// Last.fm adds this attribute if the song is currently playing
				const isPlaying = track['@attr'] && track['@attr'].nowplaying === 'true';
				
				UpdatePlayer(track, isPlaying);
			} else {
				UpdatePlayer(null, false);
			}
		} else {
			console.error(`Last.fm API Error: ${response.status}`);
		}
	} catch (error) {
		console.debug(error);[cite: 2]
		SetVisibility(false);[cite: 2]
	}

	// Last.fm rate limits are lenient, but polling every 3-5 seconds is safer than 1 second
	setTimeout(() => {
		GetCurrentlyPlaying();
	}, 4000);
}

function UpdatePlayer(track, isPlaying) {
	if (!track) {
		if (currentState) SetVisibility(false);
		return;
	}

	// Map Last.fm data
	const artist = track.artist['#text'];
	const name = track.name;
	// Last.fm image array: index 3 is 'extralarge'
	const albumArt = track.image[3]['#text'] || `images/placeholder-album-art.png`;[cite: 2]
	const songId = `${name}-${artist}`; // Unique ID since Last.fm doesn't provide Spotify URIs

	// Set the visibility of the player, but only if the state is different than the last time we checked
	if (isPlaying != currentState) {[cite: 2]
		if (!isPlaying) {[cite: 2]
			console.debug("Hiding player...");[cite: 2]
			SetVisibility(false);[cite: 2]
		} else {[cite: 2]
			console.debug("Showing player...");[cite: 2]
			setTimeout(() => {[cite: 2]
				SetVisibility(true);[cite: 2]

				if (visibilityDuration > 0) {[cite: 2]
					setTimeout(() => {[cite: 2]
						SetVisibility(false, false);[cite: 2]
					}, visibilityDuration * 1000);[cite: 2]
				}
			}, 500);[cite: 2]
		}
	}

	if (songId != currentSongUri) {		
		if (isPlaying) {
			console.debug("Updating song data...");
			setTimeout(() => {[cite: 2]
				SetVisibility(true);[cite: 2]

				if (visibilityDuration > 0) {[cite: 2]
					setTimeout(() => {[cite: 2]
						SetVisibility(false, false);[cite: 2]
					}, visibilityDuration * 1000);[cite: 2]
				}
			}, 500);[cite: 2]
	
			currentSongUri = songId;
			
			// Set thumbnail
			UpdateAlbumArt(document.getElementById("albumArt"), albumArt);[cite: 2]
			UpdateAlbumArt(document.getElementById("backgroundImage"), albumArt);[cite: 2]

			// Set song info[cite: 2]
			UpdateTextLabel(document.getElementById("artistLabel"), artist);[cite: 2]
			UpdateTextLabel(document.getElementById("songLabel"), name);[cite: 2]
			
			setTimeout(() => {[cite: 2]
				document.getElementById("albumArtBack").src = albumArt;[cite: 2]
				document.getElementById("backgroundImageBack").src = albumArt;[cite: 2]
			}, 1000);[cite: 2]
		}
	}

	// NOTE: Last.fm does not provide real-time millisecond progress.
	// Hiding the progress text and locking the bar so it doesn't break the UI.
	document.getElementById("progressBar").style.width = `100%`;
	document.getElementById("progressTime").innerHTML = "";
	document.getElementById("timeRemaining").innerHTML = "";
}

function UpdateTextLabel(div, text) {[cite: 2]
	if (div.innerText != text) {[cite: 2]
		div.setAttribute("class", "text-fade");[cite: 2]
		setTimeout(() => {[cite: 2]
			div.innerText = text;[cite: 2]
			div.setAttribute("class", "text-show"); // Fixed the stray dot from the original code
		}, 500);[cite: 2]
	}
}

function UpdateAlbumArt(div, imgsrc) {[cite: 2]
	if (div.src != imgsrc) {[cite: 2]
		div.setAttribute("class", "text-fade");[cite: 2]
		setTimeout(() => {[cite: 2]
			div.src = imgsrc;[cite: 2]
			div.setAttribute("class", "text-show");[cite: 2]
		}, 500);[cite: 2]
	}
}

//////////////////////
// HELPER FUNCTIONS //
//////////////////////

function SetVisibility(isVisible, updateCurrentState = true) {[cite: 2]
	widgetVisibility = isVisible;[cite: 2]
	const mainContainer = document.getElementById("mainContainer");[cite: 2]

	if (isVisible) {[cite: 2]
		mainContainer.style.opacity = 1;[cite: 2]
		mainContainer.style.bottom = "50%";[cite: 2]
	} else {[cite: 2]
		mainContainer.style.opacity = 0;[cite: 2]
		mainContainer.style.bottom = "calc(50% - 20px)";[cite: 2]
	}

	if (updateCurrentState)[cite: 2]
		currentState = isVisible;[cite: 2]
}

//////////////////////////////////////////////////////////////////////////////////////////
// RESIZER THING BECAUSE I THINK I KNOW HOW RESPONSIVE DESIGN WORKS EVEN THOUGH I DON'T //[cite: 2]
//////////////////////////////////////////////////////////////////////////////////////////

let outer = document.getElementById('mainContainer'),[cite: 2]
	maxWidth = outer.clientWidth+50,[cite: 2]
	maxHeight = outer.clientHeight;[cite: 2]

window.addEventListener("resize", resize);[cite: 2]
resize();[cite: 2]

function resize() {[cite: 2]
	const scale = window.innerWidth / maxWidth;[cite: 2]
	outer.style.transform = 'translate(-50%, 50%) scale(' + scale + ')';[cite: 2]
}

/////////////////////////////////////////////////////////////////////
// IF THE USER PUT IN THE HIDEALBUMART PARAMATER, THEN YOU SHOULD  //[cite: 2]
//   HIDE THE ALBUM ART, BECAUSE THAT'S WHAT IT'S SUPPOSED TO DO   //[cite: 2]
/////////////////////////////////////////////////////////////////////

if (hideAlbumArt) {[cite: 2]
	document.getElementById("albumArtBox").style.display = "none";[cite: 2]
	document.getElementById("songInfoBox").style.width = "calc(100% - 20px)";[cite: 2]
}

////////////////////////////////
// KICK OFF THE WHOLE WIDGET  //[cite: 2]
////////////////////////////////

GetCurrentlyPlaying(); // This is a recursive function, so just run it once[cite: 2]
