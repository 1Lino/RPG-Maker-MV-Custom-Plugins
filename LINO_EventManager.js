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
Dialog.loadDialogs = function() {
    if (!this.dialogs) {
        var fs = require("fs"); // fs = file system
        var text = fs.readFileSync(path, "utf8");
        this.dialogs = JSON.parse(text);
    }
    return this.dialogs;
};

// os dados puxados do json são de acordo com os argumentos que o dev passar a este método.
// "scene" trata-se da cena atual, "character" trata do personagem daquela cena, e "dialog" do identificador do texto específico daquele personagem para aquela cena.
Dialog.showDialog = function(scene, character, dialog) {
    var dialogs = this.loadDialogs();

    dialogs[scene][character][dialog].forEach(function(line, index) {
        if (index === 0)
            $gameMessage.add(`\\C[0]${character}\\C[0]\n${line}`); // torna a primeira linha o nome do personagem, cor de índice 0. 
        else
            $gameMessage.add(line);
    });
};

// "state" é true ou false. É pra ser usado antes de qualquer diálogo com qualquer npc
Dialog.setEventDirectionFix = function(npc, state){
    if (npc) {
        npc.setDirectionFix(state);
    }
}

// É pra ser usado após um diálogo.
Dialog.resetEventDirectionFix = function(npc){
	const TerminateMessage = Window_Message.prototype.terminateMessage;

	Window_Message.prototype.terminateMessage = function() {
		TerminateMessage.call(this); // 'this' se refere à mensagem atual no display/window.

		Dialog.setEventDirectionFix(npc, false);
	};
}


// Métodos que envolvem ação de personagem, movimentos, etc.
var Action = {};

// Esta função deve ser chamada numa página de evento separada do npc, em modo de execução paralela.
Action.moveTo = function(npc, target){
    Game_Character.prototype.moveTowardTarget = function(target) {
		if (!target) return;
		if (this.isMoving()) return; // previne teleporte

		const direction = this.findDirectionTo(target.x, target.y);

		if (direction > 0) {
			this.moveStraight(direction);
		}
	};
	
	npc.moveTowardTarget(target);
    
}