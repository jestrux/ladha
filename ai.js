const rp = require('request-promise');
const fs = require('fs');
const cheerio = require('cheerio');

async function load(){
    var artist = "Alicia Keys";
    var search_path = "https://music.apple.com/us/search?term=" + encodeURIComponent(artist);

    const html = await rp(search_path);

    const artistsImages = cheerio('.dt-shelf--search-artist img', html)
        .filter((i, e) => e.attribs.alt === artist);

    const image = artistsImages[0].attribs['data-srcset'].split(",")[0];
    let [url, size] = image.split(" ");
    size = size.replace("w", "");
    console.log(image);
    console.log(size);
    console.log(url.replace(new RegExp(size, 'g'), 257));
}

load();

// const base64Img = require('image-to-base64');
// const GoogleImages = require('google-images');
// const scrapeIt = require("scrape-it");

// var artist = "Alicia Keys";
// var search_path = "https://music.apple.com/us/search?term=" + encodeURIComponent(artist);
// console.log(search_path);
// scrapeIt(search_path, {
//     image: "img",
//     lyrics: "#ember14"
//     // lyrics: {
//     //     selector: ".dt-shelf--search-artist img", 
//     //     attr: "srcset"
//     // }
// })
// .then(({lyrics, image}) => {
//       // var lyrics = page.lyrics.replace(/\n/g, "<br />");
//     // postMessage(lyrics);
//     console.log(lyrics, image);
//   })
//   .catch(error => {
//       console.log("Scrape failed: ", error);
//     //   postMessage({error});
//   });