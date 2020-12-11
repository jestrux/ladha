import { Component, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { AppService } from './providers/app.service';
import { FileService } from './providers/file-service.service';
import { PlaybackService } from './providers/playback.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy {
  maximized: boolean = false;
  loading: boolean = false;
  loaded: boolean = false;
  playing: boolean = false;
  title = "My Music";
  currentPage = "songs";
  song = null;
  songs = [];
  albums = [];
  artists = [];
  hasBack = false;
  expandedPlayer = false;

  constructor(private ref: ChangeDetectorRef,
    private _app: AppService,
    private _files: FileService,
    private _playback: PlaybackService){
      this._app.appIsMaximized.subscribe(res => {
        this.maximized = res;
        // this.ref.detectChanges();
      });

      this._playback.song.subscribe(res => {
        this.song = res;
        // this.ref.detectChanges();
      });

      this._playback.showPlaylist.subscribe(res => {
        this.expandedPlayer = res;
        // this.ref.detectChanges();
      });

      this._files.songs.subscribe(res => {
        this.songs = res;
        // this.ref.detectChanges();
      });

      this._files.albums.subscribe(res => {
        this.albums = res;
        // this.ref.detectChanges();
      });

      this._files.artists.subscribe(res => {
        this.artists = res;
        // this.ref.detectChanges();
      });

      this._app.page.subscribe(res => {
        this.currentPage = res;
        // this.ref.detectChanges();
      });

      this._app.hasBack.subscribe(res => {
        this.hasBack = res;
        // this.ref.detectChanges();
      });

      this._files.indexFetched.subscribe(res => {
        this.loaded = res;
        // this.ref.detectChanges();
      });

      this._app.goBack.subscribe(res => {
        if(res == AppService.GO_BACK_PLAYER && this.expandedPlayer){
          this._playback.minimizePlayer();
          // this.ref.detectChanges();
        }
      })
  }

  onAppAction(e){
    console.log("Action from title_bar: ", e);
    this._app.appAction(e);
  }

  addFolder(){
    this._files.pickFolder();
  }

  togglePlaying(){
    this._playback.setPlaying(!this.playing);
  }

  playSong(song){
    this._playback.play(song);
  }

  stopSong(){
    this._playback.reset();
  }

  ngOnDestroy() {
    this.stopSong();
  }
}
