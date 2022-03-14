import random
import pgzrun

WIDTH = 1000
HEIGHT = 600

def getImg(direction, offset1, offset2, offset3):
    return folder + direction + img + str(offset1 + offset2 + offset3)


def draw():
    screen.clear()
    grass.draw()
    
    if gameState == 'start':
        screen.draw.text("PRESS SPACE TO START", center=(WIDTH/2, HEIGHT/4), fontsize = 60)
        return

    sortActors()
    for a in actors:
        if sRect.colliderect(a):
            a.draw()

    if gameState == 'defend':
        screen.draw.text("DEFEND THE FLOCKS!", center=(WIDTH/2, HEIGHT/4), fontsize = 72)
    elif gameState == 'win':
        screen.draw.text("YOU DEFENDED THE KING'S FLOCKS!!!", center=(WIDTH/2, HEIGHT/4), fontsize = 60)
    elif gameState == 'lose':
        screen.draw.text("THE LAMANITES SCATTERED THE SHEEP", center=(WIDTH/2, HEIGHT/4), fontsize = 60)
    elif gameState == 'again':
        screen.draw.text("PRESS SPACE TO PLAY AGAIN", center=(WIDTH/2, HEIGHT/4), fontsize = 60)


def update():
    global sheepDir, enemiesKilled
    if gameState == 'again' or gameState == 'start': return
    if gameState == 'sheep-off':
        updateSprite(ammon)
        moveSheep(3)
        if ammon.x > WIDTH/2:
            ammon.x -= ammonSpeed
        else:
            ammon.isMoving = False
        return
    if gameState == 'main' and enemiesKilled == enemyCount:
        updateState('win')
        clock.schedule_unique(againState, 5)
        sheepDir = "left"
        for s in sheep:
            s.bottom = random.randint(s.height, HEIGHT)
    if gameState == 'win':
        moveSheep(-2)

    playerMovement()
    updateSprite(ammon)

    for arm in arms:
        if arm.bottom < arm.stop:
            arm.angle += arm.turn
            arm.y -= arm.speed
            arm.speed -= 1

    for enemy in enemies:
        if enemy.isDead:
            if sRect.colliderect(enemy):
                enemy.x -= enemyDeadSpeed
                updateSprite(enemy)
            continue

        enemyMovement(enemy)
        updateSprite(enemy)

        if ammon.isAttacking and ammon.attacking//slowAttack > 1 and checkattack(ammon, enemy):
            makeArm(enemy)
            enemy.isDead = True
            enemy.dir = "left"
            enemiesKilled += 1
        if gameState == 'main' and enemy.isAttacking and enemy.attacking//slowAttack > 1 and checkattack(enemy, ammon):
            ammon.isDead = True
            updateState('lose')
            clock.schedule_unique(againState, 3)


def enemyMovement(enemy):
    enemy.isMoving = False
    if not enemy.isAttacking:
        if enemy.left >= ammon.x - attackAdj:
            enemy.isMoving = True
            enemy.dir = "left"
            enemy.x -= enemySpeed
        if enemy.right <= ammon.x + attackAdj:
            enemy.isMoving = True
            enemy.dir = "right"
            enemy.x += enemySpeed
        if enemy.top >= ammon.y - attackAdj:
            enemy.isMoving = True
            enemy.y -= enemySpeed
        if enemy.bottom <= ammon.y + attackAdj:
            enemy.isMoving = True
            enemy.y += enemySpeed
        if not enemy.isMoving and gameState == 'main':
            enemy.isAttacking = True
            enemy.attacking = random.randint(-3 * slowAttack, 0)


def makeArm(enemy):
    arm = Actor(folder + enemy.dir + "/arm", (enemy.x, enemy.y))
    arm.turn = random.randint(3, 7) * (-1 if enemy.dir == "right" else 1)
    arm.stop = enemy.bottom
    arm.speed = random.randint(5,10)
    arms.append(arm)
    actors.append(arm)


def moveSheep(sheepSpeed):
    global gameState
    for s in sheep:
        s.costume += 1
        if s.costume % slowWalk == 0:
            if s.image == folder + sheepDir + "/sheep1":
                s.image = folder + sheepDir + "/sheep2"
            else:
                s.image = folder + sheepDir + "/sheep1"
        s.x += sheepSpeed
        if sheepSpeed > 0:
            s.y += sheepSpeed * s.dir
        if random.randint(1,30) == 1:
            s.dir = -1 if random.randint(0,1) == 0 else 1
    if gameState == 'sheep-off' and lastSheep.left > WIDTH:
        updateState('defend')
        clock.schedule_unique(mainState, 2)


def playerMovement():
    if gameState == 'lose': return
    if (keyboard.left or keyboard.a) and ammon.left > 0 and not ammon.isAttacking:
        ammon.x -= ammonSpeed
        ammon.dir = "left"
    if (keyboard.right or keyboard.d) and ammon.right < WIDTH and not ammon.isAttacking:
        ammon.x += ammonSpeed
        ammon.dir =  "right"
    if (keyboard.up or keyboard.w) and ammon.top > 0 and not ammon.isAttacking:
        ammon.y -= ammonSpeed
    if (keyboard.down or keyboard.s) and ammon.bottom < HEIGHT and not ammon.isAttacking:
        ammon.y += ammonSpeed
    ammon.isMoving = keyboard.left or keyboard.right or keyboard.up or keyboard.down or keyboard.a or keyboard.d or keyboard.w or keyboard.s


