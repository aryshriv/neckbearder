const fs = require("fs");
const path = require("path");

const questions = [
  "Is Apple Vision Pro worth the $3,500 price?",
  "How long does Apple Vision Pro battery last?",
  "Can Apple Vision Pro replace my laptop?",
  "What apps are available for Apple Vision Pro?",
  "How does Apple Vision Pro compare to Meta Quest 3?",
  "Is Apple Vision Pro comfortable for long sessions?",
  "Can I use Apple Vision Pro for work?",
  "Does Apple Vision Pro work with Windows?",
  "How is the display quality on Apple Vision Pro?",
  "Is Apple Vision Pro good for gaming?",
  "Can I watch movies on Apple Vision Pro?",
  "How heavy is Apple Vision Pro?",
  "Does Apple Vision Pro cause motion sickness?",
  "Can I use Apple Vision Pro with glasses?",
  "What is the field of view on Apple Vision Pro?",
  "Is Apple Vision Pro worth it in 2025?",
  "How does Apple Vision Pro handle productivity?",
  "Can I code on Apple Vision Pro?",
  "Is Apple Vision Pro good for video editing?",
  "How is the passthrough quality?",
  "Does Apple Vision Pro support multiple monitors?",
  "Can I use Apple Vision Pro for meetings?",
  "How is the eye tracking on Apple Vision Pro?",
  "Is Apple Vision Pro good for reading?",
  "Can I use Apple Vision Pro outdoors?",
  "How does Apple Vision Pro handle hand tracking?",
  "Is Apple Vision Pro worth it for developers?",
  "Can I connect Apple Vision Pro to my Mac?",
  "How is the spatial audio on Apple Vision Pro?",
  "Does Apple Vision Pro work with iPhone?",
];

const subreddits = [
  "apple",
  "visionpro",
  "virtualreality",
  "mac",
  "technology",
  "gadgets",
];
const brands = ["Apple Vision Pro", "Vision Pro", "AVP"];

function escapeCSV(field) {
  if (field === null || field === undefined) return "";
  const str = String(field);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

const headers = [
  "Post ID",
  "Title",
  "Body",
  "URL",
  "Subreddit",
  "Upvotes",
  "Created At",
  "Comment Count",
  "Comments (JSON)",
];
const rows = [headers.map(escapeCSV).join(",")];

const now = Date.now();
const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

for (let i = 0; i < 300; i++) {
  const question = questions[i % questions.length];
  const brand = brands[i % brands.length];
  const title = question.replace("Apple Vision Pro", brand);
  const body = `Discussion about ${brand}. Many users are interested in learning more about this product and its features. Some are asking about compatibility, pricing, and use cases.`;
  const subreddit = `r/${subreddits[i % subreddits.length]}`;
  const upvotes = Math.floor(Math.random() * 5000) + 10;
  const createdAt = new Date(
    thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo)
  );
  const commentCount = Math.floor(Math.random() * 50);
  const comments = Array.from({ length: commentCount }, (_, j) => ({
    id: `comment_${i}_${j}`,
    body: `Comment about ${brand}. This is a sample response.`,
    upvotes: Math.floor(Math.random() * 200),
  }));

  const row = [
    `post_${i}`,
    title,
    body,
    `https://reddit.com/${subreddit}/post_${i}`,
    subreddit,
    upvotes,
    createdAt.toISOString(),
    commentCount,
    JSON.stringify(comments),
  ];

  rows.push(row.map(escapeCSV).join(","));
}

const exportsDir = path.join(process.cwd(), "data", "exports");
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
const filename = `backup-apple vision pro-${timestamp}-mock300.csv`;
const filepath = path.join(exportsDir, filename);

fs.writeFileSync(filepath, rows.join("\n"), "utf-8");
console.log(`✅ Created ${filename} with 300 rows`);
console.log(`📁 Location: ${filepath}`);
