import { Injectable } from '@angular/core';
import {Subject} from 'rxjs';
import { ElectronService } from 'ngx-electron';
import { FileService } from './file-service.service';

// import * as getColors from 'get-image-colors';
import * as tinygradient from 'tinygradient';

function getColors(a, b): Promise<Array<any>>{
  return new Promise((resolve, reject) => resolve([]))
}

var audio = new Audio();
var play_timer;

const SHORTCUT_PLAY = 0;
const SHORTCUT_NEXT = 1;
const SHORTCUT_PREV = 2;
const SHORTCUT_SHORT_FORWARD = 3;
const SHORTCUT_SHORT_BACKWARD = 4;
const SHORTCUT_LONG_FORWARD = 5;
const SHORTCUT_LONG_BACKWARD = 6;
const SHORTCUT_REPEAT = 7;
const SHORTCUT_SHUFFLE = 8;
const SHORTCUT_VOLUME_DOWN = 10;
const SHORTCUT_VOLUME_UP = 11;
const SHORTCUT_VOLUME_MUTE = 12;
const SHORTCUT_TOGGLE_PLAYLIST = 18;

@Injectable()
export class PlaybackService {
  curSong;
  curSongIndex = -1;
  allSongsPlaylist = [];
  recentsPlaylist = [];
  curPlaylist = [];
  playedSongs = [];
  fromUser = false;
  fromPrefs = false;
  curVolume = 0.5;
  curTime = 0;
  curDuration = 0;
  isPlaying = false;
  isMuted = false;
  isShuffled = false;
  repeatMode = 0;
  showingPlaylist = false;

  playlist = new Subject<any>();
  audioLoaded = new Subject<any>();
  song = new Subject<any>();
  playing = new Subject<any>();
  volume = new Subject<any>();
  timeIn = new Subject<any>();
  duration = new Subject<any>();
  muted = new Subject<any>();
  repeat = new Subject<any>();
  shuffle = new Subject<any>();
  showPlaylist = new Subject<any>();
  imageColors = new Subject<any>();

  constructor(private _electron: ElectronService,
    private _fileService: FileService) {
    var self = this;

    this.song.subscribe(song => {
      this.curSong = song;
      if(this.playedSongs.indexOf(song.path) === -1){
        this.playedSongs.push(song.path);
      }
      if(!this.fromPrefs)
        this._electron.ipcRenderer.send("set-pref", "last_song", song);
    });

    this.playing.subscribe(state => {
      this.isPlaying = state;
      if(state && !audio.ended)
        audio.play();
      else
        audio.pause();
    });

    this.volume.subscribe(volume => {
      if(volume > 0 && volume < 1){
        audio.volume = volume;
        self.curVolume = volume;

        if(!this.fromPrefs)
          this._electron.ipcRenderer.send("set-pref", "volume", volume);
      }else{
        if(volume >= 1)
          self.volume.next(1);
        else
          self.volume.next(0);
      }
    });

    this.muted.subscribe(muted => {
      audio.muted = muted;
      self.isMuted = muted;

      if(!this.fromPrefs)
        this._electron.ipcRenderer.send("set-pref", "muted", muted);
    });

    this.repeat.subscribe(repeat => {
      self.repeatMode = repeat;

      if(!this.fromPrefs)
        this._electron.ipcRenderer.send("set-pref", "repeat", repeat);
    });

    this.shuffle.subscribe(shuffle => {
      self.isShuffled = shuffle;

      if(!this.fromPrefs)
        this._electron.ipcRenderer.send("set-pref", "shuffle", shuffle);
    });

    this.duration.subscribe(duration => {
      this.curDuration = duration;
      if(this.curSong){
        this.curSong.duration = duration;

        if(!this.fromPrefs)
          this._electron.ipcRenderer.send("set-pref", "last_song", this.curSong);
      }
    });

    this.showPlaylist.subscribe(show => {
      self.showingPlaylist = show;
      // this._electron.ipcRenderer.send("set-pref", "show_playlist", show);
    });

    this._electron.ipcRenderer.on("prefs-fetched", function(e, db_prefs){
      console.log("Prefs on playback");
      try{
        // var prefs = JSON.parse(db_prefs);
        var prefs = db_prefs;

        if(prefs){
          self.fromPrefs = true;

          if(prefs.last_song){
            var last_song = prefs.last_song;
            self.loadAudio(last_song);
          }

          if(prefs.volume != undefined)
            self.volume.next(prefs.volume);

          if(prefs.muted != undefined && prefs.muted)
            self.mute();

          if(prefs.shuffle != undefined)
            self.setShuffle(prefs.shuffle);

          if(prefs.show_playlist != undefined)
            self.showPlaylist.next(prefs.show_playlist);

          if(prefs.time_in != undefined){
            audio.currentTime = prefs.time_in;
            self.timeIn.next(prefs.time_in);
          }

          setTimeout(function(){
            self.fromPrefs = false;
          }, 1500);
        }
      }catch(e){
        console.log("Couldn't parse prefs!");
        console.log(e);
      }
    });

    this._electron.ipcRenderer.on("global-shortcut", function(e, shortcut){
      switch(shortcut){
        case SHORTCUT_PLAY:
          if(self.curSong && self.curSong.path)
            self.toggle();
          break;
        case SHORTCUT_NEXT:
          self.playNextSong();
          break;
        case SHORTCUT_PREV:
          self.playPrevSong();
          break;
        case SHORTCUT_VOLUME_UP :
          if(self.curVolume < 0.9)
            self.volume.next(self.curVolume + 0.1);
          break;
        case SHORTCUT_VOLUME_DOWN :
          if(self.curVolume > 0.1)
            self.volume.next(self.curVolume - 0.1);
          break;
        case SHORTCUT_VOLUME_MUTE :
          self.muted.next(!self.isMuted);
          break;
        case SHORTCUT_REPEAT :
          self.setRepeat();
          break;
        case SHORTCUT_SHUFFLE :
          self.setShuffle();
          break;
        case SHORTCUT_SHORT_BACKWARD:
            self.seekAudio(false, 6);
          break;
        case SHORTCUT_SHORT_FORWARD:
            self.seekAudio(true, 6);
          break;
        case SHORTCUT_LONG_BACKWARD:
            self.seekAudio(false, 13);
          break;
        case SHORTCUT_LONG_FORWARD:
            self.seekAudio(true, 13);
          break;
        case SHORTCUT_TOGGLE_PLAYLIST:
          if(self.curSong && self.curSong.path)
            self.showPlaylist.next(!self.showingPlaylist);
          break;
      }
    });

    // this._electron.ipcRenderer.on("image-colors-fetched", function(e, colors){
    //   self.imageColors.next(colors);
    //   console.log(colors);
    // });

    this._fileService.songs.subscribe(res => {
      this.curPlaylist = res;
      this.playlist.next(res);
      var song = this.curSong;
      if(song){
        this.curSongIndex = this.curPlaylist.findIndex(s => {
          return s.path === song.path;
        });
        console.log("Current index changed to: " + this.curSongIndex);
      }
    });
  }