def updateSprite(spr):
    if spr.isDead:
        if spr.dyingNum == 5:
            spr.dying += 1
            if spr.dying//slowDeath < spr.dyingNum:
                spr.image = getImg(spr.dir, spr.offset, dyingOffset, spr.dying//slowDeath)
        else:
            spr.dying = (spr.dying + 1) % (walkingNum * slowWalk)
            spr.image = getImg(spr.dir, spr.offset, dyingOffset, (spr.dying//slowWalk))
        return

    if spr.isMoving:
        spr.walking = (spr.walking + 1) % (walkingNum * slowWalk)
        spr.image = getImg(spr.dir, spr.offset, walkingOffset, (spr.walking//slowWalk))
    else:
        spr.walking = 0
        spr.image = getImg(spr.dir, spr.offset, standingOffset, 0)

    if spr.isAttacking:
        spr.attacking += 1
        if spr.attacking//slowAttack < attackingNum and spr.attacking > 0:
            spr.image = getImg(spr.dir, spr.offset, attackingOffset, (spr.attacking//slowAttack))
        elif spr.attacking//slowAttack >= attackingNum:
            spr.isAttacking = False
            spr.attacking = 0


def on_key_down(key):
    if key == keys.SPACE:
        if gameState == 'again':
            reset()
            updateState("sheep-off")
        elif gameState == 'start':
            updateState('sheep-off')
        else:
            ammon.isAttacking = True


def checkattack(attacker, victim):
    r = attacker.dir == "right" and attacker.x < victim.x < attacker.right-attackAdj
    l = attacker.dir == "left" and attacker.left+attackAdj < victim.x < attacker.x
    y = abs(attacker.y - victim.y) < 80
    return y and (r or l)


def sort(l):
    if len(l) < 2:
        return l
    less = []
    equal = []
    greater = []

    pivot = l[len(l)//2].bottom
    for x in l:
        if x.bottom < pivot:
            less.append(x)
        elif x.bottom == pivot:
            equal.append(x)
        else:
            greater.append(x)
    return sort(less) + equal + sort(greater)


def sortActors():
    global actors
    actors = sort(actors)


def updateState(newState):
    global gameState
    gameState = newState


def mainState():
    updateState('main')


def againState():
    updateState('again')


def reset():
    global actors, ammon, arms, enemies, sheep, enemiesKilled, sheepDir, lastSheep
    actors = []

    ammon = Actor(getImg("right", 24, standingOffset, 0), (WIDTH * 1.5, HEIGHT/2))
    ammon.offset = 24
    ammon.isMoving = True
    ammon.walking = 0
    ammon.dir = "left"
    ammon.isAttacking = False
    ammon.attacking = 0
    ammon.isDead = False
    ammon.dying = 0
    ammon.dyingNum = 5
    actors.append(ammon)

    arms = []
    enemies = []
    enemiesKilled = 0

    sheepDir = "right"
    lastSheep = None
    sheep = []
    for i in range(sheepCount):
        s = Actor(folder + sheepDir + "/sheep1", (random.randint(0, WIDTH/2), random.randint(0, HEIGHT)))
        s.costume = random.randint(0,7)
        s.dir = -1 if random.randint(0,1) == 0 else 1
        sheep.append(s)
        actors.append(s)
        if lastSheep == None or s.x < lastSheep.x:
            lastSheep = s

    for i in range(enemyCount):
        enemy = Actor(getImg("left", 0, standingOffset, 0))
        enemy.x = (WIDTH/2) + ((500*(i+1)) * (-1 if random.randint(0,1) == 1 else 1))
        enemy.y = (HEIGHT/2) + ((500*(i+1)) * (-1 if random.randint(0,1) == 1 else 1))
        enemy.offset = 0
        enemy.isMoving = False
        enemy.walking = 0
        enemy.dir = "left" if enemy.x > ammon.x else "right"
        enemy.isAttacking = False
        enemy.attacking = 0
        enemy.isDead = False
        enemy.dying = 0
        enemy.dyingNum = 6
        enemies.append(enemy)
        actors.append(enemy)
    
    
folder = "bom_game/"
img = "/tile0"

# frame vars
walkingOffset = 0
walkingNum = 6
standingOffset = 6
attackingOffset = 12
attackingNum = 3
dyingOffset = 18
slowWalk = 6
slowAttack = 10
slowDeath = 7
attackAdj = 40

grass = Actor("bom_game/grass")
sRect = ZRect(0,0,WIDTH,HEIGHT)

ammonSpeed = 5
enemyCount = 2
enemySpeed = 3
enemyDeadSpeed = 5
sheepCount = 10

reset()
updateState("start")
pgzrun.go()