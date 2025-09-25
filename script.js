// Supabase sozlamalari
const SUPABASE_URL = "https://pbkmzdfaskzifvsxrizd.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBia216ZGZhc2t6aWZ2c3hyaXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg4NjgsImV4cCI6MjA2OTM4NDg2OH0.N4HysjRwrACKFmZZF0q51_9K1dvWRpRjAUeFO5F3y1s";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const divMsg = document.getElementById("msgId");
var ism = "";
var txt = document.getElementById("txtid");
var fileInput = document.getElementById("fileid");

let verificationCode = "";
let savedUser = {};

// ---------------- CHAT ----------------
async function sendMessage() {
  var vaqt =
    new Date().toTimeString().slice(0, 8) +
    " / " +
    new Date().toDateString();

  // Agar matn bo‘lsa
  if (txt.value.trim()) {
    await supabaseClient.from("massages").insert([
      { user: ism, msg: txt.value.trim(), time_insert: vaqt, type: "text" },
    ]);
    txt.value = "";
  }

  // Agar fayl tanlangan bo‘lsa
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const filePath = `${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabaseClient
      .storage.from("File")
      .upload(filePath, file);

    if (!uploadError) {
      const { data: publicUrlData } = supabaseClient
        .storage.from("File")
        .getPublicUrl(filePath);

      await supabaseClient.from("massages").insert([
        {
          user: ism,
          msg: publicUrlData.publicUrl,
          time_insert: vaqt,
          type: "file",
        },
      ]);
    } else {
      alert("Fayl yuklashda xato: " + uploadError.message);
    }

    fileInput.value = "";
  }
}

// ---------------- MESSAGE RENDER ----------------
function renderMessage(d) {
  let stat = ism === d.user ? "me" : "other";

  if (d.type === "file") {
    let ext = d.msg.split(".").pop().toLowerCase();

    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
      divMsg.innerHTML += `<div class='${stat}' id="msg-${d.id}">
        <h4>${d.user}</h4>
        <img src="${d.msg}" style="max-width:200px; border-radius:8px;" alt="Rasm">
        <small>${d.time_insert}</small>
        ${ism === d.user ? `<button onclick="deleteMessage(${d.id})">❌ O‘chirish</button>` : ""}
      </div>`;
    } else if (["mp4", "webm", "ogg"].includes(ext)) {
      divMsg.innerHTML += `<div class='${stat}' id="msg-${d.id}">
        <h4>${d.user}</h4>
        <video controls style="max-width:250px; border-radius:8px;">
          <source src="${d.msg}" type="video/${ext}">
          Sizning qurilmangiz video formatni qo‘llab-quvvatlamaydi.
        </video>
        <small>${d.time_insert}</small>
        ${ism === d.user ? `<button onclick="deleteMessage(${d.id})">❌ O‘chirish</button>` : ""}
      </div>`;
    } else {
      divMsg.innerHTML += `<div class='${stat}' id="msg-${d.id}">
        <h4>${d.user}</h4>
        <a href="${d.msg}" target="_blank">📎 Faylni ochish</a>
        <small>${d.time_insert}</small>
        ${ism === d.user ? `<button onclick="deleteMessage(${d.id})">❌ O‘chirish</button>` : ""}
      </div>`;
    }
  } else {
    divMsg.innerHTML += `<div class='${stat}' id="msg-${d.id}">
      <h4>${d.user}</h4>
      <p>${d.msg}</p>
      <small>${d.time_insert}</small>
      ${ism === d.user ? `<button onclick="deleteMessage(${d.id})">❌ O‘chirish</button>` : ""}
    </div>`;
  }
}

// ---------------- LOAD DATA ----------------
async function loadData() {
  const { data, error } = await supabaseClient.from("massages").select("*");
  if (error) {
    divMsg.innerHTML = error.message;
  } else {
    divMsg.innerHTML = "";
    data.forEach((d) => renderMessage(d));
    divMsg.scrollTop = divMsg.scrollHeight;
  }
}

// ---------------- DELETE MESSAGE ----------------
async function deleteMessage(id) {
  const { error } = await supabaseClient
    .from("massages")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Xatolik: " + error.message);
  } else {
    let msgEl = document.getElementById("msg-" + id);
    if (msgEl) {
      msgEl.remove();
    }
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

    supabaseClient
      .channel("realtime:massages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "massages" },
        (payload) => {
          renderMessage(payload.new);
          divMsg.scrollTop = divMsg.scrollHeight;
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "massages" },
        (payload) => {
          let msgEl = document.getElementById("msg-" + payload.old.id);
          if (msgEl) msgEl.remove();
        }
      )
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
    alert("Email yuborildi!");
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
