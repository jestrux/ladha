const base64Img = require('image-to-base64');
const rp = require('request-promise');
const cheerio = require('cheerio');

self.onmessage = function(e){
  var artist = e.data;
    
    getArtistImage(artist)
      .then(image => {
        console.log("Image was fetched!!!", image);
        postMessage(image);
      })
      .catch(error => {
        console.log("Error: " + error);
        postMessage({error});
      });
}

function getArtistImage(name){
    console.log("Get image for: ", name);

    return new Promise((resolve, reject) => {
      console.log("\n\nFetching image for " + name + "....\n\n");
      if(!name || name == "Unknown Artist")
        return reject("Name required!");

      var search_path = "https://music.apple.com/us/search?term=" + encodeURIComponent(name);
      rp(search_path).then(html => {
        const artistsImages = cheerio('.dt-shelf--search-artist img', html)
            .filter((i, e) => e.attribs.alt === name);
    
        const image = artistsImages[0].attribs['data-srcset'].split(",")[0];
        let [url, size] = image.split(" ");
        size = size.replace("w", "");
        
        const resizedUrl = url.replace(new RegExp(size, 'g'), 257);
        console.log("Converting to base64.....\n\n");
  
        base64Img(resizedUrl)
          .then(response => {
            const mime = "jpg";
            var artwork_url = 'data:image/'+mime+';base64,';
            artwork_url += response;
            
            resolve({url: artwork_url, mime: mime});
          })
          .catch(error => {
            reject("Converting Error: " + error);
          });
      })
      .catch(error => {
        console.log("API Error:", error);
        reject(error);
      });
    });
}