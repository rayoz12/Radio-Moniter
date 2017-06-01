const request = require("request");
const util = require("util");

const songs = [];

setInterval(makeTrackRequest, 10000);


function makeTrackRequest() {
	request('http://media.arn.com.au/XML-JSON.aspx?source=www.wsfm.com.au&feedUrl=xml/wsfm1017_now.xml', function (error, response, body) {
		if (error !== null) {
			console.log("Request error at " + new Date().toLocaleString());
			return;
		}
		console.log("\u001b[2J\u001b[0;0H");
		console.log("INFO AT: " + new Date().toLocaleString());
		printSongInfo(JSON.parse(body));
	});
}

makeTrackRequest();

function printSongInfo(body) {
	const data = body.on_air;
	console.log("-------------Now Playing-------------");
	const artist = data.now_playing.audio.artist.value;
	const title = data.now_playing.audio.title.value;
	const playedAt = data.now_playing.audio.played_datetime.value;
	console.log("Artist:", artist);
	console.log("Title:", title);
	console.log("Played At:", playedAt);
	console.log("-------------Next Tracks-------------");
	const nextArr = data.up_next.audio;
	for (let i=0;i<nextArr.length;i++) {
		const track = nextArr[i];
		console.log(`--------------Track ${i+1}-----------`);
		const nextArtist = track.artist.value;
		const nextTitle = track.title.value;
		const nextPlayedAt = track.played_datetime.value;
		console.log(`Track ${i+1}: Artist:`, nextArtist);
		console.log(`Track ${i+1}: Title:`, nextTitle);
		console.log(`Track ${i+1}: Playing At:`, nextPlayedAt);
		console.log();
	}
	recordNowPlaying(artist, title, playedAt);
  checkDuplicate();
}

function recordNowPlaying(artist, title, playedAt) {
  if (title === "101.7 WSFM , Sydney's Pure Gold") {
     console.log("In Ad Break or Talk Show");
     return;
  }
  const lastTrack = songs[songs.length - 1];
	if (lastTrack.title !== title) {
    songs.push({artist, title, playedAt});
  }
}

function checkDuplicate() {
  for (let i=0;i<songs.length;i++) {
    const currentTitle = songs[i].title;
    const foundSong = songs.find(item => item.title === currentTitle);
    if (foundSong !== undefined) {
      console.log("Duplicate Song Found");
    }
  }
}
