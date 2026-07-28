# LINO Event Manager

A utility plugin for RPG Maker MV focused on simplifying event management, NPC interactions, dialogue handling, movement control, and extending the engine's event conditions.

## Overview

LINO Event Manager provides a collection of helper systems designed to make event scripting easier and more organized.

The plugin currently provides three main modules:

- `Dialog` — dialogue loading and display management.
- `Action` — NPC actions such as movement and balloon requests.
- `Event` — general event-related utilities.
- Named Self Switches — extension of RPG Maker MV's self switch system.

The plugin is intended to be used through Script Calls inside RPG Maker MV events.

---

# Installation

1. Place `LINO_EventManager.js` inside:

```
js/plugins/
```

2. Enable the plugin through the RPG Maker MV Plugin Manager.
3. Configure the required parameters.

---

# Plugin Parameters

## Dialogue Picker

Defines the JSON file containing the dialogue database.

The file must be placed inside:

```
data/dialogues/
```

Example:

```
data/dialogues/my_dialogues.json
```

If the parameter value is:

```
my_dialogues
```

the plugin will load:

```
data/dialogues/my_dialogues.json
```

---

# Dialogue System

The dialogue system allows dialogues to be stored externally in JSON files instead of directly inside event commands.

The system uses the global object:

```js
Dialog;
```

---

## Dialogue JSON Structure

The expected structure is:

```json
{
  "scene": {
    "character": {
      "dialog": ["First line.", "Second line."]
    }
  }
}
```

The hierarchy is:

```
Scene
 └── Character
      └── Dialog ID
           └── Text lines
```

Example:

```json
{
  "village_intro": {
    "Elder": {
      "welcome": ["Welcome to our village.", "Danger approaches."]
    }
  }
}
```

---

# Dialog API

## Dialog.loadDialogs()

Loads the configured dialogue JSON file.

```js
Dialog.loadDialogs();
```

The file is loaded only once and then cached.

---

## Dialog.showDialog()

Displays a dialogue from the JSON database.

### Syntax

```js
Dialog.showDialog(interpreter, scene, character, dialog);
```

### Parameters

| Parameter     | Description                                                              |
| ------------- | ------------------------------------------------------------------------ |
| `interpreter` | The current`Game_Interpreter` instance. Usually `this` in a Script Call. |
| `scene`       | Dialogue group identifier.                                               |
| `character`   | Character name displayed above the dialogue.                             |
| `dialog`      | Specific dialogue identifier.                                            |

Example:

```js
Dialog.showDialog(this, "village_intro", "Elder", "welcome");
```

The first line automatically displays the character name.

---

# Dialogue Wait Behavior

`Dialog.showDialog()` internally uses:

```js
interpreter.setWaitMode("message");
```

However, RPG Maker MV does not pause JavaScript execution immediately after this call.

`setWaitMode("message")` only tells `Game_Interpreter` to wait **after the current event command finishes**.

Therefore:

```js
Dialog.showDialog(this, "intro", "NPC", "hello");

Action.showBalloon(this, npc, 1);
```

will execute the balloon request immediately inside the same Script Call.

## Recommended Usage

If an action must happen after the dialogue finishes, separate the logic into different event commands or implement asynchronous handling.

---

# Action API

The `Action` module contains utilities related to character behavior.

---

## Action.moveTo()

Moves a character toward another target using RPG Maker MV's built-in pathfinding.

### Syntax

```js
Action.moveTo(npc, target);
```

### Parameters

| Parameter | Description                   |
| --------- | ----------------------------- |
| `npc`     | Character that will move.     |
| `target`  | Character or position target. |

Example:

```js
Action.moveTo($gameMap.event(5), $gamePlayer);
```

---

## moveTo Limitations

`moveTo()` does not use a traditional movement route.

The destination is recalculated every frame by RPG Maker MV's pathfinding system.

Because of this:

- `setWaitMode("route")` cannot reliably detect completion.
- The interpreter may continue before the character reaches the destination.

Use:

```js
Action.isOnLocation();
```

to manually verify when the character has arrived.

---

## Action.isOnLocation()

Checks whether a character is currently at the same tile as a target.

### Syntax

```js
Action.isOnLocation(npc, target);
```

Returns:

```js
true;
```

when both characters share the same coordinates.

Example:

```js
if (Action.isOnLocation(npc, player)) {
  // NPC reached player
}
```

---

## Action.move()

Creates a manual movement route.

### Syntax

```js
Action.move(interpreter, npc, moveArray);
```

### Parameters

| Parameter     | Description                                   |
| ------------- | --------------------------------------------- |
| `interpreter` | Current event interpreter (`this`).           |
| `npc`         | Character that will move.                     |
| `moveArray`   | Array containing directions and tile amounts. |

Example:

```js
Action.move(this, npc, [
  ["up", 2],
  ["right", 3],
]);
```

Equivalent movement:

```
↑ ↑ → → →
```

---

## Action.showBalloon()

Displays a balloon icon over a character.

### Syntax

```js
Action.showBalloon(interpreter, character, balloonId);
```

### Balloon IDs

| ID  | Balloon     |
| --- | ----------- |
| 1   | Exclamation |
| 2   | Question    |
| 3   | Music Note  |
| 4   | Heart       |
| 5   | Anger       |
| 6   | Sweat       |
| 7   | Frustration |
| 8   | Silence     |
| 9   | Light Bulb  |
| 10  | Zzz         |

Example:

```js
Action.showBalloon(this, npc, 1);
```

---

# Event API

## Event.setSwitch()

Changes the value of a game switch.

### Syntax

```js
Event.setSwitch(switchId, value);
```

Example:

```js
Event.setSwitch(10, true);
```

---

# Named Self Switches

RPG Maker MV normally limits self switches to:

```
A
B
C
D
```

This plugin extends the system by allowing named self switches.

Examples:

```
QuestComplete
DoorOpened
BossDefeated
```

Named self switches remain event-local, just like default self switches.

---

# Using Named Self Switches

Add a Comment command to an event page:

```xml
<SelfSwitch: QuestComplete>
```

The page will only become active when:

```
QuestComplete = ON
```

---

## Important

Use an **Event Comment**.

Do not use a Script command.

---

## Compatibility

Named self switches work together with normal RPG Maker MV conditions.

Example:

A page containing:

- Switch 10 ON
- Variable 5 >= 20
- Self Switch A ON
- `<SelfSwitch: QuestComplete>`

requires all conditions to be satisfied.

---

# Technical Notes

## Current Known Limitations

The plugin is currently under development.

Some behaviors are intentionally documented because they depend on RPG Maker MV internals:

- `setWaitMode()` does not interrupt JavaScript execution immediately.
- Pathfinding movement cannot reliably use interpreter route waits.
- Dialogue actions inside the same Script Call continue executing unless separated.
- Named self switches depend on event refreshes to update page conditions.
