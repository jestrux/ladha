const electron = require('electron');
const { app, BrowserWindow, dialog, ipcMain } = electron;
const fs = require('fs');
const path = require('path');
const url = require('url');
const getColors = require('get-image-colors');
const tinygradient = require('tinygradient');
const storage = require('electron-json-storage');
const electronLocalshortcut = require('electron-localshortcut');
const Worker = require('workerjs');

let win, serve;
const assets_folder = path.join(__dirname, 'assets');
let play_settings = {};
let music_index = {};
const default_music_index = {
  playlists: { 'favorites' : [] },
  folders: [],
  songs: [],
  artists: [],
  albums: []
};

var tagsWorker = new Worker(path.join(assets_folder, 'tags_worker.js'));
var newTagsWorker = new Worker(path.join(assets_folder, 'tags_worker_new.js'));

const args = process.argv.slice(1);
serve = args.some(val => val === '--serve');

function createWindow() {
  const electronScreen = electron.screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    width: size.width - 80, height: 800, frame: false,
    webPreferences: {
      webSecurity: false,
      nodeIntegrationInWorker: true,
      nodeIntegration: true,
      backgroundThrottling: false
    }
  });

//   if (serve) {
//     require('electron-reload')(__dirname, {
//       electron: require(`${__dirname}/node_modules/electron`)
//     });
//     win.loadURL('http://localhost:4200');
//   } else {
//     win.loadURL(url.format({
//       pathname: path.join(__dirname, 'dist/index.html'),
//       protocol: 'file:',
//       slashes: true
//     }));
//   }

//   if(serve)
//     win.webContents.openDevTools();

    win.loadFile('dist/electrong/index.html');

    win.webContents.openDevTools();

    win.on('closed', () => {
        win = null;
    });

  ipcMain.on("app-action", function(e, action){
    switch(action){
      case 0:
        win.close();
        break;
      case 1:
        win.minimize();
        break;
      case 2:
        var state = win.isMaximized();

        if(state)
          win.unmaximize();
        else
          win.maximize();

        win.webContents.send("maximize-changed", !state);
        break;
    }
  });

  ipcMain.on("ui-loaded", function(e){
    getIndex(win);
    getPlaySettings(win);
    // savePlaySettings(play_settings);
    // saveIndex(default_music_index);
    registerShortcuts(win);
  })

  ipcMain.on("get-image-colors", function(e, buffer, mime){
    getImageColors(buffer, mime, win, false);
  })

  ipcMain.on("get-image-gradient", function(e, buffer, mime){
    getImageColors(buffer, mime, win, true);
  })

  ipcMain.on("pick-folder", function(e){
    pickFolder(win);
  })

  ipcMain.on("process-dropped-files", function(e, files){
    processDroppedFiles(win, files);
  })

  ipcMain.on("remove-folder", function(e, folder){
    var folder_songs = music_index["songs"].filter(f => f.path.indexOf(folder) !== -1);

    win.webContents.send("folder-removed", true, folder);
    music_index["folders"].splice(music_index["folders"].indexOf(folder), 1);

    if(folder_songs.length < 1){
      saveIndex(music_index);
      return;
    }else{
      win.webContents.send("songs-changed", folder_songs);
      music_index["songs"] = folder_songs;
      saveIndex(music_index);
    }
  })

  ipcMain.on("set-pref", function(e, pref, value){
    play_settings[pref] = value;
    savePlaySettings(play_settings);
  })

  ipcMain.on("fave-song", function(e, song){
    addSongToPlaylist('favorites', song)
  })

  ipcMain.on("add-song-to-playlist", function(e, playlist, song){
    addSongToPlaylist(playlist, song)
  })

  ipcMain.on("tags-fetched", onTagsFetched);

  ipcMain.on("artist-image-fetched", onArtistImageFetched);
}

try {

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow);

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

} catch (e) {
  // Catch Error
  // throw e;
  console.log("/n/n/n********ERRROR************/n/n/n");
  console.log(e);
}

