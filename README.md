# Baduk

An easy-to-use online Go gaming platform. Currently hosted at http://www.baduk.ca.

## Installation

You can either install Baduk locally, or use Docker. I recommend you install it locally unless you know what you're doing with Docker.

### Local Installation

Install Node.js and dependencies using the following (for OS X):

```
brew install wget
curl "https://nodejs.org/dist/latest/node-${VERSION:-$(wget -qO- https://nodejs.org/dist/latest/ | sed -nE 's|.*>node-(.*)\.pkg</a>.*|\1|p')}.pkg" > "$HOME/Downloads/node-latest.pkg" && sudo installer -store -pkg "$HOME/Downloads/node-latest.pkg" -target "/"
npm install && bower install
```

Run Baduk at localhost:3001:

```
node ./app.js
```

### Docker Installation

First, install Docker Toolbox from https://www.docker.com/products/docker-toolbox. Then run the following to add a new container for Baduk:

```
git clone https://github.com/19x19/Baduk
cd Baduk
docker-machine create default --driver virtualbox
docker-compose up
```

Then, add the following to your .bashrc::

```
$(docker-machine env default)
```

Baduk will now be running at the IP given by:

```
docker-machine ip default
```

After pulling new commits, update the image with:

```
docker-compose build && docker-compose up -d
```

## Infrastructure

Baduk updates to origin/master every midnight.

No more pushing to master - if you want to add a feature, make a pull request.

Currently only designed to be used with Chrome.
