// Supabase sozlamalari
const SUPABASE_URL = "https://pbkmzdfaskzifvsxrizd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBia216ZGZhc2t6aWZ2c3hyaXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg4NjgsImV4cCI6MjA2OTM4NDg2OH0.N4HysjRwrACKFmZZF0q51_9K1dvWRpRjAUeFO5F3y1s";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const divMsg = document.getElementById("msgId");
var ism = "";
var txt = document.getElementById("txtid");
var fileInput = document.getElementById("fileid");

let verificationCode = "";
let savedUser = {};

// ---------------- CHAT ----------------
async function sendMessage() {
  var vaqt = new Date().toTimeString().slice(0, 8) + " / " + new Date().toDateString();

  // Agar matn bo‘lsa
  if (txt.value.trim()) {
    await supabaseClient.from("massages").insert([
      { user: ism, msg: txt.value.trim(), time_insert: vaqt, type: "text" }
    ]);
    txt.value = "";
  }

  // Agar fayl tanlangan bo‘lsa
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const filePath = `${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabaseClient
      .storage.from("File") // katta F bilan!
      .upload(filePath, file);

    if (!uploadError) {
      const { data: publicUrlData } = supabaseClient
        .storage.from("File")
        .getPublicUrl(filePath);

      await supabaseClient.from("massages").insert([
        { user: ism, msg: publicUrlData.publicUrl, time_insert: vaqt, type: "file" }
      ]);
    } else {
      alert("Fayl yuklashda xato: " + uploadError.message);
    }

    fileInput.value = "";
  }
}

// ✅ Xabar chiqarishni alohida funksiya qildik
function renderMessage(d) {
  let stat = (ism === d.user) ? "me" : "other";

  let div = document.createElement("div");
  div.className = stat;

  let html = `
    <h4>${d.user}</h4>
    ${d.type === "file"
      ? `<a href="${d.msg}" target="_blank">📎 Faylni ochish</a>`
      : `<p>${d.msg}</p>`}
    <small>${d.time_insert}</small>
  `;

  // ✅ O‘z xabarlaringizga o‘chirish tugmasi qo‘shildi
  if (ism === d.user) {
    html += `<button class="delete-btn" onclick="deleteMessage(${d.id})">❌ O‘chirish</button>`;
  }

  div.innerHTML = html;
  divMsg.appendChild(div);
  divMsg.scrollTop = divMsg.scrollHeight;
}

async function loadData() {
  const { data, error } = await supabaseClient.from("massages").select("*").order("id", { ascending: true });
  if (error) {
    divMsg.innerHTML = error.message;
  } else {
    divMsg.innerHTML = "";
    data.forEach(d => renderMessage(d));
    divMsg.scrollTop = divMsg.scrollHeight;
  }
}

// ✅ O‘chirish funksiyasi
async function deleteMessage(id) {
  if (!confirm("Xabarni o‘chirmoqchimisiz?")) return;

  const { error } = await supabaseClient
    .from("massages")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Xato: " + error.message);
  }
}

// ---------------- LOGIN ----------------
async function kirish() {
  let nameVal = document.getElementById("nameId").value.trim();
  let passVal = document.getElementById("passId").value.trim();

  if (!nameVal || !passVal) {
    alert("Ism va parolni kiriting!");
    return;
  }

  const { data: odam } = await supabaseClient
    .from("users")
    .select("*")
    .eq("name", nameVal)
    .eq("pass", passVal);

  if (odam && odam.length === 1) {
    ism = nameVal;
    document.getElementById("divsignin").style.display = "none";
    document.getElementById("chatDiv").style.display = "flex";
    loadData();

    supabaseClient.channel("massages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "massages" }, (payload) => {
        renderMessage(payload.new);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "massages" }, (payload) => {
        loadData();
      })
      .subscribe();
  } else {
    alert("Ism yoki parol noto‘g‘ri!");
  }
}

// ---------------- SIGN UP ----------------
async function signUp() {
  let newName = document.getElementById("newNameId").value.trim();
  let newEmail = document.getElementById("newEmailId").value.trim();
  let newPass = document.getElementById("newPassId").value.trim();

  if (!newName || !newEmail || !newPass) {
    alert("Barcha maydonlarni to'ldiring!");
    return;
  }

  if (!newEmail.endsWith("@")) {
    alert("Iltimos soxta emaildan foydalanmang!!!");
    return;
  }

  verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    await emailjs.send("service_zdl3mmd", "template_1r61t21", {
      passcode: verificationCode,
      time: new Date().toTimeString(),
      email: newEmail,
    });
    alert('Email yuborildi!');
  } catch (error) {
    alert(error);
  }

  savedUser = { name: newName, email: newEmail, pass: newPass };

  document.getElementById("signupStep1").style.display = "none";
  document.getElementById("verifyDiv").style.display = "flex";
}

// ---------------- VERIFY ----------------
async function verifyCode() {
  let userCode = document.getElementById("verifyCode").value.trim();

  if (userCode === verificationCode) {
    const { error } = await supabaseClient.from("users").insert([savedUser]);

    if (error) {
      alert("Xato: " + error.message);
    } else {
      alert("Ro'yxatdan muvaffaqiyatli o'tdingiz!");
      location.reload();
    }
  } else {
    alert("Kod noto'g'ri!");
  }
}

// ---------------- TOGGLE ----------------
function showSignUp() {
  document.getElementById("divsignin").style.display = "none";
  document.getElementById("divsignup").style.display = "flex";
}

function showSignIn() {
  document.getElementById("divsignup").style.display = "none";
  document.getElementById("divsignin").style.display = "flex";
}
