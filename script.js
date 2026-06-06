const streamFrame = document.querySelector("#streamFrame");
const reloadButton = document.querySelector("#reloadPlayer");
const streamUrl = "https://sharkstreams.net/player.php?channel=2834";

reloadButton?.addEventListener("click", () => {
  streamFrame.src = "";
  window.setTimeout(() => {
    streamFrame.src = streamUrl;
  }, 120);
});
