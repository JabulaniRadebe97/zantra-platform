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
const showDashboard = (user) => {
  authDiv.style.display = "none";
  dashboard.style.display = "block";
  userEmailText.innerText = `Logged in as: ${user.email}`;
};

const showAuth = () => {
  authDiv.style.display = "block";
  dashboard.style.display = "none";
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
document.getElementById("beCreatorBtn").addEventListener("click", async () => {
  const { data: session } = await supabase.auth.getSession();
  await supabase
    .from("profiles")
    .update({ role: "creator" })
    .eq("id", session.session.user.id);

  location.reload();
});

document.getElementById("beViewerBtn").addEventListener("click", async () => {
  const { data: session } = await supabase.auth.getSession();
  await supabase
    .from("profiles")
    .update({ role: "viewer" })
    .eq("id", session.session.user.id);

  location.reload();
});


