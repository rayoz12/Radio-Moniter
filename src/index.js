const request = require("request");
const notifier = require('node-notifier');
const jsonfile = require('jsonfile');
const fs = require('fs');
const util = require("util");
const moment = require("moment");

const date = moment().format("YYYY-MM-DD");

let songs = {
	date,
	tracks: []
};

const ignoredTitles = [
	"101.7 WSFM , Sydney's Pure Gold",
	"Audio Type Changed to To Be Created"
]

const file = './songs-' + date + '.json'
//create if songs.json doesn't exist
if (!fs.existsSync(file)) {
    jsonfile.writeFileSync(file, songs);
}

const newSongs = jsonfile.readFileSync(file);
if (newSongs.date !== songs.date) {
	//new day
	jsonfile.writeFileSync(file, songs);
} else {
	songs = newSongs;
}

setInterval(makeTrackRequest, 10000);

function makeTrackRequest() {
	request('http://media.arn.com.au/XML-JSON.aspx?source=www.wsfm.com.au&feedUrl=xml/wsfm1017_now.xml', function (error, response, body) {
		if (error !== null) {
			console.log("Request error at " + moment().format());
			return;
		}
		console.log("\u001b[2J\u001b[0;0H");
		console.log("INFO AT: " + moment().format());
		try {
			printSongInfo(JSON.parse(body));
		}
		catch (e) {
			console.log("Failed to parse: ", e);
			notifier.notify({
			  'title': 'Failed to Read',
			  'message': "Failed to read/parse JSON"
			});
		}
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
		const foundSong = songs.tracks.find((item, index) => item.title === track.title);
		if (foundSong !== undefined) {
			console.log("Expected Duplicate Song!", foundSong);
		} else {
			console.log();
		}
	}
	//console.log("-------------Songs Played-------------");
	//console.log(songs.tracks);
	recordNowPlaying(artist, title, playedAt);
	checkDuplicate();
}

function recordNowPlaying(artist, title, playedAt) {
	if (inIgnoredTitles(title)) {
		console.log("In Ad Break or Talk Show");
		return;
	}
	if (songs.tracks.length === 0) {
		songs.tracks.push({artist, title, playedAt});
		jsonfile.writeFile(file, songs, function (err) {
		  if (err !== null)
			console.error(err)
		});
	} else {
		const lastTrack = songs.tracks[songs.tracks.length - 1];
		if (lastTrack.title !== title) {
			notifier.notify({
			  'title': 'New Song Playing',
			  'message': title
			});
			songs.tracks.push({artist, title, playedAt});
			jsonfile.writeFile(file, songs, function (err) {
				if (err !== null)
					console.error(err)
			});
		}
	}
}

function checkDuplicate() {
  for (let i=0;i<songs.tracks.length;i++) {
    const currentTitle = songs.tracks[i].title;
	const currentArtist = songs.tracks[i].artist;
	const thresholdTime = Date.now() - 1000*60*5;
    const foundSong = songs.tracks.find((item, index) => 
		item.title === currentTitle && 
		item.artist === currentArtist && 
		index !== i && 
		(new Date(item.playedAt).getTime() < thresholdTime));
    if (foundSong !== undefined) {
		const message = `${songs.tracks[i].title} played at: ${songs.tracks[i].playedAt} (in index ${i}) and again at ${foundSong.playedAt}`
		notifier.notify({
		  'title': 'Duplicate Song!',
		  message
		});
      console.log("Duplicate Song Found");
	  console.log(foundSong);
    }
  }
}

function inIgnoredTitles(title) {
	for(let i=0;i<ignoredTitles.length;i++) {
		if (ignoredTitles[i].indexOf(title) > -1) {
			return true;
		}
	}
	return false;
}
