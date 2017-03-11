#!/usr/bin/env nodejs
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const axios = require('axios');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// Konstanta le parabolena
const URL_BOT = 'https://api.telegram.org/bot';
const TOKEN = '331607685:AAFZH5L8RIc3ArNtoDYWyG-Ym1YgN6BxT_Y';
const URL_GAMBAR = 'https://post-storage.lokalin.id/'
const API_URL = 'https://lokalin.id:8101';
const ITEM_URL = 'https://lokalin.id/id/item/'
//API KE lokalin
const operation = '/get_posts_discover';
const operationSearch = '/search_posts';
const data = {
  "accountId" :"0000000000",
  "sessionId" : "S0Sd2IKiBIm9PLi9k5xZejL1DVDA1ZD4",
  "page": 0,
  "rid" : ""
}
// Kumpulan message tausiyah
const startMessage = 'saya Lokalin Bot. ada yg bisa saya bantu? cobain tombol command [/] atau balas pesan ini dengan kata "cari" spasi apa yg ingin kamu cari di Lokalin.';
const helpMessage = 'Ingin mencari sesuatu? coba kirim pesan ke saya dengan format "cari <item>"\n\natau coba eksplorasi tombol command terlebih dahulu [/]. Bot ini memiliki beberapa command, seperti /start, /help, /download, /produk atau /random';
const tdktauMessage = 'wah saya tidak mengerti \n((( beep....🎵 )))';
const downloadMessage = 'untuk Android bisa download di : \n https://play.google.com/store/apps/details?id=com.lokalin&hl=en 😉 \n\nUntuk Apple iOS download di : \n https://itunes.apple.com/id/app/lokalin/id1173778597?mt=8';
const nosearchMessage = 'wah yang kamu cari tidak ada. Mungkin ngetikmu kurang tepat 😉 '

