(() => {
  "use strict";

  const profileFrame = document.querySelector("#soundcloud-profile");
  const uWinFrame = document.querySelector("#soundcloud-uwin");
  const youtubeFrame = document.querySelector("#youtube-player");
  const shells = new Map(
    [...document.querySelectorAll("[data-player-shell]")].map((element) => [
      element.dataset.playerShell,
      element,
    ]),
  );

  let activePlayer = null;
  let youtubePlayer = null;
  let youtubeReady = false;
  const soundCloudWidgets = new Map();

  function setActive(player) {
    activePlayer = player;
    for (const [id, shell] of shells) {
      shell.classList.toggle("is-active", id === player);
    }
  }

  function pauseSoundCloud(except) {
    for (const [id, widget] of soundCloudWidgets) {
      if (id !== except) widget.pause();
    }
  }

  function initializeSoundCloud() {
    if (!window.SC || soundCloudWidgets.size || !profileFrame || !uWinFrame) return;

    const factory = window.SC.Widget;
    const entries = [
      ["soundcloud", factory(profileFrame)],
      ["uwin", factory(uWinFrame)],
    ];

    for (const [id, widget] of entries) {
      soundCloudWidgets.set(id, widget);

      widget.bind(factory.Events.PLAY, () => {
        pauseSoundCloud(id);
        if (youtubeReady && youtubePlayer) youtubePlayer.pauseVideo();
        setActive(id);
      });

      const clearActive = () => {
        if (activePlayer === id) setActive(null);
      };

      widget.bind(factory.Events.PAUSE, clearActive);
      widget.bind(factory.Events.FINISH, clearActive);
      widget.bind(factory.Events.ERROR, clearActive);
    }
  }

  function initializeYouTube() {
    if (!window.YT || !window.YT.Player || !youtubeFrame || youtubePlayer) return;

    youtubePlayer = new window.YT.Player(youtubeFrame, {
      events: {
        onReady() {
          youtubeReady = true;
        },
        onStateChange(event) {
          const state = window.YT.PlayerState;

          if (event.data === state.BUFFERING || event.data === state.PLAYING) {
            pauseSoundCloud(null);
          }

          if (event.data === state.PLAYING) {
            setActive("youtube");
          } else if (
            (event.data === state.PAUSED || event.data === state.ENDED) &&
            activePlayer === "youtube"
          ) {
            setActive(null);
          }
        },
      },
    });
  }

  if (youtubeFrame) {
    const videoId = youtubeFrame.dataset.videoId;
    const parameters = new URLSearchParams({
      enablejsapi: "1",
      origin: window.location.origin,
      autoplay: "0",
      playsinline: "1",
      rel: "0",
    });
    youtubeFrame.src = `https://www.youtube-nocookie.com/embed/${videoId}?${parameters}`;
  }

  const soundCloudApi = document.createElement("script");
  soundCloudApi.src = "https://w.soundcloud.com/player/api.js";
  soundCloudApi.async = true;
  soundCloudApi.addEventListener("load", initializeSoundCloud, { once: true });
  document.head.appendChild(soundCloudApi);

  window.onYouTubeIframeAPIReady = initializeYouTube;
  const youtubeApi = document.createElement("script");
  youtubeApi.src = "https://www.youtube.com/iframe_api";
  youtubeApi.async = true;
  document.head.appendChild(youtubeApi);
})();
