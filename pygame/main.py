import random
import pgzrun
import pygame
import sys
import asyncio

WIDTH = 1000
HEIGHT = 600


def getImg(offset1, offset2, offset3):
    # Always use right-facing images as the base
    image_name = img + str(offset1 + offset2 + offset3)
    return image_name


def draw():
    screen.clear()
    grass.draw()

    if gameState == "start":
        screen.draw.text(
            "PRESS SPACE TO START", center=(WIDTH // 2, HEIGHT // 4), fontsize=60
        )
        return

    for a in sortActors():
        if sRect.colliderect(a):
            # Handle sprite flipping during draw
            if hasattr(a, "_should_flip") and a._should_flip:
                # Create a flipped version of the surface and draw it
                flipped_surf = pygame.transform.flip(a._surf, True, False)
                screen.blit(flipped_surf, a.topleft)
            else:
                a.draw()

    if gameState == "defend":
        screen.draw.text(
            "DEFEND THE FLOCKS!", center=(WIDTH // 2, HEIGHT // 4), fontsize=72
        )
    elif gameState == "win":
        screen.draw.text(
            "YOU DEFENDED THE KING'S FLOCKS!!!",
            center=(WIDTH // 2, HEIGHT // 4),
            fontsize=60,
        )
    elif gameState == "lose":
        screen.draw.text(
            "THE BANDITS SCATTERED THE SHEEP",
            center=(WIDTH // 2, HEIGHT // 4),
            fontsize=60,
        )
    elif gameState == "again":
        screen.draw.text(
            "PRESS SPACE TO PLAY AGAIN", center=(WIDTH // 2, HEIGHT // 4), fontsize=60
        )


def update():
    global enemiesKilled
    if gameState == "again" or gameState == "start":
        return
    if gameState == "sheep-off":
        updateSprite(ammon)
        moveSheep(3)
        if ammon.x > WIDTH // 2:
            ammon.x -= ammonSpeed
        else:
            ammon.isMoving = False
        return
    if gameState == "main" and enemiesKilled == enemyCount:
        updateState("win")
        clock.schedule_unique(againState, 5)
        for s in sheep:
            s.bottom = random.randint(s.height, HEIGHT)
            s._should_flip = True
    if gameState == "win":
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

        if (
            ammon.isAttacking
            and ammon.attacking // slowAttack > 1
            and checkattack(ammon, enemy)
        ):
            makeArm(enemy)
            enemy.isDead = True
            enemy._should_flip = True
            enemiesKilled += 1
        if (
            gameState == "main"
            and enemy.isAttacking
            and enemy.attacking // slowAttack > 1
            and checkattack(enemy, ammon)
        ):
            ammon.isDead = True
            updateState("lose")
            clock.schedule_unique(againState, 3)


def enemyMovement(enemy):
    enemy.isMoving = False
    if not enemy.isAttacking:
        if enemy.left >= ammon.x - attackAdj:
            enemy.isMoving = True
            enemy._should_flip = True
            enemy.x -= enemySpeed
        if enemy.right <= ammon.x + attackAdj:
            enemy.isMoving = True
            enemy._should_flip = False
            enemy.x += enemySpeed
        if enemy.top >= ammon.y - attackAdj:
            enemy.isMoving = True
            enemy.y -= enemySpeed
        if enemy.bottom <= ammon.y + attackAdj:
            enemy.isMoving = True
            enemy.y += enemySpeed
        if not enemy.isMoving and gameState == "main":
            enemy.isAttacking = True
            enemy.attacking = random.randint(-3 * slowAttack, 0)


def makeArm(enemy):
    arm = Actor("arm", (enemy.x, enemy.y))
    arm.turn = random.randint(3, 7) * (1 if enemy._should_flip else -1)
    arm.stop = enemy.bottom
    arm.speed = random.randint(5, 10)
    arm._should_flip = enemy._should_flip
    arms.append(arm)


def moveSheep(sheepSpeed):
    global gameState
    for s in sheep:
        s.costume += 1
        if s.costume % slowWalk == 0:
            if s.image == "sheep1":
                s.image = "sheep2"
            else:
                s.image = "sheep1"
        s.x += sheepSpeed
        if sheepSpeed > 0:
            s.y += sheepSpeed * s.speed_y
        if random.randint(1, 30) == 1:
            s.speed_y = -1 if random.randint(0, 1) == 0 else 1
    if gameState == "sheep-off" and lastSheep.left > WIDTH:
        updateState("defend")
        clock.schedule_unique(mainState, 2)


def playerMovement():
    if gameState == "lose":
        return
    if (keyboard.left or keyboard.a) and ammon.left > 0 and not ammon.isAttacking:
        ammon.x -= ammonSpeed
        ammon._should_flip = True
    if (keyboard.right or keyboard.d) and ammon.right < WIDTH and not ammon.isAttacking:
        ammon.x += ammonSpeed
        ammon._should_flip = False
    if (keyboard.up or keyboard.w) and ammon.top > 0 and not ammon.isAttacking:
        ammon.y -= ammonSpeed
    if (
        (keyboard.down or keyboard.s)
        and ammon.bottom < HEIGHT
        and not ammon.isAttacking
    ):
        ammon.y += ammonSpeed
    ammon.isMoving = (
        keyboard.left
        or keyboard.right
        or keyboard.up
        or keyboard.down
        or keyboard.a
        or keyboard.d
        or keyboard.w
        or keyboard.s
    )


def updateSprite(spr):
    if spr.isDead:
        if spr.dyingNum == 5:
            spr.dying += 1
            if spr.dying // slowDeath < spr.dyingNum:
                spr.image = getImg(spr.offset, dyingOffset, spr.dying // slowDeath)
        else:
            spr.dying = (spr.dying + 1) % (walkingNum * slowWalk)
            spr.image = getImg(spr.offset, dyingOffset, (spr.dying // slowWalk))
        return

    if spr.isMoving:
        spr.walking = (spr.walking + 1) % (walkingNum * slowWalk)
        spr.image = getImg(spr.offset, walkingOffset, (spr.walking // slowWalk))
    else:
        spr.walking = 0
        spr.image = getImg(spr.offset, standingOffset, 0)

    if spr.isAttacking:
        spr.attacking += 1
        if spr.attacking // slowAttack < attackingNum and spr.attacking > 0:
            spr.image = getImg(
                spr.offset, attackingOffset, (spr.attacking // slowAttack)
            )
        elif spr.attacking // slowAttack >= attackingNum:
            spr.isAttacking = False
            spr.attacking = 0


def on_key_down(key):
    if key == keys.SPACE:
        if gameState == "again":
            reset()
            updateState("sheep-off")
        elif gameState == "start":
            updateState("sheep-off")
        else:
            ammon.isAttacking = True


def checkattack(attacker, victim):
    r = not attacker._should_flip and attacker.x < victim.x < attacker.right - attackAdj
    l = attacker._should_flip and attacker.left + attackAdj < victim.x < attacker.x
    y = abs(attacker.y - victim.y) < 80
    return y and (r or l)


def sort(l):
    if len(l) < 2:
        return l
    less = []
    equal = []
    greater = []

    pivot = l[len(l) // 2].bottom
    for x in l:
        if x.bottom < pivot:
            less.append(x)
        elif x.bottom == pivot:
            equal.append(x)
        else:
            greater.append(x)
    return sort(less) + equal + sort(greater)


def sortActors():
    return sort(arms) + sort(actors)


def updateState(newState):
    global gameState
    gameState = newState


def mainState():
    updateState("main")


def againState():
    updateState("again")


def reset():
    global actors, ammon, arms, enemies, sheep, enemiesKilled, lastSheep
    actors = []

    ammon = Actor(getImg(24, standingOffset, 0), (WIDTH * 1.5, HEIGHT // 2))
    ammon.offset = 24
    ammon.isMoving = True
    ammon.walking = 0
    ammon._should_flip = True
    ammon.isAttacking = False
    ammon.attacking = 0
    ammon.isDead = False
    ammon.dying = 0
    ammon.dyingNum = 5
    actors.append(ammon)

    arms = []
    enemies = []
    enemiesKilled = 0
    lastSheep = None
    sheep = []
    for i in range(sheepCount):
        s = Actor(
            "sheep1",
            (random.randint(0, WIDTH // 2), random.randint(0, HEIGHT)),
        )
        s.costume = random.randint(0, 7)
        s.speed_y = -1 if random.randint(0, 1) == 0 else 1
        # Initialize flip state for sheep (they start moving right)
        s._should_flip = False
        sheep.append(s)
        actors.append(s)
        if lastSheep == None or s.x < lastSheep.x:
            lastSheep = s

    for i in range(enemyCount):
        enemy = Actor(getImg(0, standingOffset, 0))
        enemy.x = (WIDTH // 2) + (
            (500 * (i + 1)) * (-1 if random.randint(0, 1) == 1 else 1)
        )
        enemy.y = (HEIGHT // 2) + (
            (500 * (i + 1)) * (-1 if random.randint(0, 1) == 1 else 1)
        )
        enemy.offset = 0
        enemy.isMoving = False
        enemy.walking = 0
        enemy._should_flip = enemy.x > ammon.x
        enemy.isAttacking = False
        enemy.attacking = 0
        enemy.isDead = False
        enemy.dying = 0
        enemy.dyingNum = 6
        enemies.append(enemy)
        actors.append(enemy)


img = "tile0"

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

grass = Actor("grass")
sRect = ZRect(0, 0, WIDTH, HEIGHT)

ammonSpeed = 5
enemyCount = 10
enemySpeed = 3
enemyDeadSpeed = 5
sheepCount = 10

reset()
updateState("start")

pgzrun.go()
