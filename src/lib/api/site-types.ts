// Editable copy and images of the public pages (landing, login, register).
// Admins edit it at /quan-tri/noi-dung; everyone reads it.

export interface SiteImage {
  url: string;
  alt: string;
  /** Set when the image was picked from the media library. */
  mediaId?: string;
}

/** A photo in the open album on the landing hero. */
export interface SiteAlbumPhoto extends SiteImage {
  memo: string; // handwritten caption
  date: string; // short label, e.g. "17.02"
}

export interface SiteSection {
  title: string;
  body: string;
}

export interface SiteContent {
  landing: {
    /** Full hero headline. */
    heroTitle: string;
    /** Part of heroTitle shown in coral. Empty or not found: no highlight. */
    heroHighlight: string;
    heroLead: string;
    /** Exactly 4: left page top, left page bottom, right page top, right page bottom. */
    album: SiteAlbumPhoto[];
    photos: SiteSection;
    chat: SiteSection;
    learn: SiteSection;
    assistant: SiteSection;
    privacy: {
      statement: string;
      /** Exactly 3 short points under the statement. */
      points: SiteSection[];
    };
    closing: string;
  };
  login: {
    /** Exactly 3 photos stacked on the closed album cover (left panel). */
    coverPhotos: SiteImage[];
    coverLine: string;
    greetingTitle: string;
    greeting: string;
  };
  register: {
    title: string;
    lead: string;
    member: SiteSection;
    guest: SiteSection;
    sentTitle: string;
    sentBody: string;
  };
  updatedAt?: string; // ISO, set by the server on save
  updatedBy?: string; // display name
}
