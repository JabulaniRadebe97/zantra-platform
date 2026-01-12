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

let profile = null;

/* AUTH */
logoutBtn?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  location.href = "/";
});

supabase.auth.onAuthStateChange(async (_, session) => {
  if (!session) {
    location.href = "/";
    return;
  }
  await loadProfile(session.user.id);
  await loadFeed();
});

/* PROFILE */
async function loadProfile(id) {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  profile = data;
  userInfo.innerText = `Role: ${data.role} | Credits: ${data.tokens}`;

  creatorPanel.style.display = data.role === "creator" ? "block" : "none";
  adminPanel.style.display = data.role === "admin" ? "block" : "none";
}

/* POST */
postBtn?.addEventListener("click", async () => {
  const content = postContent.value.trim();
  if (!content) return;

  const visibility =
    document.querySelector("input[name='visibility']:checked").value;

  await supabase.from("posts").insert({
    creator_id: profile.id,
    content,
    visibility
  });

  postContent.value = "";
  await loadFeed();
});

/* FEED */
async function loadFeed() {
  const { data: posts } = await supabase
    .from("posts")
    .select("*, profiles(display_name)")
    .order("created_at", { ascending: false });

  feedDiv.innerHTML = "";

  for (const post of posts) {
    if (post.visibility === "subscriber") {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("subscriber", profile.id)
        .eq("creator", post.creator_id)
        .single();

      if (!sub) continue;
    }

    const div = document.createElement("div");
    div.className = "feed-card";

    div.innerHTML = `
      <strong>${post.profiles?.display_name || "Creator"}</strong>
      <p>${post.content}</p>
      ${post.visibility === "subscriber"
        ? "<small>🔒 Subscribers only</small>"
        : ""}
    `;

    feedDiv.appendChild(div);
  }

  if (feedDiv.innerHTML === "") {
    feedDiv.innerHTML = "<p>No posts available.</p>";
  }
}

/* ADMIN */
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
