
# ShowStats Cloud Functions

## Project Setup

- Install Node.js.
- Install npm.
- Install the Firebase CLI via npm: `npm install -g firebase-tools`.
- Update the Firebase CLI and the `firebase-functions` SDK with

  ```
  npm install firebase-functions@latest firebase-admin@latest --save   
  npm install -g firebase-tools
  ```
- Run `firebase login` to log in via the browser and authenticate the firebase tool.

## Deploying

Run `firebase deploy --only functions`.