function is_image(element) {
  var extName = path.extname(element);
  return [".jpg", ".jpeg", ".png", ".bmp"].indexOf(extName) !== -1;
};

function processDroppedFiles(win, files){
  console.log("Files dropped: ", files);
  files.forEach(file => {
    fs.lstatSync(file, (err, stats) => {
      if(!err){
        var isDir = stats.isDirectory();
        if(isDir){
          if(music_index["folders"].indexOf(file) === -1){
            addToIndex("folders", file);
            win.webContents.send('folders-added', true, file);
          }
          readMusicFolder(win, file);
        }
        else{
          var matching_files = music_index["songs"].filter(f => f.path === file);
          if(file.indexOf(".mp3") >= 0 && matching_files.length < 1){
            getTags(file, file, null);
          }
        }
      }
      else
        console.log(`Stat Error: ${err}`); //Handle error
    });
  });
}

function readMusicFolder(win, folder){
  console.log("Read music folder: ", win, folder);

  var small_pics = [];
  var big_pics = [];

  var songs = fs.readdirSync(folder); //, (err, songs) => {
  console.log("Music folder files: ", songs);

  songs.forEach(song => {
    var images = songs.filter(is_image);
      images.forEach(file_inner => {
        var name = file_inner.toLowerCase();
        if(
            name.indexOf("album") != -1
            || name.indexOf("art") != -1
            || name.indexOf("cover") != -1
            || name.indexOf("cov") != -1
            || name.indexOf("front") != -1
            || name.indexOf("frontal") != -1){
            var type = path.extname(file_inner);
            var type_short = type.substring(type.lastIndexOf(".") + 1, type.length);
            if(name.indexOf("small") != -1)
                small_pics.push({path: folder + "/" + file_inner, type: type_short});
            else
                big_pics.push({path: folder + "/" + file_inner, type: type_short});
        }
    });

    if(small_pics.length)
        var small_pic = small_pics[0];

    if(big_pics.length){
        var big_pic = big_pics[0];
        if(!small_pics.length)
            var small_pic = big_pics[0];
    }
    var full_path = path.join(folder, song);
    var stats = fs.lstatSync(full_path);
    var isDir = stats.isDirectory();

    if(isDir){
      readMusicFolder(win, full_path);
      return;
    }
    else{
      // var songs = songs.filter(f => f.indexOf(".mp3") >= 0);
      var matching_files = music_index["songs"].filter(f => f.path === full_path);

      if(song.indexOf(".mp3") >= 0 && matching_files.length < 1){
        getTags(full_path, song, {small: small_pic, large: big_pic});
      }
    }
  });
}

function getTags(full_path, file_inner, covers){
  console.log("Get mp3 tags: ", full_path);

  if(covers && covers != null){
    var albumArt = {};
    if(covers.large)
        albumArt = covers;
    else if(covers.small){
        albumArt.large = {path : covers.small.path, type: covers.small.type};
    }
  }
  var fl = {
      name: file_inner,
      path: full_path
  };

  win.webContents.send('fetch-tags', fl, albumArt);
}

function onArtistImageFetched(e, name, image){
  var artist = {name, image};
  var idx = music_index["artists"].findIndex(a => a.name === name);

  // log("Artsit image fetched");
  // log(artist);
  // log(`Artist index: ${idx}`)

  if(idx === -1)
    idx = music_index["artists"].length;

  music_index["artists"][idx] = artist;
  saveIndex(music_index);

  win.webContents.send("artist-fetched", artist);
}

