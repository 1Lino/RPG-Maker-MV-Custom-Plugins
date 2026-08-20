/*:
 * @plugindesc Administrador de Eventos customizado.
 * @author Lino
 *
 * @help
 * Este add-on é basicamente um conjunto de funções customizadas que lidam com diversos tipos de eventos.
 * O objetivo é reduzir drasticamente o uso de páginas longas de configurações de evento e deixar isso tudo pro backend.
 * O dev usará somente funções e o código faz o resto.
 * 
 * @param Dialogue Picker
 * @text PATH: data/dialogues/
 * @type text
 * @desc Insira o nome do JSON na caixa de texto. O arquivo deve ficar neste caminho: "project_name/data/dialogues/".
 *
 */

var params = PluginManager.parameters("LINO_EventManager"); // seleciona os parâmetros deste plugin.
var fileName = params["Dialogue Picker"]; // puxa o conteúdo da caixa de texto Dialogue Picker, da interface do plugin.
var path = "data/dialogues/" + fileName + ".json"; // cria o caminho

// Helper de diálogos:

window.Dialog = {};

Dialog.dialogs = null;

// método responsável pelo carregamento do arquivo json:
Dialog.loadDialogs = function () 
{
    if (!this.dialogs) 
    {
        var fs = require("fs"); // fs = file system
        var text = fs.readFileSync(path, "utf8");
        this.dialogs = JSON.parse(text);
    }
    return this.dialogs;
};

// os dados puxados do json são de acordo com os argumentos que o dev passar a este método.
// "scene" trata-se da cena atual, "character" trata do personagem daquela cena, e "dialog" do identificador do texto específico daquele personagem para aquela cena. "interpreter" trata do contexto atual em que showDialog é usado, para que setWaitMode possa ser utilizado. Além disso, setWaitMode só 
Dialog.showDialog = function (interpreter, scene, character, dialog) 
{
    var dialogs = this.loadDialogs();

    dialogs[scene][character][dialog].forEach(function (line, index) 
    {
        if (index === 0)
            $gameMessage.add(`\\C[0]${character}\\C[0]\n${line}`); // torna a primeira linha o nome do personagem, cor de índice 0. 
        else
            $gameMessage.add(line);
    });
    interpreter.setWaitMode("message");
};

// "state" é true ou false. É pra ser usado antes de qualquer diálogo com qualquer npc
Dialog.setEventDirectionFix = function (npc, state) 
{
    if (npc) 
    {
        npc.setDirectionFix(state);
    }
}

// É pra ser usado após um diálogo.
Dialog.resetEventDirectionFix = function (npc) 
{
    const TerminateMessage = Window_Message.prototype.terminateMessage;

    Window_Message.prototype.terminateMessage = function () 
    {
        TerminateMessage.call(this); // 'this' se refere à mensagem atual no display/window.

        Dialog.setEventDirectionFix(npc, false);
    };
}

// TODO: talvez seja interessante simplificar este método
// Ex.: $gameScreen.showPicture(1, "MyPicture", 0, 0, 0, 100, 100, 255, 0);
Dialog.showPicture = function(pictureId, name, origin, x, y, scaleX, scaleY, opacity, blendMode) {
    $gameScreen.showPicture(pictureId, name, origin, x, y, scaleX, scaleY, opacity, blendMode);
}
Dialog.erasePicture = function(pictureId) {
    $gameScreen.erasePicture(pictureId);
}

// Helper de ações e movimentos:

var Action = {};

//moveTo usa pathfinding do RPG Maker MV para encontrar o caminho.
// Esta função deve ser chamada numa página de evento separada do npc, em modo de execução paralela.
Action.moveTo = function (npc, target) 
{
    Game_Character.prototype.moveTowardTarget = function (target) 
    {
        if (!target) return;

        if (this.isMoving()) return; // previne teleporte

        const direction = this.findDirectionTo(target.x, target.y);

        // checa se o sistema de mensagens do jogo não está ocupado e se a direção encontrada para o target é maior que 0.
        // a primeira condição impede que o npc mova durante o diálogo.
        if (!$gameMessage.isBusy() && direction > 0) 
        {
            this.moveStraight(direction);
        }
    };

    npc.moveTowardTarget(target);

}

