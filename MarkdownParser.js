class MarkdownParser {
    compile(nodes) {
        let matchArr
        let html = ''
        for (let i = 0, len = nodes.length; i < len; i++) {
            let text = ''
            let index = 0
            const node = nodes[i]
            if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.innerHTML === '<br>') continue

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
                        || text.match(/^>\s/)
                        || text.match(/^\*\s/)
                        || text.match(/^\d\.\s/)
                        || text.match(/^```/)
                        || text.match(/^\|.*\|/)
                        || text.match(/`[^`]*`/)

            if (matchArr) {
                let temp = ''
                const re1 = /^>\s/
                const re2 = /^\*\s/
                const re3 = /^\d\.\s/
                const re4 = /^```/
                const re5 = /^\|.*\|/
                const re6 = /`[^`]*`/
                console.log(matchArr[0], text.match(/`[^`]*`/))
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
                    case '> ':
                        while (i < len && nodes[i].textContent.match(re1)) {
                            const str = nodes[i].textContent
                            temp += '<div>' + str.substring(2, str.length) + '</div>'
                            i++
                        }
                        html += `<blockquote data-index="${index}">` + temp + '</blockquote>'
                        break
                    case '* ':
                        while (i < len && nodes[i].textContent?.match(re2)) {
                            const str = nodes[i].textContent
                            temp += '<li>' + str.substring(2, str.length) + '</li>'
                            i++
                        } 
                        html += `<ul data-index="${index}">` + temp + '</ul>'
                        break
                    case text.match(/^\d\.\s/) && text.match(/^\d\.\s/)[0]:
                        while (i < len && nodes[i].textContent?.match(re3)) {
                            const str = nodes[i].textContent
                            temp += '<li>' + str.substring(3, str.length) + '</li>'
                            i++
                        } 
                        html += `<ol data-index="${index}">` + temp + '</ol>'
                        break
                    case '```':
                        i++
                        while (i < len && !re4.test(nodes[i].textContent)) {
                            temp += nodes[i].textContent + '\n'
                            i++
                        }
                        html += `<pre data-index="${index}">` + temp + '</pre>'
                        break
                    case text.match(/^\|.*\|/) && text.match(/^\|.*\|/)[0]:
                        console.log('table')
                        let thRe = /^\[th\]/
                        let arr, j, jlen
                        while (i < len && re5.test(nodes[i].textContent)) {
                            arr = nodes[i].textContent.split('|')
                            temp += '<tr>'
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
                        html += `<table data-index="${index}">` + temp + '</table>'
                        break
                    default:
                        html += `<code class="highlight" data-index="${index}">` + text.slice(1, text.length - 1) + '</code>'
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

        const code = str.match(/`.+`/g)
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

        const a = str.match(/\[.*\]\(.*\)/g)
        if (a) {
            for (let i = 0, len = a.length; i < len; i++) {
                const url = a[i].match(re1)[0]
                const title = a[i].match(re2)[0]
                str = str.replace(a[i], '<a href=' + url.substring(1, url.length - 1)  + '>' + title.substring(1, title.length -1) + '</a>')
            }
        }

        return str
    }
}