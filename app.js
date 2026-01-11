import { createClient } from https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm;

const supabase = createClient(
  https://ihawjbayhwbfyeytgrhg.supabase.co
  sb_publishable_REKxzXBdaL9AHQzhUDv0-w_QRNk8XDO
);

// UI elements
const authDiv = document.getElementById("auth");
const showDashboard = async (user) => {
  authDiv.style.display = "none";
  dashboard.style.display = "block";

  const profile = await loadUserProfile(user);

  userEmailText.innerText = `
    Logged in as: ${profile.email}
    | Role: ${profile.role}
  `;

  if (profile.role === "creator") {
    document.getElementById("creatorPanel").style.display = "block";
  } else {
    document.getElementById("creatorPanel").style.display = "none";
  }

  loadPosts();
};


const userEmailText = document.getElementById("userEmail");

// SIGN UP
document.getElementById("signupBtn").addEventListener("click", async () => {
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  // Create profile
  await supabase.from("profiles").insert({
    id: data.user.id,
    email: email,
    role: "viewer"
  });

  alert("Signup successful! You can now log in.");
});


// LOGIN
document.getElementById("loginBtn").addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert(error.message);
  }
});

// LOGOUT
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await supabase.auth.signOut();
  showAuth();
});

// SESSION HANDLING
const showDashboard = async (user) => {
  authDiv.style.display = "none";
  dashboard.style.display = "block";

  const profile = await loadUserProfile(user);

  userEmailText.innerText = `
    Logged in as: ${profile.email}
    | Role: ${profile.role}
  `;

  document.getElementById("creatorPanel").style.display =
  profile.role === "creator" ? "block" : "none";

document.getElementById("adminPanel").style.display =
  profile.role === "admin" ? "block" : "none";


  loadPosts();
};


// CHECK LOGIN STATE ON PAGE LOAD
supabase.auth.getSession().then(({ data }) => {
  if (data.session) {
    showDashboard(data.session.user);
  } else {
    showAuth();
  }
});

// LISTEN FOR AUTH CHANGES
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    showDashboard(session.user);
  } else {
    showAuth();
  }
});
const loadUserProfile = async (user) => {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
};
document.getElementById("postBtn").addEventListener("click", async () => {
  const content = document.getElementById("postContent").value;

  const { data: session } = await supabase.auth.getSession();

  if (!content) return;

  await supabase.from("posts").insert({
    creator_id: session.session.user.id,
    content: content
  });

  document.getElementById("postContent").value = "";
  loadPosts();
});
const loadPosts = async () => {
  const { data } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  const postsDiv = document.getElementById("posts");
  postsDiv.innerHTML = "";

  data.forEach(post => {
    const div = document.createElement("div");
    div.style.padding = "10px";
    div.style.borderBottom = "1px solid #ccc";
    div.innerText = post.content;
    postsDiv.appendChild(div);
  });
};
document.getElementById("loadUsersBtn").addEventListener("click", async () => {
  const { data } = await supabase
    .from("profiles")
    .select("id, email, role, created_at");

  const usersDiv = document.getElementById("usersList");
  usersDiv.innerHTML = "";

  data.forEach(user => {
    const div = document.createElement("div");
    div.style.borderBottom = "1px solid #ddd";
    div.style.padding = "6px";
    div.innerText = `${user.email} | ${user.role}`;
    usersDiv.appendChild(div);
  });
});


