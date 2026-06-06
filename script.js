const streamFrame = document.querySelector("#streamFrame");
const reloadButton = document.querySelector("#reloadPlayer");
const streamUrl = "https://sharkstreams.net/player.php?channel=2834";
const scoreboardUrl =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";

const scoreHome = document.querySelector("#score-home");
const scoreAway = document.querySelector("#score-away");
const matchStatus = document.querySelector("#match-status");
const scoreUpdated = document.querySelector("#score-updated");
const cardHomeScore = document.querySelector("#card-home-score");
const cardAwayScore = document.querySelector("#card-away-score");
const cardLiveStatus = document.querySelector("#card-live-status");
const statusIndicator = document.querySelector(".status-indicator");

reloadButton?.addEventListener("click", () => {
  streamFrame.src = "";
  window.setTimeout(() => {
    streamFrame.src = streamUrl;
  }, 120);
});

function setScoreState({ home = "--", away = "--", status = "A VENIR", live = false }) {
  scoreHome.textContent = home;
  scoreAway.textContent = away;
  matchStatus.textContent = status;
  cardHomeScore.textContent = home;
  cardAwayScore.textContent = away;
  cardLiveStatus.textContent = live ? "LIVE" : "NBA";
  statusIndicator.style.background = live ? "#39ff88" : "#f59f00";
  scoreUpdated.textContent = `Derniere verification: ${new Date().toLocaleTimeString(
    "fr-FR",
    { hour: "2-digit", minute: "2-digit" },
  )}`;
}

function getTeam(competitors, abbreviation) {
  return competitors.find((entry) => entry.team.abbreviation === abbreviation);
}

function getStatusLabel(status) {
  if (!status) {
    return "A VENIR";
  }

  if (status.type?.state === "in") {
    return `Q${status.period} - ${status.displayClock}`;
  }

  return status.type?.shortDetail || status.type?.detail || "A VENIR";
}

async function fetchLiveScore() {
  try {
    const response = await fetch(scoreboardUrl, { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Scoreboard indisponible");
    }

    const data = await response.json();
    const events = data.events || [];
    const game =
      events.find((event) => {
        const competitors = event.competitions?.[0]?.competitors || [];
        return getTeam(competitors, "SAS") && getTeam(competitors, "NYK");
      }) ||
      events.find((event) => {
        const competitors = event.competitions?.[0]?.competitors || [];
        return getTeam(competitors, "SAS") || getTeam(competitors, "NYK");
      });

    if (!game) {
      setScoreState({ status: "A VENIR" });
      return;
    }

    const competition = game.competitions[0];
    const competitors = competition.competitors || [];
    const spurs = getTeam(competitors, "SAS");
    const knicks = getTeam(competitors, "NYK");
    const status = competition.status || game.status;
    const isLive = status?.type?.state === "in";

    setScoreState({
      home: spurs?.score || "--",
      away: knicks?.score || "--",
      status: getStatusLabel(status),
      live: isLive,
    });
  } catch (error) {
    console.error("Erreur de recuperation du score:", error);
    setScoreState({ status: "HORS LIGNE" });
    statusIndicator.style.background = "#ff3333";
  }
}

fetchLiveScore();
window.setInterval(fetchLiveScore, 15000);
