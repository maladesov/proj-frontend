import {
    WebSocketConnection,
    WebSocketEvent,
    WebSocketPacket,
    WebSocketPacketId
} from './WebSocket.js'


// list of all possible event ids for chats
export const CHAT_EVENTS = [
    0,  // new message
    1,  // typing event
]


// Handles all messenger-related events using longpolling
export default class EventsHandler
{
    constructor(app, messenger)
    {
        this.app = app
        this.messenger = messenger

        this.handlers = []

        // this is used to identify messages in the handler
        this.lastMarker = 0
        this.markerCallbacks = {}

        this.websocketConnection = undefined
        this.currentChatCallback = undefined
        this.searchMessagesHandler = undefined
    }

    setup()
    {
        // subscribe for keyboard events
        this.app.subscribeKeyboardEvent((e) => {
            // check if any chats currently opened
            if (this.currentChatCallback !== undefined)
            {
                this.currentChatCallback("keyboard", e)
            }
        })

        // connect to websocket server
        this.websocketConnection = new WebSocketConnection('chats', 'v1', this.app.state.userData)
        console.log(this.websocketConnection)

        // setup websocket handler
        this.websocketConnection.subscribeEvent(
            WebSocketEvent.ON_MESSAGE,
            (_0, _1) => this.#websocketMessagesHandler(_0, _1)
        )
    }

    uninstall()
    {
        // close websocket connection
        this.websocketConnection.close()
    }

    sendServerEvent(id, data, callback)
    {
        const marker = this.lastMarker++
        
        // save callback
        if (callback !== undefined)
            this.markerCallbacks[marker] = callback

        // send the message
        this.websocketConnection.sendPacket(
            WebSocketPacket(id, data, marker)
        )
    }

    subscribeEvents(callback)
    {
        this.handlers.push(callback)
        return this.handlers.length - 1
    }

    pollSearchMessage(value)
    {
        if (this.searchMessagesHandler !== undefined)
            this.searchMessagesHandler(value)
    }

    unsubscribeSearchMessage()
    {
        this.searchMessagesHandler = undefined
    }

    subscribeSearchMessage(callback)
    { // only one search message subscriber is allowed
        this.searchMessagesHandler = callback
    }

    // private methods
    #websocketMessagesHandler(ws, event)
    {
        // decode data
        const data = JSON.parse(event.data)

        // check if we have callback for the message
        if (this.markerCallbacks[data.marker] !== undefined)
        {
            // call the callback and remove it
            this.markerCallbacks[data.marker](
                ws,
                data.code,
                data.message,
                data.data
            )

            delete this.markerCallbacks[event.marker]
        }


    }

}

