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
const homeTeamName = document.querySelector("#home-team-name");
const awayTeamName = document.querySelector("#away-team-name");
const homeTeamNameCard = document.querySelector("#home-team-name-card");
const awayTeamNameCard = document.querySelector("#away-team-name-card");
const homeRecord = document.querySelector("#home-record");
const awayRecord = document.querySelector("#away-record");
const gamePeriod = document.querySelector("#game-period");
const gameClock = document.querySelector("#game-clock");

reloadButton?.addEventListener("click", () => {
  if (!streamFrame) {
    return;
  }

  streamFrame.src = "";
  window.setTimeout(() => {
    streamFrame.src = streamUrl;
  }, 120);
});

function setScoreState({ home = "--", away = "--", status = "A VENIR", live = false }) {
  if (scoreHome) {
    scoreHome.textContent = home;
  }

  if (scoreAway) {
    scoreAway.textContent = away;
  }

  if (matchStatus) {
    matchStatus.textContent = status;
  }

  if (cardHomeScore) {
    cardHomeScore.textContent = home;
  }

  if (cardAwayScore) {
    cardAwayScore.textContent = away;
  }

  if (cardLiveStatus) {
    cardLiveStatus.textContent = live ? "LIVE" : "NBA";
  }

  if (statusIndicator) {
    statusIndicator.style.background = live ? "#39ff88" : "#f59f00";
  }

  if (scoreUpdated) {
    scoreUpdated.textContent = `Derniere verification: ${new Date().toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }
}

function setTeamLabel(nodeList, value) {
  nodeList.forEach((node) => {
    if (node) {
      node.textContent = value;
    }
  });
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
    const spursName =
      spurs?.team?.displayName || spurs?.team?.shortDisplayName || "San Antonio Spurs";
    const knicksName =
      knicks?.team?.displayName || knicks?.team?.shortDisplayName || "New York Knicks";
    const spursRecord = spurs?.records?.[0]?.summary || spurs?.record?.summary || "--";
    const knicksRecord = knicks?.records?.[0]?.summary || knicks?.record?.summary || "--";
    const periodLabel =
      status?.type?.state === "in"
        ? `Q${status.period || 1}`
        : status?.type?.shortDetail || status?.type?.detail || "NBA Live";
    const clockLabel = status?.displayClock || status?.type?.shortDetail || "--:--";
    const diff = Number(spurs?.score || 0) - Number(knicks?.score || 0);
    const diffLabel =
      spurs?.score && knicks?.score
        ? diff === 0
          ? "Tie"
          : `${Math.abs(diff)} pts ${diff > 0 ? "SAS" : "NYK"}`
        : "En attente";

    setScoreState({
      home: spurs?.score || "--",
      away: knicks?.score || "--",
      status: getStatusLabel(status),
      live: isLive,
    });

    setTeamLabel([homeTeamName, homeTeamNameCard], spursName);
    setTeamLabel([awayTeamName, awayTeamNameCard], knicksName);

    if (homeRecord) {
      homeRecord.textContent = `Record: ${spursRecord}`;
    }

    if (awayRecord) {
      awayRecord.textContent = `Record: ${knicksRecord}`;
    }

    if (gamePeriod) {
      gamePeriod.textContent = periodLabel;
    }

    if (gameClock) {
      gameClock.textContent = `${clockLabel} | ${diffLabel}`;
    }
  } catch (error) {
    console.error("Erreur de recuperation du score:", error);
    setScoreState({ status: "HORS LIGNE" });
    if (statusIndicator) {
      statusIndicator.style.background = "#ff3333";
    }
  }
}

if (scoreHome || scoreAway || matchStatus || scoreUpdated || cardHomeScore || cardAwayScore || cardLiveStatus) {
  fetchLiveScore();
  window.setInterval(fetchLiveScore, 15000);
}