function onTagsFetched(e, data){
  // console.log("Result from Worker!", data);
  var song = data.song;
  var albumArt = data.albumArt;
  var err = data.err;
  if(song){
    var matching_songs = music_index["songs"].filter(f => {
      if(song.title && song.title.toLowerCase() != "unknown"
        && f.title && song.title.toLowerCase() != "unknown"
        && f.title === song.title){
          if(f.artist && f.artist.toLowerCase() != "unknown"
            && song.artist && song.artist.toLowerCase() != "unknown"
            && f.artist === song.artist)
            return true;
      }

      return false;
    });

    if(matching_songs.length > 0){
      return;
    }

    music_index["songs"].push(song);
    saveIndex(music_index);
    win.webContents.send("song-fetched", song);

    if(song && song.artwork && albumArt)
      albumArt.large = {
        path: song.artwork,
        type: song.imageMime
      }

    if(song.album){
      var albums = music_index["albums"].filter(a => a.title === song.album);

      if(!albums.length){
        const album = {title: song.album, artist: song.artist, year: song.year, artwork: song.artwork || "", art: song.artwork || ""}
        music_index["albums"].push(album);
        saveIndex(music_index);
        win.webContents.send("album-fetched", album);
      }
    }

    if(song.artist){
      var matching_artists = music_index["artists"].filter(a => a.name === song.artist);

      if(!matching_artists.length){
        music_index["artists"].push({name: song.artist, image: ""});
        saveIndex(music_index);

        win.webContents.send('fetch-artist-image', song.artist);
      }
    }
  }

  if(err){
      console.log("Error!");
      console.log(err);
      console.log("***Error mwisho***\n");
  }
}

function pickFolder(win){
  var options = {
    properties: ['openDirectory', 'multiSelections']
  };

  dialog.showOpenDialog(options, function(fols){
    console.log("Fols: ", fols);
    if(fols){
      if(win && win != null){
        win.webContents.send('folders-added', true, fols);
        fols.forEach(fol => {
          if(music_index["folders"].indexOf(fol) === -1){
            addToIndex("folders", fol);
            readMusicFolder(win, fol);
          }
        });
      }
    }
    else
      win.webContents.send('folders-fetched', false);
  });
}

function addSongToPlaylist(playlist, song){
  if(!music_index["playlists"][playlist])
    music_index["playlists"][playlist] = [song.path];
  else{
    const song_index = music_index["playlists"][playlist].indexOf(song.path);
    if(song_index !== -1)
      music_index["playlists"][playlist].splice(song_index, 1);
    else
      music_index["playlists"][playlist].push(song.path);
  }

  win.webContents.send("playlists-changed", music_index["playlists"]);
  saveIndex(music_index);
}

function registerShortcuts(win){
  //play pause
  electronLocalshortcut.register(win, 'Space', function () {
    win.webContents.send('global-shortcut', 0);
  });

  ipcMain.on('space-pressed', () => {
    win.webContents.send('global-shortcut', 0);
  });

  // // previous song
  // electronLocalshortcut.register(win, 'CmdOrCtrl+P', function () {
  //   win.webContents.send('global-shortcut', 0);
  // });

  // next song
  electronLocalshortcut.register(win, 'N', function () {
    win.webContents.send('global-shortcut', 1);
  });

  // previous song
  electronLocalshortcut.register(win, 'P', function () {
    win.webContents.send('global-shortcut', 2);
  });

  // SHORT SKIP NEXT BACK
  electronLocalshortcut.register(win, 'Shift+Right', function () {
      win.webContents.send('global-shortcut', 3);
  });
  electronLocalshortcut.register(win, 'Shift+Left', function () {
      win.webContents.send('global-shortcut', 4);
  });

  // LONG SKIP NEXT BACK
  electronLocalshortcut.register(win, 'CmdOrCtrl+Right', function () {
      win.webContents.send('global-shortcut', 5);
  });
  electronLocalshortcut.register(win, 'CmdOrCtrl+Left', function () {
      win.webContents.send('global-shortcut', 6);
  });

  //REPEAT
  electronLocalshortcut.register(win, 'CmdOrCtrl+R', function () {
      win.webContents.send('global-shortcut', 7);
  });

  //SHUFFLE
  electronLocalshortcut.register(win, 'CmdOrCtrl+S', function () {
      win.webContents.send('global-shortcut', 8);
  });

  // VOLUME UP / DOWN / MUTE
  electronLocalshortcut.register(win, 'CmdOrCtrl+Down', function () {
      win.webContents.send('global-shortcut', 10);
  });
  electronLocalshortcut.register(win, 'CmdOrCtrl+Up', function () {
      win.webContents.send('global-shortcut', 11);
  });
  electronLocalshortcut.register(win, 'CmdOrCtrl+M', function () {
      win.webContents.send('global-shortcut', 12);
  });

  // TOGGLE PLAYLIST
  electronLocalshortcut.register(win, 'CmdOrCtrl+L', function () {
      win.webContents.send('global-shortcut', 18);
  });

  // OPEN DEVTOOLS
  electronLocalshortcut.register(win, 'CmdOrCtrl+D', function () {
      win.webContents.openDevTools();
  });
}

