const editor = $('#editor')
const showDom = $('#show-content')
const markdown = new MarkdownParser()
showDom.innerHTML = markdown.compile(editor.children)

function onInput() {
    // 为每个元素加上索引，通过索引找到 markdown 渲染后的元素
    let index = 0
    const data = Array.from(editor.children)
    data.forEach(item => {
        delete item.dataset.index
        // 忽略 br 换行符和空文本字节
        if (item.tagName !== 'BR' && item.innerText.trim() !== '') {
            if (!item.children.length || (item.children.length === 1 && item.children[0].tagName === 'BR')) {
                item.dataset.index = index++
                return
            }

            // 这里主要是针对复制过来的有嵌套节点的内容
            const frag = document.createDocumentFragment()
            Array.from(item.childNodes).forEach(e => {
                if (e.nodeType === Node.TEXT_NODE) {
                    const div = document.createElement('div')
                    div.textContent = e.nodeValue
                    item.replaceChild(div, e)
                    div.dataset.index = index++
                    frag.appendChild(div)
                } else if (item.tagName !== 'BR') {
                    e.dataset?.index && delete e.dataset.index
                    e.dataset.index = index++
                    frag.appendChild(e)
                }
            })
            
            editor.replaceChild(frag, item)
            
            // 需要修改光标位置，不然光标会在复制内容的前面，修改后会在复制内容的后面
            changeCursorPosition(editor.querySelector(`[data-index="${index - 1}"]`))
        }
    })

    showDom.innerHTML = markdown.compile(editor.childNodes)
}

const debounceFn = debounce(100) // 防抖
editor.oninput = () => {
    debounceFn(onInput)
}

editor.onpaste = (e) => {
    clearTextStyle(e)
}

// 是否允许滚动
const canScroll = {
    editor: true,
    showDom: true,
}

const debounceFn2 = debounce(100) // 防抖
const throttleFn = throttle(50) // 节流
editor.onscroll = () => {
    if (!canScroll.editor) return

    canScroll.showDom = false
    throttleFn(onScroll, editor, showDom)
    debounceFn2(resumeScroll)
}

showDom.onscroll = () => {
    if (!canScroll.showDom) return

    canScroll.editor = false
    throttleFn(onScroll, showDom, editor)
    debounceFn(resumeScroll)
}

// 恢复滚动
function resumeScroll() {
    canScroll.editor = true
    canScroll.showDom = true
}

/**
 * 
 * @param {HTMLElement} scrollContainer 正在滚动的容器
 * @param {HTMLElement} ShowContainer 需要同步滚动的容器
 * @returns 
 */
function onScroll(scrollContainer, ShowContainer) {
    const scrollHeight = ShowContainer.scrollHeight
    // 滚动到底部
    if (scrollContainer.offsetHeight + scrollContainer.scrollTop >= scrollContainer.scrollHeight) {
        ShowContainer.scrollTo({ top: scrollHeight - ShowContainer.clientHeight })
        return
    }

    // 滚动到顶部
    if (scrollContainer.scrollTop === 0) {
        ShowContainer.scrollTo({ top: 0 })
        return
    }

    const nodes = Array.from(scrollContainer.children)
    for (const node of nodes) {
        // 从上往下遍历，找到第一个在屏幕内的元素
        if (canNodeCalculate(node)) {
            // 如果当前滚动的元素是 <pre> <table>
            if (node.tagName === 'PRE' || node.tagName === 'TABLE') {
                // 如果 pre 里面的子元素同步滚动了，则直接返回
                if (hasPreElementInScrollContainerScroll(node, ShowContainer)) return
                // 否则直接从下一个元素开始计算
                continue
            }

            const index = node.dataset.index
            // 根据滚动元素的索引，找到它在渲染框中对应的元素
            const dom = ShowContainer.querySelector(`[data-index="${index}"]`)
            if (!dom) continue

            // 获取滚动元素在滚动屏中展示的内容百分比
            const percent = percentOfdomInScreen(node)
            // 计算这个对等元素在展示屏中距离容器顶部的高度
            const heightToTop = getHeightToTop(dom)
            // 根据 percent 算出对等元素在展示屏中需要隐藏的高度
            const domNeedHideHeight = dom.offsetHeight * (1 - percent)
            // scrollTo({ top: heightToTop }) 会把对等元素滚动到在展示屏中恰好完全展示整个元素的位置
		    // 然后再滚动它需要隐藏的高度 domNeedHideHeight，组合起来就是 scrollTo({ top: heightToTop + domNeedHideHeight })
            ShowContainer.scrollTo({ top: heightToTop + domNeedHideHeight })
            break
        }
    }
}

function hasPreElementInScrollContainerScroll(preElement, ShowContainer) {
    for (const node of preElement.children[0].children) {
        // 从上往下遍历，找到第一个在屏幕内的元素
        if (isInScreen(node) && percentOfdomInScreen(node) >= 0) {
            const index = node.dataset.index
            const dom = ShowContainer.querySelector(`[data-index="${index}"]`)
            if (!dom) continue

            const percent = percentOfdomInScreen(node)
            const heightToTop = getHeightToTop(dom)
            const domNeedHideHeight = dom.offsetHeight * (1 - percent)
            ShowContainer.scrollTo({ top: heightToTop + domNeedHideHeight })
            return true
        }
    }

    return false
}