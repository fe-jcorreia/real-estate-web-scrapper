ARG NODE_VERSION="20.18.0"
ARG ALPINE_VERSION="3.19"

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS base

FROM base AS builder

WORKDIR /home/app

COPY . .
RUN npm set progress=false && npm config set depth 0 && npm ci --ignore-scripts && npm run prune:rest-server

FROM base AS installer

WORKDIR /home/app

COPY --from=builder /home/app/rest-server-pruned/json/ .
RUN npm ci --ignore-scripts

COPY --from=builder /home/app/rest-server-pruned/full/ .
RUN npm run db:codegen && npm run build
 
FROM base AS runner

USER node
WORKDIR /home/node

COPY --from=installer --chown=node:nodejs /home/app .

ENV NODE_ENV=production

ENTRYPOINT ["npm", "run", "start", "--workspace=@repo/rest-server"]
