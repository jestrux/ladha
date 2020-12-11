import { Component, ChangeDetectorRef, Input, OnDestroy } from '@angular/core';
import { PlaybackService } from '../../providers/playback.service';
import { AppService } from '../../providers/app.service';
import { FileService } from '../../providers/file-service.service';

@Component({
  selector: 'player-bar',
  templateUrl: './player-bar.component.html',
  styleUrls: ['./player-bar.component.css']
})
export class PlayerBarComponent implements OnDestroy{
  timeIn = 0;
  duration = 0;
  progress = 0;
  volume = 0;
  repeat = 0;
  faved = false;
  muted = false;
  shuffled = false;
  playing = false;
  song:any = {};
  bgColor = "#555";
  @Input() expanded = false;
  playlist = {
    artwork: "",
    title: "",
    artist: "",
    album: "",
    year: "",
    type: "nowplaying",
    songs: []
  };
  songs;

  constructor(private _playback: PlaybackService,
    private _app: AppService,
    private _file: FileService,
    private ref: ChangeDetectorRef){
    var self = this;

    this._file.playlists.subscribe(res => {
      if(this.song && this.song.path){
        this.setFaveState(this.song);
      }
    });

    this._playback.song.subscribe(res => {
      this.song = res;
      this.playlist.artwork = res.artwork;
      this.playlist.title = res.title;
      this.playlist.artist = res.artist;
      this.playlist.album = res.album;
      this.playlist.year = res.year;
      this.playlist.type = "nowplaying";

      this.setFaveState(res);

      this._playback.getImageColors(res.artwork.url, 'image/' + res.artwork.mime)
        .then((color: string) => {
          this.bgColor = color;
          console.log("Player bar color: " + this.bgColor);
          ref.detectChanges();
        })
        .catch(error => console.log('Error fetching bar color.', error));
    });

    this._playback.playlist.subscribe(res => {
      this.playlist.songs = res;
      this.playlist.type = "nowplaying";
      ref.detectChanges();
    });

    this._playback.playing.subscribe(res => {
      this.playing = res;
      ref.detectChanges();
    });

    this._playback.timeIn.subscribe(res => {
      this.timeIn = res;
      this.progress = res / this.duration * 100;
      ref.detectChanges();
    });

    this._playback.duration.subscribe(res => {
      this.duration = res;
      this.progress = this.timeIn / this.duration * 100;
      ref.detectChanges();
    });

    this._playback.muted.subscribe(res => {
      this.muted = res;
      ref.detectChanges();
    });

    this._playback.repeat.subscribe(res => {
      this.repeat = res;
      ref.detectChanges();
    });

    this._playback.shuffle.subscribe(res => {
      this.shuffled = res;
      ref.detectChanges();
    });

    this._playback.volume.subscribe(res => {
      this.volume = res*10;
      ref.detectChanges();
    });
  }

  setFaveState(song){
    this.faved = this._file.songIsFavorite(song);
    this.ref.detectChanges();
    console.log("Fetched favorite state: ", this.faved);
  }

  playClicked(){
    this._playback.play();
  }

  pauseClicked(){
    this._playback.pause();
  }

  prevClicked(){
    this._playback.playPrevSong();
  }

  nextClicked(){
    this._playback.playNextSong();
  }

  repeatClicked(){
    this._playback.setRepeat();
  }

  shuffleClicked(){
    this._playback.setShuffle();
  }

  favClicked(){
    this._file.favoriteSong(this.song);
    // this.faved = !this.faved;
    // this.ref.detectChanges();
  }

  playlistClicked(){
    this._playback.expandPlayer();
    this._app.addBack(AppService.GO_BACK_PLAYER);
  }

  muteClicked(){
    this._playback.mute();
  }

  formattedTime(time = 0){
    return this._playback.formattedTime(time);
  }

  ngOnDestroy(): void{
    // this._playback.song.unsubscribe();
    // this._playback.playlist.unsubscribe();
    // this._playback.playing.unsubscribe();
    // this._playback.timeIn.unsubscribe();
    // this._playback.duration.unsubscribe();
    // this._playback.muted.unsubscribe();
    // this._playback.volume.unsubscribe();
  }
}
