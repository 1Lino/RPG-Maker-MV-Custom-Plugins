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

// helper que guardará todas as variáveis e métodos relacionados ao diálogo dos personagens.
window.Dialog = {};

Dialog.dialogs = null;

// método responsável pelo carregamento do arquivo json:
Dialog.loadDialogs = function () {
    if (!this.dialogs) {
        var fs = require("fs"); // fs = file system
        var text = fs.readFileSync(path, "utf8");
        this.dialogs = JSON.parse(text);
    }
    return this.dialogs;
};

// os dados puxados do json são de acordo com os argumentos que o dev passar a este método.
// "scene" trata-se da cena atual, "character" trata do personagem daquela cena, e "dialog" do identificador do texto específico daquele personagem para aquela cena. "interpreter" trata do contexto atual em que showDialog é usado, para que setWaitMode possa ser utilizado. Além disso, setWaitMode só 
Dialog.showDialog = function (interpreter, scene, character, dialog) {
    var dialogs = this.loadDialogs();

    dialogs[scene][character][dialog].forEach(function (line, index) {
        if (index === 0)
            $gameMessage.add(`\\C[0]${character}\\C[0]\n${line}`); // torna a primeira linha o nome do personagem, cor de índice 0. 
        else
            $gameMessage.add(line);
    });
    interpreter.setWaitMode("message");
};

// "state" é true ou false. É pra ser usado antes de qualquer diálogo com qualquer npc
Dialog.setEventDirectionFix = function (npc, state) {
    if (npc) {
        npc.setDirectionFix(state);
    }
}

// É pra ser usado após um diálogo.
Dialog.resetEventDirectionFix = function (npc) {
    const TerminateMessage = Window_Message.prototype.terminateMessage;

    Window_Message.prototype.terminateMessage = function () {
        TerminateMessage.call(this); // 'this' se refere à mensagem atual no display/window.

        Dialog.setEventDirectionFix(npc, false);
    };
}


// Métodos que envolvem ação de personagem, movimentos, etc.
var Action = {};

//moveTo usa pathfinding do RPG Maker MV para encontrar o caminho.
// Esta função deve ser chamada numa página de evento separada do npc, em modo de execução paralela.
Action.moveTo = function (npc, target) {
    Game_Character.prototype.moveTowardTarget = function (target) {
        if (!target) return;
        if (this.isMoving()) return; // previne teleporte

        const direction = this.findDirectionTo(target.x, target.y);

        // checa se o sistema de mensagens do jogo não está ocupado e se a direção encontrada para o target é maior que 0.
        // a primeira condição impede que o npc mova durante o diálogo.
        if (!$gameMessage.isBusy() && direction > 0) {
            this.moveStraight(direction);
        }
    };

    npc.moveTowardTarget(target);

}

//move é o modo "manual" de fazer o npc se mover. O método recebe uma array de tuplas, onde o primeiro índice de cada tupla se refere à direção e o segundo índice se refere à quantidade de tiles que o npc se moverá naquela direção.
// Ex.: moveArr = [["up", 2], ["right", 3]...] 
Action.move = function(interpreter, npc, moveArr) {
    const moveRoute = [];

    for (const [direction, amount] of moveArr) {

        let code;

        switch (direction) {
            case "up":
                code = Game_Character.ROUTE_MOVE_UP;
                break;

            case "down":
                code = Game_Character.ROUTE_MOVE_DOWN;
                break;

            case "left":
                code = Game_Character.ROUTE_MOVE_LEFT;
                break;

            case "right":
                code = Game_Character.ROUTE_MOVE_RIGHT;
                break;

            default:
                continue;
        }

        for (let i = 0; i < amount; i++) {
            moveRoute.push({
                code: code,
                parameters: []
            });
        }
    }

    moveRoute.push({
        code: Game_Character.ROUTE_END, // ROUTE_END encerra a rota
        parameters: []
    });

    console.log(moveRoute);

    npc.forceMoveRoute({
        list: moveRoute,
        repeat: false,
        skippable: true,
        wait: true
    });

    interpreter._character = npc;
    interpreter.setWaitMode("route");
};

// "interpreter" deve ser "this" (se refere ao contexto atual do evento que utiliza esse método).
// "character" é onde o balão aparecerá (Ex.: $gamePlayer), e "balloonId" é o id dos balões que vai de 1 a 10
// 1	Exclamation (!)
// 2	Question (?)
// 3	Music Note
// 4	Heart
// 5	Anger
// 6	Sweat
// 7	Frustration
// 8	Silence
// 9	Light Bulb
// 10	Zzz
Action.showBalloon = function (interpreter, character, balloonId) {
    interpreter._character = character; // define o alvo do balão para o interpretador, sem isso, setWaitMode retorna erro de referência.
    character.requestBalloon(balloonId); // chama o balão com o id especificado (ex.: 1 -> exclamação; 6 -> suor).
    interpreter.setWaitMode("balloon"); // espera o término da animação do balão no alvo definido.
}

var Event = {};

Event.setSwitch = function(switchId, value){
    $gameSwitches.setValue(switchId, value);
}


// deve ser transformado em um método serve pra evitar race condition, já que moveTo utiliza métodos em que setWaitMode não funciona.
Action.isOnLocation = function(npc, target){
    if (npc.x === target.x && npc.y === target.y) {
        return true;
    }
    return false;
}



// ######### DOCUMENTAÇÃO SIMPLES #############
// Nota sobre setWaitMode("message") e o funcionamento do Game Interpreter do RPG Maker MV:

// setWaitMode("message") não interrompe imediatamente a execução do JavaScript atual. Ele apenas informa ao Game_Interpreter que, após o término do comando de evento em execução, o interpretador deverá aguardar o fechamento da caixa de diálogo antes de prosseguir para o próximo comando.

// Isso significa que, dentro de um único Script Call, todo o código continuará sendo executado normalmente, mesmo após a chamada de setWaitMode("message"). Assim, comandos como requests de balão, animações ou qualquer outra ação executada depois dessa chamada ocorrerão imediatamente, podendo aparecer enquanto a mensagem ainda está sendo exibida.

// Para que a espera tenha efeito, a lógica deve ser dividida em comandos de evento distintos (ou implementada de forma assíncrona pelo próprio plugin), permitindo que o interpretador processe o estado de espera antes de executar a próxima ação.