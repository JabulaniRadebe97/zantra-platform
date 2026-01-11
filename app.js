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

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const userInfo = document.getElementById("userInfo");

const creatorPanel = document.getElementById("creatorPanel");
const postContent = document.getElementById("postContent");
const postBtn = document.getElementById("postBtn");

const feedDiv = document.getElementById("feed");

const adminPanel = document.getElementById("adminPanel");
const loadPostsBtn = document.getElementById("loadPostsBtn");
const adminPostsDiv = document.getElementById("adminPosts");

/* =========================
   AUTH ACTIONS
========================= */
signupBtn.onclick = async () => {
  const { data, error } = await supabase.auth.signUp({
    email: emailInput.value,
    password: passwordInput.value
  });

  if (error) {
    alert(error.message);
    return;
  }

  // Create profile
  await supabase.from("profiles").insert({
    id: data.user.id,
    role: "viewer",
    tokens: 100
  });

  alert("Signup successful. You can now log in.");
};

loginBtn.onclick = async () => {
  const { error } = await supabase.auth.signInWithPassword({
    email: emailInput.value,
    password: passwordInput.value
  });

  if (error) alert(error.message);
};

logoutBtn.onclick = async () => {
  await supabase.auth.signOut();
};

/* =========================
   SESSION HANDLING
========================= */
supabase.auth.onAuthStateChange(async (event, session) => {
  if (session) {
    authDiv.style.display = "none";
    dashboardDiv.style.display = "block";
    await loadUser(session.user);
    await loadFeed();
  } else {
    authDiv.style.display = "block";
    dashboardDiv.style.display = "none";
  }
});

/* =========================
   LOAD USER & ROLE
========================= */
async function loadUser(user) {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  userInfo.innerText = `Logged in as ${user.email} | Role: ${data.role} | Tokens: ${data.tokens}`;

  creatorPanel.style.display = data.role === "creator" ? "block" : "none";
  adminPanel.style.display = data.role === "admin" ? "block" : "none";
}

/* =========================
   POSTS
========================= */
postBtn.onclick = async () => {
  const content = postContent.value.trim();
  if (!content) return;

  const { data: session } = await supabase.auth.getSession();

  await supabase.from("posts").insert({
    creator_id: session.session.user.id,
    content
  });

  postContent.value = "";
  await loadFeed();
};

async function loadFeed() {
  const { data } = await supabase
    .from("posts")
    .select("id, content, creator_id, created_at")
    .order("created_at", { ascending: false });

  feedDiv.innerHTML = "";

  if (!data || data.length === 0) {
    feedDiv.innerText = "No posts yet.";
    return;
  }

  data.forEach(post => {
    const div = document.createElement("div");

    const p = document.createElement("p");
    p.innerText = post.content;

    const tipBtn = document.createElement("button");
    tipBtn.innerText = "Tip 10 Credits";
    tipBtn.onclick = () => tipCreator(post.creator_id);

    div.appendChild(p);
    div.appendChild(tipBtn);
    feedDiv.appendChild(div);
  });
}

/* =========================
   TIPPING LOGIC
========================= */
async function tipCreator(creatorId) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session.user.id;

  if (creatorId === userId) {
    alert("You cannot tip yourself.");
    return;
  }

  const { data: sender } = await supabase
    .from("profiles")
    .select("tokens")
    .eq("id", userId)
    .single();

  if (sender.tokens < 10) {
    alert("Not enough credits.");
    return;
  }

  const { data: receiver } = await supabase
    .from("profiles")
    .select("tokens")
    .eq("id", creatorId)
    .single();

  await supabase.from("profiles").update({ tokens: sender.tokens - 10 }).eq("id", userId);
  await supabase.from("profiles").update({ tokens: receiver.tokens + 10 }).eq("id", creatorId);

  await supabase.from("transactions").insert({
    from_user: userId,
    to_user: creatorId,
    amount: 10
  });

  await loadUser(session.session.user);
  alert("Tip sent!");
}

/* =========================
   ADMIN ACTIONS
========================= */
loadPostsBtn.onclick = async () => {
  const { data } = await supabase
    .from("posts")
    .select("id, content, created_at");

  adminPostsDiv.innerHTML = "";

  data.forEach(post => {
    const div = document.createElement("div");

    const p = document.createElement("p");
    p.innerText = post.content;

    const del = document.createElement("button");
    del.innerText = "Delete";
    del.onclick = async () => {
      await supabase.from("posts").delete().eq("id", post.id);
      await loadFeed();
      loadPostsBtn.click();
    };

    div.appendChild(p);
    div.appendChild(del);
    adminPostsDiv.appendChild(div);
  });
};
