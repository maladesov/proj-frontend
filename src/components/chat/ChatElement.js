import React from "react"

import './ChatElement.css'

// list of colors for a letter avatar
export function getLetterAvatarColor(id) {
    return [
    '#F08080', '#FFA07A',
    '#FFD700', '#32CD32',
    '#00FFFF', '#ADD8E6',
    '#87CEEB', '#BA55D3',
    '#FF69B4', '#CD5C5C',
    '#E6E6FA', '#F0E68C',
    '#98FB98', '#FFC0CB',
    '#DDA0DD', '#F0E68C'][id];
}

export default class ChatElement extends React.Component {

    render()
    {
        return <li className="chat-element nodrag noselect" onClick={() => this.props.onClick(this.props.uuid)} style={this.props.style}>
            {!this.props.avatarLetter && <img alt={this.props.uuid + "_avatar"} src={this.props.avatar} className="nodrag" />}
            <div id="title" className="noselect">{this.props.title}</div>
            {this.props.avatarLetter && <p style={{ backgroundColor: getLetterAvatarColor(this.props.avatarLetter.charCodeAt(0) & 0xf) }} id="avatar-letter" className="noselect">{this.props.avatarLetter}</p>}
            <p id="description" className={"noselect chat-element-description-" + this.props.uuid}>{this.props.description}</p>
        </li>
    }
}

