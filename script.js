// Supabase sozlamalari
const SUPABASE_URL = "https://pbkmzdfaskzifvsxrizd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBia216ZGZhc2t6aWZ2c3hyaXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg4NjgsImV4cCI6MjA2OTM4NDg2OH0.N4HysjRwrACKFmZZF0q51_9K1dvWRpRjAUeFO5F3y1s";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const divMsg = document.getElementById("msgId");
var ism = "";
var txt = document.getElementById("txtid");

let verificationCode = "";
let savedUser = {};

// ---------------- CHAT ----------------
async function sendMessage() {
  var vaqt = new Date().toTimeString().slice(0, 8) + " / " + new Date().toDateString();
  if (!txt.value.trim()) return;

  await supabaseClient.from("massages").insert([
    { user: ism, msg: txt.value.trim(), time_insert: vaqt }
  ]);
  txt.value = "";
}

async function loadData() {
  const { data, error } = await supabaseClient.from("massages").select("*");
  if (error) {
    divMsg.innerHTML = error.message;
  } else {
    divMsg.innerHTML = "";
    data.forEach(d => {
      let stat = (ism === d.user) ? "me" : "other";
      divMsg.innerHTML += `<div class='${stat}'>
        <h4>${d.user}</h4>
        <p>${d.msg}</p>
        <small>${d.time_insert}</small>
      </div>`;
    });
    divMsg.scrollTop = divMsg.scrollHeight;
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

    supabaseClient.channel("realtime:massages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "massages" }, (payload) => {
        const data = payload.new;
        let stat = (ism === data.user) ? "me" : "other";
        divMsg.innerHTML += `<div class='${stat}'>
            <h4>${data.user}</h4>
            <p>${data.msg}</p>
            <small>${data.time_insert}</small>
          </div>`;
        divMsg.scrollTop = divMsg.scrollHeight;
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

  if (!newEmail.endsWith("@gmail.com")) {
    alert("Faqat @gmail.com email qabul qilinadi!");
    return;
  }

  verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  


  try{
    await emailjs.send("service_zdl3mmd","template_1r61t21",{
      passcode: verificationCode,
      time: new Date().toTimeString(),
      email: newEmail,
      })
      alert('success')
  }
   catch(error){
    alert(error)
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
