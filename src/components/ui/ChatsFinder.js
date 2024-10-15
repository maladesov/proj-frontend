import React from "react";

import ChatElement from '../chat/ChatElement.js';

import { langGetString } from '../../languages/Lang.js'

import './BaseComponent.css'
import './ChatsFinder.css'
import '../chat/ChatElement.css'

export default class ChatsFinder extends React.Component
{
    constructor(props)
    {
        super(props)

        this.state = {
            userInfo: "",
            usersList: [
                <p id="err-msg" className="noselect">{langGetString("type_id_nickname")}</p>
            ],

            timeoutId: undefined,
        };

        this.props.messenger.eventsHandler.subscribeSearchMessage(
            (msg) => this.setUserInfo(msg))
    }

    setUserInfo(info)
    {
        // stop the timeout (see below)
        clearTimeout(this.state.timeoutId)

        this.setState({ userInfo: info.trim() })

        // Try to find the user
        // Note: it waits some time in case the user is still typing in the field
        this.setState({ timeoutId: setTimeout(() => this.findUser(), 500) })
    }

    findUser()
    {
        if (this.state.userInfo === undefined || this.state.userInfo.length <= 3)
        {
            this.setState({ usersList: [
                <p id="err-msg" className="noselect">{langGetString("type_id_nickname")}</p>
            ] })
            return;
        }
        
        // request user by its info from the server
        this.props.app.apiCall((code, data) => {
            let resultArray = []

            if (code === 200)
            {
                for (let i in data)
                {
                    let user = data[i]

                    // if user did not set an avatar, show their first letter from nickname
                    if (user.settings.avatar === "default")
                    {
                        resultArray.push(<ChatElement  
                            avatarLetter={user.nickname[0]}
                            title={user.nickname}
                            description={user.login}
                            uuid={user.uuid}
                            onClick={() => this.createDialog(user)}
                        />)
                    }
                    else { 
                        resultArray.push(<ChatElement  
                            avatar={user.settings.avatar}
                            title={user.nickname}
                            description={user.login}
                            uuid={user.uuid}
                            onClick={() => this.createDialog(user)}
                        />)
                    }
                }
            }
            else {
                if (code === 404)
                { // no users were found
                    resultArray.push(<p id="err-msg" className="noselect">{langGetString("noone_found")}</p>)
                }
                else if (code === 401)
                { // unable to authenticate using token
                    resultArray.push(<p id="err-msg" className="noselect">{langGetString("unable_authenticate")}</p>)
                }
            }

            this.setState({ usersList: resultArray })
        }, {}, `/users/find/${encodeURIComponent(this.state.userInfo)}`, "GET")
    }

    createDialog(userData)
    {
        this.props.onUserClick(userData)
        this.props.messenger.leftMenuAction()
    }

    render()
    {
        return <div style={this.props.style} className={"base-component-div " + (this.props.className !== undefined ? this.props.className : "")}>
            <ul>{this.state.usersList}</ul>
        </div>
    }

}

