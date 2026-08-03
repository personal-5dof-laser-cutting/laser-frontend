FROM node:26-bookworm
WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm i

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev"]