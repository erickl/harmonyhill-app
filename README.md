# harmonyhill-app

# Getting Started with Firebase
Make sure your node version is compatible with Firebase 11
- nvm install 20
- nvm use 20
- nvm alias default 20
Install and login to Firebase
- npm install -g firebase-tools
- firebase login
- firebase install
For the authentication flow
- npm install firebase-admin

# Launching on Firebase
- npm run build
- firebase deploy
- Once complete, you'll get a link like this: https://your-project-id.web.app, which you can share
- On Android, one can tap the 3-dot menu and chose "Add to Home screen", to make it almost like a real app

# Relaunch as APK for android
- edit the versionCode and versionName variables in android/app/build.gradle
- you need the key store password to be stored in the android/keystore.properties file. Ask the admin
- npm run build
- npx cap copy
Use this instead of "npx cap copy" when you changed anything related to Capacitor plugins or capacitor.config.ts/json
- npx cap sync
- Open in Android: npx cap open android
- Wait for Gradle to sync (see the progress bar finish at the bottom right)
- Create a release key (once): keytool -genkeypair -v -keystore android/app/hh-release-key.keystore -alias hh-release-key -keyalg RSA -keysize 2048 -validity 10000
- Build > Generate Signed App Bundle or APK > Select APK and Continue
- Make sure Key Store Path and password are filled in (only need to do this the first time)
- Select the Release option and then Create

# Launch on iOS as a Progressive Web App (PWA)
- Adjust version numbering in package.json (align with gradle.properties for the android app)
- npm run build
- firebase deploy

# Loading the bookings from the sheet
- Download sheet as a tsv
- put files in Public folder
- run the seeder script with path of "./public/<filename>"
- Note: if running from the node script, instead of the react app, use fs/promises/readFile, instead of fetch

# How to download storage files (expenses)
- brew install --cask google-cloud-sdk
- gcloud auth login
- gcloud config set project harmonyhill-1
- You may see more info here: gcloud storage buckets list
- gsutil -m cp -r gs://harmonyhill-1.firebasestorage.app/expenses <absolute path to local destination folder>

- set cors: gsutil cors set cors.json gs://harmonyhill-1.firebasestorage.app

# Using & exporting internal libraries
- Go to shared/ and run npm link
- go to functions/ and run npm link @harmonyhill/shared


# Versions
- 1.0: browse booking data
- 2.0: add & edit bookings and activities
- 2.1: delete activities, more custom activities and meal options, clearer activity info and forms, launch as web app
- 2.2: PDF invoice generator
- 3.0 Expense and Income menus, activity provider deadlines, side menu, export to G Sheets 

# See that your java version is updated
= brew update && brew upgrade --cask temurin (brew install --cask temurin if temurin isn’t installed)
- Java -version to check if installation was successful

# Login to Firebase
If needed, if this is your first time developing with firebase on this computer
- firebase login --reauth
- firebase use --add harmonyhill-1

# Test your firebase functions locally
- firebase emulators:start --import=./emulator-data
    - starts all emulators configured in firebase.json, with the imported database
- see local DB: http://localhost:4000/firestore/default/data
- export data: firebase emulators:export ./emulator-data
- latest command: firebase emulators:start --project=harmonyhill-1 --import=./emulator-data --export-on-exit

- How to start debugging firebase functions
    - node --inspect=9229 ./node_modules/.bin/firebase emulators:start --import=./emulator-data 
        - lately, that didn't work so well. An alternative is this: firebase emulators:start --inspect-functions --import=./emulator-data

How to trigger scheduled functions
- firebase functions:shell, then hourlyJob()

# Database seeding
- run ```node src/scripts/seeder.mjs```
- if you are getting an authentication problem, run ```gcloud auth application-default login```
- Note: launch the debugger for the seeder script, and the env vars in launch.json will be used
- To seed the emulator database, select "Run Seeder Script" in the debug menu (see launch.json) and press Debug

# Getting access to the shared repo
- go to shared project, run ```npm link```
- go to other project, run ```npm link @harmonyhill/shared```

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)
