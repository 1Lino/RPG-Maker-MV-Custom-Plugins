/*:
 * @plugindesc Quadro de quests simples com seleção dinâmica de quests.
 * @author Lino
 *
 * @help
 * ============================================================================
 * Quest Board
 * ============================================================================
 *
 * Comando de Plugin:
 *
 *     QuestBoard open
 *
 * O quadro seleciona até 3 quests disponíveis e permite navegar entre elas.
 *
 * ============================================================================
 */

(function() {
    "use strict";

    // BANCO DE QUESTS (é apenas teste, mas _quests deverá ser transformado em JSON em breve)
    var QuestBoard = {

        _quests: [

            {
                id: 1,

                title: "Ratos no porão",

                description:
                    "O taverneiro precisa de alguém para eliminar " +
                    "os ratos que infestaram o porão.",

                reward: 100
            },


            {
                id: 2,

                title: "Ervas medicinais",

                description:
                    "A curandeira precisa de cinco ervas medicinais " +
                    "encontradas na floresta.",

                reward: 75
            },


            {
                id: 3,

                title: "O mercador desaparecido",

                description:
                    "Um mercador não retornou de sua última viagem.\n" +
                    "Descubra o que aconteceu.",

                reward: 250
            },


            {
                id: 4,

                title: "Lobos na estrada",

                description:
                    "Alguns lobos estão atacando viajantes na estrada " +
                    "que leva até a cidade.",

                reward: 300
            },


            {
                id: 5,

                title: "Entrega urgente",

                description:
                    "Leve uma encomenda até a vila vizinha antes " +
                    "do anoitecer.",

                reward: 150
            }

        ],

        // QUESTS DISPONÍVEIS
        getAvailableQuests: function() {
            return this._quests.slice();
        },

        // SELECIONA QUESTS
        pickQuests: function(amount) {

            var available = this.getAvailableQuests();

            // Embaralha a lista de quests.
            for (var i = available.length - 1; i > 0; i--) {

                var j = Math.floor(Math.random() * (i + 1));
                var temp = available[i];

                available[i] = available[j];
                available[j] = temp;

            }
            return available.slice(0, amount);
        },

        // ABRE O QUADRO
        open: function() {
            var quests = this.pickQuests(3);
            SceneManager.push(Scene_QuestBoard);
            SceneManager.prepareNextScene(quests);
        }

    };


    // Disponibiliza globalmente.
    window.QuestBoard = QuestBoard;

    // WINDOW QUEST LIST
    function Window_QuestList() {
        this.initialize.apply(this, arguments);
    }


    Window_QuestList.prototype = Object.create(Window_Selectable.prototype);

    Window_QuestList.prototype.constructor = Window_QuestList;


    Window_QuestList.prototype.initialize = function(quests) {
        this._quests = quests || [];
        var width = 360;
        var height = this.fittingHeight(Math.max(1, this._quests.length));

        Window_Selectable.prototype.initialize.call(this, 0, 0, width, height);

        this.refresh();
        this.select(0);
    };


    Window_QuestList.prototype.maxItems = function() {
        return this._quests.length;
    };


    Window_QuestList.prototype.item = function() {
        return this._quests[this.index()];
    };


    Window_QuestList.prototype.drawItem = function(index) {
        var quest = this._quests[index];
        if (!quest) return;

        var rect = this.itemRectForText(index);

        this.drawText(quest.title, rect.x, rect.y, rect.width);
    };


    Window_QuestList.prototype.refresh = function() {
        this.contents.clear();
        this.createContents();

        for (var i = 0; i < this._quests.length; i++) {
            this.drawItem(i);
        }
    };

    // WINDOW QUEST DESCRIPTION
    function Window_QuestDescription() {
        this.initialize.apply(this, arguments);
    }


    Window_QuestDescription.prototype = Object.create(Window_Base.prototype);

    Window_QuestDescription.prototype.constructor = Window_QuestDescription;


    Window_QuestDescription.prototype.initialize = function() {
        this._quest = null;
        this._width = Graphics.boxWidth - 360;
        this._x = 360;
        this._y = 0;

        // Altura inicial.
        this._height = this.fittingHeight(6);

        Window_Base.prototype.initialize.call(
            this,
            this._x,
            this._y,
            this._width,
            this._height
        );

    };

    // DEFINE A QUEST
    Window_QuestDescription.prototype.setQuest = function(quest) {
        if (this._quest === quest) return;
        this._quest = quest;

        this.refresh();
    };

    // CALCULA QUEBRAS DE LINHA
    Window_QuestDescription.prototype.wrapText = function(text, width) {

        var lines = [];

        // Permite \n manual.
        var paragraphs = String(text).split("\n");

        for (var p = 0; p < paragraphs.length; p++) {

            var paragraph = paragraphs[p];

            // Linha vazia.
            if (paragraph.length === 0) {
                lines.push("");
                continue;
            }

            var words = paragraph.split(" ");
            var line = "";

            for (var i = 0; i < words.length; i++) {

                var word = words[i];
                var testLine = line;

                if (testLine.length > 0) {
                    testLine += " ";
                }

                testLine += word;

                // Se a palavra sozinha for maior que a largura,
                // ainda assim deixamos ela ocupar a linha.
                if ( this.textWidth(testLine) > width && line.length > 0) {
                    lines.push(line);
                    line = word;
                } else {
                    line = testLine;
                }
            }


            if (line.length > 0) {
                lines.push(line);
            }
        }
        return lines;
    };

    // CALCULA ALTURA NECESSÁRIA
    Window_QuestDescription.prototype.calculateHeight = function(lines) {

            var padding = this.padding * 2;
            var titleHeight = this.lineHeight();

            var descriptionHeight = lines.length * this.lineHeight();
            var spacing = 16;
            var rewardHeight =this.lineHeight();

            var total =
                padding +
                titleHeight +
                spacing +
                descriptionHeight +
                spacing +
                rewardHeight;

            // Mantém a janela dentro da tela.
            var maxHeight = Graphics.boxHeight;

            return Math.min(total, maxHeight);
        };

    // REFRESH
    Window_QuestDescription.prototype.refresh = function() {

        // Se não houver quest.
        if (!this._quest) {
            this.contents.clear();
            return;
        }

        var quest = this._quest;
        var width = this.contentsWidth();

        // Calcula linhas da descrição.
        var lines = this.wrapText(quest.description, width);

        // Calcula altura.
        var newHeight = this.calculateHeight(lines);

        // Redimensiona a janela.
        if (this.height !== newHeight) {
            this.height = newHeight;
            this.createContents();
        } else {
            this.contents.clear();
        }

        // TÍTULO
        var x = 0;
        var y = 0;

        this.changeTextColor( this.systemColor());
        this.drawText(quest.title, x, y, width);
        this.resetTextColor();

        y += this.lineHeight();
        y += 8;

        // DESCRIÇÃO
        for (var i = 0; i < lines.length; i++) {
            this.drawText(lines[i], x, y, width);
            y += this.lineHeight();
        }

        // RECOMPENSA
        y += 8;

        this.changeTextColor( this.systemColor() );
        this.drawText("Recompensa: ", x, y, 120);
        this.resetTextColor();

        this.drawText(
            String(quest.reward) + " G",
            120,
            y,
            width - 120
        );
    };

    // SCENE QUEST BOARD
    function Scene_QuestBoard() {
        this.initialize.apply(this, arguments);
    }

    Scene_QuestBoard.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_QuestBoard.prototype.constructor = Scene_QuestBoard;

    Scene_QuestBoard.prototype.initialize = function() {
        Scene_MenuBase.prototype.initialize.call(this);
        this._quests = [];
    };

    Scene_QuestBoard.prototype.prepare = function(quests) {
        this._quests = quests || [];
    };


    Scene_QuestBoard.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        this.createQuestWindows();
    };


    Scene_QuestBoard.prototype.createQuestWindows = function() {

        this._questList = new Window_QuestList(this._quests);
        this._questDescription = new Window_QuestDescription();
        this.addWindow(this._questList);

        this.addWindow(this._questDescription);
        var scene = this;

        // ENTER
        this._questList.setHandler(
            "ok",
            function() {
                scene.onQuestOk();
            }
        );

        // ESC
        this._questList.setHandler(
            "cancel",
            function() {
                scene.popScene();
            }
        );

        this._questList.activate();
        this.updateQuestDescription();
    };

    // UPDATE
    Scene_QuestBoard.prototype.update = function() {
        Scene_MenuBase.prototype.update.call(this);
        this.updateQuestDescription();
    };

    // ATUALIZA DESCRIÇÃO
    Scene_QuestBoard.prototype.updateQuestDescription = function() {
            var quest = this._questList.item();
            this._questDescription.setQuest(quest );
        };

    // QUEST SELECIONADA
    Scene_QuestBoard.prototype.onQuestOk = function() {
            var quest = this._questList.item();

            if (!quest) return;

            // Por enquanto apenas mostra uma mensagem.
            $gameMessage.add("Quest selecionada: " + quest.title);
            this.popScene();
        };

    // PLUGIN COMMAND
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;

    Game_Interpreter.prototype.pluginCommand = function(command, args) {
            _Game_Interpreter_pluginCommand.call(this, command, args);

            if (command.toLowerCase() === "questboard") {
                if (args[0] && args[0].toLowerCase() === "open") {
                    QuestBoard.open();
                }
            }
        };

//END
})();
