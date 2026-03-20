export interface Post {
  id: string;
  likes: number;
  comments: number;
  views?: number;
  saves?: number;
  caption?: string;
  imageUrl?: string;
  date: string;
}

export interface Account {
  id: string;
  username: string;
  hashtags: string[];
  followers: number;
  following: number;
  profileUrl: string;
  bio?: string;
  posts: Post[];
  notes?: string;
  createdAt: string;
}

export interface EngagementMetrics {
  avgLikes: number;
  avgComments: number;
  avgViews: number;
  avgSaves: number;
  engagementRate: number;
  likesPerPost: number;
  commentsPerPost: number;
  totalPosts: number;
}

export interface ContentIdea {
  theme: string;
  caption: string;
  hashtags: string[];
  format: string;
  tips: string[];
}