//move é o modo "manual" de fazer o npc se mover. O método recebe uma array de tuplas, onde o primeiro índice de cada tupla se refere à direção e o segundo índice se refere à quantidade de tiles que o npc se moverá naquela direção.
// Ex.: moveArr = [["up", 2], ["right", 3]...] 
Action.move = function(interpreter, npc, moveSteps) 
{
    const moveRoute = [];

    const dirMapping = 
    {
        "up" : Game_Character.ROUTE_MOVE_UP,
        "down": Game_Character.ROUTE_MOVE_DOWN,
        "left": Game_Character.ROUTE_MOVE_LEFT,
        "right": Game_Character.ROUTE_MOVE_RIGHT
    };

    for (const [stepDirection, stepAmount] of moveSteps) 
    {
        for (let i = 0; i < stepAmount; i++) 
        {
            moveRoute.push({
                code: dirMapping[stepDirection],
                parameters: []
            });
        }
    }

    moveRoute.push({
        code: Game_Character.ROUTE_END, // ROUTE_END encerra a rota
        parameters: []
    });

    // console.log(moveRoute); // fn + f8 pra confirmar a rota no console.

    npc.forceMoveRoute({
        list: moveRoute,
        repeat: false,
        skippable: true,
        wait: true
    });

    interpreter._character = npc;
    interpreter.setWaitMode("route");
};

Action.showBalloon = function (interpreter, character, balloonId) 
{
    interpreter._character = character; // define o alvo do balão para o interpretador, sem isso, setWaitMode retorna erro de referência.
    character.requestBalloon(balloonId); // chama o balão com o id especificado (ex.: 1 -> exclamação; 6 -> suor).
    interpreter.setWaitMode("balloon"); // espera o término da animação do balão no alvo definido.
}

// esse método serve pra evitar race condition, já que moveTo utiliza métodos em que setWaitMode não funciona, por conta que o pathfinding recalcula as coordenadas a cada frame, fazendo com que o npc pare e ande toda vez, o que confunde setWaitMode. Por isso, toda vez que moveTo é utilizado, isOnLocation deve ser utilizado também para verificar se o npc de fato chegou no lugar.
Action.isOnLocation = function(npc, target)
{
    if (npc.x === target.x && npc.y === target.y) 
    {
        return true;
    }
    return false;
}


// Helper de Player:

var Player = {};

Player.goToMap = function(mapId, x, y, faceDir, fade)
{
    const direction = 
    {
        "down": 2,
        "left": 4,
        "right": 6,
        "up": 8,
        "current": 0
    };

    const fadeType = 
    {
        "black": 0,
        "white": 1,
        "no": 2
    }

    $gamePlayer.reserveTransfer(mapId, x, y, direction[faceDir], fadeType[fade]);
}


// Helper de eventos:

var Event = {};

Event.setSwitch = function(switchId, value)
{
    $gameSwitches.setValue(switchId, value);
}

Event.setSelfSwitch = function(argsArr, value)
{
    $gameSelfSwitches.setValue([argsArr[0], argsArr[1], argsArr[2]], value);
}


const _meetsConditions = Game_Event.prototype.meetsConditions; // cria cópia da meetsConditions.

// modifica o comportamento do evento original para que aceite self-switches para além dos A, B, C, D.
Game_Event.prototype.meetsConditions = function(page) 
{

    // Avalia todas as condições, para ver se há alguma que não foi alcançada
    if (!_meetsConditions.call(this, page)) return false;
    
    // NOTE.: <self switch: QuestDone>  deve estar em qualquer linha de um 'Comment' em uma página. A página deve ser o alvo do selfswitch, evidentemente. O Comment deve ser o primeiro comando da lista de comandos também.

    for (const command of page.list) 
    {
        if (command.code === 108) // 108 se refere ao comando 'Comment' da interface.
        { 
            for (let parameter of command.parameters) //parameters são basicamente as linhas do comando.
            {
                const match = parameter.match(/<self switch:\s*(.+?)>/i);

                if (match) 
                { 
                    const name = match[1];

                    return $gameSelfSwitches.value([this._mapId, this._eventId, name]);
                }
            } 
        }
    }

    return true;
};

// Métodos para certificar-se de que os eventos são persistentes em suas propriedades:

// esse método customizado checa qual evento é persistente. O evento deverá ter um comentário no topo de sua última página
// com alguma linha contendo <persistentEvent>. No caso, "última página" aqui trata-se da página onde se quer salvar esta persistência, já que cada página de um evento são estados diferentes. Dito isto, é possível utilizar <persistentEvent> em múltiplas páginas, desde que uma não subescreva imediatamente a outra.
Game_Event.prototype.isPersistentEvent = function() 
{
    var list = this.list();

    console.log(list);

    if (!list) return false;

    for (var i = 0; i < list.length; i++) 
    {
        var command = list[i];

        if (command.code === 108 || command.code === 408) 
        { 
            for (let parameter of command.parameters)
            {
                if (parameter.indexOf("<persistentEvent>") >= 0)
                    return true;
            }
        }
        //END
    }

    return false;
};