  playAList(songs){
    if(!songs || !songs.length)
      return;

    this.setCurPlayList(songs);
    this.loadAudio(songs[0]);

    this.audioLoaded.subscribe(res => {
      console.log("Yaaaay! audio was loaded!");
      if(res){
        this.startPlaying();
      }
    });
  }

  setCurPlayList(songs){
    this.curPlaylist = songs;
    this.playlist.next(songs);
    this.playedSongs = [];
  }

  seekAudio(dir, val){
    if(!this.curSong && !this.curSong.path)
      return;
    else if(dir && !this.curDuration)
      return;

    this.fromUser = true;

    if(dir){
      if(audio.currentTime <= (this.curDuration - val)){
        audio.currentTime += val;
      }else{
        audio.currentTime = this.curDuration;
      }
    }else{
      if(audio.currentTime >= val){
        audio.currentTime -= val;
      }else{
        audio.currentTime = 0;
      }
    }

    var self = this;
    setTimeout(function(){
      self.fromUser = false;
    });
  }

  play(song = null){
    if(song && song !== null){
      this.reset();
      this.loadAudio(song);

      this.audioLoaded.subscribe(res => {
        if(res)
          this.startPlaying();
      });
    }else{
      this.startPlaying();
    }
  }

  restartCurrentSong(){
    audio.currentTime = 0;
    this.play();
  }

  shuffleArray(array) {
    let counter = array.length;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        let index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
  }

  playNextSong(){
    this._electron.ipcRenderer.send("set-pref", "time_in", 0);

    if(this.isShuffled){
      if(this.curPlaylist.length === this.playedSongs.length){
        this.playedSongs = [];
      }

      const unplayedSongs = this.curPlaylist.filter(s => this.playedSongs.indexOf(s.path) === -1);
      const nextSong = this.shuffleArray(unplayedSongs)[0];
      const nextIdx = this.curPlaylist.findIndex(s => s.path = nextSong.path);

      console.log("Played Songs Shuffle: ", this.playedSongs, unplayedSongs);
      console.log("NextSong Shuffle: ", nextSong);
      console.log("NextIdx Shuffle: ", nextIdx);

      return this.playSong(nextIdx);
    }

    const is_last_song = this.curSongIndex === this.curPlaylist.length - 1;
    if(this.curSongIndex === -1 || (is_last_song && this.repeatMode == 1)){
      return this.playSong(0);
    }
    else if(!is_last_song){
      this.playSong(this.curSongIndex + 1);
    }
  }

