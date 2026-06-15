#!/usr/bin/env node
/**
 * Daily follow-up for overdue "Pengajuan PR :" Asana tasks.
 *
 * Required env:
 *   ASANA_ACCESS_TOKEN
 *   ASANA_WORKSPACE_GID
 *   ASANA_APPROVER_GID (for @mention in Asana comments)
 * Optional:
 *   ASANA_APPROVER_NAME (default: "Approver")
 *   DRY_RUN=1
 */

import { execFileSync } from "node:child_process";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const FOLLOW_UP_MARKER = "[follow-up-pr-asana]";
const DRY_RUN = process.env.DRY_RUN === "1";

const config = {
  asanaToken: process.env.ASANA_ACCESS_TOKEN,
  workspaceGid: process.env.ASANA_WORKSPACE_GID,
  approverGid: process.env.ASANA_APPROVER_GID,
  approverName: process.env.ASANA_APPROVER_NAME || "Approver",
};

function todayWibDate() {
  const wib = new Date(Date.now() + WIB_OFFSET_MS);
  return wib.toISOString().slice(0, 10);
}

function tomorrowWibDate() {
  const wib = new Date(Date.now() + WIB_OFFSET_MS + 24 * 60 * 60 * 1000);
  return wib.toISOString().slice(0, 10);
}

function isTodayWib(isoTimestamp) {
  if (!isoTimestamp) return false;
  const wib = new Date(new Date(isoTimestamp).getTime() + WIB_OFFSET_MS);
  return wib.toISOString().slice(0, 10) === todayWibDate();
}

function approverMentionHtml() {
  if (!config.approverGid) return `@${config.approverName}`;
  return `<a data-asana-type="user" data-asana-gid="${config.approverGid}"></a>`;
}

async function asanaRequest(path, { method = "GET", body } = {}) {
  const res = await fetch(`https://app.asana.com/api/1.0${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${config.asanaToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = json?.errors?.map((e) => e.message).join("; ") || res.statusText;
    throw new Error(`Asana ${method} ${path}: ${message}`);
  }
  return json;
}

async function searchTasks() {
  const params = new URLSearchParams({
    "text.on": "name",
    "text": "Pengajuan PR :",
    completed: "false",
    "due_on.before": tomorrowWibDate(),
    opt_fields: "name,notes,due_on,completed,permalink_url",
  });

  const tasks = [];
  let offset;
  do {
    if (offset) params.set("offset", offset);
    const { data, next_page } = await asanaRequest(
      `/workspaces/${config.workspaceGid}/tasks/search?${params}`,
    );
    tasks.push(...(data || []));
    offset = next_page?.offset;
  } while (offset);

  return tasks.filter((task) => {
    if (task.completed) return false;
    if (!task.due_on || task.due_on > todayWibDate()) return false;
    return /github\.com\/[^/\s]+\/[^/\s]+\/pull\/\d+/i.test(task.notes || "");
  });
}

function parsePrInfo(task) {
  const text = `${task.name}\n${task.notes || ""}`;
  const linkMatch = text.match(/github\.com\/([^/\s]+)\/([^/\s]+)\/pull\/(\d+)/i);
  if (linkMatch) {
    return {
      owner: linkMatch[1],
      repo: linkMatch[2],
      number: Number(linkMatch[3]),
    };
  }

  const nameMatch = task.name.match(/Pengajuan PR\s*:\s*([^/\s]+)\/([^#\s]+)\s*#?(\d+)/i);
  if (nameMatch) {
    return {
      owner: nameMatch[1],
      repo: nameMatch[2],
      number: Number(nameMatch[3]),
    };
  }

  return null;
}

function ghApi(args) {
  return JSON.parse(
    execFileSync("gh", ["api", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }),
  );
}

function getPrStatus(owner, repo, number) {
  try {
    const pr = ghApi([`repos/${owner}/${repo}/pulls/${number}`]);
    if (pr.merged_at) return "MERGED";
    if (pr.state === "closed") return "CLOSED";
    return "OPEN";
  } catch (err) {
    const msg = String(err.stderr || err.message || err);
    if (msg.includes("404") || msg.includes("Not Found")) return "NOT_FOUND";
    throw err;
  }
}

async function getTaskStories(taskGid) {
  const { data } = await asanaRequest(
    `/tasks/${taskGid}/stories?opt_fields=created_at,text,resource_subtype`,
  );
  return data || [];
}

function hasFollowUpTodayInAsana(stories) {
  return stories.some(
    (story) =>
      story.resource_subtype === "comment_added" &&
      (story.text || "").includes(FOLLOW_UP_MARKER) &&
      isTodayWib(story.created_at),
  );
}

function hasFollowUpTodayOnPr(owner, repo, number) {
  try {
    const comments = ghApi([`repos/${owner}/${repo}/issues/${number}/comments`]);
    return comments.some(
      (comment) =>
        (comment.body || "").includes(FOLLOW_UP_MARKER) &&
        isTodayWib(comment.created_at),
    );
  } catch {
    return false;
  }
}

async function addTaskComment(taskGid, text) {
  if (DRY_RUN) {
    console.log(`[DRY_RUN] Asana comment on ${taskGid}: ${text}`);
    return;
  }
  await asanaRequest(`/tasks/${taskGid}/stories`, {
    method: "POST",
    body: { data: { text } },
  });
}

async function completeTask(taskGid) {
  if (DRY_RUN) {
    console.log(`[DRY_RUN] Complete task ${taskGid}`);
    return;
  }
  await asanaRequest(`/tasks/${taskGid}`, {
    method: "PUT",
    body: { data: { completed: true } },
  });
}

function addPrComment(owner, repo, number, body) {
  if (DRY_RUN) {
    console.log(`[DRY_RUN] PR comment on ${owner}/${repo}#${number}: ${body}`);
    return;
  }
  execFileSync(
    "gh",
    ["api", `repos/${owner}/${repo}/issues/${number}/comments`, "-f", `body=${body}`],
    { stdio: "inherit" },
  );
}

