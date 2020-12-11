import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef} from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { PlaybackService } from '../../providers/playback.service';

@Component({
  selector: 'song-collection',
  templateUrl: './song-collection.component.html',
  styleUrls: ['./song-collection.component.css']
})
export class SongCollectionComponent implements OnChanges{
  @Input() collection;
  bgColor: string;
  curPath: string;

  constructor(private _electron: ElectronService,
    private _playback: PlaybackService,
    private ref: ChangeDetectorRef){
    var self = this;

    if(this._playback.curSong)
      this.curPath = this._playback.curSong.path;

    this._playback.song.subscribe(res => {
      this.curPath = res.path;
      if(this.collection && this.collection.artwork && this.collection.artwork.url && this.collection.artwork.mime)
        this.setBg();
        
      ref.detectChanges();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if(this.collection && this.collection.artwork && this.collection.artwork.url && this.collection.artwork.mime)
      this.setBg();
  }

  setBg(){
    this._playback
    .getImageGradient(this.collection.artwork.url, 'image/' + this.collection.artwork.mime)
    .then((gradient: string) => {
      this.bgColor = gradient;
      this.ref.detectChanges();
    });
  }

  songClicked(song){
    if(song.path === this.curPath)
      this._playback.toggle();
    else{
      this._playback.setCurPlayList(this.collection.songs);
      this._playback.play(song);
    }
  }

  playAll(){
    if(this.collection && this.collection.songs && this.collection.songs.length)
      this._playback.playAList(this.collection.songs);
  }

  formattedTime(time){
    return this._playback.formattedTime(time);
  }
}
