import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* =========================
   SUPABASE CONFIG
========================= */
const supabase = createClient(
  "https://ihawjbayhwbfyeytgrhg.supabase.co",
  "sb_publishable_REKxzXBdaL9AHQzhUDv0-w_QRNk8XDO"
);

/* =========================
   ELEMENTS
========================= */
const logoutBtn = document.getElementById("logoutBtn");
const userInfo = document.getElementById("userInfo");
const creatorPanel = document.getElementById("creatorPanel");
const postBtn = document.getElementById("postBtn");
const postContent = document.getElementById("postContent");
const feedDiv = document.getElementById("feed");
const adminPanel = document.getElementById("adminPanel");
const loadPostsBtn = document.getElementById("loadPostsBtn");
const adminPostsDiv = document.getElementById("adminPosts");

/* =========================
   STATE
========================= */
let currentProfile = null;
let heartbeatInterval = null;

/* =========================
   AUTH & SESSION
========================= */
logoutBtn?.addEventListener("click", async () => {
  await setOffline();
  await supabase.auth.signOut();
  location.href = "/";
});

supabase.auth.onAuthStateChange(async (_, session) => {
  if (!session) {
    location.href = "/";
    return;
  }

  await loadProfile(session.user.id);
  await setOnline();
  startHeartbeat();
  await loadFeed();
});

/* =========================
   PROFILE
========================= */
async function loadProfile(userId) {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  currentProfile = data;

  if (userInfo) {
    userInfo.innerText =
      `Logged in · Role: ${data.role} · Credits: ${data.tokens}`;
  }

  if (creatorPanel) {
    creatorPanel.style.display =
      data.role === "creator" ? "block" : "none";
  }

  if (adminPanel) {
    adminPanel.style.display =
      data.role === "admin" ? "block" : "none";
  }
}

/* =========================
   LIVE STATUS
========================= */
async function setOnline() {
  if (!currentProfile) return;

  await supabase.from("profiles").update({
    is_online: true,
    last_seen: new Date().toISOString()
  }).eq("id", currentProfile.id);
}

async function setOffline() {
  if (!currentProfile) return;

  await supabase.from("profiles").update({
    is_online: false,
    last_seen: new Date().toISOString()
  }).eq("id", currentProfile.id);
}

function startHeartbeat() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);

  heartbeatInterval = setInterval(async () => {
    if (!currentProfile) return;

    await supabase.from("profiles").update({
      last_seen: new Date().toISOString()
    }).eq("id", currentProfile.id);
  }, 120000); // every 2 minutes
}

/* Browser close / refresh */
window.addEventListener("beforeunload", () => {
  navigator.sendBeacon(
    "/api/offline",
    JSON.stringify({ user: currentProfile?.id })
  );
});

/* =========================
   POSTS
========================= */
postBtn?.addEventListener("click", async () => {
  if (!postContent.value.trim()) return;

  await supabase.from("posts").insert({
    creator_id: currentProfile.id,
    content: postContent.value.trim()
  });

  postContent.value = "";
  await loadFeed();
});

/* =========================
   FEED (WITH LIVE BADGE)
========================= */
async function loadFeed() {
  const { data } = await supabase
    .from("posts")
    .select(`
      id,
      content,
      created_at,
      creator_id,
      profiles (
        display_name,
        is_online
      )
    `)
    .order("created_at", { ascending: false });

  if (!feedDiv) return;
  feedDiv.innerHTML = "";

  if (!data || data.length === 0) {
    feedDiv.innerHTML = "<p>No creator content yet.</p>";
    return;
  }

  data.forEach(post => {
    const card = document.createElement("div");
    card.className = "feed-card";

    const liveBadge = post.profiles?.is_online
      ? `<span style="color:#22c55e;font-weight:bold;">● LIVE</span>`
      : `<span style="color:#888;">Offline</span>`;

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;">
        <strong>${post.profiles?.display_name || "Creator"}</strong>
        ${liveBadge}
      </div>
      <p>${post.content}</p>
      <button class="tip">Tip 10 Credits</button>
    `;

    card.querySelector(".tip").onclick = () =>
      tipCreator(post.creator_id);

    feedDiv.appendChild(card);
  });
}

/* =========================
   TIPPING
========================= */
async function tipCreator(creatorId) {
  if (creatorId === currentProfile.id) {
    alert("You cannot tip yourself.");
    return;
  }

  if (currentProfile.tokens < 10) {
    alert("Not enough credits.");
    return;
  }

  const { data: receiver } = await supabase
    .from("profiles")
    .select("tokens")
    .eq("id", creatorId)
    .single();

  await supabase.from("profiles")
    .update({ tokens: currentProfile.tokens - 10 })
    .eq("id", currentProfile.id);

  await supabase.from("profiles")
    .update({ tokens: receiver.tokens + 10 })
    .eq("id", creatorId);

  await supabase.from("transactions").insert({
    from_user: currentProfile.id,
    to_user: creatorId,
    amount: 10
  });

  await loadProfile(currentProfile.id);
  alert("Tip sent.");
}

/* =========================
   ADMIN
========================= */
loadPostsBtn?.addEventListener("click", async () => {
  const { data } = await supabase.from("posts").select("*");
  adminPostsDiv.innerHTML = "";

  data.forEach(post => {
    const div = document.createElement("div");
    div.innerHTML = `
      <p>${post.content}</p>
      <button>Delete</button>
    `;

    div.querySelector("button").onclick = async () => {
      await supabase.from("posts").delete().eq("id", post.id);
      await loadFeed();
      loadPostsBtn.click();
    };

    adminPostsDiv.appendChild(div);
  });
});