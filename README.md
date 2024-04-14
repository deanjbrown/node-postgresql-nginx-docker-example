# NodeJs + Express, PostgreSQL, React, Nginx multi-image Docker example

*An example of a multi-image Docker container running NodeJs + Express, PostgreSQL, React, and Nginx that I created for a tutorial that I'm working on*

### Initial Setup

Create a directory for each component, except the frontend, in our application. We will be using Vite to create the frontend which will create a directory for the frontend in the process. 

```CONSOLE
mkdir backend database nginx
```

### Backend Server With Node + Express + Typescript

Set up a very simple Node JS + Express project with TypeScript for the backend server code. Let's initialize the project:

```CONSOLE
cd backend
yarn init 
```

Answer the questions that you are presented with. The defaults will do fine. This will create the `package.json` file which we will be editing in a moment anyway.

Install the dependencies & development dependencies that we will use:

```CONSOLE
yarn add express cors
yarn add -D typescript @types/express @types/node @types/cors concurrently nodemon
```

Edit the `package.json` file and add the commands to the scripts section to allow us to start the server in both development and production mode. Also pay attention to the `"main"` part of this JSON file. You can set that as whatever you like but it ought to be the entry point to the application. I have set mine to `app.ts` 

```JSON
{
  "name": "backend",
  "version": "1.0.0",
  "description": "Backend NodeJS + Express + TypeScript app for node-postgresql-nginx-docker",
  "main": "app.ts",
  "author": "Dean Brown",
  "license": "MIT",
  "dependencies": {
    "express": "^4.19.2"
  },
  "scripts": {
    "build": "npx tsc",
    "start": "node dist/app.js",
    "dev": "concurrently \"npx tsc --watch\" \"nodemon -q dist/app.js\""
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.12.7",
    "concurrently": "^8.2.2",
    "nodemon": "^3.1.0",
    "typescript": "^5.4.5"
  }
}
```

Let's add some simple code to create an very simple backend server that will listen for connections on the port specified in our environment variables, which we will set with docker later. We also set up Cors, and tell express to parse requests with content type `application/json` & `application/x-www-form-urlencoded`.

```TypeScript
import express, { Express } from "express";
import cors, { CorsOptions } from "cors";

// Get the port that we want to use from the env variables
const port: string | undefined = process.env.PORT;

// Create the express application
const app: Express = express();

// Parse requests with content-type application/json
app.use(express.json());

// Parse requests with content-type application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Enable Cors
const allowedOrigins = ["http://localhost", "http://127.0.0.1"];
const options: CorsOptions = {
  credentials: true,
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
};
app.use(cors(options));

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
```

Before we can run our code we need to initialize the TypeScript compiler:

```CONSOLE
npx tsc --init
```

This will create the `tsconfig.json` file. We will need to edit one option in this file to specify our output directory for the transpiled JavaScript code to live. Find the following section 

```JSON
// "inlineSourceMap": true,                          /* Include sourcemap files inside the emitted JavaScript. */
    // "outFile": "./",                                  /* Specify a file that bundles all outputs into one JavaScript file. If 'declaration' is true, also designates a file that bundles all .d.ts output. */
    "outDir": "./dist",                                   /* Specify an output folder for all emitted files. */
    // "removeComments": true,                           /* Disable emitting comments. */
    // "noEmit": true,       
```

Set the `"outDir"` to be the same as mine: `"./dist"`

Next we will dockerize the backend server and ensure that it is working. But first we should understand some Docker terminology:
### Understanding Some Docker Terminology:

- What is a Dockerfile?
	- A text document which tells Docker how to assemble an image.

- What is a Docker image?
	- A packaged set of instructions that is used to create Docker containers

- What is a Docker container?
	- A runnable instance of an image that is isolated from the system it is running on. The same Docker container can run on Windows, Mac, etc.


### Dockerizing The Backend Server

Create a file called `Dockerfile` with no extension and paste the following code into it:

```Dockerfile
###
# Backend Dockerfile
###

# pull the Node.js Docker image
FROM node:alpine

# create the directory inside the container
WORKDIR /usr/src/app

# Add the port environment variable
ENV PORT 3000

# copy the package.json files from local machine to the workdir in container
COPY package*.json yarn.lock ./

# run yarn install in our local machine
RUN yarn install

# copy the generated modules and all other files to the container
COPY . .

# our app is running on port 5000 within the container, so need to expose it
EXPOSE 3000

# the command that starts our app
CMD ["yarn", "dev"]
```

