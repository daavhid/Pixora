export type Story = {
  id: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    avatar: string;
    isVerified: boolean;
  };
  mediaUrl: string;
  mediaType: "image" | "video";
  caption: string;
  viewed: boolean;
  createdAt: string;
  expiresAt: string;
};

export type FeedPost = {
  id: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    avatar: string;
    isVerified: boolean;
  };
  location?: string;
  caption?: string;
  media: {
    id: string;
    url: string;
    type: "image" | "video";
    width: number;
    height: number;
  }[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  savesCount: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
  tags: string[];
  commentsPreview: {
    id: string;
    user: string; 
    text: string;
    createdAt: string;
  }[];
}[];