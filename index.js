var webSocketServer = require("ws").Server,
  wss = new webSocketServer({ port: 4000 });
users = {};

wss.on("connection", (connection) => {
  console.log("User connected");

  connection.on("message", (message) => {
    var data;
    try {
      data = JSON.parse(message);
    } catch (err) {
      console.log(err);
      data = {};
    }
    switch (data.type) {
      // login handler
      case "login":
        console.log("User logged in as", data.name);
        if (users[data.name]) {
          sendTo(connection, {
            type: "login",
            success: false,
          });
        } else {
          users[data.name] = connection;
          connection.name = data.name;
          sendTo(connection, {
            type: "login",
            success: true,
          });
        }

        break;

      // offer handler
      case "offer":
        console.log("Sending offer to", data.name);
        var conn = users[data.name];
        if (conn != null) {
          connection.otherName = data.name;
          sendTo(conn, {
            type: "offer",
            offer: data.offer,
            name: connection.name,
          });
        }
        break;

      //answer
      case "answer":
        console.log("Sending answer to", data.name);
        var conn = users[data.name];
        if (conn != null) {
          connection.otherName = data.name;
          sendTo(conn, {
            type: "answer",
            answer: data.answer,
          });
        }
        break;
      // ice canditate handlers
      case "candidate":
        console.log("Sending candidate to", data.name);
        var conn = users[data.name];
        if (conn != null) {
          sendTo(conn, {
            type: "candidate",
            candidate: data.candidate,
          });
        }
        break;

      // Learver handler
      case "leave":
        console.log("Disconnecting user from", data.name);
        var conn = users[data.name];
        conn.otherName = null;
        if (conn != null) {
          sendTo(conn, {
            type: "leave",
          });
        }
        break;

      // mouse controllers
      case "mouse":
        console.log(
          "recived mouse data",
          "mousex :",
          data.mousex,
          "mousey :",
          data.mousey
        );
        var conn = users[data.name];
        if (conn != null) {
          connection.otherName = data.name;
          sendTo(conn, {
            type: "mouse",
            mousex: data.mousex,
            mousey: data.mousey,
          });
        }
        break;

      default:
        sendTo(connection, {
          type: "error",
          message: "Unrecognized command: " + data.type,
        });
        break;
    }
  });

  connection.send("hello world");

// close handler
connection.on("close", function () {
  if (connection.name) {
    delete users[connection.name];
    if (connection.otherName) {
      console.log("Disconnecting user from", connection.otherName);
      var conn = users[connection.otherName];
      conn.otherName = null;
      if (conn != null) {
        sendTo(conn, {
          type: "leave",
        });
      }
    }
  }
});

});

function sendTo(conn, message) {
  conn.send(JSON.stringify(message));
}
