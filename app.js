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
const authDiv = document.getElementById("auth");
const dashboardDiv = document.getElementById("dashboard");
const logoutBtn = document.getElementById("logoutBtn");
const userInfo = document.getElementById("userInfo");
const creatorPanel = document.getElementById("creatorPanel");
const postBtn = document.getElementById("postBtn");
const postContent = document.getElementById("postContent");
const feedDiv = document.getElementById("feed");
const adminPanel = document.getElementById("adminPanel");
const loadPostsBtn = document.getElementById("loadPostsBtn");
const adminPostsDiv = document.getElementById("adminPosts");

let currentProfile = null;

/* AUTH */
logoutBtn.onclick = async () => {
  await supabase.auth.signOut();
  location.href = "/";
  is_online = false;
  last_seen= minute;
};

supabase.auth.onAuthStateChange(async (_, session) => {
  if (!session) {
    location.href = "/";
    return;
  }
  await loadProfile(session.user.id);
  await loadFeed();
});

/* PROFILE */
async function loadProfile(userId) {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  currentProfile = data;

  userInfo.innerText =
    `Logged in | Role: ${data.role} | Credits: ${data.tokens}`;
    is_online = true;
    last_seen= minute;

  creatorPanel.style.display = data.role === "creator" ? "block" : "none";
  adminPanel.style.display = data.role === "admin" ? "block" : "none";
}

/* POSTS */
postBtn.onclick = async () => {
  if (!postContent.value.trim()) return;

  await supabase.from("posts").insert({
    creator_id: currentProfile.id,
    content: postContent.value.trim()
  });

  postContent.value = "";
  await loadFeed();
};

/* FEED */
async function loadFeed() {
  const { data } = await supabase
    .from("posts")
    .select(`
      id,
      content,
      creator_id,
      created_at,
      profiles ( role )
    `)
    .order("created_at", { ascending: false });

  feedDiv.innerHTML = "";

  if (!data || data.length === 0) {
    feedDiv.innerHTML = "<p>No creator content yet.</p>";
    return;
  }

  data.forEach(post => {
    const card = document.createElement("div");
    card.className = "feed-card";

    card.innerHTML = `
      <strong>Creator</strong>
      <p>${post.content}</p>
      <button class="tip">Tip 10 Credits</button>
    `;

    card.querySelector(".tip").onclick = () =>
      tipCreator(post.creator_id);

    feedDiv.appendChild(card);
  });
}

/* TIPPING */
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

/* ADMIN */
loadPostsBtn.onclick = async () => {
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
};