Each section is commented to describe what the command is doing, but to be clear we are 

- 1. Pull the docker image for Node from Docker Hub (They have docker images for many different applications, programming environments and servers).
  
- 2. Set the working directory that will be used inside of the container. (`usr/src/app` is fairly standard for a Node app).

- 3. Copy our `package.json` file from our source directory into the container's working directory. 

- 4. Run `yarn install` to install the dependencies that we need.

- 5.  Copy all of the files from our source directory into the container's working directory.

- 6. Export port `3000`. The app is set to run on port 8080. We can't access it unless we expose that port.

- 7. Tell the image what command to run when the container starts up.

We also want to create a `.dockerignore` file with the following lines:

```CONSOLE
node_modules
npm-debug.log
```

The `.dockerignore` tells the `docker build` command which files from our source directory to ignore. In our situation, we want to ignore `node_modules` and `npm-debug.log` because it is time consuming.

Because we're going to use multiple Docker images in our container, we will create a `docker-compose.yml` script in the root directory of our project and enter the following:

```YAML
version: "3.8"
services:
  nodeserver:
	restart: always
	build:
	  context: ./backend
	ports:
	  - "3000:3000"
	develop:
	  watch:
		- action: sync
		  path: ./backend
		  target: /usr/src/app
		  ignore:
			- node_modules/
		- action: rebuild
		  path: package.json
```

The develop section will tell Docker to automatically detect changes to our source files and sync those changes to the container. Because we are using concurrently to watch for file changes during development, these changes will automatically be applied once synced with the container.

From the root directory we can now run:

```CONSOLE
docker-compose watch
```

This should build our docker container with just the one image that we have created so far. It will also watch the project for any changes that are made and apply them.

You should see the following output from your terminal:

```CONSOLE
12:31:32 AM - Starting compilation in watch mode...
nodeserver-1  | [0]
nodeserver-1  | [0] 
nodeserver-1  | [0] 12:31:33 AM - Found 0 errors. Watching for file changes.
nodeserver-1  | [1] ⚡️[server]: Server is running at http://localhost:3000
```


### Adding a Dockerized PostgreSQL database and using Prisma as an ORM.

In our database directory we add the following Dockerfile

```Dockerfile
# Use official PostgreSQL image from Docker Hub
FROM postgres:alpine

# Set environment variables
ENV POSTGRES_USER=devtestuser
ENV POSTGRES_PASSWORD=Devtestpassword!123
ENV POSTGRES_DB=devdatabase

# Expose PostgreSQL port
EXPOSE 5432

# Copy custom initialization scripts
# COPY init.sql /docker-entrypoint-initdb.d/

# Optionally, you can mount a volume for persistent data:
VOLUME ["/var/lib/postgresql/data"]
```

Then modify the docker-compose script like so:

```YAML
version: "3.8"
services:
  postgresqlserver:
    restart: always
    build:
      context: ./database
    ports:
      - "5432:5432"
      
  nodeserver:
    restart: always
    build:
      context: ./backend
    ports:
      - "3000:3000"
    develop:
      watch:
        - action: sync
          path: ./backend
          target: /usr/src/app
          ignore:
            - node_modules/
        - action: rebuild
          path: package.json
```

Now when we run `docker-compose watch`, it will run our backend node application and our database.

To connect the backend to the database, install the database ORM Prisma as a dev dependency to the backend project. Navigate back into the backend directory and run:

```CONSOLE
yarn add prisma -D
```

Set up Prisma ORM to use the PostgreSQL database:

```CONSOLE
npx prisma init --datasource-provider postgresql
```

This will generate all of the files that Prisma needs to be able to interact with the database. This will have also created a `.env` file and added the following line to it:

```ENV
DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public"
```

Make sure you change the username, password, and database name that you want to use. For this example, I will use the following:

```.ENV
DATABASE_URL="postgresql://devtestuser:Devtestpassword!123@localhost:5432/devdatabase?schema=public"
```

You will obviously want to change this for a production system. It is also not very secure to include usernames and passwords in a `.env` file in production!

We need to add the following line to the backend Dockerfile:

```DockerFile
...

# Add the port environment variable
ENV PORT 3000

# Add the database url environment variable
ENV DATABASE_URL="postgresql://devtestuser:Devtestpassword!123@postgresqlserver:5432/devdatabase?schema=public"

...
```

This allows us to make migrations locally using the `.env` file to create the environment variables and also from inside the Docker container using the environment variables contained in the  Dockerfile. 

Install the Prisma client:

