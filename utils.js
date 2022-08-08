function $(selector) {
    return document.querySelector(selector)
}

// 修改光标位置
function changeCursorPosition(node) {
    const selection = window.getSelection()
    // 清除所有选区 如果是 Caret 类型，清除选区后变为 Range，如果不是 Range 类型，后面的 addRange() 就不起作用
    selection.removeAllRanges()
    const range = document.createRange()
    // 选中节点的内容
    range.selectNode(node)
    selection.addRange(range)
    // 取消选中并将光标移至选区最后
    selection.collapseToEnd()
}

// 清除复制后的内容样式
function clearTextStyle(e) {
    e.preventDefault()

    let text
    const clp = (e.originalEvent || e).clipboardData
    if (clp === undefined || clp === null) {
        text = window.clipboardData.getData('text') || ''
        if (text !== '') {
            if (window.getSelection) {
                var newNode = document.createElement('span')
                newNode.innerHTML = text
                window.getSelection().getRangeAt(0).insertNode(newNode)
            } else {
                document.selection.createRange().pasteHTML(text)
            }
        }
    } else {
        text = clp.getData('text/plain') || ''
        if (text !== '') {
            document.execCommand('insertText', false, text)
        }
    }
}

function throttle(delay) {
    let waitForCallFunc
    let canCall = true
    return function helper(callback, ...args) {
        if (!canCall) {
            if (callback) waitForCallFunc = callback
            return
        }

        callback(...args)
        canCall = false
        setTimeout(() => {
            canCall = true
            if (waitForCallFunc) {
                helper(waitForCallFunc, ...args)
                waitForCallFunc = null
            }
        }, delay)
    }
}

function debounce(delay) {
    let timer
    return function(callback, ...args) {
        clearTimeout(timer)
        timer = setTimeout(() => callback.call(null, ...args), delay)
    }
}

/**
 * 计算 dom 到容器顶部的距离
 * @param {HTMLElement} dom 需要计算的容器
 * @param {HTMLElement} topContainer 终止条件
 * @returns 
 */
 function getHeightToTop(dom, topContainer) {
    let height = dom.offsetTop
    let parent = dom.parentNode

    while (parent && parent !== topContainer) {
        height += parent.offsetTop
        parent = parent.parentNode
    }

    return height
}

// dom 是否在屏幕内
function isInScreen(dom) {
    const { top, bottom } = dom.getBoundingClientRect()
    return bottom >= 0 && top < window.innerHeight
}

// dom 在当前屏幕展示内容的百分比
function percentOfdomInScreen(dom) {
    const { height, bottom } = dom.getBoundingClientRect()
    if (bottom <= 0) return 0
    if (bottom >= height) return 1
    return bottom / height
}