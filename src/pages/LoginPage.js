import React from "react";
import $ from "jquery";

import TextField from '../components/ui/TextField.js'
import Button from '../components/ui/Button.js'
import { langGetString } from '../languages/Lang.js'

import './LoginPage.css'


export default class LoginPage extends React.Component
{
    constructor(props)
    {
        super(props)

        this.state = {
            email: "",
            password: ""
        };
    }

    async loginEvent()
    {
        // Set button color to gray while waiting for the response from the server.
        // We have only one button, so this should work
        this.forceUpdate(() => $(".button").css('background-color', '#a2acacd1'))
        
        // get email and password from fields
        let email = this.state.email
        let password = this.state.password

        // check fields
        // todo: improve checking
        $("#hint").css("opacity", 0)
        if (email.length === 0 || password.length < 8)
        {
            $("#hint").html(langGetString("malformed_email_password"))
            $("#hint").css("opacity", 1)
        }

        // send the login request to the server
        await this.props.app.login(email, password, (code, data) => {
            // check for errors
            $("#hint").css("opacity", 0)
            switch (code)
            {
                case 200: // login successful
                    break

                case 500: // internal error
                    $("#hint").html(langGetString("internal_error"))
                    $("#hint").css("opacity", 1)
                    break

                case 404: // invalid user
                    $("#hint").html(langGetString("incorrect_email_password"))
                    $("#hint").css("opacity", 1)
                    break

                case -1: // unable to connect
                    $("#hint").html(langGetString("unable_connect"))
                    $("#hint").css("opacity", 1)
                    break

                default: // unknown error
                    $("#hint").html(langGetString("unknown_error"))
                    $("#hint").css("opacity", 1)
                    break
            }
        })

        this.forceUpdate(() => $(".button").css('background-color', '#d6e0e0d1'))
    }

    render()
    {
        return (<div className={"login-page " + (this.props.className !== undefined ? this.props.className : "")} style={this.props.style}>
            <div className="background" />

            <form className="login-form">
                {/* Form title */}
                <div id="title">{langGetString("login_title")}</div>

                {/* Status hint (shows errors, if any occurred) */}
                <div id="hint" style={{ opacity: 0 }}>...</div>

                {/* Email field */}
                <TextField
                    hint={langGetString("email")}
                    setValue={(value) => this.setState({ email: value }) }
                    className="login-email"
                />
                
                {/* Password field */}
                <TextField
                    hint={langGetString("password")}
                    setValue={(value) => this.setState({ password: value }) }
                    isPassword={true}
                    className="login-password"
                />

                {/* Log in button */}
                <Button
                    onClick={() => this.loginEvent()}
                    text={langGetString("login_button")}
                    className="login-button"
                />
            </form>
        </div>);
    }

}

