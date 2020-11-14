if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
let express = require("express");
let request = require("request");
let querystring = require("querystring");
let cors = require("cors");

let app = express();

let redirect_uri = process.env.REDIRECT_URI + "/" || "http://localhost:8888/callback";

app.get("/login", function (req, res) {
  const scopes = `user-follow-read user-follow-modify user-top-read user-read-playback-position user-read-recently-played user-library-modify 
      user-library-read playlist-read-collaborative playlist-modify-public playlist-read-private playlist-modify-private user-read-email
      user-read-private streaming
      app-remote-control user-read-playback-state
      user-modify-playback-state
      user-read-currently-playing ugc-image-upload`;
  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: process.env.SPOTIFY_CLIENT_ID,
        scope: scopes,
        redirect_uri,
      })
  );
});

app.get("/callback", function (req, res) {
  let code = req.query.code || null;
  let authOptions = {
    url: "https://accounts.spotify.com/api/token",
    form: {
      code: code,
      redirect_uri,
      grant_type: "authorization_code",
    },
    headers: {
      Authorization:
        "Basic " +
        new Buffer(
          process.env.SPOTIFY_CLIENT_ID +
            ":" +
            process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64"),
    },
    json: true,
  };
  request.post(authOptions, function (error, response, body) {
    var access_token = body.access_token;
    var refresh_token = body.refresh_token;
    let uri = process.env.FRONTEND_URI + "/login" || "http://localhost:3000/login";
    res.redirect(
      uri + "?access_token=" + access_token + "&refresh_token=" + refresh_token
    );
  });
});

app.get("/refresh_token", cors(), function (req, res) {
  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: "https://accounts.spotify.com/api/token",
    headers: {
      Authorization:
        "Basic " +
        new Buffer(
          process.env.SPOTIFY_CLIENT_ID +
            ":" +
            process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64"),
    },
    form: {
      grant_type: "refresh_token",
      refresh_token: refresh_token,
    },
    json: true,
  };
  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      // res.send({
      //   access_token: access_token,
      // });
      res.json({
        access_token: access_token
      })
    }
  });
});

let port = process.env.PORT || 8888;
console.log(
  `Listening on port ${port}. Go /login to initiate authentication flow.`
);
app.listen(port);
