import React, { useState, useEffect } from 'react';
import './App.css';
import useInput from './components/Input';
import PubNub from 'pubnub';
import { Card, CardActions, CardContent, List, ListItem, Button, Typography, Input } from '@material-ui/core';

function App() {
  let defaultChannel = "Global";
  let query = window.location.search.substring(1);
  let params = query.split("&");
  for (let i = 0; i < params.length; i++) {
    var pair = params[i].split("=");
    if (pair[0] === "channel" && pair[1] !== "") {
      defaultChannel = decodeURI(pair[1]);
    }
  }

  const [channel, setChannel] = useState(defaultChannel);
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState(`user-${new Date().getTime()}`);
  const tempChannel = useInput();
  const tempMessage = useInput();
  const tempUsername = useInput(username); // New input for username

  useEffect(() => {
    console.log("REST Api PubNub");
    const pubnub = new PubNub({
      publishKey: "pub-c-94c68b55-08af-4bdc-bc29-ccd12646f0cb",
      subscribeKey: "sub-c-c4ddd887-4836-4c22-a395-c732331e131a",
      uuid: username
    });

    pubnub.addListener({
      status: function (statusEvent) {
        if (statusEvent.category === "PNConnectedCategory") {
          console.log("Connected to NextChat Server");
        }
      },
      message: function (msg) {
        if (msg.message.text) {
          let newMessages = [];
          newMessages.push({
            uuid: msg.message.uuid,
            text: msg.message.text
          });
          setMessages(messages => messages.concat(newMessages));
        }
      }
    });

    pubnub.subscribe({
      channels: [channel]
    });

    pubnub.history(
      {
        channel: channel,
        count: 10,
        stringifiedTimeToken: true
      },
      function (status, response) {
        let newMessages = [];
        for (let i = 0; i < response.messages.length; i++) {
          newMessages.push({
            uuid: response.messages[i].entry.uuid,
            text: response.messages[i].entry.text
          });
        }
        setMessages(messages => messages.concat(newMessages));
      }
    );

    return function cleanup() {
      console.log("shutting down NextChat Server");
      pubnub.unsubscribeAll();
      setMessages([]);
    };
  }, [channel, username]);

  function handleKeyDown(event) {
    if (event.target.id === "messageInput") {
      if (event.key === "Enter") {
        publishMessage();
      }
    } else if (event.target.id === "channelInput") {
      if (event.key === "Enter") {
        const newChannel = tempChannel.value.trim();
        if (newChannel) {
          if (channel !== newChannel) {
            setChannel(newChannel);
            let newURL = window.location.origin + "?channel=" + newChannel;
            window.history.pushState(null, '', newURL);
            tempChannel.setValue('');
          }
        } else {
          if (channel !== "Global") {
            setChannel("Global");
            let newURL = window.location.origin;
            window.history.pushState(null, '', newURL);
            tempChannel.setValue('');
          }
        }
      }
    } else if (event.target.id === "usernameInput") {
      if (event.key === "Enter") {
        const newUsername = tempUsername.value.trim();
        if (newUsername && username !== newUsername) {
          setUsername(newUsername);
        }
      }
    }
  }

  function publishMessage() {
    if (tempMessage.value) {
      let messageObject = {
        text: tempMessage.value,
        uuid: username
      };

      const pubnub = new PubNub({
        publishKey: "pub-c-94c68b55-08af-4bdc-bc29-ccd12646f0cb",
        subscribeKey: "sub-c-c4ddd887-4836-4c22-a395-c732331e131a",
        uuid: username
      });
      pubnub.publish({
        message: messageObject,
        channel: channel
      });
      tempMessage.setValue('');
    }
  }

  return (
    <Card>
      <CardContent>
        <div className="top">
          <Typography variant="h4" inline>
            NextChat RV.1.0.1
          </Typography>
          <Input
            style={{ width: '100px' }}
            className="channel"
            id="channelInput"
            onKeyDown={handleKeyDown}
            placeholder={channel}
            onChange={tempChannel.onChange}
            value={tempChannel.value}
          />
          <Input
            style={{ width: '150px', marginLeft: '10px' }}
            className="username"
            id="usernameInput"
            onKeyDown={handleKeyDown}
            placeholder="Change username"
            onChange={tempUsername.onChange}
            value={tempUsername.value}
          />
        </div>
        <div>
          <Log messages={messages} />
        </div>
      </CardContent>
      <CardActions>
        <Input
          placeholder="Enter a message"
          fullWidth={true}
          id="messageInput"
          value={tempMessage.value}
          onChange={tempMessage.onChange}
          onKeyDown={handleKeyDown}
          inputProps={{ 'aria-label': 'Message Field' }}
          autoFocus={true}
        />
        <Button
          size="small"
          variant="outlined"
          color='primary'
          onClick={publishMessage}
        >
          Submit
        </Button>
      </CardActions>
    </Card>
  );
}

function Log(props) {
  return (
    <List component="nav">
      <ListItem>
        <Typography component="div">
          {props.messages.map((item, index) => (
            <Message key={index} uuid={item.uuid} text={item.text} />
          ))}
        </Typography>
      </ListItem>
    </List>
  );
};

function Message(props) {
  return (
    <div>
      {props.uuid}: {props.text}
    </div>
  );
}

export default App;
