import React from "react"

import './PopupDialog.css'

export default class PopupDialog extends React.Component {
    render()
    {
        return <div className="popup-dialog" style={this.props.style}>
            {this.props.children}
        </div>
    }
}

