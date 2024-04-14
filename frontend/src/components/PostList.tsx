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
