FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4003

CMD ["node", "src/index.js"]

# Add a host override
COPY override-fastify.js /app/override-fastify.js
# Change the entrypoint to use the override file
CMD ["node", "override-fastify.js"]