  playPrevSong(){
    this._electron.ipcRenderer.send("set-pref", "time_in", 0);

    if(this.isShuffled){
      const prevPath = this.playedSongs[this.playedSongs.length - 1];
      const prevIdx = this.curPlaylist.findIndex(s => s.path = prevPath);

      console.log("PrevSong Shuffle: ", prevPath);
      console.log("PrevIdx Shuffle: ", prevIdx);

      // return this.playSong(prevIdx !== -1 ? prevIdx : 0);
      return this.playSong(prevIdx !== -1 ? prevIdx : 0);
    }

    if(this.curSongIndex === -1 || (this.curSongIndex === 0 && this.repeatMode == 1)){
      this.playSong(this.curPlaylist.length - 1);
    }else{
      this.playSong(this.curSongIndex - 1);
    }
  }

  playSong(idx){
    if(this.curPlaylist && this.curPlaylist.length){
      this.play(this.curPlaylist[idx]);
    }
  }

  loadAudio(song){
    var self = this;
    const song_is_favorite = self._fileService.songIsFavorite(song.path);

    audio.oncanplay = function(){
      if(song.timeIn && song.timeIn != 0){
        audio.currentTime = song.timeIn;
        self.timeIn.next(song.timeIn);
      }

      self.duration.next(audio.duration);
      self.song.next(song);
      self.audioLoaded.next(true);
    };

    audio.src = song.path;

    this.curSongIndex = this.curPlaylist.findIndex(s => {
      return s.path === song.path;
    });
  }

  startPlaying(){
    // this.audioLoaded.unsubscribe();
    this.playing.next(true);
    this.startInterval();

    this.startEarphonesWatcher();
  }

  startEarphonesWatcher(){
    console.log("Watcher attached!!!");
    navigator.mediaDevices.ondevicechange = function(event) {
      console.log("Devices changed!!!");
      navigator.mediaDevices.enumerateDevices()
      .then(function(devices) {
        let earphones = devices.filter(d => d.kind === "audiooutput");
        // earphones[0].
        console.log("\n\n\n EARPHONES COUNT: " + earphones.length + "\n\n\n");
      })
      .catch(function(err) {
        console.log(err.name + ": " + err.message);
      });
    }
  }

  startInterval(){
    var self = this;
    audio.ontimeupdate = function(){
      if(!self.fromUser)
        self.timeIn.next(audio.currentTime);
    }

    audio.onended = function(){
      self.reset();
      if(self.repeatMode == 2)
        self.restartCurrentSong();
      else
        self.playNextSong();
    }
  }

  pause(){
    audio.pause();
    this.playing.next(false);
    this._electron.ipcRenderer.send("set-pref", "time_in", audio.currentTime);
  }

  mute(){
    this.muted.next(!this.isMuted);
  }

  setPlaying(state: boolean){
    if(state)
      this.play();
    else
      this.pause();
  }

  toggle(){
    this.setPlaying(!this.isPlaying);
  }

  setRepeat(){
    this.repeat.next(this.repeatMode === 2 ? 0 : this.repeatMode + 1);
  }

  setShuffle(state?){
    this.shuffle.next(state === undefined ? !this.isShuffled : state);
  }

  expandPlayer(){
    this.showPlaylist.next(true);
  }

  minimizePlayer(){
    this.showPlaylist.next(false);
  }

  reset(){
    audio.currentTime = 0;
    audio.pause();
    this.playing.next(false);
    this.timeIn.next(0);
    this.duration.next(0);
  }

  getImageColors(buffer, mime){
    var self = this;
    var promise = new Promise((resolve, reject) => {
      try{
        getColors(buffer, mime)
          .then(colors => {
              // var gradient = tinygradient(colors.map(color => color.hex()));
              // var gradientStr = gradient.css();

              // var colors_map = {
              //   progress: colors[0].alpha(0.3).css(),
              //   bar: colors[0].css(),
              //   gradient: gradientStr
              // }
              if(colors && colors.length)
                resolve(colors[0].css());
              else
                reject("No valid colors found");
          })
          .catch(err => {
            reject(err);
          });
      }catch(e){
        console.log("Error getting colors");
        reject();
      }
    });
    return promise;
  }

  getImageGradient(buffer, mime){
    var self = this;
    var promise = new Promise((resolve, reject) => {
      getColors(buffer, mime)
      .then(colors => {
          var gradient = tinygradient(colors.map(color => color.hex()));
          resolve(gradient.css());
      });
    });
    return promise;
  }

  formattedTime(time = 0){
    var hr  = parseInt((time/3600).toFixed(0));
    var min = parseInt((time/60).toFixed(0));
    var sec = parseInt((time%60).toFixed(0));

    return ((hr > 0) ? ((hr > 9) ? hr : '0'+hr)+':' : '' )+((min > 9) ? min : '0'+min)+':'+ ((sec > 9) ? sec : '0'+sec);
  }
}