```CONSOLE
yarn add @prisma/client
```

Open the `prisma/schema.prisma` file and create a very simple database schema:

```JavaScript
model Post {
  id        Int     @id @default(autoincrement())
  title     String
  content   String?
}
```

Run all of the services with: 

```CONSOLE
docker-compose watch
```

Migrate these changes we made to the schema to the database:

```CONSOLE
npx prisma migrate dev --name "Initial Migration"
```

You should see a response similar to this:

```CONSOLE
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "devdatabase", schema "public" at "postgresql:5432"

Applying migration `20240413215703_inital_migration`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20240413215703_inital_migration/
    └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client (v5.12.1) to ./node_modules/@prisma/client in 90ms
```

Indicating that the migration has been successful. 

Modify the `Dockerfile` so that any new migrations get applied to the database when the Docker container restarts:

```YAML
###
# Backend Dockerfile
###

# pull the Node.js Docker image
FROM node:alpine

# create the directory inside the container
WORKDIR /usr/src/app

# Add the port environment variable
ENV PORT 3000

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
```

We now have a backend server using NodeJS, Express, and Prisma, and a PostgreSQL database as separate images inside a docker container and have confirmed that they are able to communicate. Next, we will set up a React project using Vite for the front end of the web application.


### Creating a React Frontend With Vite

Create the React based front end project with Vite. This will create a directory for our front end project to sit in, which is why we didn't create one earlier. Change into the root directory of the project and then run:

```CONSOLE
yarn create vite
```

Give the project a name: `frontend` (This will create the frontend directory that we skipped earlier)
Select React as the Framework to use.
Select TypeScript + SWC as the variant

Install the dependencies:

```CONSOLE
cd frontend
yarn install
```

That's it. Now all we need to do is run `yarn dev` to run the React application. By default the React app will be served on port 5173. You should see the following:

![App Preview](readme_images/viteAndReact.png)

We need to modify the Vite config file located at `frontend/vite.config.ts`. Enter the following config:

```TypeScript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react()],
  preview: {
   port: 8080,
   strictPort: true,
  },
  server: {
   port: 8080,
   strictPort: true,
   host: true,
   origin: "http://127.0.0.1:8080",
  },
 });
```

If we run the server again with `yarn dev` we should see that the application is being hosted at port 8080, which is the standard port for a react application. We will later proxy connections from port 80 to our react application through Nginx. 

You can create a production build of the application by running `yarn build`. This will create a directory called `dist` inside the `frontend` directory. We can then use `yarn preview` or install and use the NPM package serve to serve our production build:

```CONSOLE
yarn global add serve
serve -s dist
```

Let's create a `Dockerfile` for the front end:

```Dockerfile
###
# Frontend Dockerfile
###

# pull the Node.js Docker image
FROM node:alpine

# create the directory inside the container
WORKDIR /usr/src/app

# copy the package.json files from local machine to the workdir in container
COPY package*.json yarn.lock ./

# run yarn install in our local machine
RUN yarn install

# copy the generated modules and all other files to the container
COPY . .

# our app is running on port 5000 within the container, so need to expose it
EXPOSE 8080

# run our application in dev mode
CMD [ "yarn", "dev" ]
```

It will look a little different when we move from development to production:
// TODO => DO NOT INCLUDE THIS IN THE BLOG IN CASE I AM WRONG!!!

```Dockerfile
###
# Frontend Dockerfile
###

# pull the Node.js Docker image
FROM node:alpine

# create the directory inside the container
WORKDIR /usr/src/app

# copy the package.json files from local machine to the workdir in container
COPY package*.json yarn.lock ./

# run yarn install in our local machine
RUN yarn install

# copy the generated modules and all other files to the container
COPY . .

# generate the build
RUN yarn build

# our app is running on port 5000 within the container, so need to expose it
EXPOSE 8080

# run our application in production mode
CMD [ "yarn", "preview" ]
```

Now let's modify the `docker-compose` script in the root directory:

```YAML
version: "3.8"
services:
  postgresqlserver:
    restart: always
    build:
      context: ./database
    ports:
      - "5432:5432"

  reactserver:
    restart: always
    build:
      context: ./frontend
    ports:
      - "8080:8080"
    develop:
      watch:
        - action: sync
          path: ./frontend
          target: /usr/src/app
          ignore:
            - node_modules/
        - action: rebuild
          path: package.json

  nodeserver:
    restart: always
    build:
      context: ./backend
    ports:
      - "3000:3000"
    develop:
      watch:
        - action: sync
          path: ./backend
          target: /usr/src/app
          ignore:
            - node_modules/
        - action: rebuild
          path: package.json

```

