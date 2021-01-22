# My Nintendo Rewards

## Description
This project focuses on giving a clearer picture on what items are available in the [My Nintendo Rewards Store](hhttps://my.nintendo.com/reward_categories/nintendo_store), as well as gives users the option to opt-in to Notifications whenever a new item is available or old item is restocked.

Each reward item displayed shows its available stock in realtime (after each update interval). Rewards are shown based on the selected region.

## Tools Used
- [ReactJS](https://reactjs.org/)
- [Google Firebase](https://firebase.google.com/)
    - Hosting
    - Firestore
    - Cloud Functions
    - Cloud Messaging
- [Bootstrap](https://getbootstrap.com/) and [react-bootstrap](https://react-bootstrap.github.io/)
- [ApexCharts](https://apexcharts.com/)
- Additional Libraries
    - [react-timeago](https://www.npmjs.com/package/react-timeago)

## Setup
- Ensure your project is properly setup with Firebase
    - https://firebase.google.com/docs/cli
- Rename `.env.template` to `.env` and update it with your Firebase project details
- In `src/common/constants.ts` update `SITE_URL` to your site URL
- **Run for Development**:
    - `firebase deploy --only functions,firestore` to deploy all required cloud functions and Firestore settings
        - TODO: Use the `Firebase Emulator` instead
    - `yarn` to install all dependencies
    - `yarn start` to start the local UI development environment
- **Run for Production**:
    - `yarn && yarn build` to install all dependencies and build the UI
    - `firebase deploy` to deploy all hosting, functions, and firestore settings

## Additional Notes
- **Cloud Functions**
    - Each Cloud Function instance is given the minimum specs needed to properly run. One improment that would greatly recuce the function bandwidth needed for each "sync" is to find the actual My Nintendo Rewards Store API endpoint rather than just scraping the webpage
    - Further teseting needs to be done to get other region stores to properly sync. Testing has been done using other regions (`europe-west2`, `australia-southeast1`, `northamerica-northeast1`), however changing these regions did not seem to change the item results. *Note: Using different regions may come with [different pricing](https://firebase.google.com/docs/functions/locations).*