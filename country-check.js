fetch("https://ipapi.co/json/")
  .then(res => res.json())
  .then(data => {
    if (data.country !== "SE") {
      document.body.innerHTML = "Ej tillgängligt i ditt land";
    }
  });
