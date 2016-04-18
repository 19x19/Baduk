# Baduk

An easy-to-use online Go gaming platform. Currently hosted at http://www.baduk.ca.

Currently in the pre-alpha stage.

## Installation

Install Node.js and dependencies using the following (for OS X):

```
brew install wget
curl "https://nodejs.org/dist/latest/node-${VERSION:-$(wget -qO- https://nodejs.org/dist/latest/ | sed -nE 's|.*>node-(.*)\.pkg</a>.*|\1|p')}.pkg" > "$HOME/Downloads/node-latest.pkg" && sudo installer -store -pkg "$HOME/Downloads/node-latest.pkg" -target "/"
npm install && bower install
```

Run Baduk at localhost:3001:

```
sudo node app.js
```

## For Developers

It's important to note that Baduk updates to origin/master every midnight (UTC). If you'd like to submit an issue, use one of the labels provided.
