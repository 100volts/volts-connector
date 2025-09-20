# ---- Build Stage ----
FROM node:20-alpine AS build
WORKDIR /app
    
# Install build dependencies for canvas
RUN apk add --no-cache python3 make g++ cairo-dev pango-dev jpeg-dev giflib-dev pixman-dev
    
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS prod
WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/config.json ./config.json
COPY --from=build /app/timeSheet.json ./timeSheet.json
# Add any other files your app needs at runtime

CMD ["node", "dist/index.js"]
