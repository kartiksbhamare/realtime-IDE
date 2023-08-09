const ACTIONS = {
  JOIN: 'join',
  JOINED: 'joined',
  DISCONNECTED: 'disconnected',
  CODE_CHANGE: 'code-change',
  LANG_CHANGE: 'language-change',
  SYNC_CODE: 'sync-code',
  LEAVE: 'leave',
  
  ALL_PEERS: 'all-peers',
  PEER_JOINED: 'peer-joined',
  PEER_LEFT: 'peer-left',
  ACK_TO_CONNECT: 'ack-to-connect',
  MEDIADEVICE_STATE_CHANGE: 'mediadevice-state-change',
  REQ_TO_CONNECT: 'req-to-connect',
  RES_TO_CONNECT: 'res-to-connect',
};

module.exports = ACTIONS;