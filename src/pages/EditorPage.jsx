import { useState, useRef, useEffect } from 'react';
import icon from "../assets/logo.png";
import Client from "../components/Client";
import Editor from "../components/Editor";
import Navbar from '../components/EditorNavbar'
import ACTIONS from '../utils/SocketActions';
import { initSocket } from '../socket';
import toast from 'react-hot-toast';
import TextField from '@mui/material/TextField';
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import '../styles/editorPage.css'
import '../styles/sidebar.css'
import '../styles/runcode.css'
import {
  useLocation,
  Navigate,
  useNavigate,
  useParams,
} from 'react-router-dom';
import axios from 'axios';
import { CircularProgress } from "@material-ui/core";
import Backdrop from "@mui/material/Backdrop";
import Peer from 'simple-peer';
import micmute from "../assets/micmute.svg";
import micunmute from "../assets/micunmute.svg";
import webcam from "../assets/webcam.svg";
import webcamoff from "../assets/webcamoff.svg";
import { Rnd } from "react-rnd";
import { Grid, makeStyles } from '@material-ui/core';
import Box from '@mui/material/Box';


const useStyles3 = makeStyles((theme) => ({
  video: {
    width: '100%',
    position: "static",
    borderRadius: "8px",
    margin: "1px",
    [theme.breakpoints.down('xs')]: {
      width: '300px',
    }
  },
  paper: {
    padding: '10px',
    border: '2px solid black',
    margin: '10px',
  },
  smallVideo: {
    left: 0,
    position: "absolute",
    display: 'flex',
    // width: '30%',
    height: '32%',
    marginTop: "-0.7rem",
    // paddingRight: "0.5rem",
    // float: "right"
  },
}))

// Video Component
const Video = ({ peer }) => {
  const ref = useRef();
  const classes3 = useStyles3();

  useEffect(() => {

    // setting a live video stream for pirticular peer
    peer.on("stream", (stream) => {
      ref.current.srcObject = stream;
    });
  }, []);

  return (
    <>
      <video playsInline autoPlay ref={ref} className={classes3.video} />
    </>
  )
};


