import React from 'react'
import Avatar from "react-avatar";
import '../styles/client.css'


export default function Client({username}) {

  return (
    <div className='client'>
      <Avatar name={username} size={40} round="12px" />
      <span className="clientUserName">{username}</span>
    </div>
  )
}
