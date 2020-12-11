var id3 = require('node-id3');

self.onmessage = function(e){
	var file = e.data.file;
    var albumArt = e.data.albumArt;
	var song_path = file.path;
    var song = {};
    song.path = song_path;
    song.title = file.name || "Unknown song";
    song.artwork = "";
    song.duration = 0;

    if(albumArt && albumArt != undefined && albumArt.large && albumArt.large.type){
        song.artwork = {url: albumArt.large.path, mime: albumArt.large.type};
    }

    var tags = id3.read(song_path);

    if(tags){
        // console.log(tags);

        song.title = tags.title || song.title;
        song.artist = tags.artist || "Unknown Artist";
        song.album = tags.album || "Unknown Album";
        song.year = tags.year || "Unknown";
        song.genre = tags.genre;

        if(tags.length)
            song.duration = tags.length / 1000;

        if(!albumArt || !albumArt.length){
            var pic = tags.image;
            if(pic && pic.imageBuffer && pic.imageBuffer.length && pic.mime && pic.mime.length){
                // pic.mime = pic.mime || "png";
                var url = 'data:image/'+pic.mime+';base64,';
                url += pic.imageBuffer.toString('base64');

                song.artwork = {url: url, mime: pic.mime};
            }
        }
    }

    postMessage({song: song});

    // mp3Duration(song_path, function (err, duration) {
    //     if (err) return console.log(err.message);
    //     console.log('Your file is ' + parseInt(duration) + ' seconds long');
    //     song.duration = parseInt(duration);
    // });
}
