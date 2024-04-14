import { Post, PrismaClient } from "@prisma/client";
import cors, { CorsOptions } from "cors";
import express, { Express, Request, Response } from "express";

const app: Express = express();
const port: string | undefined = process.env.PORT;

// Create a prisma client instance
const prismaClient = new PrismaClient();

// Parse requests with content-type application/json
app.use(express.json());

// Parse requests with the content-type application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Enable CORS
const allowedOrigins = ["http://localhost", "http://127.0.0.1"];
const options: CorsOptions = {
  credentials: true,
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
};
app.use(cors(options));

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
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})