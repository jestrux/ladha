import { Component, OnDestroy } from '@angular/core';
import { FileService } from '../../providers/file-service.service';
import { AppService } from '../../providers/app.service';

@Component({
  selector: 'playlist-songs',
  templateUrl: './playlist-songs.component.html',
  styleUrls: ['./playlist-songs.component.css']
})
export class PlaylistSongsComponent implements OnDestroy {
  curSong = "";
  songs: Array<any>;
  playlist:any = {};

  constructor(private _app: AppService,
    private _files: FileService){
      this.playlist = this._app.getCurrentPlaylist();
      this.setPlaylist();

      this._app.playlist.subscribe(res => {
        this.playlist = res;
        this.setPlaylist();
      });
  }

  setPlaylist(){
    console.log("Set playlist called!!");
    if(!this.playlist || !this.playlist.title){
      return;
    }

    const self = this;
    this._files.getPlaylistSongs(this.playlist.songs).then(songs => {
      self.playlist = { ...self.playlist,
        type: 'playlist',
        songs: songs
      };
    })
  }

  ngOnDestroy(): void {
    // this._files.songs.unsubscribe();
    // this._playback.song.unsubscribe();
  }
}
