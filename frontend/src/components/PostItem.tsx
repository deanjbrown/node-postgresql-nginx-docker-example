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