export default function EditorPage() {

  const socketRef = useRef(null);
  const { roomId } = useParams();
  const location = useLocation();
  const reactNavigator = useNavigate();
  const codeRef = useRef(null);
  const classes3 = useStyles3();
  
  const [codeLang, setCodeLang] = useState('cpp');
  const [theme, setTheme] = useState('dracula');
  const [clients, setClients] = useState([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [peers, setPeers] = useState([]);
  const [audioFlag, setAudioFlag] = useState(true);
  const [videoFlag, setVideoFlag] = useState(true);
  const [userUpdate, setUserUpdate] = useState([]);
  const userVideo = useRef();
  const peersRef = useRef([]);

  // setting video constrains
  const videoConstraints = {
    frameRate: 12,
    noiseSuppression: true,
    width: 260,
    height: 180
  };
  
  // Creating a new peer
  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    // Sending the signal(SDP) to socket server 
    peer.on("signal", (signal) => {
      socketRef.current.emit(ACTIONS.REQ_TO_CONNECT, {
        userToSignal,
        callerID,
        signal,
      });
    });

    return peer;
  }

  // Adding a new peer to stream
  function addPeer(incomingSignal, callerID, stream) {

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    // Sending the signal(SDP) to socket server of new joined user
    peer.on("signal", (signal) => {
      socketRef.current.emit(ACTIONS.RES_TO_CONNECT, { signal, callerID });
    });

    // sending the offer to the peers present in stream
    peer.signal(incomingSignal);

    return peer;
  }



  useEffect(() => {
    async function init() {
      socketRef.current = await initSocket();
      console.log("socketRef", socketRef);

      // Error handling
      socketRef.current.on('connect_error', (err)=> handleErrors(err));
      socketRef.current.on('connect_failed', (err)=> handleErrors(err));

      const stream = await navigator.mediaDevices
        .getUserMedia({ video: videoConstraints, audio: true })

      // Send join event to server - this user joined
      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username : location.state?.username,
      });

       // setting userVideo strem to our current video input
       userVideo.current.srcObject = stream;

      // Listen for joined events - other user joined 
      socketRef.current.on(ACTIONS.JOINED, async({clients, username, socketId}) => {

        if(username !== location.state?.username){
          toast.success(`${username} joined the room`);
          console.log(`${username} joined the room`);
        }
      
        setClients(clients);
        socketRef.current.emit(ACTIONS.SYNC_CODE, {
          code: codeRef.current,
          socketId,
        });
      })

      // creating peers of all users to create stream
      socketRef.current.on(ACTIONS.ALL_PEERS, (users) => {

        // initilazing an empty array
        const peersTemp = [];

        users.forEach((userID) => {

          // creating a new peer of out current streem
          const peer = createPeer(userID, socketRef.current.id, stream);
          // updating the global peers list
          peersRef.current.push({
            peerID: userID,
            peer,
          });

          peersTemp.push({
            peerID: userID,
            peer,
          });
        });
        setPeers(peersTemp);
        // setPeers(uniqByKeepFirst(peers, (it) => it.peerID))
      });

      // when a new user is joined stream
      socketRef.current.on(ACTIONS.PEER_JOINED, (payload) => {

        // initilazing peer of new joined user
        const peer = addPeer(payload.signal, payload.callerID, stream);

        peersRef.current.push({
          peerID: payload.callerID,
          peer,
        });
        const newPeer = {
          peer,
          peerID: payload.callerID,
        };
        const tempPeer = peers
        tempPeer.push(newPeer)
        setPeers(tempPeer);
      });

      // When a user leaves the stream
      socketRef.current.on(ACTIONS.PEER_LEFT, (id) => {

        // Finding the peer details 
        const peerObj = peersRef.current.find((p) => p.peerID === id);
        if (peerObj) {
          // removing the peer details if exists
          peerObj.peer.destroy();
        }

        // removing the peer details from the useState too
        const peers = peersRef.current.filter((p) => p.peerID !== id);
        peersRef.current = peers;
        setPeers(peers);
      });

      socketRef.current.on(ACTIONS.ACK_TO_CONNECT, (payload) => {
        const item = peersRef.current.find((p) => p.peerID === payload.id);

        // sending the acknowledgment offer to the peer for connection
        item.peer.signal(payload.signal);
      });

      // for sending the update related to show/display video and mute/unmute audio
      socketRef.current.on(ACTIONS.MEDIADEVICE_STATE_CHANGE, (payload) => {
        setUserUpdate(payload);
      });

      // Listen for disconnected
      socketRef.current.on(ACTIONS.DISCONNECTED, 
        ({socketId, username}) => {
          toast.success(`${username} left the room`);
          // Update sidebar client list
          setClients((prev) => {
            return prev.filter(
              (client) => client.socketId !== socketId
            );
          });
      })

    }

    init();
    return () => {
      // Cleaning up listeners
      socketRef.current.off(ACTIONS.JOINED);
      socketRef.current.off(ACTIONS.DISCONNECTED);
      socketRef.current.off(ACTIONS.ALL_PEERS);
      socketRef.current.off(ACTIONS.PEER_JOINED);
      socketRef.current.off(ACTIONS.PEER_LEFT);
      socketRef.current.off(ACTIONS.ACK_TO_CONNECT);
      socketRef.current.off(ACTIONS.MEDIADEVICE_STATE_CHANGE);
      socketRef.current.disconnect();
    }
  },[])

  async function copyRoomId() {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success('Room ID Copied to clipboard');

    } catch (err) {
      toast.error('Could not copy room ID');
      console.error(err);
    }
  }

  function leaveRoom() {
    reactNavigator('/');
  }

  if (!location.state) {
    return <Navigate to="/" />;
  }

  function handleErrors(e) {
    console.log("socket error", e);
    toast.error("Socket connection failed, try again later");
    // router.push('/ide');
  }

  async function handleCodeRun(){

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/runcode', {
        code: codeRef.current,
        codeLang,
        input,
      })
      
      console.log("res: ", res.data.data);
      const outputToDisplay = res.data.data.output + 
                              "--------------------------\n" +
                              "CPU Time: " + res.data.data.cpuTime + "s" + 
                              "\nMemory Used: "+ res.data.data.memory +"b"

      setOutput(outputToDisplay);
  
      toast.success('Executed successfully');
      // toast.success('CPU Time: ' + res.data.data.cpuTime + "s");
      // toast.success('Memory Used: '+ res.data.data.memory +"Kb");

    } catch(err) {
      console.log(err);
      toast.error("Compiler API Server Error");
    }
    setLoading(false);
  }

  return (
    <div className='mainWrap'>

      {/* E D I T O R */}
      <div className='editorWrap'>
        <Navbar 
          codeLang={codeLang} setCodeLang={setCodeLang}
          theme={theme} setTheme={setTheme}
          socketRef={socketRef}
          roomId={roomId}
        />

        <div style={{height: "90%", width: "auto"}}>
          <Editor 
            codeLang={codeLang} setCodeLang={setCodeLang}
            theme={theme}
            socketRef={socketRef}
            roomId={roomId}
            onCodeChange={(code) => {
              codeRef.current = code;
            }}            
          />
          
          { showTerminal &&      
            <div className='inputbox' >
              <div className='inner-inputbox' >
                <div className='close-button' >
                  <p style={{fontSize:"large"}}>Output</p>
                    <IconButton  onClick={()=> setShowTerminal(false)}>
                          <CloseIcon />
                    </IconButton>        
                </div>

                
                <TextField
                  id="outlined-multiline-static" 
                  className='input-text' 
                  InputProps={{
                  readOnly: true,
                  }}            
                  multiline
                  rows={3}
                  value={output}
                />

                <p style={{fontSize:"large"}}>Input</p>
                <TextField
                  id="outlined-multiline-static" 
                  className='input-text'
                  multiline
                  rows={3}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              <br/>
              <div className='runbox'>
                <button className='btn' onClick={handleCodeRun}> Run Code </button>
              </div>
              </div>
              {/* Loding Spinner */}
              <Backdrop
                sx={{
                  color: "#fff",
                  zIndex: (theme) => theme.zIndex.drawer + 1,
                }}
                open={loading}
              >
                <CircularProgress color="inherit" />
              </Backdrop>
            </div>
          }

        </div>
        
      </div>

      {/* S I D E B A R */}
      <div className='sidebar' style={{position: "sticky"}}>
        <div className='sidebarInner'>
          <div className='logoBox'>
            <img src={icon} alt="" className='sidebarLogo' />
            <span>Data Networks Project - Group 21</span>
          </div>

          <h3> Connected  </h3>
          <div className='clientsList'>
            {
              clients.map((client) => (
                <Client key={client.socketId} username={client.username} />
              ))
            }
          </div>
        </div>
        <button className='btn'  onClick={()=> setShowTerminal(true)} > Show Terminal </button>
        <br />
        <button className='copyBtn btn' onClick={copyRoomId}> Copy Room ID</button>
        <button className='leaveBtn btn' onClick={leaveRoom} > Leave </button>
      </div>

      <Rnd bounds="parent">
          <Box>
            <Grid container>
              {/* showing the video of all the users present in stream except own */}
              <Grid container spacing={2} item direction="row">
                {
                  peers.map((peer, idx) => {
                    return (
                      <>
                        <Grid item key={peer.peerID} >
                          <Video peer={peer.peer} className={classes3.video} />
                        </Grid>
                      </>
                    );
                  })
                }
              </Grid>
              {/* showing our own video */}
              <Grid item container direction="row" justifyContent='center' style={{ marginTop: "-3.7rem", }}>
                <Grid item>
                  <video muted ref={userVideo} autoPlay playsInline className={classes3.smallVideo} />
                </Grid>
                <Grid item container sm justifyContent='center' spacing={2} style={{ zIndex: "1" }}>
                  <Grid item>
                    <img style={{
                      cursor: "pointer",
                      height: "25px"
                    }}
                      src={videoFlag ? webcam : webcamoff}
                      alt="img"
                      onClick={() => {
                        if (userVideo.current.srcObject) {
                          userVideo.current.srcObject.getTracks().forEach(function (track) {
                            if (track.kind === "video") {
                              if (track.enabled) {
                                socketRef.current.emit(ACTIONS.MEDIADEVICE_STATE_CHANGE, [...userUpdate, {
                                  id: socketRef.current.id,
                                  videoFlag: false,
                                  audioFlag,
                                }]);
                                track.enabled = false;
                                setVideoFlag(false);
                              } else {
                                socketRef.current.emit(ACTIONS.MEDIADEVICE_STATE_CHANGE, [...userUpdate, {
                                  id: socketRef.current.id,
                                  videoFlag: true,
                                  audioFlag,
                                }]);
                                track.enabled = true;
                                setVideoFlag(true);
                              }
                            }
                          });
                        }
                      }}
                    />
                  </Grid>
                  <Grid item>
                    <img style={{
                      cursor: "pointer",
                      height: "25px"
                    }}
                      src={audioFlag ? micunmute : micmute}
                      alt="img"
                      onClick={() => {
                        if (userVideo.current.srcObject) {
                          userVideo.current.srcObject.getTracks().forEach(function (track) {
                            if (track.kind === "audio") {
                              if (track.enabled) {
                                socketRef.current.emit("change", [...userUpdate, {
                                  id: socketRef.current.id,
                                  videoFlag,
                                  audioFlag: false,
                                }]);
                                track.enabled = false;
                                setAudioFlag(false);
                              } else {
                                socketRef.current.emit("change", [...userUpdate, {
                                  id: socketRef.current.id,
                                  videoFlag,
                                  audioFlag: true,
                                }]);
                                track.enabled = true;
                                setAudioFlag(true);
                              }
                            }
                          });
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid >
          </Box>
        </Rnd>

    </div>
  );
}
