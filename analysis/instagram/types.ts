export type PostType = "IG reel" | "IG image" | "IG carousel";

export type MotionClass = "static" | "slight" | "motion" | "unknown";

export interface ReelMotion {
  duration: number;
  maxDistance: number;
  avgDistance: number;
  isStatic: boolean;
  motionClass: MotionClass;
}

export interface InstagramPost {
  postId: string;
  username: string;
  accountName: string;
  description: string;
  durationSeconds: number | null;
  publishedAt: string;
  permalink: string;
  postType: PostType;
  date: string;
  views: number;
  reach: number;
  likes: number;
  shares: number;
  newFollowers: number;
  comments: number;
  saves: number;
  reelMotion: ReelMotion | null;
}

export interface PostDescription {
  postId: string;
  permalink: string;
  imagePath: string | null;
  caption: string;
  description: string;
  themes: string[];
  tone: string;
  hasLiturgicalContent: boolean;
  modelNotes: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  examples: string[];
}

export interface PostClassification {
  postId: string;
  primaryCategory: string;
  secondaryCategories: string[];
  confidence: number;
  reasoning: string;
}

export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  postCount: number;
  medianReach: number;
  medianViews: number;
  medianEngagementRate: number;
  totalLikes: number;
  totalComments: number;
  totalSaves: number;
  totalShares: number;
  totalNewFollowers: number;
  avgSavesRate: number;
  topPosts: Array<{ postId: string; permalink: string; engagementRate: number }>;
}
