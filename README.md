# Baduk

An easy-to-use online Go gaming platform. Currently hosted at http://www.baduk.com.

# Installation

Install Node.js and dependencies using the following:

```
brew install wget
curl "https://nodejs.org/dist/latest/node-${VERSION:-$(wget -qO- https://nodejs.org/dist/latest/ | sed -nE 's|.*>node-(.*)\.pkg</a>.*|\1|p')}.pkg" > "$HOME/Downloads/node-latest.pkg" && sudo installer -store -pkg "$HOME/Downloads/node-latest.pkg" -target "/"
npm install && bower install
```

Run Baduk at localhost:3001:

```
node ./app.js
```
