import { Component, OnInit, ChangeDetectorRef, Input, OnDestroy } from '@angular/core';
import { PlaybackService } from '../../providers/playback.service';
import { FileService } from '../../providers/file-service.service';

@Component({
  selector: 'song-list',
  templateUrl: './song-list.component.html',
  styleUrls: ['./song-list.component.css']
})
export class SongListComponent implements OnDestroy {
  curSong = "";
  songs: Array<any>;
  // @Input() songs = [];

  constructor(private _playback: PlaybackService,
    private _files: FileService,
    private ref: ChangeDetectorRef){
      this.songs = this._files.getSongList();

      this._files.songs.subscribe(res => {
        this.songs = res;
      });

      this._playback.song.subscribe(res => {
        if(res != null)
          this.curSong = res.path;
      });
  }

  songClicked(song){
    if(song.path === this.curSong)
      this._playback.toggle();
    else
      this._playback.play(song);
  }

  formattedTime(time = 0){
    return this._playback.formattedTime(time);
  }

  ngOnDestroy(): void {
    // this._files.songs.unsubscribe();
    // this._playback.song.unsubscribe();
  }
}
