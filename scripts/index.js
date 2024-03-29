function newElement(tagName, className) {
    const element = document.createElement(tagName)
    element.className = className
    return element
}

class Barrier {
    constructor(game) {
        this.game = game

        this.buildBarrier(/* gapSize */)
        this.positionIncrement = 10
        this.isScored = false
    }
    
    buildBarrier(gapSize = 144) {
        this.element = newElement('div', 'barrier')
        this.game.activeCanvas.appendChild(this.element)
        
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

    active() {
        let newPosition = this.getPosition() + this.positionIncrement
        this.setPosition(newPosition)
    
        if (newPosition > this.game.activeCanvas.clientWidth) {
            this.element.parentNode.removeChild(this.element)
            this.game.barrierCollection.shift()
        }
        
        if (30 === (newPosition - this.startingPosition) / this.positionIncrement) {
            this.game.nextBarrier()
        }
    }
}

class Ghost {
    constructor(activeCanvas) {
        this.activeCanvas = activeCanvas

        this.spawnGhost()
        this.gravity()
    }
    
    spawnGhost() {
        this.element = newElement('img', 'ghost')
        this.element.src = "assets/imgs/ghost_mid.png"
        this.activeCanvas.appendChild(this.element)
        
        this.maxHeight = this.activeCanvas.clientHeight - this.element.clientHeight
        
        let startingPosition = this.maxHeight / 2
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
        let newPosition = this.getPosition() + (this.isFloating ? 7 : -10)

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
    constructor(activeCanvas) {
        this.activeCanvas = activeCanvas

        this.scoreboard = newElement('div', 'score')
        this.activeCanvas.appendChild(this.scoreboard)

        this.currentScore = 0
        this.scorePush(this.currentScore)
    }

    scoreCheck(ghostObj, barrierObj) {
        if (!barrierObj.isScored) {
            let rect1 = ghostObj.element.getBoundingClientRect()
            let rect2 = barrierObj.element.getBoundingClientRect()
    
            if (rect1.x > rect2.x + rect2.width) {
                barrierObj.isScored = true
                this.scorePush(++this.currentScore)
            }
        }
    }

    scorePush(score) {
        this.scoreboard.innerHTML = score
    }
}

class Game {
    constructor() {
        this.container = document.querySelector('[fg-screen]')
        this.activeCanvas = newElement('div', 'activeCanvas')
        this.container.appendChild(this.activeCanvas)

        document.querySelector('[fg-new]').onclick = () => {
            this.canvasSetup()
        }

        /* TODO: Hide disabled buttons */
        document.querySelector('[fg-start]').onclick = () => {
            if (!this.isRunning && !this.isGameOver) this.startGame()
        }

        document.querySelector('[fg-pause]').onclick = () => {
            if (this.isRunning && !this.isGameOver) this.pauseGame()
        }
    }

    canvasSetup() {
        if (document.querySelector('.game-over')) {
            this.container.removeChild(this.gameOverSplash)
        }

        this.pauseGame()
        this.isGameOver = false
        this.barrierCollection = []
        this.activeCanvas.innerHTML = ""
        
        this.gameScore = new Scoreboard(this.activeCanvas)
        this.ghost = new Ghost(this.activeCanvas)
        this.nextBarrier()

        this.startGame()
    }

    startGame() {
        this.isRunning = true
        this.gameAnimation = setInterval(() => {
            this.ghost.float()
            let currentCollection = [...this.barrierCollection]
            currentCollection.forEach(barrier => {
                barrier.active()
                this.gameScore.scoreCheck(this.ghost, barrier)
                if (this.collisionCheck(this.ghost, barrier)) this.gameOver()
            })
        }, 50)
    }
    
    pauseGame() {
        this.isRunning = false
        clearInterval(this.gameAnimation)
    }
    
    gameOver() {
        clearInterval(this.gameAnimation)
        this.isGameOver = true
        this.gameOverSplash = newElement('div', 'game-over')
        this.container.appendChild(this.gameOverSplash)
    }

    nextBarrier() {
        this.barrierCollection.push(new Barrier(this))
    }

    collisionCheck(ghostObj, barrierObj) {
        /* Collision detection is adapted from bounding box algorithm */
        let rect1 = ghostObj.element.getBoundingClientRect()
        let rect2 = barrierObj.element.getBoundingClientRect()
        let rect3 = barrierObj.columnGap.getBoundingClientRect()

        let atBarrier = rect1.x + rect1.width > rect2.x && rect1.x < rect2.x + rect2.width
        let insideGap = rect1.y > rect3.y && rect1.y + rect1.height < rect3.y + rect3.height

        return (atBarrier && !insideGap)
    }
}

window.onload = () => new Game()