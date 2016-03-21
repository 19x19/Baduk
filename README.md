# fischr
Play games

# Installation

Install Node.js using the following:

```
curl "https://nodejs.org/dist/latest/node-${VERSION:-$(wget -qO- https://nodejs.org/dist/latest/ | sed -nE 's|.*>node-(.*)\.pkg</a>.*|\1|p')}.pkg" > "$HOME/Downloads/node-latest.pkg" && sudo installer -store -pkg "$HOME/Downloads/node-latest.pkg" -target "/"
```

Install dependencies:

```
npm install
```

Run app:

```
node ./app.js
```

Visit http://localhost:3000/ in Chrome
