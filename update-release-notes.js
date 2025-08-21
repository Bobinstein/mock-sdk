#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { Octokit } = require("@octokit/rest");
const simpleGit = require("simple-git");
const axios = require("axios");

/**
 * Script to update release notes from SDK changelog
 * This script reads the CHANGELOG.md from the SDK repo and updates
 * the release-notes.md file in the docs portal repo while maintaining MDX formatting.
 */

const SDK_CHANGELOG_PATH = process.env.SDK_CHANGELOG_PATH || "./CHANGELOG.md";
const RELEASE_NOTES_PATH = "./release-notes.md";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

const octokit = new Octokit({ auth: GITHUB_TOKEN });

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    process.exit(1);
  }
}

function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✅ Successfully updated ${filePath}`);
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error.message);
    process.exit(1);
  }
}

function parseChangelog(changelogContent) {
  // Extract the latest version section (everything from the first ## [version] to the next ## or end)
  const lines = changelogContent.split("\n");
  let latestVersion = "";
  let latestContent = [];
  let inLatestVersion = false;

  for (const line of lines) {
    // Check if this is a version header
    if (line.startsWith("## [")) {
      if (!inLatestVersion) {
        // Start of the latest version
        inLatestVersion = true;
        latestVersion = line.trim();
        latestContent.push(line);
      } else {
        // We've hit the next version, stop here
        break;
      }
    } else if (inLatestVersion) {
      latestContent.push(line);
    }
  }

  // Clean up the content - remove any duplicate version headers that might have been included
  const cleanContent = latestContent.filter((line) => !line.startsWith("## ["));

  return {
    version: latestVersion,
    content: cleanContent.join("\n").trim(),
    full: `${latestVersion}\n${cleanContent.join("\n")}`.trim(),
  };
}

function insertReleaseIntoDocs(docsContent, newRelease) {
  const lines = docsContent.split("\n");
  let inFrontmatter = false;
  let overviewFound = false;
  let overviewContent = [];
  let insertIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "---" && !inFrontmatter) {
      inFrontmatter = true;
    } else if (line.trim() === "---" && inFrontmatter) {
      inFrontmatter = false;
    } else if (!inFrontmatter && line.startsWith("## Overview")) {
      overviewFound = true;
      insertIndex = i;
    } else if (overviewFound && line.startsWith("## [")) {
      // Found the first versioned release section, stop collecting Overview content
      break;
    } else if (overviewFound) {
      overviewContent.push(line);
      insertIndex = i + 1;
    }
  }

  // Insert new release after Overview and its content with proper spacing
  const before = lines.slice(0, insertIndex).join("\n");
  const after = lines.slice(insertIndex).join("\n");

  // Add proper spacing: one blank line before new release, two blank lines after
  return `${before}\n\n${newRelease.full}\n\n${after}`.trim();
}

function removeDuplicateHeaders(content) {
  const lines = content.split("\n");
  const seenHeaders = new Set();
  const cleanedLines = [];

  for (const line of lines) {
    if (line.startsWith("## [")) {
      // If we've seen this header before, skip it
      if (seenHeaders.has(line.trim())) {
        continue;
      }
      seenHeaders.add(line.trim());
    }
    cleanedLines.push(line);
  }

  return cleanedLines.join("\n");
}

async function sendSlackNotification(message) {
  if (!SLACK_WEBHOOK_URL) {
    console.log("⚠️ No Slack webhook URL provided, skipping notification");
    return;
  }

  try {
    await axios.post(SLACK_WEBHOOK_URL, {
      text: message,
    });
    console.log("✅ Slack notification sent successfully");
  } catch (error) {
    console.error("❌ Failed to send Slack notification:", error.message);
  }
}

async function updateReleaseNotes() {
  console.log("🔄 Starting release notes update...");

  // Read the SDK changelog
  console.log(`📖 Reading SDK changelog from: ${SDK_CHANGELOG_PATH}`);
  const changelogContent = readFile(SDK_CHANGELOG_PATH);

  // Parse the latest version
  const newRelease = parseChangelog(changelogContent);

  if (!newRelease.version || !newRelease.content) {
    console.error("❌ Could not parse changelog content");
    process.exit(1);
  }

  console.log(`📋 Latest version found: ${newRelease.version}`);

  // Read existing release notes
  let existingContent = "";
  try {
    existingContent = readFile(RELEASE_NOTES_PATH);
  } catch (error) {
    console.log("📝 No existing release notes found, creating new file");
  }

  // Check if this version already exists and clean up any duplicates
  if (existingContent.includes(newRelease.version)) {
    console.log(
      "✅ This version already exists in release notes, no update needed"
    );
    return;
  }

  // Clean up any existing duplicate headers in the content
  existingContent = removeDuplicateHeaders(existingContent);

  // Insert new release into existing content
  let updatedContent;
  if (existingContent.includes("## Overview")) {
    // Insert after Overview section
    updatedContent = insertReleaseIntoDocs(existingContent, newRelease);
  } else {
    // No Overview section, prepend to existing content
    updatedContent = `${newRelease.full}\n\n${existingContent}`.trim();
  }

  // Write the updated release notes
  writeFile(RELEASE_NOTES_PATH, updatedContent);

  // Send Slack notification
  await sendSlackNotification(
    `🔄 New SDK changelog update: ${newRelease.version}\n` +
      `Release notes have been updated in the docs portal.\n` +
      `Please review for additional documentation updates.`
  );

  console.log("🎉 Release notes update completed successfully!");
}

// Run the script
if (require.main === module) {
  updateReleaseNotes();
}

module.exports = {
  updateReleaseNotes,
  parseChangelog,
  insertReleaseIntoDocs,
  removeDuplicateHeaders,
};
