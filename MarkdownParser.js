class MarkdownParser {
    compile(nodes) {
        let matchArr
        let html = ''
        for (let i = 0, len = nodes.length; i < len; i++) {
            let text = ''
            let index = 0
            const node = nodes[i]
            if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.innerHTML === '<br>') {
                    // 多个空行只算一个
                    html += `<div></div>`
                    while (nodes[i + 1].nodeType === Node.ELEMENT_NODE && nodes[i + 1].innerHTML === '<br>') {
                        i++
                    }

                    continue
                }

                index = node.dataset.index
                text = node.textContent.trim()
            } else {
                text = node.nodeValue.trim()
            }

            matchArr = text.match(/^#\s/)
                        || text.match(/^##\s/)
                        || text.match(/^###\s/)
                        || text.match(/^####\s/)
                        || text.match(/^#####\s/)
                        || text.match(/^######\s/)
                        || text.match(/^\*{3,}/)
                        || text.match(/^>/)
                        || text.match(/^\*\s/)
                        || text.match(/^\d*\.\s/)
                        || text.match(/^```/)
                        || text.match(/^\|.*\|/)

            if (matchArr) {
                let temp = ''
                const re1 = /^>/
                const re2 = /^\*\s/
                const re3 = /^\d*\.\s/
                const re4 = /^```/
                const re5 = /^\|.*\|/
                switch(matchArr[0]) {
                    case '# ':
                        html += `<h1 data-index="${index}">` + this.format(text.substring(2)) + '</h1>'
                        break
                    case '## ':
                        html += `<h2 data-index="${index}">` + this.format(text.substring(3)) + '</h2>'
                        break
                    case '### ':
                        html += `<h3 data-index="${index}">` + this.format(text.substring(4)) + '</h3>'
                        break
                    case '#### ':
                        html += `<h4 data-index="${index}">` + this.format(text.substring(5)) + '</h4>'
                        break
                    case '##### ':
                        html += `<h5 data-index="${index}">` + this.format(text.substring(6)) + '</h5>'
                        break
                    case '###### ':
                        html += `<h6 data-index="${index}">` + this.format(text.substring(7)) + '</h6>'
                        break
                    case text.match(/^\*{3,}/) && text.match(/^\*{3,}/)[0]:
                        html += text.replace(/^\*{3,}/g, '<hr>')
                        break
                    case '>':
                        while (i < len && nodes[i].textContent.match(re1)) {
                            const str = nodes[i].textContent
                            temp += '<div>' + this.format(str.slice(1)) + '</div>'
                            i++
                        }

                        i--
                        html += `<blockquote data-index="${index}">` + temp + '</blockquote>'
                        break
                    case '* ':
                        while (i < len && nodes[i].textContent?.match(re2)) {
                            const str = nodes[i].textContent
                            temp += `<li data-index="${nodes[i]?.dataset?.index}">` + this.format(str.slice(2)) + '</li>'
                            i++
                        }

                        i--
                        html += `<ul data-index="${index}">` + temp + '</ul>'
                        break
                    case text.match(/^\d*\.\s/) && text.match(/^\d*\.\s/)[0]:
                        while (i < len && nodes[i].textContent?.match(re3)) {
                            const str = nodes[i].textContent
                            temp += `<li data-index="${nodes[i]?.dataset?.index}">` + this.format(str.replace(/^\d*\.\s/, '')) + '</li>'
                            i++
                        } 

                        i--
                        html += `<ol data-index="${index}">` + temp + '</ol>'
                        break
                    case '```':
                        i++
                        while (i < len && !re4.test(nodes[i].textContent)) {
                            temp += `<div data-index="${nodes[i]?.dataset?.index}">` + escapeHTML(nodes[i].textContent) + '</div>'
                            i++
                        }
                        
                        html += `<pre data-index="${index}"><code>` + temp + '</code></pre>'
                        break
                    case text.match(/^\|.*\|/) && text.match(/^\|.*\|/)[0]:
                        let thRe = /^\[th\]/
                        let arr, j, jlen
                        while (i < len && re5.test(nodes[i].textContent)) {
                            arr = nodes[i].textContent.split('|')
                            temp += `<tr data-index="${nodes[i]?.dataset?.index}">`
                            for (j = 1, jlen = arr.length - 1; j < jlen; j++) {
                                if (thRe.test(arr[1])) {
                                    temp += '<th>' + arr[j] + '</th>'
                                } else {
                                    temp += '<td>' + arr[j] + '</td>'
                                }
                            }
                            temp += '</tr>'
                            temp = temp.replace('[th]', '')
                            i++
                        }

                        html += '<table>' + temp + '</table>'
                        break
                }
            } else if (text) {
                html += `<div data-index="${index}">` + this.format(text) + '</div>'
            }

        }

        return html
    }

    format(str) { 
        str = str.replace(/\s/g, '&nbsp') 

        const bold = str.match(/\*{2}[^*].*?\*{2}/g) // 惰性匹配
        if (bold) {
            for (let i = 0, len = bold.length; i < len; i++) {
                str = str.replace(bold[i], '<b>' + bold[i].substring(2, bold[i].length - 2) + '</b>')
            }
        }

        const italic = str.match(/\*[^*].*?\*/g)  
        if (italic) {
            for (let i = 0, len = italic.length; i < len; i++) {
                str = str.replace(italic[i], '<i>' + italic[i].substring(1, italic[i].length - 1) + '</i>')
            }
        }

        const code = str.match(/`[^`]*`/g)
        if (code) {
            for (let i = 0, len = code.length; i < len; i++) {
                str = str.replace(code[i], '<code>' + code[i].substring(1, code[i].length - 1) + '</code>')
            }
        }

        const img = str.match(/!\[.*\]\(.*\)/g)
        const re1 = /\(.*\)/
        const re2 = /\[.*\]/
        if (img) {
            for (let i = 0, len = img.length; i < len; i++) {
                const url = img[i].match(re1)[0]
                const title = img[i].match(re2)[0]
                str = str.replace(img[i], '<img src=' + url.substring(1, url.length - 1) + ' alt=' + title.substring(1, title.length -1) + '>')
            }
        }

        const a = str.match(/\[.*?\]\(.*?\)/g)
        if (a) {
            for (let i = 0, len = a.length; i < len; i++) {
                const url = a[i].match(re1)[0]
                const title = a[i].match(re2)[0]
                str = str.replace(a[i], '<a href=' + url.substring(1, url.length - 1)  + '>' + title.substring(1, title.length -1) + '</a>')
            }
        }

        return escapeHTML2(str)
    }
}

function escapeHTML(html) {
    return html.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeHTML2(html) {
    return html.replace(/<(\/)?script>/g, '&lt;$1script&gt;')
}