function log(message){
  win.webContents.send('log-message', message);
}

function getImageColors(buffer, mime, win, gradient){
  if(buffer && mime){
      var mime_str = 'image/' + mime;

      getColors(buffer, mime_str)
      .then(colors => {
          // var shadow = "box-shadow: 0 0 15px " + $scope.progressBg;
          gradient = tinygradient(colors.map(color => color.hex()));
          var gradientStr = gradient.css();

          var colors_map = {
            progress: colors[0].alpha(0.3).css(),
            bar: colors[0].css(),
            gradient: gradientStr
          }

          if(!gradient)
            win.webContents.send('image-colors-fetched', colors_map);
          else
            win.webContents.send('image-gradient-fetched', colors_map);
      });
  }else{
      // var shadow = "box-shadow: 0 0 15px " + $scope.progressBg;
      gradient = tinygradient("#333", "#555", "#333");
      var gradientStr = gradient.css();

      var colors_map = {
        progress: "rgba(0,0,0,0.3)",
        bar: "#333",
        gradient: gradientStr
      };

      if(!gradient)
        win.webContents.send('image-colors-fetched', colors_map);
      else
        win.webContents.send('image-gradient-fetched', colors_map);
  }
}


function getPlaySettings(win){
  // savePlaySettings({});
  var default_play_settings = {volume: 0.5};
  storage.get('play_settings', function(error, data) {
    if (error) {
      console.log("Error fetching play settings");
      console.log(error);
      play_settings = default_play_settings;
      savePlaySettings(default_play_settings);
      win.webContents.send("prefs-fetched", JSON.stringify(default_play_settings));
    }else{
      if(data.volume){
        // play_settings = JSON.parse(data);
        play_settings = data;
        win.webContents.send("prefs-fetched", data);
      }else{
        play_settings = default_play_settings;
        savePlaySettings(default_play_settings);
        win.webContents.send("prefs-fetched", default_play_settings);
      }
    }
  });
}
function savePlaySettings(settings){
  storage.set('play_settings', settings, function(error) {
    if (error) throw error;
  });
}

function getIndex(win){
  // saveIndex({});
  storage.get('music_index', function(error, data) {
    if (error) {
      console.log("Error fetching index");
      console.log(error);
      music_index = default_music_index;
      saveIndex(default_music_index);
      win.webContents.send("index-fetched", music_index);
    }else{
      if(!data || !data.length || data == undefined){
        music_index = default_music_index;
        return win.webContents.send("index-fetched", {});
      }
      else
        var index = JSON.parse(data);

      if(index.folders){
        music_index = index;
        win.webContents.send("index-fetched", index);
      }else{
        music_index = default_music_index;
        saveIndex(default_music_index);
        win.webContents.send("index-fetched", music_index);
      }
    }
  });
}
function addToIndex(what, content){
  music_index[what].push(content);
  saveIndex(music_index);
}
function saveIndex(index){
  storage.set('music_index', JSON.stringify(index), function(error) {
    if (error) {
      console.log("Error saving index");
    }
  });
}
