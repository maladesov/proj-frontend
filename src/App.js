import React from 'react';
import $ from "jquery";

import LoginPage from './pages/LoginPage.js'
import MessengerPage from './pages/MessengerPage.js'
import { loadLanguage } from './languages/Lang.js'

import PopupDialog from './components/PopupDialog.js'

import './App.css'

export const WEB_API_URL = "http://127.0.0.1:8080/api"
export const WS_API_URL = "ws://127.0.0.1:8080/ws"



// useful property
Object.defineProperty(String.prototype, 'capitalize', {
  value: function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
  },
  enumerable: false
});


export default class App extends React.Component {
    constructor(props)
    {
        super(props);

        this.state = {
            token: localStorage.getItem("token"),
            userData: {},

            isLoggedIn: false,
            loaderMessage: "",
            isLoading: true,

            popupState: 0,  // 0 - closed, 1 - opening, 2 - opened and waiting for action, 3 - closing
            popupChildren: undefined,
        };

        this.language = "en"
        this.keyUpHandlers = []

        this.websocketServer = undefined

        loadLanguage(this.language);
    }

    async apiCall(callback, data, apiMethod, httpMethod, version)
    {
        if (version === undefined)
            version = "v1"

        let request = {
            url: WEB_API_URL + "/" + version + apiMethod,
            headers: {
                "Content-Type":"application/json",
            },
            type: httpMethod,
        }

        // add user's token to the header, if it is not undefined
        if (this.state.token !== undefined)
            request.headers['authorization'] = this.state.token
        
        // add data to the request, if it is not empty
        if (Object.keys(data).length !== 0)
            request['data'] = (httpMethod === "GET" ? data : JSON.stringify(data))

        // todo: remove double slashes in url
        $.ajax(request).done((result) => {
            callback(200, result)
        }).fail((resp, exception) => {
            if (resp.status === 401)
            { // unable to authorize. logout
                this.logout()
                return;
            }

            callback(
                resp.status,
                resp.responseJSON === undefined ? {} : resp.responseJSON
            )
        })
    }

    async login(email, password, callback)
    {
        await this.apiCall((code, data) => {
            // send result to the callback
            callback(code, data) 

            // check result code
            if (code === 200)
            {
                // save token and reload the page
                localStorage.setItem("token", data.token)
                this.setState({ token: data.token })
                window.location.reload()
            }
        }, { email: email, password: password }, '/auth/login', 'POST')
    }

    keyUpHandler(event) 
    {
        if (event.code === "Escape")
        {
            this.closePopupDialog()
        }

        // send key events to all subscribers
        for (let i in this.keyUpHandlers)
            this.keyUpHandlers[i](event)
    }

    componentDidMount()
    {
        // add events and authenticate
        $(document).on("keyup", e => this.keyUpHandler(e))

        this.authenticate()
    }

    componentWillUnmount()
    {
        // remove events
        $(document).off("keyup")
        this.keyUpHandlers = []
    }

    subscribeKeyboardEvent(callback)
    {
        this.keyUpHandlers.push(callback)
    }

    authenticate()
    {
        this.setLoadingState(true, "Loading...")

        if (this.state.token === null || this.state.token === undefined)
        {
            this.setLoadingState(false)
            this.setState({ isLoggedIn: false })
            return;
        }

        // try to login using token
        this.apiCall((code, data) => {
            if (code === 200)
            {
                this.authenticateSuccess(data)
            }
            else {
                // unable to login
                localStorage.removeItem("token")
                window.location.reload()
            }
        }, {}, "/auth/token", "GET")
    }

    logout()
    {
        localStorage.removeItem("token")
        window.location.reload()
    }

    getLanguage()
    {
        return this.language
    }

    getRegion()
    {
        return this.language + "-US"
    }

    authenticateSuccess(data)
    {
        // save user data that we got with the response
        this.setState({ userData: data, isLoggedIn: true })
    }

    setLoadingState(state, msg)
    {
        this.setState({ isLoading: state, loaderMessage: msg })
    }

    setPopupDialog(jsx)
    {
        if (jsx === undefined)
        {
            // Update the flag to tell the popup it needs to play close animation
            this.setState({ popupState: 3 })
            
            // Wait for the animation
            setTimeout(() => this.setState({ popupState: 0, popupChildren: undefined }), 300);
        }
        else {
            // Update popup children so the dialog can appear
            this.setState({ popupState: 1, popupChildren: jsx })

            // Wait a bit for the animation to process and then update flag
            setTimeout(() => this.setState({ popupState: 2 }), 300)
        }
    }

    closePopupDialog()
    {
        // check that the dialog opened
        if (this.state.popupState === 2)
        {
            this.setPopupDialog(undefined)
        }
    }

    render()
    {
        return (<>

            {/* Div that disables clicking on the site while it is still loading */}
            {this.state.isLoading &&
                <div className="loader">{this.state.loaderMessage}</div>
            }

            {/* Note: style for this div makes its blurry when a loading is pending */}
            <div id="app" style={this.state.isLoading ? { filter: "blur(32px)", transform: "scale(1.3)" } : {}}>
                {/* Popup dialog. If you click on app-popup div, the dialog will close */}
                {this.state.popupChildren !== undefined &&
                            <div className="app-popup">
                                {/* The dialog */}
                                <PopupDialog
                                     style={this.state.popupState === 3 ? { animation: "popup-close-animation 0.2s cubic-bezier(0.85, 0, 0.15, 1) forwards" } :
                                            this.state.popupState === 1 ? { animation: "popup-open-animation 0.2s cubic-bezier(0.85, 0, 0.15, 1)"  } : {} }>
                                     {this.state.popupChildren}
                                 </PopupDialog>
                                 
                                 {/* Div to detect close click event */}
                                 <div style={{ zIndex: 11, position: "absolute", width: "100%", height: "100%" }} onClick={() => this.closePopupDialog()} />
                            </div>}

                {!this.state.isLoggedIn && <LoginPage app={this} />}
                {this.state.isLoggedIn && <MessengerPage app={this} />}
            </div>

        </>);
    }

};

