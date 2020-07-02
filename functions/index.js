const functions = require("firebase-functions");
const admin = require("firebase-admin");
const rp = require("request-promise");

admin.initializeApp(functions.config().firebase);

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.helloWorld = functions.https.onRequest((request, response) => {
  if (request.method !== "POST") {
    response.send("This is not post request");
  }

  console.log(request.body);
  response.send("OK");
});

exports.oauth_redirect = functions.https.onRequest(async (request, response) => {
  console.log(request.query);
  if (request.method !== "GET") {
    console.error(`Got unsupported ${request.method} request. Expected GET.`);
    return response.send(405, "Only GET requests are accepted");
  }

  if (!request.query && !request.query.code) {
    return response.status(401).send("Missing query attribute 'code'");
  }

  const options = {
    uri: "https://slack.com/api/oauth.v2.access",
    method: "POST",
    json: true,
    qs: {
      code: request.query.code,
      client_id: functions.config().slack.id,
      client_secret: functions.config().slack.secret,
      redirect_uri: `https://us-central1-${process.env.GCP_PROJECT}.cloudfunctions.net/oauth_redirect`,
    },
  };

  const result = await rp(options);
  if (!result.ok) {
    console.error("The request was not ok: " + JSON.stringify(result));
    return response.header("Location", `https://${process.env.GCP_PROJECT}.firebaseapp.com`).send(302);
  }
  console.log(result);

  const token = await admin
    .auth()
    .createCustomToken(result.authed_user.id)
    .catch((err) => {
      console.log("Error creating custom token:", err);
    });
  console.log(token);

  // await admin
  //   .database()
  //   .ref("installations")
  //   .child(result.team_id)
  //   .set({
  //     token: result.access_token,
  //     team: result.team_id,
  //     webhook: {
  //       url: result.incoming_webhook.url,
  //       channel: result.incoming_webhook.channel_id,
  //     },
  //   });

  response.header("Location", `https://${process.env.GCP_PROJECT}.firebaseapp.com/success.html?token=` + token).send(302);
});
