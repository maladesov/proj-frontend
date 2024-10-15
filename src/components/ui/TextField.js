import React from "react";

import './BaseComponent.css'

export default class TextField extends React.Component
{
    componentDidMount()
    {
        if (this.props.autofocus)
        {
            this.ref.focus()
        }
    }

    render()
    {
        return <div style={this.props.style} id="text-field" className={(this.props.className !== undefined ? this.props.className : "")}>
            <input
                onClick={(evt) => { if (this.props.onClick !== undefined) this.props.onClick(evt) }}
                onChange={(evt) => { if (this.props.setValue !== undefined) this.props.setValue(evt.target.value) }}
                placeholder={this.props.hint}
                type={this.props.isPassword ? "password" : "text"}
                className={"base-component text-field " + (this.props.elemClassName !== undefined ? this.props.elemClassName : "")}
                id={"text-field-input "} 
                ref={(v) => { this.ref = v }} />
        </div>
    }

}

