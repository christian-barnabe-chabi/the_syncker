jQuery(async () => {
  const startServiceBtn = $("#startServiceBtn");
  const stopServiceBtn = $("#stopServiceBtn");
  const serviceIsRunning = $(".serviceIsRunning");
  const serviceIsStoped = $(".serviceIsStoped");
  const socket = io("http://localhost:3000", {reconnectionDelayMax: 10000, autoConnect: false,});
  let retryingInterval;
  let serviceIsSyncing = false;

  $(document).on('contextmenu', (event)=>{
    event.preventDefault();
  })

  startServiceBtn.on("click", async (event) => {
    serviceIsRunning.removeClass("isHideOnInit");
    event.preventDefault();

    await startSync();

    serviceIsStoped.fadeOut(100, null, () => {
      serviceIsRunning.fadeIn(100);
    });
  });

  stopServiceBtn.on("click", async (event) => {
    event.preventDefault();

    await stopSync();

    serviceIsRunning.fadeOut(100, null, () => {
      serviceIsStoped.fadeIn(100);
    });
  });

  await initSync();

  async function initSync() {

    socket.connect();

    socket.on("connect", () => {
      clearInterval(retryingInterval);
      outputMessage("Connection with remote server established successfully", "socket", "green");

      if(serviceIsSyncing) {
        socket.emit("startSync");
      }
    });

    socket.on('message', (message) => {
      outputMessage(message, "socket", "yellow");
    });
    
    socket.on('compressStart', (message) => {
      $('#loader').removeClass("isHideOnInit");
      $('#loader').fadeIn(100);
      outputMessage(message, "compression", "orange");
    });
    
    socket.on('compressEnd', (message) => {
      $('#loader').fadeOut(100);
      outputMessage(message, "conpression", "magenta");
    });
    
    socket.on('disconnect', (message) => {
      outputMessage("Disconnected. Reconnecting ...", "socket", "yellow");
      retryingInterval = setInterval(async ()=>{
        outputMessage(`Retrying in 5s`, "socket", "yellow");
        await socket.connect();
      }, 5000);
    });

    return await fetch("/sync/init", { method: "GET" }).then((data) => {
      return handleResponse(data);
    });
  }

  async function startSync() {
    socket.emit("startSync");
    serviceIsSyncing = true;
  }

  async function stopSync() {
    socket.emit("stopSync");
    serviceIsSyncing = false;
  }

  async function handleResponse(data) {
    let message = data.statusText;
    
    try {
      let response = await data.json();

      if (response.message) {
        message = response.message;
      }

      if (data.status < 200 || data.status > 299) {
        throw new Error(message);
      }
  
      outputMessage(message, data.status, "green");
      return response;

    } catch (error) {
      outputMessage(error, data.status, "red");
      throw new Error(error);
    }
  }

  function outputMessage(message, status = "update", color = "white") {
    const appConsole = $("#app-console .console");
    const appConsoleContainer = $("#app-console");
    appConsoleContainer.scrollTop(appConsole.height())
    const output = $(
      `<p>[<span style='color: ${color}'>${status}</span>] ${message}</p>`
    );
    appConsole.append(output);
  }
});
