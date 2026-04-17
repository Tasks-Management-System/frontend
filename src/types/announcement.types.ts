export interface AnnouncementAuthor {
  _id: string;
  name: string;
  profileImage?: string;
}

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  image?: string | null;
  attachments: { filename: string; url: string; mimetype: string; size: number }[];
  isPinned: boolean;
  isRead: boolean;
  readBy: string[];
  postedBy: AnnouncementAuthor;
  orgAdmin: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementsListResponse {
  success: boolean;
  announcements: Announcement[];
}