We can now run the backend, frontend, and database with just one command:

```CONSOLE
docker compose watch
```


### Dockerizing the Nginx Reverse Proxy

In the nginx section of our app we need to create a config file the same way that you would if you were using Nginx outside of a container. We will use this config file to tell Nginx to listen on port `80` and to reverse proxy any connections to port `8080`.  It will also forward any connections to `http://localhost:80/api` to `http://locahost:3000`. 

Create a file called `default.conf` inside the nginx directory and enter the following config:

```CONSOLE
server {
    listen 80;
    # server_name example.com;

    location /api {
        proxy_pass http://nodeserver:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass http://reactserver:8080;       
    }
}
```

Create the `Dockerfile` inside the Nginx folder:

```Dockerfile
FROM nginx
COPY default.conf /etc/nginx/conf.d/default.conf
```

This will pull the official nginx image from Docker Hub and copies our config file into the correct directory that Nginx will look in. 

Update the `docker-compse` script to run the Nginx proxy also:

```YAML
version: "3.8"
services:
  postgresqlserver:
    restart: always
    build:
      context: ./database
    ports:
      - "5432:5432"

  reactserver:
    restart: always
    build:
      context: ./frontend
    ports:
      - "8080:8080"
    develop:
      watch:
        - action: sync
          path: ./frontend
          target: /usr/src/app
          ignore:
            - node_modules/
        - action: rebuild
          path: package.json

  nodeserver:
    restart: always
    build:
      context: ./backend
    ports:
      - "3000:3000"
    develop:
      watch:
        - action: sync
          path: ./backend
          target: /usr/src/app
          ignore:
            - node_modules/
        - action: rebuild
          path: package.json

  nginxreverseproxy:
    restart: always
    build:
      context: ./nginx
    ports:
      - "80:80"
```


### Connecting the frontend to the backend

To connect the frontend to the backend we need to make HTTP requests from the frontend to an API endpoint on the backend. We'll add 2 simple API endpoints on the in `backend/app.ts`:

```TypeScript
...
// Returns a list of posts:
app.get("/api/posts", async (req: Request, res: Response) => {
  try {
    const postList = await prismaClient.post.findMany({});
    console.log(postList);
    res.status(200).send(postList);
  } catch (e: any) {
    res.status(500).json({ message: `Server error: ${e}` });
  }
});

// Creates a new post
app.post("/api/posts", async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;
  const post: Post = await prismaClient.post.create({
    data: {
      title: title,
      content: content,
    },
  });

  res
    .status(200)
    .json({ message: "Post created", id:post.id, title: post.title, content: post.content });
  
  }
  catch(e: any)
  {
    res.status(500).json({message: `Server error: ${e}`});
  }
  ...
```


Now in `frontend` let's delete all of the CSS from the `index.css` and `app.css` files in the frontend. Remove all of the JSX from the `return` statement in the `src/App.tsx` file so that it looks like this:

```TypeScript
import './App.css'

function App() {
  return (
    <>
      <h1>Hello World</h1>
    </>
  )
}

export default App

```

Confirm that you are able to see the Hello World message when you navigate to `localhost:80` in the browser. 

Install `axios` as a dependency. This will be used to make the HTTP requests:

```CONSOLE
yarn add axios
```

First I'll define some of the `types` that we're going to be using by creating a `types` directory inside of `frontend/src/`. Create a file inside of this called `Post.ts` and enter the following:

```TypeScript
interface Post {
  id?: number;
  message?: string
  title: string;
  content: string;
}

interface PostFormProps {
  onCreatePost: (post: Post) => void;
}
```

Create a `components` directory inside of `frontend/src` and inside of it, create 3 files: `PostForm.tsx`, `PostItem.tsx`, and `PostList`. Enter the following code in each file:

`PostForm.tsx`:

```TypeScript
import { ChangeEvent, FormEvent, useState } from "react";

const PostForm = (props: PostFormProps) => {
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");

  const onSubmitHandler = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const post: Post = { title: title, content: content };
    props.onCreatePost(post);
  };

  return (
    <>
      <div className="post-form-container">
        <form className="post-form" onSubmit={onSubmitHandler}>
          <h1>Create A Post</h1>
          <label htmlFor="title">Post Title</label>
          <input
            type="text"
            name="title"
            id="title"
            placeholder="Post Title"
            value={title}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setTitle(event.target.value);
            }}
          />

          <label htmlFor="content">Content</label>
          <textarea
            name="content"
            id="content"
            placeholder="Post Content"
            value={content}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
              setContent(event.target.value);
            }}
          />

          <button type="submit" className="post-form-button">
            Post
          </button>
        </form>
      </div>
    </>
  );
};

export default PostForm;

```

