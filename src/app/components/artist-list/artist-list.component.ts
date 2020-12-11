import { Component, Input, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FileService } from '../../providers/file-service.service';
import { AppService } from '../../providers/app.service';

@Component({
  selector: 'artist-list',
  templateUrl: './artist-list.component.html',
  styleUrls: ['./artist-list.component.css']
})
export class ArtistListComponent implements OnDestroy{
  // @Input() artists = [];
  artists: Array<any>;
  artist: any = {};

  constructor(private _files: FileService,
    private _app: AppService,
    private ref: ChangeDetectorRef){
      this.artists = this._files.getArtistList();
      this._files.artists.subscribe(res => {
        this.artists = res;
      });
  }

  artistClicked(artist){
    var self = this;
    this._files.getArtistSongs(artist.name).then(songs => {
      artist.title = artist.name;
      artist.artwork = artist.image;
      artist.type = "artist";
      artist.songs = songs;
      self.artist = artist;

      self._app.addBack(AppService.GO_BACK_ARTISTS);

      self._app.goBack.subscribe(res => {
        if(res === AppService.GO_BACK_ARTISTS){
          self.artist = {};
          // self.ref.detectChanges();
        }
      });
    })
  }

  ngOnDestroy(): void {
    // this._app.goBack.unsubscribe();
    // this._files.artists.unsubscribe();
  }
}
