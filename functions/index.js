const functions = require("firebase-functions");

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.helloWorld = functions.https.onRequest((request, response) => {
  if (request.method !== "POST") {
    response.send("This is not post request");
  }

  console.log(request);
  response.send("OK");
});
