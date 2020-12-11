import { Injectable } from '@angular/core';

import {Subject} from 'rxjs';
import { ElectronService } from 'ngx-electron';

@Injectable()
export class FileService {
  cur_type;
  indexFetched = new Subject<boolean>();
  loading = new Subject<boolean>();
  songs = new Subject<any>();
  albums = new Subject<any>();
  artists = new Subject<any>();
  folders = new Subject<any>();
  playlists = new Subject<any>();
  song = new Subject<any>();
  playlist_array = [];
  fols = [];
  song_array = [];
  album_array = [];
  artist_array = [];

  constructor(private _electron: ElectronService) {
    var self = this;

    console.log("Electron servce:", _electron);

    this._electron.ipcRenderer.on("folders-added", function(e, success, folders){
      if(success){
        folders.forEach(folder => {
          self.fols.push(folder);
        });
        self.folders.next([]);
        self.folders.next(self.fols);
      }
      else
        console.log("Folders not found!");
    });

    this._electron.ipcRenderer.on("folder-removed", function(e, success, folder){
      if(success){
        self.fols.splice(self.fols.indexOf(folder), 1);
        self.folders.next([]);
        self.folders.next(self.fols);
      }
      else
        console.log("Folders not found!");
    });

    this._electron.ipcRenderer.on("song-fetched", function(e, song){
      self.song_array.push(song);
      self.songs.next(self.song_array);
    });

    this._electron.ipcRenderer.on("album-fetched", function(e, album){
      self.album_array.push(album);
      self.albums.next(self.album_array);
    });

    this._electron.ipcRenderer.on("artist-fetched", function(e, artist){
      self.artist_array.push(artist);
      self.artists.next(self.artist_array);
    });

    this._electron.ipcRenderer.on("remove-song", function(e, idx){
      self.song_array.splice(idx, 1);
      self.songs.next(self.song_array);
    });

    this._electron.ipcRenderer.on("songs-changed", function(e, songs){
      self.song_array = songs;
      self.songs.next([]);
      self.songs.next(self.song_array);
    });

    this._electron.ipcRenderer.on("playlists-changed", function(e, playlists){
      console.log("Playlists");
      let formatted_playlists = [];
      for (let [key, value] of Object.entries(playlists)) {
        formatted_playlists.push({
          title: key,
          songs: value
        });
      }

      self.playlist_array = formatted_playlists;
      self.playlists.next(self.playlist_array);
    });

    this._electron.ipcRenderer.on("index-fetched", function(e, index){
      let { albums, artists, folders, playlists, songs } = index;

      self.indexFetched.next(true);

      self.folders.next(folders);
      self.fols = folders;

      let formatted_playlists = [];
      for (let [key, value] of Object.entries(playlists)) {
        formatted_playlists.push({
          title: key,
          songs: value
        });
      }
      self.playlists.next(formatted_playlists);
      self.playlist_array = formatted_playlists;

      if(songs && songs.length){

        songs.sort((a, b) => {
          var titleA = a.title.toUpperCase();
          var titleB = b.title.toUpperCase();

          if (titleA < titleB)
            return -1;
          if (titleA > titleB)
            return 1;

          return 0;
        })
        .forEach(song => {
          self.song_array.push(song);
          self.songs.next(self.song_array);
        });
      }

      if(albums && albums.length){
        console.log(albums);
        albums.sort((a, b) => {
          // var titleA = a.title.toUpperCase();
          // var titleB = b.title.toUpperCase();

          // if (titleA < titleB)
          //   return -1;

          // if (titleA > titleB)
          //   return 1;

          return 0;
        })
        .forEach(song => {
          self.album_array.push(song);
          self.albums.next(self.album_array);
        });
      }

      if(artists && artists.length){
        artists.sort((a, b) => {
          // var nameA = a.name.toUpperCase();
          // var nameB = b.name.toUpperCase();

          // if (nameA < nameB)
          //   return -1;
          // if (nameA > nameB)
          //   return 1;

          return 0;
        })
        .forEach(song => {
          self.artist_array.push(song);
          self.artists.next(self.artist_array);
        });
      }
    });
  }

  pickFolder(){
    this._electron.ipcRenderer.send("pick-folder");
  }

  favoriteSong(song){
    this._electron.ipcRenderer.send("fave-song", song);
  }

  songIsFavorite(song){
    if(this.playlist_array && this.playlist_array.length && song && song.path){
      return this.playlist_array[0].songs.indexOf(song.path) != -1;
    }

    else return false;
  }

  getAlbumSongs(album){
    var promise = new Promise((resolve, reject) => {
      var songs = this.song_array
      .filter(s => s.album === album)
      .map(s => {
        s.duration_str = this.formattedTime(s.duration);
        return s;
      });
      resolve(songs);
    });

    return promise;
  }

  getArtistSongs(artist){
    var promise = new Promise((resolve, reject) => {
      var songs = this.song_array
      .filter(s => s.artist === artist)
      .map(s => {
        s.duration_str = this.formattedTime(s.duration);
        return s;
      });
      resolve(songs);
    });

    return promise;
  }

  getPlaylistSongs(playlist){
    var promise = new Promise((resolve, reject) => {
      var songs = this.song_array
      .filter(song => playlist.indexOf(song.path) != -1);
      resolve(songs);
    });

    return promise;
  }

  getArtistAlbums(artist){
    var promise = new Promise((resolve, reject) => {
      var albums = this.album_array
      .filter(album => album.artist === artist);
      resolve(albums);
    });

    return promise;
  }

  getSongList(){
    return this.song_array;
  }

  getPlayLists(){
    return this.playlist_array;
  }

  getFolders(){
    return this.fols;
  }

  getAlbumList(){
    return this.album_array;
  }

  getArtistList(){
    return this.artist_array;
  }

  formattedTime(time = 0){
    if(!time || time == 0)
      return '--:--';

    var hr  = parseInt((time/3600).toFixed(0));
    var min = parseInt((time/60).toFixed(0));
    var sec = parseInt((time%60).toFixed(0));

    return ((hr > 0) ? ((hr > 9) ? hr : '0'+hr)+':' : '' )+((min > 9) ? min : '0'+min)+':'+ ((sec > 9) ? sec : '0'+sec);
  }

  removeFolder(folder){
    this._electron.ipcRenderer.send("remove-folder", folder);
  }
}
