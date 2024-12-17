async function postDataTrovaUsati(id_trovausati, canale) {
  var result = fetch(
    "https://trovausati.it/api/marketplace/" +
      canale +
      "/order/?X-Authorization=85deb35b175d68bfddabed376b61107e3b60bb6c",
    {
      // Adding method type
      method: "POST",
      // Adding body or contents to send
      body: JSON.stringify({
        product_ids: id_trovausati,
        reference: "",
      }),
      // Adding headers to the request
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    }
  )
    // Converting to JSON
    .then((response) => response.json())
    // Displaying results to console
    .then((json) => {})
    .catch((err) => console.log("Request Failed", err));
  return await result;
}
export default postDataTrovaUsati;
