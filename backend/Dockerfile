###
# Backend Dockerfile
###

# pull the Node.js Docker image
FROM node:alpine

# create the directory inside the container
WORKDIR /usr/src/app

# Add the port environment variable
ENV PORT 3000

# Add the database url environment variable
ENV DATABASE_URL="postgresql://devtestuser:Devtestpassword!123@postgresqlserver:5432/devdatabase?schema=public"

# copy the package.json files from local machine to the workdir in container
COPY package*.json yarn.lock ./

# run yarn install in our local machine
RUN yarn install

# copy the generated modules and all other files to the container
COPY . .

# our app is running on port 5000 within the container, so need to expose it
EXPOSE 3000

# Generate Prisma Client and apply migrations during container startup
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate dev && yarn dev"]