# Fischr

An easy-to-use online gaming platform.

# Installation

Install Node.js and dependencies using the following:

```
brew install wget
curl "https://nodejs.org/dist/latest/node-${VERSION:-$(wget -qO- https://nodejs.org/dist/latest/ | sed -nE 's|.*>node-(.*)\.pkg</a>.*|\1|p')}.pkg" > "$HOME/Downloads/node-latest.pkg" && sudo installer -store -pkg "$HOME/Downloads/node-latest.pkg" -target "/"
npm install && bower install
```

Run Fischr at localhost:3001:

```
node ./app.js
```

# Developers

## Browserify

If you add a new browserify bundle, update the loaded javascript as follows:

```
browserify src/bundles/go.js -o src/bundles/go_bundle.js
```

## To-Do

- Move model code to a new file, don't mix it with controller