// savePersistentEvent é um evento customizado, ou seja, não é nativo de Game_System.prototype.
// basicamente ele salva a posição atual do evento, dentre outros detalhes, para que quando o mapa seja recarregado estes dados não
// sejam resetados, mas se mantenham persistentes (no caso, o jogo deverá dar um "load" nestes dados persistentes).
// deve ser usado após mudanças num evento.

Game_System.prototype.savePersistentEvent = function() 
{
    this._persistentEvents = this._persistentEvents || {};

    var mapId = $gameMap.mapId();

    // recria os dados deste mapa
    this._persistentEvents[mapId] = {};

    $gameMap.events().forEach(function(event) 
    {
        if (!event.isPersistentEvent()) {
            return;
        }

        if (typeof event.makePersistentData !== "function") {
            return;
        }

        var data = event.makePersistentData();

        if (data === undefined || data === null) {
            return;
        }

        this._persistentEvents[mapId][event.eventId()] = data;

    }, this);
};

// método customizado responsável por restaurar os eventos persistentes do mapa toda vez que for carregado em Game_Map.prototype.setup.
Game_Map.prototype.restorePersistentEvent = function() 
{
    // caso estes sistemas não estejam carregados, sai do método, pra evitar erro.
    if (!$gameSystem || !$gameSystem._persistentEvents) {
        return;
    }

    var mapData = $gameSystem._persistentEvents[this.mapId()]; // carrega os dados do mapa atual.

    if (!mapData) { // verifica se tais dados de fato existem
        return;
    }

    Object.keys(mapData).forEach(function(id) 
    {
        var data = mapData[id];

        // Para que não se tente restaurar dados inexistentes
        if (data === undefined || data === null) {
            return;
        }

        var event = this.event(Number(id));

        // se evento não existir no mapa atual
        if (!event) {
            return;
        }

        if (typeof event.applyPersistentData !== "function") {
            return;
        }

        event.applyPersistentData(data);

    }, this);
};




// makePersistentData é um método customizado que retornar todas as características do evento, para que não seja necessário escrever
// isso tudo na hora de chamar savePersistentePosition para o evento.
Game_CharacterBase.prototype.makePersistentData = function() 
{
    return {
        x: this.x,
        y: this.y,
        dir: this.direction(),
        moveSpeed: this.moveSpeed(),
        moveFrequency: this.moveFrequency(),
        opacity: this.opacity(),
        blendMode: this.blendMode(),
        transparent: this.isTransparent(),
        through: this.isThrough(),
        walkAnime: this.hasWalkAnime(),
        stepAnime: this.hasStepAnime(),
        directionFix: this.isDirectionFixed()
    };
};

// método customizado para aplicar os dados persistentes salvos.
Game_CharacterBase.prototype.applyPersistentData = function(data) 
{
    this.locate(data.x, data.y);
    this.setDirection(data.dir);
    this.setMoveSpeed(data.moveSpeed);
    this.setMoveFrequency(data.moveFrequency);
    this.setOpacity(data.opacity);
    this.setBlendMode(data.blendMode);
    this.setTransparent(data.transparent);
    this.setThrough(data.through);

    //testar estes (tem que ver na documentação se existem):
    this.setWalkAnime(data.walkAnime);
    this.setStepAnime(data.stepAnime);
    this.setDirectionFix(data.directionFix);
};


// usando de fato os métodos:
var _Game_Player_reserveTransfer = Game_Player.prototype.reserveTransfer;

// salva os eventos persistentes quando houver reserveTransfer (quando player sair do mapa ou quando salvar o jogo).
Game_Player.prototype.reserveTransfer = function(mapId, x, y, d, fadeType) 
{
    $gameSystem.savePersistentEvent();

    _Game_Player_reserveTransfer.call(this, mapId, x, y, d, fadeType);
};

var _Game_Map_setup = Game_Map.prototype.setup;

// quando o mapa for recarregado, no caso pelo método setup, carrega o estado dos eventos persistentes.
Game_Map.prototype.setup = function(mapId) 
{
    _Game_Map_setup.call(this, mapId);

    this.restorePersistentEvent();
};