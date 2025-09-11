const divMsg = document.getElementById("msgId");
var user = document.getElementById("nameId");
var txt = document.getElementById("txtid");
var pass = document.getElementById("passId");
var stat = "other";
var ism = "";

const supApi =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBia216ZGZhc2t6aWZ2c3hyaXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg4NjgsImV4cCI6MjA2OTM4NDg2OH0.N4HysjRwrACKFmZZF0q51_9K1dvWRpRjAUeFO5F3y1s";
const supUrl = "https://pbkmzdfaskzifvsxrizd.supabase.co";
const sardor = supabase.createClient(supUrl, supApi);

async function sendMessage() {
  var vaqt =
    new Date().toTimeString().slice(0, 8) +
    " / " +
    new Date().toDateString();
  await sardor.from("massages").insert([
    { user: ism, msg: txt.value.trim(), time_insert: vaqt }
  ]);
  txt.value = "";
}

async function loadData() {
  const { data, error } = await sardor.from("massages").select("*");
  if (error) {
    divMsg.innerHTML = error.message;
  } else {
    divMsg.innerHTML = "";
    for (let i = 0; i < data.length; i++) {
      var userbazaa = data[i].user;
      var txtbaza = data[i].msg;
      stat = (ism == userbazaa) ? "me" : "other";

      divMsg.innerHTML += `<div class='${stat}'>
          <h3>${userbazaa}</h3>
          <p>${txtbaza}</p>
          <small>${data[i].time_insert}</small>
        </div>`;
    }
    divMsg.scrollTop = divMsg.scrollHeight;
  }
}

async function kirish() {
  ism = user.value.trim();
  let parol = pass.value.trim();

  if (!ism || !parol) {
    alert("Iltimos, ism va parolni to'ldiring!");
    return;
  }

  const { data: odam } = await sardor
    .from("users")
    .select("*")
    .eq("name", ism)
    .eq("pass", parol);

  if (odam && odam.length === 1) {
    loadData();
    sardor.channel("realtime:massages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "massages" }, (payload) => {
        const data = payload.new;
        let stat = (ism === data.user) ? "me" : "other";
        divMsg.innerHTML += `<div class='${stat}'>
            <h3>${data.user}</h3>
            <p>${data.msg}</p>
            <small>${data.time_insert}</small>
          </div>`;
        divMsg.scrollTop = divMsg.scrollHeight;
      })
      .subscribe();

    document.getElementById("divsignin").style.display = "none";
  } else {
    alert("Ism yoki parol noto‘g‘ri!");
  }
}

async function signUp() {
  let newName = document.getElementById("newNameId").value.trim();
  let newPass = document.getElementById("newPassId").value.trim();

  if (!newName || !newPass) {
    alert("Iltimos, yangi ism va parolni to'ldiring!");
    return;
  }

  const { data, error } = await sardor
    .from("users")
    .insert([{ name: newName, pass: newPass }]);

  if (error) {
    alert("Xato: " + error.message);
  } else {
    alert("Muvaffaqiyatli ro'yxatdan o'tdingiz! Endi kirishingiz mumkin.");
    showSignIn();
  }
}

function showSignUp() {
  document.getElementById("divsignin").style.display = "none";
  document.getElementById("divsignup").style.display = "flex";
}

function showSignIn() {
  document.getElementById("divsignup").style.display = "none";
  document.getElementById("divsignin").style.display = "flex";
}
