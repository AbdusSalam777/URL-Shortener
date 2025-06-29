function shorten() {
  const url = document.getElementById("url").value;
  const short = document.getElementById("short").value;

  if (!url || !short) {
    alert("Both fields are required!");
    return;
  }

  fetch("/shorten", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url, short })
  })
    .then(res => res.json())
    .then(data => {
      if (data.message) {
        document.getElementById("result").innerText = `Shortened URL: http://localhost:3000/${short}`;
      } else {
        document.getElementById("result").innerText = `Error: ${data.error}`;
      }
    })
    .catch(err => {
      console.error(err);
      document.getElementById("result").innerText = "Something went wrong.";
    });
}
