interface Post {
  id?: number;
  message?: string
  title: string;
  content: string;
}

interface PostFormProps {
  onCreatePost: (post: Post) => void;
}