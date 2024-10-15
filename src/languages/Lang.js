import $ from 'jquery'

import { _EN_MESSAGES } from './en.js'
import { _RU_MESSAGES } from './ru.js'

export function loadLanguage(id)
{
    window.__loadedLanguage = id.toUpperCase()
}

export function langGetString(name)
{
    switch (window.__loadedLanguage)
    {
        case "EN":
            return _EN_MESSAGES[name]
        case "RU":
            return _RU_MESSAGES[name]

        default:
            return "Unknown message"
    }
}

// used when some words have to be changed based on the number provided
export function langGetStringWithNumber(name, number)
{
    const sentence =  langGetString(name)

    let source = sentence[0]
    let params = {
        number: number,
        mod: sentence[1](number)
    }

    $.each(params, function (i, n) {
        source = source.replace(new RegExp("\\{" + i + "\\}", "g"), n);
    })

    return source
}

export function langGetStringFormatted(name, params)
{
    let source = langGetString(name)

    $.each(params, function (i, n) {
        source = source.replace(new RegExp("\\{" + i + "\\}", "g"), n);
    })

    return source;
}