async function processTask(task) {
  const prInfo = parsePrInfo(task);
  if (!prInfo) {
    console.log(`SKIP ${task.gid}: cannot parse repo/PR from task`);
    return { status: "skipped", reason: "parse_failed" };
  }

  const { owner, repo, number } = prInfo;
  const repoFull = `${owner}/${repo}`;
  const stories = await getTaskStories(task.gid);
  const asanaFollowedUpToday = hasFollowUpTodayInAsana(stories);

  const prStatus = getPrStatus(owner, repo, number);
  console.log(`Task ${task.gid} | ${repoFull}#${number} | PR=${prStatus} | due=${task.due_on}`);

  if (prStatus === "MERGED") {
    if (asanaFollowedUpToday) {
      return { status: "skipped", reason: "already_handled_today" };
    }
    await completeTask(task.gid);
    await addTaskComment(
      task.gid,
      `${FOLLOW_UP_MARKER}\nPR ${repoFull}#${number} sudah **MERGED**. Task ditandai selesai otomatis.`,
    );
    return { status: "completed", prStatus };
  }

  if (prStatus === "CLOSED" || prStatus === "NOT_FOUND") {
    if (asanaFollowedUpToday) {
      return { status: "skipped", reason: "already_handled_today" };
    }
    const statusLabel = prStatus === "NOT_FOUND" ? "tidak ditemukan" : "CLOSED tanpa merge";
    await addTaskComment(
      task.gid,
      `${FOLLOW_UP_MARKER}\nPR ${repoFull}#${number} berstatus ${statusLabel}. ${approverMentionHtml()} mohon konfirmasi apakah task ini bisa ditutup atau perlu tindak lanjut.`,
    );
    return { status: "closed_confirmation", prStatus };
  }

  // OPEN
  const prFollowedUpToday = hasFollowUpTodayOnPr(owner, repo, number);
  if (asanaFollowedUpToday && prFollowedUpToday) {
    return { status: "skipped", reason: "follow_up_today" };
  }

  if (!asanaFollowedUpToday) {
    await addTaskComment(
      task.gid,
      `${FOLLOW_UP_MARKER}\nReminder: PR ${repoFull}#${number} masih **OPEN** dan due date (${task.due_on}) sudah lewat. ${approverMentionHtml()} mohon review dan approval.`,
    );
  }

  if (!prFollowedUpToday) {
    const prBody = [
      FOLLOW_UP_MARKER,
      `Reminder: due date task Asana sudah lewat (${task.due_on}).`,
      `${config.approverName}, mohon review dan approval PR ini.`,
      `Task Asana: ${task.permalink_url}`,
    ].join("\n\n");
    addPrComment(owner, repo, number, prBody);
  }

  return { status: "followed_up", prStatus };
}

async function main() {
  const today = todayWibDate();
  console.log(`=== Tindak Lanjut PR Asana | ${today} WIB ===`);

  const missing = [];
  if (!config.asanaToken) missing.push("ASANA_ACCESS_TOKEN");
  if (!config.workspaceGid) missing.push("ASANA_WORKSPACE_GID");
  if (missing.length) {
    console.error(`BLOCKED: missing env ${missing.join(", ")}`);
    process.exit(2);
  }

  const tasks = await searchTasks();
  console.log(`Found ${tasks.length} eligible task(s)`);

  const summary = {
    processed: 0,
    followed_up: 0,
    completed: 0,
    closed_confirmation: 0,
    skipped: 0,
    errors: 0,
  };

  for (const task of tasks) {
    try {
      const result = await processTask(task);
      summary.processed++;
      if (result.status in summary) summary[result.status]++;
      else if (result.status === "skipped") summary.skipped++;
    } catch (err) {
      summary.errors++;
      console.error(`ERROR task ${task.gid}:`, err.message || err);
    }
  }

  console.log("Summary:", JSON.stringify(summary));
  process.exit(summary.errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal:", err.message || err);
  process.exit(1);
});
