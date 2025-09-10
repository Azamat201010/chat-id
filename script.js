const divMsg = document.getElementById("msgId");
const userbaza = "MirAziz";
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
  const { data, error } = await sardor
    .from("massages")
    .insert([
      {
        user: user.value.trim(),
        msg: txt.value.trim(),
        time_insert: vaqt,
      },
    ])
    .select();
  txt.value = "";
}

async function loadData() {
  const { data, error } = await sardor.from("massages").select("*");
  if (error) {
    divMsg.innerHTML = error;
  } else {
    divMsg.innerHTML = "";
    for (let i = 0; i < data.length; i++) {
      console.log(data[i].user);
      var userbazaa = data[i].user;
      var txtbaza = data[i].msg;

      if (ism == userbazaa) {
        stat = "me";
      } else {
        stat = "other";
      }

      divMsg.innerHTML += `<div class='${stat}'>
          <h3>${userbazaa}</h3>
          <p>${txtbaza}</p>
        </div>`;
      divMsg.scrollTop = divMsg.scrollHeight;
    }
  }
}

async function kirish() {
  ism = user.value.trim();
  let parol = pass.value.trim();   // 🔥 faqat shu joyi to‘g‘irlandi

  const { data: odam, error: nito } = await sardor
    .from("users")
    .select("*")
    .eq("name", ism)
    .eq("pass", parol);

  if (odam.length == 1) {
    loadData();

    sardor
      .channel("realtime:massages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "massages" },
        (payload) => {
          const data = payload.new;
          let stat = ism === data.user ? "me" : "other";

          divMsg.innerHTML += `<div class='${stat}'>
              <h3>${data.user}</h3>
              <p>${data.msg}</p>
              <small>${data.time_insert}</small>
            </div>`;

          divMsg.scrollTop = divMsg.scrollHeight;
        }
      )
      .subscribe();

    document.getElementById("divsignin").style.display = "none";
  } else {
    alert("odam bolib keldik it bolib ketmaylik");
  }
}
