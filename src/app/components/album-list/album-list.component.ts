import { Component, Input, Output, EventEmitter, ChangeDetectorRef, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { FileService } from '../../providers/file-service.service';
import { AppService } from '../../providers/app.service';

@Component({
  selector: 'album-list',
  templateUrl: './album-list.component.html',
  styleUrls: ['./album-list.component.css']
})

export class AlbumListComponent implements OnDestroy {
  albums: Array<any>;
  @Output() view = new EventEmitter();
  album:any = {};

  constructor(private _files: FileService, private _app: AppService,
      private ref: ChangeDetectorRef){

      this.albums = this._files.getAlbumList();
      this._files.albums.subscribe(res => {
        this.albums = res;
      });
  }

  albumClicked(album){
      var self = this;
      this._files.getAlbumSongs(album.title).then(songs => {
        album.songs = songs;
        album.type = "album";
        self.album = album;

        self._app.addBack(AppService.GO_BACK_ALBUMS);

        self._app.goBack.subscribe(res => {
          if(res === AppService.GO_BACK_ALBUMS){
            self.album = {};
            // self.ref.detectChanges();
          }
        });
      })
  }

  ngOnDestroy(){
    // this._app.goBack.unsubscribe();
    // this._files.albums.unsubscribe();
  }
}
