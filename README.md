# Baduk

An easy-to-use online Go gaming platform. Currently hosted at http://www.baduk.ca.

## Installation

First, install Docker Toolbox from https://www.docker.com/products/docker-toolbox. Then run the following to add a new container for Baduk:

```
git clone https://github.com/19x19/Baduk
cd Baduk
docker-machine create default --driver virtualbox
docker-compose up
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
