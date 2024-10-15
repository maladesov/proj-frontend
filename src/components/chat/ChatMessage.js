import React from "react"

import './ChatMessage.css'

export default class ChatMessage extends React.Component {
    getFormattedTime()
    {
        return new Date(this.props.messageData.timestamp*1000).toLocaleTimeString(this.props.timeFormat);
    }

    render()
    {
        return <li id={"chat-message-" + this.props.side} className="chat-message" style={this.props.style}>
            <div className="message-block" id={this.props.side}>
                <p id="content">{this.props.messageData.content}</p>
                <p id="time">{this.getFormattedTime()}</p>
            </div>
        </li>
    }
}

