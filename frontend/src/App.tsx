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
