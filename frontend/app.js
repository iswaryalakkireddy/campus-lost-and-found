const API = "/api";
let token = localStorage.getItem("token") || "";
let currentUser = JSON.parse(localStorage.getItem("user") || "null");
const $ = id => document.getElementById(id);
const headers = () => token ? { Authorization: `Bearer ${token}` } : {};

function showAuth(mode) {
  $("authModal").classList.remove("hidden");
  $("authContent").innerHTML = `<h2>${mode === "login" ? "Welcome back" : "Create your account"}</h2>
    <p class="muted">${mode === "login" ? "Login to manage your campus reports." : "Join the campus lost and found community."}</p>
    <form id="authForm" class="auth-form">
      ${mode === "register" ? '<label>Full name<input name="name" required></label>' : ""}
      <label>Email address<input name="email" type="email" required></label>
      <label>Password<input name="password" type="password" minlength="8" required></label>
      <button class="btn" type="submit">${mode === "login" ? "Login" : "Register"}</button>
      <p id="authMessage" class="message"></p>
    </form>
    <p class="muted">${mode === "login" ? 'New here? <a href="#" onclick="showAuth(\\'register\\')">Register</a>' : 'Already registered? <a href="#" onclick="showAuth(\\'login\\')">Login</a>'}</p>`;
  $("authForm").addEventListener("submit", async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
      const res = await fetch(`${API}/auth/${mode}`, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(data) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      token = result.token; currentUser = result.user;
      localStorage.setItem("token", token); localStorage.setItem("user", JSON.stringify(currentUser));
      closeAuth(); updateNav(); loadDashboard(); loadItems();
    } catch (err) { $("authMessage").textContent = err.message; }
  });
}
function closeAuth() { $("authModal").classList.add("hidden"); }
function logout() {
  token = ""; currentUser = null; localStorage.removeItem("token"); localStorage.removeItem("user");
  updateNav(); loadDashboard(); loadItems();
}
function updateNav() {
  $("authNav").innerHTML = currentUser
    ? `<span class="muted">Hi, ${escapeHtml(currentUser.name)}</span><button class="btn light" onclick="logout()">Logout</button>`
    : `<button class="btn light" onclick="showAuth('login')">Login</button><button class="btn" onclick="showAuth('register')">Register</button>`;
  if (currentUser?.role === "admin") $("admin").classList.remove("hidden");
  else $("admin").classList.add("hidden");
}
async function loadItems() {
  const params = new URLSearchParams();
  if ($("search").value.trim()) params.set("search", $("search").value.trim());
  if ($("typeFilter").value) params.set("type", $("typeFilter").value);
  if ($("categoryFilter").value) params.set("category", $("categoryFilter").value);
  if ($("locationFilter").value.trim()) params.set("location", $("locationFilter").value.trim());
  const grid = $("itemsGrid"); grid.innerHTML = '<p class="muted">Loading...</p>';
  try {
    const res = await fetch(`${API}/items?${params}`);
    const items = await res.json();
    if (!items.length) { grid.innerHTML = '<p class="muted">No reports found. Try another search.</p>'; return; }
    grid.innerHTML = items.map(item => `<article class="item-card">
      <div class="item-image">${item.image ? `<img src="${item.image}" alt="${escapeHtml(item.title)}" style="width:100%;height:145px;object-fit:cover">` : (item.category === "Electronics" ? "🎧" : item.category === "Books & Notes" ? "📚" : item.category === "ID & Cards" ? "🪪" : "🎒")}</div>
      <div class="item-body"><span class="tag">${escapeHtml(item.type)} • ${escapeHtml(item.category)}</span>
      <h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p>
      <div class="item-meta">📍 ${escapeHtml(item.location)} &nbsp; · &nbsp; ${new Date(item.date).toLocaleDateString()}</div>
      ${currentUser && String(item.postedBy?._id || item.postedBy) !== currentUser.id ? `<button class="btn" onclick="submitClaim('${item._id}')">Submit a claim</button>` : ""}
      </div></article>`).join("");
  } catch { grid.innerHTML = '<p class="muted">Could not load reports. Check that the server is running.</p>'; }
}
async function submitClaim(itemId) {
  if (!token) return showAuth("login");
  const message = prompt("Explain how you can identify this item:");
  if (!message) return;
  const res = await fetch(`${API}/claims`, { method:"POST", headers:{...headers(),"Content-Type":"application/json"}, body:JSON.stringify({itemId,message}) });
  const data = await res.json(); alert(data.message || "Request completed"); loadDashboard();
}
$("reportForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!token) { showAuth("login"); $("reportMessage").textContent = "Please login before submitting a report."; return; }
  const form = new FormData(e.target);
  try {
    const res = await fetch(`${API}/items`, { method:"POST", headers:headers(), body:form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    $("reportMessage").textContent = "Your report has been submitted successfully.";
    e.target.reset(); loadItems();
  } catch (err) { $("reportMessage").textContent = err.message; }
});
async function loadDashboard() {
  const box = $("dashboardContent");
  if (!token || !currentUser) { box.innerHTML = '<p class="muted">Login to view your reports and claims.</p>'; return; }
  try {
    const [itemsRes, claimsRes] = await Promise.all([
      fetch(`${API}/items`, {headers:headers()}), fetch(`${API}/claims/mine`, {headers:headers()})
    ]);
    const allItems = await itemsRes.json(), claims = await claimsRes.json();
    const mine = Array.isArray(allItems) ? allItems.filter(i => String(i.postedBy?._id || i.postedBy) === currentUser.id) : [];
    box.innerHTML = `<h3>My reports (${mine.length})</h3><div class="dashboard-list">${mine.map(i=>`<div class="dashboard-row"><span><b>${escapeHtml(i.title)}</b><br><small>${i.type} · ${i.status}</small></span><button class="small-btn" onclick="deleteItem('${i._id}')">Delete</button></div>`).join("") || '<p class="muted">You have not posted any items.</p>'}</div>
      <h3 style="margin-top:25px">My claims (${claims.length})</h3><div class="dashboard-list">${claims.map(c=>`<div class="dashboard-row"><span><b>${escapeHtml(c.item?.title || "Item")}</b><br><small>${escapeHtml(c.status)}</small></span></div>`).join("") || '<p class="muted">You have not submitted any claims.</p>'}</div>`;
    if (currentUser.role === "admin") loadAdmin();
  } catch { box.innerHTML = '<p class="muted">Could not load dashboard.</p>'; }
}
async function deleteItem(id) {
  if (!confirm("Delete this report?")) return;
  const res = await fetch(`${API}/items/${id}`, {method:"DELETE",headers:headers()});
  const data = await res.json(); alert(data.message); loadItems(); loadDashboard();
}
async function loadAdmin() {
  try {
    const [statsRes, claimsRes] = await Promise.all([
      fetch(`${API}/admin/stats`,{headers:headers()}), fetch(`${API}/claims`,{headers:headers()})
    ]);
    const stats = await statsRes.json(), claims = await claimsRes.json();
    $("adminContent").innerHTML = `<div class="stats"><div><strong>${stats.users}</strong><span>Students</span></div><div><strong>${stats.items}</strong><span>Reports</span></div><div><strong>${stats.lost}</strong><span>Lost</span></div><div><strong>${stats.found}</strong><span>Found</span></div><div><strong>${stats.pendingClaims}</strong><span>Pending claims</span></div></div>
      <h3>Manage claims</h3><div class="dashboard-list">${claims.map(c=>`<div class="dashboard-row"><span><b>${escapeHtml(c.item?.title || "Item")}</b><br><small>${escapeHtml(c.claimant?.name || "Student")} · ${escapeHtml(c.message)} · ${c.status}</small></span>${c.status==="pending"?`<span><button class="small-btn" onclick="reviewClaim('${c._id}','approved')">Approve</button> <button class="small-btn" onclick="reviewClaim('${c._id}','rejected')">Reject</button></span>`:""}</div>`).join("") || '<p class="muted">No claims yet.</p>'}</div>`;
  } catch { $("adminContent").textContent = "Could not load admin data. Check admin login."; }
}
async function reviewClaim(id,status) {
  const res = await fetch(`${API}/claims/${id}`,{method:"PATCH",headers:{...headers(),"Content-Type":"application/json"},body:JSON.stringify({status})});
  const data = await res.json(); alert(data.message); loadAdmin();
}
function escapeHtml(value="") { return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
["search","typeFilter","categoryFilter","locationFilter"].forEach(id => $(id).addEventListener(id==="search"||id==="locationFilter"?"input":"change", loadItems));
updateNav(); loadItems(); loadDashboard();
