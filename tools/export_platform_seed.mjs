import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
globalThis.localStorage = { getItem:() => null, setItem:() => {}, removeItem:() => {} };
globalThis.window = { dispatchEvent:() => {} };
globalThis.CustomEvent = class { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } };

const store = await import(pathToFileURL(path.join(root, "assets/js/store.js")).href);
const state = store.getState();
const payload = {
  generatedFrom:"V4.14 governed browser seed",
  profiles:state.profiles.map(({ id, displayName, avatarUrl, role, verificationStatus, canPost, trustScore, handle, bio, location, favouriteSport, baseFollowers, createdAt, isAthlete }) => ({
    id, displayName, avatarUrl, role, verificationStatus, canPost, trustScore, handle, bio, location, favouriteSport, baseFollowers, createdAt, isAthlete:!!isAthlete,
  })),
  posts:state.posts.map(({ id, authorId, content, sport, imageUrl, imageAlt, photoKey, moderationStatus, createdAt }) => ({ id, authorId, content, sport, imageUrl, imageAlt, photoKey, moderationStatus, createdAt })),
  comments:state.comments.map(({ id, postId, parentId, authorId, content, moderationStatus, createdAt }) => ({ id, postId, parentId, authorId, content, moderationStatus, createdAt })),
};
fs.writeFileSync(path.join(root, "assets/server/platform_seed.json"), JSON.stringify(payload, null, 2) + "\n");
console.log(`Wrote ${payload.profiles.length} profiles, ${payload.posts.length} posts and ${payload.comments.length} comments.`);