//Route untuk API CALL
app.post('/lokalin-message', function(req, res) {
  const {message} = req.body
  console.log('pesan masuk dari ' + message.from.username + ' pesannya ' + message.text);

  if (!message) {
    return res.end()
  }

  if(message.chat.id === undefined || message.text === undefined) {
    return res.end()
  }

  if(message.text.substring(0,4).toLowerCase() == 'cari'){
    // masuk ke search
    var _params = {
      "accountId" :"0000000000",
      "sessionId" : "S0Sd2IKiBIm9PLi9k5xZejL1DVDA1ZD4",
      "query" : message.text.substring(5),
      "page": 0,
      "rid" : ""
    };
    sendApiRequest2(operationSearch, _params, function(responses){
      if(responses.rc === 1) {
        console.log('API request ke lokalin sukses');
        var judul = responses.data[0].product.title;
        var judulUrl = judul.replace(/\s+/g, '-').toLowerCase();
        var harga = responses.data[0].product.price;
        var mediaId = responses.data[0].mediaId[0];
        var informasi = responses.data[0].message;
        if(harga === 0) { harga = ' yg bisa kamu dapat kalo telepon dulu' }
        var urlProduk = ITEM_URL + responses.data[0].postId + '-' + encodeURIComponent(judulUrl);
        var urlGambar = URL_GAMBAR + mediaId + '.jpg';

        var ComposePesan = 'Mungkin ini cocok, ' + judul + ' harganya ' + harga + '. Kunjungi ' + urlProduk;

        kirimGambar(urlGambar, ComposePesan, message, res);
      } else {
        //Jika search gak ketemu
        kirimPesan(nosearchMessage, message, res);
      }
    })

  } else {
    switch(message.text){
      case "/start":
        kirimPesan(startMessage, message, res);
        break;

      case "/produk":
        sendApiRequest2(operation, data, function(responses){
          if(responses.rc === 1){
            console.log('API request ke lokalin sukses');
            var judul = responses.data[0].product.title;
            var judulUrl = judul.replace(/\s+/g, '-').toLowerCase();
            var harga = responses.data[0].product.price;
            var mediaId = responses.data[0].mediaId[0];
            var informasi = responses.data[0].message;
            if(harga === 0) { harga = ' yg bisa kamu dapat kalo telepon dulu' }
            var urlProduk = ITEM_URL + responses.data[0].postId + '-' + encodeURIComponent(judulUrl);
            var urlGambar = URL_GAMBAR + mediaId + '.jpg';

            var ComposePesan = ' Produk terbaru hari ini adalah ' + judul + ' harganya ' + harga + '. Kunjungi ' + urlProduk;

            kirimGambar(urlGambar, ComposePesan, message, res);

          } else {
            console.log('minta data error gan');
          }
        })
        break

      case "/help":
        kirimPesan(helpMessage, message, res);
        break

      case "/download":
        kirimPesan(downloadMessage, message, res);
        break

      case "/random":
        var randomPage = Math.floor(Math.random() * (5 - 0) + 0);
        var randomIndex = Math.floor(Math.random() * (14 - 0) + 0);
        var params = {
          "accountId" :"0000000000",
          "sessionId" : "S0Sd2IKiBIm9PLi9k5xZejL1DVDA1ZD4",
          "page": randomPage,
          "rid" : ""
        }
        sendApiRequest2(operation, params, function(responses){
          if(responses.rc === 1) {
            console.log('API request ke lokalin sukses');
            var judul = responses.data[randomIndex].product.title;
            var judulUrl = judul.replace(/\s+/g, '-').toLowerCase();
            var harga = responses.data[randomIndex].product.price;
            var mediaId = responses.data[randomIndex].mediaId[0];
            var informasi = responses.data[randomIndex].message;
            if(harga === 0) { harga = ' yg bisa kamu dapat kalo telepon dulu' }
            var urlProduk = ITEM_URL + responses.data[randomIndex].postId + '-' + encodeURIComponent(judulUrl);
            var urlGambar = URL_GAMBAR + mediaId + '.jpg';

            var ComposePesan = 'Ahay! ' + judul + ' harganya ' + harga + '. Kunjungi ' + urlProduk;

            kirimGambar(urlGambar, ComposePesan, message, res);
          } else {
            //Jika search gak ketemu
            kirimPesan(nosearchMessage, message, res);
          }
        })
        break

      default: kirimPesan(tdktauMessage, message, res);
    }
  }
});
// message dan res selalu esensial
var kirimPesan = function(isiPesan, message, res){

  axios.post( URL_BOT + TOKEN  +'/sendMessage', {
    chat_id: message.chat.id,
    text: 'Halo ' + message.from.first_name + ', '+ isiPesan
  })
    .then(response => {
      // We get here if the message was successfully posted
      console.log('Bot Kirim Pesan')
      res.end('ok')
    })
    .catch(err => {
      console.log('Error :', err)
      res.end('Error :' + err)
    })
}
// message dan res selalu esensial
var kirimGambar = function(isiPhoto, isiCaption, message, res){
  axios.post( URL_BOT + TOKEN  +'/sendPhoto', {
    chat_id: message.chat.id,
    photo: isiPhoto,
    caption: isiCaption
  })
    .then(response => {
      // We get here if the message was successfully posted
      console.log('Message posted')
      res.end('ok')
    })
    .catch(err => {
      console.log('Error :', err)
      res.end('Error :' + err)
    })
}

const sendApiRequest2 = (operation, data, callback) => {
  axios.post( API_URL + operation, JSON.stringify(data))
    .then( response => {
      if(response.data.rc === -3){
        console.log('rc === -3 gan')
      } else if (typeof callback === 'function') callback(response.data)
    })
    .catch( error => {
      console.log("error" ,error);
      callback(false)
    });
};

// LISTENING SERVER
app.listen(8080, function() {
  console.log('Lokalin app listening on port 8080!');
});

