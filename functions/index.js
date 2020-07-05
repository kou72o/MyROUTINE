const functions = require("firebase-functions");
const admin = require("firebase-admin");
const rp = require("request-promise");
// const url = require("url");

admin.initializeApp(functions.config().firebase);

exports.web = functions.https.onRequest((request, response) => {
  response.send(`<h1> test </h1>`);
});

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

  //response.send(`
  //<html>
  //<head>
  //  <script src="https://www.gstatic.com/firebasejs/6.2.0/firebase-app.js"></script>
  //  <script src="https://www.gstatic.com/firebasejs/6.2.0/firebase-auth.js"></script>
  //  <script>
  //    const firebaseConfig = {
  //      apiKey: "${functions.config().sdkconfig.apikey}",
  //      authDomain: "${functions.config().sdkconfig.authdomain}",
  //      projectId: "${functions.config().sdkconfig.projectid}",
  //    };
  //    firebase.initializeApp(firebaseConfig);
  //  </script>
  //  <script>
  //    const token = "${token}";
  //    (async () => {
  //      await firebase.auth().signInWithCustomToken(token);
  //      await localStorage.setItem("token", token);
  //      //window.location.href = "https://myroutine-test-0630.web.app/";
  //    })();
  //  </script>
  //</head>
  //</html>
  //`);

  // const redirectUri = new url(`https://${process.env.GCP_PROJECT}.web.app`);
  // redirectUri.search = `token=${token}`;
  // res.redirect(303, redirectUri.toString());

  response.header("Location", `https://${process.env.GCP_PROJECT}.web.app?urlToken=` + token).send(302);
});
