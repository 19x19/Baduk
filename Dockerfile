# We use the node base image
FROM node:5.9.0

# Add a new folder /app/ and install all dependencies
RUN mkdir -p /app/
WORKDIR /app
ADD package.json /app/
RUN npm install
RUN npm install -g bower
ADD bower.json /app/
# We use --allow-root due to bower being dumb
RUN bower install --allow-root
ADD . /app/

# Run the application
CMD ["node", "app.js"]
