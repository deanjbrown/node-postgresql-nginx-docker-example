import { ChangeEvent, FormEvent, useState } from "react";

const PostForm = (props: PostFormProps) => {
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");

  const onSubmitHandler = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const post: Post = { title: title, content: content };
    setTitle("");
    setContent("");
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
