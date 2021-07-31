jQuery(async () => {

  $(document).ready(function(){
    $('.modal').modal();
  });

  const localPathInput = $("#localPathInput");
  const saveLocalPathInput = $("#saveLocalPathInput");
  const serviceIsRunning = $(".serviceIsRunning");
  const serviceIsStoped = $(".serviceIsStoped");
  const socket = io("http://localhost:3000", {reconnectionDelayMax: 10000, autoConnect: false,});
  let retryingInterval;

  $(document).on('contextmenu', (event)=>{
    event.preventDefault();
  })

  saveLocalPathInput.on('click', () => {
    socket.emit("setSyncFolder", localPathInput.val());
  })

  await initSync();

  async function initSync() {

    socket.connect();

    socket.on("connect", () => {
      serviceIsStoped.fadeOut(100, null, () => {
        serviceIsRunning.removeClass("isHideOnInit");
        serviceIsRunning.fadeIn(100);
      });
      clearInterval(retryingInterval);
      outputMessage("Connection with remote server established successfully", "socket", "green");
    });

    socket.on('message', (message) => {
      outputMessage(message, "socket", "yellow");
    });
    
    socket.on('syncFolderChanged', (message) => {
      outputMessage(message, "socket", "yellow");
    });
    
    socket.on('syncStarted', (message) => {
      outputMessage(message, "socket", "red");
      serviceIsStoped.fadeOut(100, null, () => {
        serviceIsRunning.fadeIn(100);
      });
    });
    
    socket.on('uploadingStart', (message) => {
      $('#loader').removeClass("isHideOnInit");
      $('#loader').fadeIn(100);
      outputMessage(message, "syncing", "cyan");
    });
    
    socket.on('uploadingEnd', (message) => {
      $('#loader').fadeOut(100);
      outputMessage(message, "syncing", "green");
    });
    
    socket.on('uploadingError', (message) => {
      $('#loader').fadeOut(100);
      console.log(message);
      outputMessage(message.message || "sync error", "uploading", "red");
    });
    
    socket.on('disconnect', (message) => {

      serviceIsRunning.fadeOut(100, null, () => {
        serviceIsStoped.fadeIn(100);
      });

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
  
      localPathInput.val(response.localPath);
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
    appConsoleContainer.scrollTop(appConsole.height()+100);
    const date = new Date().toDateString();
    const output = $(
      `<p>[${date}] [<span style='color: ${color}'>${status}</span>] ${message}</p>`
    );
    appConsole.append(output);
  }
});
