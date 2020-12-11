# Ladha
Simple music player using electron and angular

## Getting Started

Clone this repository locally :

``` bash
git clone https://github.com/jestrux/ladha.git
```

Install dependencies with npm :

``` bash
npm install
```

## Included Commands

|Command|Description|
|--|--|
|`npm run start`| Run app locally |
|`npm run electron:mac`|  On a MAC OS, builds your application and generates a `.app` file of your application that can be run on Mac |


## Screenshots
![Albums Screen](/screenshots/albums-screen.png?raw=true "Albums Screen")

![Album Details Screen](/screenshots/album-details-screen.png?raw=true "Album Details Screen")

![Artists Screen](/screenshots/artists-screen.png?raw=true "Artists Screen")

![Songs Screen](/screenshots/songs-screen.png?raw=true "Songs Screen")

## Todos
- [ ] Add appwide search
- [ ] Move selected folders to settings page
- [ ] Make selected folders work properly by also removing albums, artists and songs
- [ ] Optimize file reading using web worker
- [ ] Notify UI on errors like invalid file formats or files currently being processed.
- [ ] Add albums to artists page
- [ ] Link to artist page when their name is clicked
- [ ] Link to album page when it's name is clicked
- [ ] Add playlists functionality
- [ ] Clear all media when app reloads
- [ ] Clicking on left navigation should close detail pages or nowplaying
- [ ] Fix error when viewing playlists on app load
- [ ] Add automatically genereted playlist of recents with up to 20 songs
- [ ] Add spotify integration for suggestions and trending music
- [ ] Add mini player functionality
- [ ] Reduce size of main.ts by creating sub module for distinct features such as preferences management
- [ ] Make outer shell, app icons and fonts dynamic based on platform
- [ ] Allow phone connected to same wifi to work as remote
