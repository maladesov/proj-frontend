import React from "react";

import './BaseComponent.css'

export default class Button extends React.Component
{
    render()
    {
        return <div style={this.props.style} id="button" className={"base-component-div " + (this.props.className !== undefined ? this.props.className : "")}>
            <input
                value={this.props.text}
                type={"button"}
                id={"button-input "} 
                className={"base-component button " + (this.props.elemClassName !== undefined ? this.props.elemClassName : "")}
                ref={(v) => this.ref = v } />
            <div onClick={this.props.onClick} className="button-icon">{this.props.icon}</div>
        </div>
    }

}

