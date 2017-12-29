FROM node:alpine
ARG DIR=/home/app
COPY . /home/app

RUN apk update
RUN apk upgrade
RUN apk add bash
RUN apk add grep

WORKDIR $DIR
RUN chmod +x wait-for-mongo.sh
RUN dos2unix wait-for-mongo.sh
RUN npm install
ENV DEBUG *

#CMD ["npm", "start"]
CMD ["/home/app/wait-for-mongo.sh", "sunputer-db", "27017", "npm start"]
