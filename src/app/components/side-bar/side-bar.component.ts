import { Component, OnInit, ChangeDetectorRef, Input, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ElectronService } from 'ngx-electron';
import {Subject} from 'rxjs';
import {Observable} from 'rxjs';
import 'rxjs/add/operator/switchMap';
import { AppService } from '../../providers/app.service';
import { FileService } from '../../providers/file-service.service';

@Component({
  selector: 'side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.css']
})
export class SideBarComponent implements OnInit {
  folders = [];
  curSong;
  showFolders = false;
  playlists  = [];
  @Input() curPage;

  constructor(
    private _files: FileService,
    private _app: AppService,
    private ref:ChangeDetectorRef,
    private activeRoute: ActivatedRoute) {
  }

  ngOnInit() {
    this.folders = this._files.getFolders();
    this.playlists = this._files.getPlayLists();

    this._files.folders.subscribe(res => {
      this.folders = res;
    });

    this._files.playlists.subscribe(res => {
      this.playlists = res;
    });

    this._app.page.subscribe(res => {
      this.curPage = res;
    });

    this.activeRoute.params.subscribe(p => {
      console.log("Route changed!");
      console.log(p);
    });
  }

  addFolder(){
    this._files.pickFolder();
  }

  removeFolder(folder){
    this._files.removeFolder(folder);
  }

  toggleShowFolders(){
    this.showFolders = !this.showFolders;
    this.ref.detectChanges();
  }

  goTo(where){
    this._app.goTo(where);
  }

  viewPlaylist(playlist){
    this._app.viewPlaylist(playlist);
  }
}
