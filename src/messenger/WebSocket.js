import { WS_API_URL } from '../App.js'


export const WebSocketPacketId = {
    CHAT_EVENT: 0,
}

export const WebSocketEvent = {
    ON_MESSAGE: 0,
    ON_CLOSE: 1,
}

export function WebSocketPacket(packetId, data, marker)
{
    return {
        packet: packetId,
        data: data,
        marker: marker,
        time: new Date().getTime()
    }
}


export class WebSocketConnection {
    #server;
    #connInfo;
    #userData;

    constructor(service, version, userData)
    {
        this.#userData = userData
        this.#server = new WebSocket(`${WS_API_URL}/${version}/${service}?token=${encodeURIComponent(this.#userData.token)}`)
        this.isAlive = true

        this.#server.onopen = (e) => this.#onConnection(e)
        this.#server.onmessage = (e) => this.#onMessage(e)
        this.#server.onclose = (e) => this.#onClose(e)
        this.#server.onerror = (e) => this.#onError(e)

        this.callbacks = {}
        this.#connInfo = `${service}/${version}`
    }

    #onConnection(e) 
    {
        console.log(`Connected to ${this.#connInfo}`)
    }
    
    #onError(e)
    {
        console.error(`WS Connection error`, e)
    }

    #onMessage(e)
    {
        // call callback if it is not undefined
        if (this.callbacks[WebSocketEvent.ON_MESSAGE] !== undefined)
            this.callbacks[WebSocketEvent.ON_MESSAGE](this, e)
    }

    #onClose(e)
    {
        // call callback if it is not undefined
        if (this.callbacks[WebSocketEvent.ON_CLOSE] !== undefined)
            this.callbacks[WebSocketEvent.ON_CLOSE](this, e)
        
        console.log(`Closing connection with ${this.#connInfo} (code: ${e.code})`)
        this.close()
    }

    subscribeEvent(event, callback)
    {
        this.callbacks[event] = callback
    }

    sendPacket(packet)
    {
        this.#server.send(JSON.stringify(packet))
    }

    close()
    {
        console.log(`Disconnected ${this.#connInfo}`)
        this.#server.close()
        this.isAlive = false
    }

}
