import { Injectable } from '@angular/core';

import {Subject} from 'rxjs';
import { ElectronService } from 'ngx-electron';
import { Router } from '@angular/router';
import { FileService } from './file-service.service';

@Injectable()
export class AppService {
  static readonly GO_BACK_PLAYER = 1;
  static readonly GO_BACK_ALBUMS = 2;
  static readonly GO_BACK_ARTISTS = 3;

  appIsMaximized = new Subject<any>();
  hasBack = new Subject<any>();
  goBack = new Subject<any>();
  page = new Subject<any>();
  backstack = [];
  playlist = new Subject<any>();
  curPlaylist:any = {};

  constructor(private _electron: ElectronService,
    private _files: FileService,
    private route: Router) {
    var self = this;
    this._electron.ipcRenderer.on("maximize-changed", function(e, newMaxState){
      self.appIsMaximized.next(newMaxState);
    });

    this._electron.ipcRenderer.send("ui-loaded");

    this._electron.ipcRenderer.on("prefs-fetched", function(e, db_prefs){
      try{
        if(db_prefs){
          if(db_prefs.cur_page){
            self.goTo(db_prefs.cur_page, true);
          }
        }
      }catch(e){
        console.log("Couldn't parse prefs!");
        console.log(e);
      }
    });

    this.goBack.subscribe(res => {
      if(!this.backstack.length) this.hasBack.next(true);
    });
  }

  appAction(action){
    console.log(action);
    if(action === -1){
      this.goBack.next(this.backstack[this.backstack.length - 1]);
      this.backstack.pop();
      return;
    }

    this._electron.ipcRenderer.send("app-action", action);
  }

  addBack(sub_page){
    if(!this.backstack.length)
      this.hasBack.next(true);

    this.backstack.push(sub_page);
  }

  viewPlaylist(playlist){
    console.log("Clicked playlist: ", playlist);
    this.goTo('playlist');
    this.curPlaylist = playlist;
    this.playlist.next(playlist);

    this._files.playlists.subscribe(res => {
      const updated_playlist = res.find(playlist => playlist.title == this.curPlaylist.title);
      this.curPlaylist = updated_playlist;
      this.playlist.next(updated_playlist);
    });
  }

  getCurrentPlaylist(){
    if(!this.curPlaylist){
      const all_playlists = this._files.getPlayLists();
      console.log("All playlists from files: ", all_playlists);
      return all_playlists.length ? all_playlists[0] : {};
    }
    return this.curPlaylist;
  }

  goTo(where, fromPrefs=false){
    this.route.navigate([where]);
    this.page.next(where);

    if(!fromPrefs){
      //temp fix to when error when loading playlist for the first time
      const curpage = where === 'playlist' ? 'songs' : where;
      this._electron.ipcRenderer.send("set-pref", "cur_page", curpage);
    }
  }
}
