FROM node:18.20
RUN apt-get update
COPY ./ ./
RUN npm i
EXPOSE 3000
CMD ["npm", "run-script", "start"]
