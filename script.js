/* =============================
   📦 Supabase sozlamalari
============================= */
const SUPABASE_URL = "https://pbkmzdfaskzifvsxrizd.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBia216ZGZhc2t6aWZ2c3hyaXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg4NjgsImV4cCI6MjA2OTM4NDg2OH0.N4HysjRwrACKFmZZF0q51_9K1dvWRpRjAUeFO5F3y1s";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* =============================
   🔧 Global o‘zgaruvchilar
============================= */
const divMsg = document.getElementById("msgId");
var ism = "";
var txt = document.getElementById("txtid");
var fileInput = document.getElementById("fileid");

let verificationCode = "";
let savedUser = {};

/* =============================
   💬 Xabar yuborish
============================= */
async function sendMessage() {
  const vaqt = new Date().toLocaleString();

  if (txt.value.trim()) {
    await supabaseClient.from("massages").insert([
      { user: ism, msg: txt.value.trim(), time_insert: vaqt, type: "text" },
    ]);
    txt.value = "";
  }

  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const filePath = `${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabaseClient.storage
      .from("File")
      .upload(filePath, file);

    if (!uploadError) {
      const { data: urlData } = supabaseClient.storage
        .from("File")
        .getPublicUrl(filePath);

      await supabaseClient.from("massages").insert([
        {
          user: ism,
          msg: urlData.publicUrl,
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

/* =============================
   💬 Xabarni ko‘rsatish
============================= */
function renderMessage(d) {
  let stat = ism === d.user ? "me" : "other";
  let html = `<div class="${stat}" id="msg-${d.id}">
    <h4>${d.user}</h4>`;

  if (d.type === "file") {
    const ext = d.msg.split(".").pop().toLowerCase();

    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
      html += `<img src="${d.msg}" style="max-width:200px; border-radius:8px;">`;
    } else if (["mp4", "webm", "ogg"].includes(ext)) {
      html += `<video controls style="max-width:250px; border-radius:8px;">
        <source src="${d.msg}" type="video/${ext}">
      </video>`;
    } else {
      html += `<a href="${d.msg}" target="_blank">📎 Faylni ochish</a>`;
    }
  } else {
    html += `<p>${d.msg}</p>`;
  }

  html += `<small>${d.time_insert}</small>`;
  if (ism === d.user)
    html += `<button onclick="deleteMessage(${d.id})">O‘chirish</button>`;
  html += `</div>`;

  divMsg.innerHTML += html;
  divMsg.scrollTop = divMsg.scrollHeight;
}

/* =============================
   🧾 Xabarlarni yuklash
============================= */
async function loadData() {
  const { data, error } = await supabaseClient
    .from("massages")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    divMsg.innerHTML = "Xato: " + error.message;
  } else {
    divMsg.innerHTML = "";
    data.forEach((d) => renderMessage(d));
  }
}

/* =============================
   🗑️ Xabarni o‘chirish
============================= */
async function deleteMessage(id) {
  const { error } = await supabaseClient
    .from("massages")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Xato: " + error.message);
  } else {
    const el = document.getElementById(`msg-${id}`);
    if (el) el.remove();
  }
}

/* =============================
   🔐 Kirish
============================= */
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
        (payload) => renderMessage(payload.new)
      )
      .subscribe();
  } else {
    alert("Ism yoki parol noto‘g‘ri!");
  }
}

/* =============================
   🆕 Ro‘yxatdan o‘tish
============================= */
async function signUp() {
  let newName = document.getElementById("newNameId").value.trim();
  let newEmail = document.getElementById("newEmailId").value.trim();
  let newPass = document.getElementById("newPassId").value.trim();

  if (!newName || !newEmail || !newPass) {
    alert("Barcha maydonlarni to‘ldiring!");
    return;
  }

  verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    await emailjs.send("service_zdl3mmd", "template_1r61t21", {
      passcode: verificationCode,
      email: newEmail,
    });
    alert("Tasdiqlash kodi emailingizga yuborildi!");
  } catch (error) {
    alert("Email yuborishda xato: " + error);
  }

  savedUser = { name: newName, email: newEmail, pass: newPass };
  document.getElementById("signupStep1").style.display = "none";
  document.getElementById("verifyDiv").style.display = "flex";
}

/* =============================
   ✅ Kodni tasdiqlash
============================= */
async function verifyCode() {
  let userCode = document.getElementById("verifyCode").value.trim();

  if (userCode === verificationCode) {
    const { error } = await supabaseClient.from("users").insert([savedUser]);
    if (error) alert("Xato: " + error.message);
    else {
      alert("Ro‘yxatdan muvaffaqiyatli o‘tdingiz!");
      location.reload();
    }
  } else {
    alert("Kod noto‘g‘ri!");
  }
}

/* =============================
   🔁 Ko‘rinishlarni almashtirish
============================= */
function showSignUp() {
  document.getElementById("divsignin").style.display = "none";
  document.getElementById("divsignup").style.display = "flex";
}
function showSignIn() {
  document.getElementById("divsignup").style.display = "none";
  document.getElementById("divsignin").style.display = "flex";
}

/* =============================
   🎥 AGORA VIDEO CHAT
============================= */
const APP_ID = "705239b6e0c5418d86ef8ec751fe5889";
let client;
let localTracks = [];
let remoteUsers = {};

async function openVoiceChat() {
  document.getElementById("videoChatContainer").style.display = "flex";
}

async function startVideoChat() {
  client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

  try {
    await client.join(APP_ID, "ipe_room", null, null);
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

    localTracks[1].play("local-player");
    await client.publish(localTracks);

    client.on("user-published", async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === "video") {
        user.videoTrack.play("remote-player");
      }
      if (mediaType === "audio") {
        user.audioTrack.play();
      }
    });

    alert("🎥 Kamera va mikrofon ruxsati berildi!");
  } catch (err) {
    console.error("❌ Video chatda xato:", err);
    alert("Video chat xatosi: " + err.message);
  }
}

async function leaveVideoChat() {
  if (localTracks.length) {
    localTracks.forEach((track) => {
      track.stop();
      track.close();
    });
  }
  if (client) await client.leave();
  document.getElementById("videoChatContainer").style.display = "none";
}
