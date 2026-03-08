export type Language = "he" | "en";

export const translations = {
  // Bottom Nav
  "nav.home": { he: "בית", en: "Home" },
  "nav.discover": { he: "גלה", en: "Discover" },
  "nav.create": { he: "צור", en: "Create" },
  "nav.notifications": { he: "התראות", en: "Alerts" },
  "nav.profile": { he: "פרופיל", en: "Profile" },

  // Feed
  "feed.following": { he: "עוקב", en: "Following" },
  "feed.foryou": { he: "בשבילך", en: "For You" },
  "feed.loading": { he: "טוען הדגשות...", en: "Loading highlights..." },
  "feed.loginToSee": { he: "התחבר כדי לראות סרטונים", en: "Sign in to see videos" },
  "feed.followToSee": { he: "עקוב אחרי שחקנים כדי לראות את התוכן שלהם כאן", en: "Follow players to see their content here" },
  "feed.noVideosYet": { he: "אין עדיין סרטונים", en: "No videos yet" },
  "feed.discoverPlayers": { he: "גלה שחקנים", en: "Discover players" },
  "feed.views": { he: "צפיות", en: "views" },

  // Auth
  "auth.signIn": { he: "התחבר", en: "Sign In" },
  "auth.signUp": { he: "הירשם", en: "Sign Up" },
  "auth.email": { he: "אימייל", en: "Email" },
  "auth.password": { he: "סיסמה", en: "Password" },
  "auth.displayName": { he: "שם תצוגה", en: "Display Name" },
  "auth.signingIn": { he: "מתחבר...", en: "Signing in..." },
  "auth.signingUp": { he: "נרשם...", en: "Signing up..." },
  "auth.or": { he: "או", en: "or" },
  "auth.googleSignIn": { he: "כניסה עם Google", en: "Sign in with Google" },
  "auth.noAccount": { he: "אין לך חשבון?", en: "Don't have an account?" },
  "auth.hasAccount": { he: "כבר יש לך חשבון?", en: "Already have an account?" },
  "auth.welcome": { he: "!ברוך הבא", en: "Welcome!" },
  "auth.signUpSuccess": { he: "נרשמת בהצלחה! בדוק את המייל לאימות", en: "Signed up! Check your email to verify" },
  "auth.invalidLogin": { he: "אימייל או סיסמה שגויים", en: "Invalid email or password" },
  "auth.alreadyRegistered": { he: "אימייל זה כבר רשום", en: "Email already registered" },
  "auth.error": { he: "שגיאה בהתחברות", en: "Authentication error" },
  "auth.nameMinLength": { he: "שם תצוגה חייב להכיל לפחות 2 תווים", en: "Display name must be at least 2 characters" },
  "auth.passwordMinLength": { he: "סיסמה חייבת להכיל לפחות 6 תווים", en: "Password must be at least 6 characters" },
  "auth.signInToView": { he: "התחבר כדי לצפות בפרופיל", en: "Sign in to view profile" },

  // Profile
  "profile.editProfile": { he: "ערוך פרופיל", en: "Edit profile" },
  "profile.shareProfile": { he: "שתף פרופיל", en: "Share profile" },
  "profile.following": { he: "עוקב", en: "Following" },
  "profile.followers": { he: "עוקבים", en: "Followers" },
  "profile.likes": { he: "לייקים", en: "Likes" },
  "profile.noVideos": { he: "עדיין אין סרטונים", en: "No videos yet" },
  "profile.uploadFirst": { he: "העלה את ההדגשה הראשונה שלך", en: "Upload your first highlight" },
  "profile.privateVideos": { he: "סרטונים פרטיים", en: "Private videos" },
  "profile.onlyYou": { he: "רק אתה יכול לראות סרטונים שאהבת", en: "Only you can see liked videos" },
  "profile.saved": { he: "שמורים", en: "Saved" },
  "profile.saveHighlights": { he: "שמור הדגשות כדי לצפות בהן אחר כך", en: "Save highlights to view them later" },
  "profile.follow": { he: "עקוב", en: "Follow" },
  "profile.message": { he: "הודעה", en: "Message" },
  "profile.playerNotFound": { he: "השחקן לא נמצא", en: "Player not found" },
  "profile.goBack": { he: "חזור", en: "Go back" },

  // Discover
  "discover.title": { he: "גלה", en: "Discover" },
  "discover.searchPlaceholder": { he: "חפש שחקנים, עמדות, קבוצות...", en: "Search players, positions, teams..." },
  "discover.trending": { he: "טרנדינג 🔥", en: "Trending 🔥" },
  "discover.topHighlights": { he: "הדגשות מובילות", en: "Top Highlights" },
  "discover.results": { he: "תוצאות", en: "results" },
  "discover.noResults": { he: "לא נמצאו תוצאות", en: "No results found" },
  "discover.tryAnother": { he: "נסה לחפש שם אחר", en: "Try a different search" },
  "discover.player": { he: "שחקן", en: "Player" },
  "discover.followersCount": { he: "עוקבים", en: "followers" },

  // Notifications
  "notifications.title": { he: "התראות", en: "Notifications" },
  "notifications.signInToSee": { he: "התחבר כדי לראות את ההתראות שלך", en: "Sign in to see your notifications" },
  "notifications.empty": { he: "אין התראות", en: "No notifications" },
  "notifications.emptyDesc": { he: "כשמישהו יעשה לייק, יגיב או יעקוב — תראה את זה כאן", en: "When someone likes, comments, or follows — you'll see it here" },
  "notifications.now": { he: "עכשיו", en: "now" },
  "notifications.minsAgo": { he: "לפני", en: "ago" },
  "notifications.min": { he: "ד׳", en: "m" },
  "notifications.hour": { he: "ש׳", en: "h" },
  "notifications.days": { he: "ימים", en: "days" },
  "notifications.weeks": { he: "שבועות", en: "weeks" },

  // Create
  "create.title": { he: "העלאת תוכן", en: "Upload Content" },
  "create.signInRequired": { he: "יש להתחבר", en: "Sign in required" },
  "create.signInDesc": { he: "עליך להתחבר כדי להעלות תוכן", en: "You need to sign in to upload content" },
  "create.selectFile": { he: "לחץ לבחירת קובץ", en: "Click to select a file" },
  "create.video": { he: "וידאו", en: "Video" },
  "create.image": { he: "תמונה", en: "Image" },
  "create.upTo100MB": { he: "עד 100MB", en: "Up to 100MB" },
  "create.titleField": { he: "כותרת *", en: "Title *" },
  "create.descField": { he: "תיאור (אופציונלי)", en: "Description (optional)" },
  "create.tagsField": { he: "תגיות (מופרדות בפסיק: כדורסל, חטיפה, טריפל)", en: "Tags (comma-separated: basketball, dunk, triple)" },
  "create.publish": { he: "פרסם 🔥", en: "Publish 🔥" },
  "create.uploading": { he: "מעלה...", en: "Uploading..." },
  "create.success": { he: "הועלה בהצלחה! 🔥", en: "Uploaded successfully! 🔥" },
  "create.addTitleAndFile": { he: "יש להוסיף כותרת ולבחור קובץ", en: "Add a title and select a file" },
  "create.invalidFile": { he: "יש לבחור קובץ תמונה או וידאו", en: "Select an image or video file" },
  "create.fileTooLarge": { he: "גודל הקובץ חייב להיות עד 100MB", en: "File size must be under 100MB" },
  "create.uploadFailed": { he: "ההעלאה נכשלה", en: "Upload failed" },

  // Settings
  "settings.title": { he: "הגדרות", en: "Settings" },
  "settings.appearance": { he: "מראה", en: "Appearance" },
  "settings.darkMode": { he: "מצב כהה", en: "Dark Mode" },
  "settings.lightMode": { he: "מצב בהיר", en: "Light Mode" },
  "settings.language": { he: "שפה", en: "Language" },
  "settings.hebrew": { he: "עברית", en: "Hebrew" },
  "settings.english": { he: "English", en: "English" },
  "settings.account": { he: "חשבון", en: "Account" },
  "settings.signOut": { he: "התנתק", en: "Sign Out" },
  "settings.signOutConfirm": { he: "האם אתה בטוח שברצונך להתנתק?", en: "Are you sure you want to sign out?" },

  // VideoCard
  "video.likeError": { he: "שגיאה בעדכון הלייק", en: "Error updating like" },
  "video.linkCopied": { he: "הקישור הועתק!", en: "Link copied!" },
  "video.followBtn": { he: "עקוב", en: "Follow" },
  "video.followingBtn": { he: "עוקב", en: "Following" },

  // Comments
  "comments.title": { he: "תגובות", en: "Comments" },
  "comments.signInToComment": { he: "התחבר כדי להגיב", en: "Sign in to comment" },
  "comments.placeholder": { he: "הוסף תגובה...", en: "Add a comment..." },
  "comments.empty": { he: "אין תגובות עדיין. היה הראשון! 🏀", en: "No comments yet. Be the first! 🏀" },
  "comments.sendError": { he: "שגיאה בשליחת התגובה", en: "Error sending comment" },
  "comments.deleteError": { he: "שגיאה במחיקת התגובה", en: "Error deleting comment" },
  "comments.anonymous": { he: "אנונימי", en: "Anonymous" },

  // Edit Profile
  "editProfile.title": { he: "עריכת פרופיל", en: "Edit Profile" },
  "editProfile.changePhoto": { he: "לחץ לשינוי תמונה", en: "Tap to change photo" },
  "editProfile.displayName": { he: "שם תצוגה *", en: "Display Name *" },
  "editProfile.position": { he: "עמדה", en: "Position" },
  "editProfile.team": { he: "קבוצה", en: "Team" },
  "editProfile.bio": { he: "ביו", en: "Bio" },
  "editProfile.save": { he: "שמור", en: "Save" },
  "editProfile.saving": { he: "שומר...", en: "Saving..." },
  "editProfile.success": { he: "הפרופיל עודכן בהצלחה", en: "Profile updated successfully" },
  "editProfile.error": { he: "שגיאה בעדכון הפרופיל", en: "Error updating profile" },
  "editProfile.nameMinLength": { he: "שם תצוגה חייב להכיל לפחות 2 תווים", en: "Display name must be at least 2 characters" },
  "editProfile.fileTooLarge": { he: "הקובץ גדול מדי (מקסימום 5MB)", en: "File too large (max 5MB)" },
  "editProfile.invalidImage": { he: "יש לבחור קובץ תמונה", en: "Please select an image file" },

  // Follow
  "follow.error": { he: "שגיאה", en: "Error" },
} as const;

export type TranslationKey = keyof typeof translations;
