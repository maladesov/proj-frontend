import React from "react";
import $ from 'jquery';

import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

import TextField from '../components/ui/TextField.js'
import Button from '../components/ui/Button.js'
import ChatsFinder from '../components/ui/ChatsFinder.js'
import ChatElement from '../components/chat/ChatElement.js'
import ChatWindow from '../components/chat/ChatWindow.js'

import { langGetString, langGetStringFormatted } from '../languages/Lang.js'

import EventsHandler from '../messenger/EventsHandler.js'

import './MessengerPage.css'


export default class MessengerPage extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            isMenuShown: false,
            searchValue: "",

            inSearchMode: false,

            chats: [],

            chatOpened: false,
            chatInfo: [],

            chatWindowRef: undefined,

            // wait interval on API error. It will grow up to 60 seconds on every error
            lastInterval: 5,
        };
        
        // timers pool for all global chats events
        this.chatsEventTimers = {}

        this.eventsHandler = new EventsHandler(this.props.app, this)
        this.eventsHandler.setup()

        this.eventsHandler.subscribeEvents((n, d) => this.globalEventsHandler(n, d))
    }
    
    componentDidMount()
    {
        this.requestChats()
        this.props.app.subscribeKeyboardEvent((e) => this.keyHandler(e))
    }

    componentWillUnmount()
    {
        this.eventsHandler.uninstall()
    }

    globalEventsHandler(name, data)
    {
        switch (name)
        {
            case "typing":
                this.setTyping(data)
                break

            case "new_message":
                this.setChatDescription(data)
                break

            default: // invalid event
                console.log("Invalid event", name)
                break
        }
    }

    setChatDescription(data)
    { // update chats description with new message that was sent
        // cancel all typing events for this chat if any
        if (this.chatsEventTimers[data.chat_id] !== undefined)
        {
            clearTimeout(this.chatsEventTimers[data.chat_id])
            delete this.chatsEventTimers[data.chat_id]
        }

        // update chat's last message. Works the same way as with the typing event. See in 'setTyping' method.
        $(".chat-element-description-" + data.chat_id).text(data.message.data)
    }
    
    setTyping(data)
    { // updates chats description if somebody is typing
        // check that event does not tell about ourself
        if (data.user_id === this.props.app.state.userData.uid)
            return

        if (this.chatsEventTimers[data.chat_id] !== undefined)
        {
            clearTimeout(this.chatsEventTimers[data.chat_id])
            delete this.chatsEventTimers[data.chat_id]
        }

        // every chat element in the list has description, and the description has a class
        // that's unique for every element. It is in format 'chat-element-description-{chatId}'.
        // Using this we can update the description on fly
        const prevDescription = $(".chat-element-description-" + data.chat_id).text()
        $(".chat-element-description-" + data.chat_id).text(langGetStringFormatted("somebody_typing", { nickname: data.nickname }))

        // set timeout, so the typing message will be cleared if no new events produces
        this.chatsEventTimers[data.chat_id] = setTimeout(() => {
            $(".chat-element-description-" + data.chat_id).text(prevDescription)
            delete this.chatsEventTimers[data.chat_id]
        }, 2200)
    }

    keyHandler(event)
    {
        if (event.code === "Escape")
        {
            // hide search, if it is opened and escape is pressed
            if (this.state.inSearchMode)
            {
                this.leftMenuAction()
            }
            // hide chat window if it is opened
            else 
            {
                if (this.state.chatOpened)
                {
                    this.closeChat()
                }
            }
        }
        
        // if chat is opened, send key event
        if (this.state.chatWindowRef !== undefined)
        {
            this.state.chatWindowRef.keyPress(event)
        }
    }

    updateChats(chats)
    {
        let chatsPool = []

        // sort chats by their last update time
        let sortedChat = Object.entries(chats)
            .sort(([,a],[,b]) => a.last_update-b.last_update)
            .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});

        for (let i in sortedChat)
        {
            let chat = chats[i]

            chatsPool = [<ChatElement
                onClick={(uuid) => this.openChat(uuid)}
                uuid={chat.uuid}
                avatar={chat.settings.avatar}
                avatarLetter={chat.settings.avatar === "default" ? chat.title[0] : undefined}
                title={chat.title}
                description={chat.last_message.content}
            />, ...chatsPool]
        }

        this.setState({ chats: chatsPool })

        this.props.app.setLoadingState(false)
    }

    displayErrorTimeout(message, callback)
    {
        const maxI = this.state.lastInterval
        for (let i = 0; i < this.state.lastInterval; i++)
        {
            setTimeout(() => {
                this.props.app.setLoadingState(true, message + ". " + langGetStringFormatted("timer_retrying", { time: maxI - i }))
            }, 1000 * i)
        }

        setTimeout(callback, 1000 * this.state.lastInterval)

        this.setState({ lastInterval: (this.state.lastInterval < 60 ? this.state.lastInterval + 5 : 60) })
    }

    requestChats()
    {
        this.props.app.setLoadingState(true, langGetString("loading_information"))
        
        // close chat if any open
        this.closeChat()
       
        // request chats from the server
        this.props.app.apiCall((code, data) => {
            if (code === 200)
            {
                this.updateChats(data)
            }
            else if (code === 404) {
                // add placeholder that tells thecuser no chats available
                this.setState({ chats: [
                    <li className="chat-placeholder noselect"><p>{langGetString("no_chats_available")} <div onClick={() => this.beginSearching()} id="create-chat">{langGetString("somebody")}</div>.</p></li>
                ]})
                
                this.props.app.setLoadingState(false)
            }
            else {
                this.displayErrorTimeout(
                    langGetStringFormatted("error_unable_get_chats", {errorCode: code}),
                    () => this.requestChats()
                )
            }
        }, {}, "/chats", "GET")
    }

    requestChatCreate(userData)
    {
        // Tell the server that we want to create a dialog. Then open it.
        this.props.app.apiCall((code, data) => {
            if (code === 200)
            {
                // Update chats list
                this.requestChats()
    
                // Open created chat
                this.openChat(data.uuid)
            }
            else {
                // else statement would execute only when an internal server error occurred
                this.displayErrorTimeout(langGetStringFormatted("error_unable_send_request", {errorCode: code}), () => this.requestChats())
            }
        }, {
            members: [userData.uuid],
            title: `${userData.nickname.capitalize()}, ${this.props.app.state.userData.nickname.capitalize()}`
        }, "/chats", "POST")
    }

    openChat(uuid)
    {
        // close chat if any open
        this.closeChat()

        // Get chat info
        this.props.app.apiCall((code, data) => {
            if (code === 200)
            {
                // open the chat
                this.setState({ chatOpened: true, chatInfo: data })
            }
            else {
                this.displayErrorTimeout(langGetStringFormatted("error_unable_get_chat", {errorCode: code}), () => this.requestChats())
            }
        }, {}, `/chats/${encodeURIComponent(uuid)}`, "GET")
    }

    closeChat()
    {
        this.setState({ chatWindowRef: undefined, chatOpened: false, chatInfo: [] })
    }

    leftMenuAction()
    {
        // check if the user currently in search mode, and if it is, then hide search list
        if (this.state.inSearchMode)
        {
            // remove search event, because ChatsFinder component set it up earlier
            this.eventsHandler.unsubscribeSearchMessage()

            // hide search list
            this.setState({ inSearchMode: false }, () => {
                this.searchField.ref.value = ""

                // remove focus from search field
                this.searchField.ref.blur()
            })
        }
        else this.setState({ isMenuShown: !this.state.isMenuShown })
    }

    beginSearching()
    { // when search box is clicked or from some other events
        this.setState({ inSearchMode: true }, () => {
            // focus search box
            this.searchField.ref.focus()
        })
    }

    updateSearchBox(value)
    {
        this.setState({ searchValue: value })
        this.eventsHandler.pollSearchMessage(value)
    }

    render()
    {
        return (<div className={"messenger-page " + (this.props.className !== undefined ? this.props.className : "")} style={this.props.style}>
            <div id="bg" />
            
            {/* Menu panel. Hidden until its button is clicked */}
            <div
                className="menu-bar"
                style={{
                    transform: "translateX(" + (this.state.isMenuShown ? "0px" : "-100%") + ")"
                }}>
                
                <Button
                    onClick={() => this.leftMenuAction()}
                    style={{ width: 40, height: 40, margin: 10  }}
                    icon={<CloseIcon />}
                />
            </div>

            {/* List of chats. This div also contains search box with menu button */}
            <div className="left-list">
                <div className="search-box" style={{ transform: "translateX(" + (!this.state.isMenuShown ? "0px" : "100%") + ")" }}>
                    <Button
                        onClick={() => this.leftMenuAction()}
                        style={{ width: 40, height: 40 }}
                        icon={this.state.inSearchMode ? <CloseIcon /> : <MenuIcon />}
                    />
                    
                    <TextField
                        style={{ width: "calc(80% - 30px)", height: 38, marginRight: 20, marginTop: -2 }}
                        setValue={(value) => this.updateSearchBox(value)}
                        onClick={(evt) => this.beginSearching()}
                        hint={langGetString("search")}
                        elemClassName="search-field"
                        ref={(v) => this.searchField = v}
                    />
                </div>

                {this.state.inSearchMode && <div className="search-list">
                    <ChatsFinder messenger={this} app={this.props.app} onUserClick={(userData) => this.requestChatCreate(userData)} />
                </div>}

                {!this.state.inSearchMode && <div className="chats-list" style={{ transform: "translateX(" + (!this.state.isMenuShown ? "0px" : "100%") + ")" }}>
                    <ul>{this.state.chats}</ul>
                </div>}
            </div>

            {/* Current opened chat */}
            <div className="chat" style={this.state.chatOpened ? { zIndex: 2 } : {}}>
                {!this.state.chatOpened && <div className="chat-placeholder noselect" style={{ height: "100vh" }}>
                    <p>{langGetString("open_chat")}</p>
                </div>}
                {this.state.chatOpened && <ChatWindow _ref={(ref) => this.setState({ chatWindowRef: ref })} messenger={this} app={this.props.app} chatInfo={this.state.chatInfo} />}
            </div>

        </div>);
    }

}