`PostItem.tsx`:

```TypeScript
const PostItem: React.FC<Post> = ({title, content}) => {
  return (
    <>
      <div className="post">
        <h3 className="post-title">{title}</h3>
        <p className="post-content">{content}</p>
      </div>
    </>
  );
};

export default PostItem;
```

`PostList.tsx`:

```TypeScript
import PostItem from "./PostItem";

const PostList = (props: any) => {
  if (props.postList.length === 0)
    return <p className="warning">No posts found</p>;

  return (
    <>
      <ul className="post-list">
        {props.postList.map((post: Post) => (
          <PostItem key={post.id} title={post.title} content={post.content} />
        ))}
      </ul>
    </>
  );
};

export default PostList;

```


Add the following JSX to your `App.tsx` to finish up our frontend's layout and logic:

```TypeScript
import "./App.css";
import axios, { AxiosError, AxiosResponse } from "axios";
import { useEffect, useState } from "react";
import PostForm from "./components/PostForm";
import PostList from "./components/PostList";

const App = () => {
  const [postList, setPostList] = useState<Post[]>([]);

  useEffect(() => {
    const getPostList = async () => {
      try {
        const response: AxiosResponse<Post[]> = await axios.get<Post[]>(
          "http://localhost/api/posts",
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        setPostList(response.data);
      } catch (error: any) {
        console.log(`Error fetching data: ${error}`);
      }
    };
    getPostList();
  }, []);

  const createPost = async (post: Post): Promise<Post | null> => {
    try {
      const response: AxiosResponse<Post> = await axios.post<Post>(
        "http://localhost/api/posts",
        post,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      const axiosError = error as AxiosError;
      console.error(`Error: ${axiosError.message}`);
      return null;
    }
  };

  const createPostHandler = async (post: Post) => {
    const postResponse: Post | null = await createPost(post);
    console.log(`postResponse: ${postResponse}`);
    if (postResponse) {
      console.log(`Response: ${JSON.stringify(post)}`);
      setPostList([postResponse, ...postList]);
    } else {
      console.log(`No response received`);
    }
  };
  return (
    <>
      <PostForm onCreatePost={createPostHandler} />
      <div className="post-list-container-outer">
        <h1 className="post-list-title">Latest Posts</h1>
        <div className="post-list-container-inner">
          <PostList postList={postList} />
        </div>
      </div>
    </>
  );
};

export default App;

```

Finally, to make the page look at little less boring add the following to the `App.css`:

```CSS
@import url("https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap");

/* Apply Roboto font to the entire document */
body {
  font-family: "Roboto", sans-serif;
  padding-top: 50px;
}

/**
*
* Post Form
*
*/

.post-form-container {
  padding-bottom: 20px;
}

.post-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f9f9f9;
}

.post-form h1 {
  text-align: center;
  margin-bottom: 20px;
}

.post-form label {
  display: block;
  margin-bottom: 5px;
}

.post-form input[type="text"],
.post-form textarea {
  width: 100%;
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-sizing: border-box; /* Ensure padding and border are included in the element's total width and height */
}

.post-form textarea {
  height: 100px; /* Adjust according to your preference */
  font-family: "Roboto", sans-serif;
}

.post-form button {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 5px;
  background-color: #007bff;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
}

.post-form button:hover {
  background-color: #0056b3;
}

/**
*
* Post List
*
*/

.post-list-container-outer {
  max-width: 800px;
  margin: 0 auto;
}

.post-list-title {
  text-align: center;
}

.post {
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #ccc;
}

```

Okay, that's it! Let's fire up our application with `docker-compose watch` and if we navigate to: http://localhost:80 in our browser we should see the following:

![App Preview](readme_images/appPreview.png)

If we enter a title, and content, and then click the post button, we should see a post be added underneath "Latest Posts" without having to refresh the browser:

![alt text](readme_images/appPreviewWithpost.png)

So that's it. If you made it this far, welcome to the starting point of developing a web app with Docker, NodeJs, PostgreSQL, and Nginx! 
If you make something interesting with this, I would love to see it, and if you find some bugs, please report them, and I will do my best to fix them. 

Thank you :) 