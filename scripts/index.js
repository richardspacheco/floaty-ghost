function newElement(tagName, className) {
    const element = document.createElement(tagName)
    element.className = className
    return element
}

class Barrier {
    constructor(canvas) {
        this.canvas = canvas

        this.build(/* gapSize */)
        this.positionIncrement = 10
        this.isScored = false
    }

    build(gapSize = 144) {
        this.element = newElement('div', 'barrier')
        this.canvas.appendChild(this.element)

        this.columnTopHead = newElement('div', 'column top head')
        this.columnTopBody = newElement('div', 'column top body')
        this.columnGap = newElement('div', 'column gap')
        this.columnBottomHead = newElement('div', 'column bottom head')
        this.columnBottomBody = newElement('div', 'column bottom body')

        this.columnGap.style.height = `${gapSize}px`

        /* TODO: Improve gap distribution */
        const random = Math.random()
        this.columnTopBody.style.flexGrow = 0.2 + random
        this.columnBottomBody.style.flexGrow = 1.2 - random

        this.element.appendChild(this.columnTopBody)
        this.element.appendChild(this.columnTopHead)
        this.element.appendChild(this.columnGap)
        this.element.appendChild(this.columnBottomHead)
        this.element.appendChild(this.columnBottomBody)

        this.startingPosition = - this.element.clientWidth
        this.setPosition(this.startingPosition)
    }

    getPosition() {
        return parseInt(this.element.style.right.split('px')[0])
    }

    setPosition(newPosition) {
        this.element.style.right = `${newPosition}px`
    }
}

class Scenario {
    constructor(canvas) {
        this.canvas = canvas
        this.barriers = []
        this.createBarrier()
    }

    createBarrier() {
        const barrier = new Barrier(this.canvas)
        this.barriers.push(barrier)
    }

    removeBarrier(barrier) {
        this.canvas.removeChild(barrier.element)
        this.barriers.shift()
    }

    shift(barrier) {
        const newPosition = barrier.getPosition() + barrier.positionIncrement
        barrier.setPosition(newPosition)

        if (newPosition > this.canvas.clientWidth) {
            this.removeBarrier(barrier)
        }

        if (30 === (newPosition - barrier.startingPosition) / barrier.positionIncrement) {
            this.createBarrier()
        }
    }
}

class Ghost {
    constructor(canvas) {
        this.canvas = canvas

        this.spawn()
        this.gravity()
    }

    spawn() {
        this.element = newElement('img', 'ghost')
        this.element.src = "assets/imgs/ghost_mid.png"
        this.canvas.appendChild(this.element)

        this.maxHeight = this.canvas.clientHeight - this.element.clientHeight

        const startingPosition = this.maxHeight / 2
        this.setPosition(startingPosition)

        this.isFloating = false
    }

    gravity() {
        window.onkeydown = () => this.isFloating = true
        window.onkeyup = () => this.isFloating = false
    }

    getPosition() {
        return parseInt(this.element.style.bottom.split('px')[0])
    }

    setPosition(newPosition) {
        this.element.style.bottom = `${newPosition}px`
    }

    float() {
        const newPosition = this.getPosition() + (this.isFloating ? 7 : -10)

        if (this.isFloating) {
            this.element.src = "assets/imgs/ghost_up.png"
        } else this.element.src = "assets/imgs/ghost_down.png"

        if (newPosition < 0) {
            this.setPosition(0)
        } else if (newPosition > this.maxHeight) {
            this.setPosition(this.maxHeight)
        } else {
            this.setPosition(newPosition)
        }
    }
}

class Scoreboard {
    constructor(canvas) {
        this.canvas = canvas

        this.scoreboard = newElement('div', 'score')
        this.canvas.appendChild(this.scoreboard)

        this.currentScore = 0
        this.update()
    }

    update() {
        this.scoreboard.innerHTML = this.currentScore
    }

    increment() {
        this.currentScore++
        this.update()
    }
}

class Game {
    constructor({ container, buttonNew, buttonStart, buttonPause }) {
        this.container = container
        this.canvas = newElement('div', 'canvas')
        this.container.appendChild(this.canvas)

        buttonNew.onclick = () => {
            this.setup()
        }

        /* TODO: Hide disabled buttons */
        buttonStart.onclick = () => {
            if (!this.isRunning && !this.isGameOver) this.start()
        }

        buttonPause.onclick = () => {
            if (this.isRunning && !this.isGameOver) this.pause()
        }
    }

    setup() {
        if (this.container.contains(this.gameOverSplash)) {
            this.container.removeChild(this.gameOverSplash)
        }

        this.pause()
        this.isGameOver = false
        this.canvas.innerHTML = ""

        this.score = new Scoreboard(this.canvas)
        this.ghost = new Ghost(this.canvas)
        this.scenario = new Scenario(this.canvas)

        this.start()
    }

    start() {
        this.isRunning = true
        this.gameAnimation = setInterval(() => {
            this.ghost.float()

            const barriers = [...this.scenario.barriers]
            barriers.forEach(barrier => {
                this.scenario.shift(barrier)
                this.checkCollision(barrier)
                this.checkScore(barrier)
            })
        }, 50)
    }

    pause() {
        this.isRunning = false
        clearInterval(this.gameAnimation)
    }

    gameOver() {
        clearInterval(this.gameAnimation)
        this.isGameOver = true
        this.gameOverSplash = newElement('div', 'game-over')
        this.container.appendChild(this.gameOverSplash)
    }

    checkScore(barrier) {
        if (barrier.isScored) return

        const rect1 = this.ghost.element.getBoundingClientRect()
        const rect2 = barrier.element.getBoundingClientRect()

        if (rect1.x > rect2.x + rect2.width) {
            barrier.isScored = true
            this.score.increment()
        }
    }

    checkCollision(barrier) {
        /* Collision detection is adapted from bounding box algorithm */
        const rect1 = this.ghost.element.getBoundingClientRect()
        const rect2 = barrier.element.getBoundingClientRect()
        const rect3 = barrier.columnGap.getBoundingClientRect()

        const atBarrier = rect1.x + rect1.width > rect2.x && rect1.x < rect2.x + rect2.width
        const insideGap = rect1.y > rect3.y && rect1.y + rect1.height < rect3.y + rect3.height

        this.hasCollided = atBarrier && !insideGap
        if (this.hasCollided) this.gameOver()
    }
}

const container = document.querySelector('[fg-screen]')
const buttonNew = document.querySelector('[fg-new]')
const buttonStart = document.querySelector('[fg-start]')
const buttonPause = document.querySelector('[fg-pause]')

new Game({ container, buttonNew, buttonStart, buttonPause })
