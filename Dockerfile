FROM node:5.9.0

RUN mkdir -p /app/
WORKDIR /app

ADD package.json /app/
RUN npm install

RUN npm install -g bower
ADD bower.json /app/
RUN bower install --allow-root

ADD . /app/

CMD ["node", "app.js"]