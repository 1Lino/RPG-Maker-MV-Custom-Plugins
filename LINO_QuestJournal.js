/*:
 * @plugindesc Diário de Quests - gerenciamento das quests aceitas pelo jogador.
 * @author Lino
 *
 * @help
 * Este plugin cria o sistema de Diário de Quests.
 *
 * As quests são armazenadas pelo ID e possuem um estado.
 *
 * Estados previstos:
 *
 * active
 * completed
 * failed
 * abandoned
 *
 * Para adicionar uma quest:
 *
 * QuestJournal.addQuest(quest);
 *
 * Para concluir:
 *
 * QuestJournal.completeQuest(id);
 *
 * Para consultar o estado:
 *
 * QuestJournal.getStatus(id);
 */

(function() {

    "use strict";


    // QUEST JOURNAL
    var QuestJournal = {};


    // INICIALIZAÇÃO
    QuestJournal.initialize = function() {

        if (!$gameSystem._questJournal) {

            $gameSystem._questJournal = {};

        }

    };


    // RETORNA OS DADOS DO DIÁRIO
    QuestJournal.data = function() {

        this.initialize();

        return $gameSystem._questJournal;

    };


    // ADICIONA QUEST
    QuestJournal.addQuest = function(quest) {

        if (!quest) {
            return;
        }

        this.initialize();

        // Não permite adicionar a mesma quest
        // se ela já estiver registrada.
        if (this.hasQuest(quest.id)) {
            return;
        }

        $gameSystem._questJournal[quest.id] = {

            status: "active"

        };

    };


    // VERIFICA SE A QUEST ESTÁ REGISTRADA
    QuestJournal.hasQuest = function(id) {

        this.initialize();

        return !!$gameSystem._questJournal[id];

    };


    // RETORNA O ESTADO DA QUEST
    QuestJournal.getStatus = function(id) {

        this.initialize();

        var entry =
            $gameSystem._questJournal[id];

        if (!entry) {
            return null;
        }

        return entry.status;

    };


    // ALTERA O ESTADO
    QuestJournal.setStatus = function(id, status) {

        this.initialize();

        var entry =
            $gameSystem._questJournal[id];

        if (!entry) {
            return;
        }

        entry.status = status;

    };


    // CONCLUI QUEST
    QuestJournal.completeQuest = function(id) {

        this.setStatus(
            id,
            "completed"
        );

    };


    // FALHA QUEST
    QuestJournal.failQuest = function(id) {

        this.setStatus(
            id,
            "failed"
        );

    };


    // ABANDONA QUEST
    QuestJournal.abandonQuest = function(id) {

        this.setStatus(
            id,
            "abandoned"
        );

    };


    // REMOVE QUEST DO DIÁRIO
    QuestJournal.removeQuest = function(id) {

        this.initialize();

        delete $gameSystem._questJournal[id];

    };


    // DISPONIBILIZA GLOBALMENTE
    window.QuestJournal = QuestJournal;


    // GAME SYSTEM
    var _Game_System_initialize =
        Game_System.prototype.initialize;


    Game_System.prototype.initialize =
        function() {

        _Game_System_initialize.call(this);

        this._questJournal = {};

    };


    // WINDOW QUEST JOURNAL LIST
    function Window_QuestJournalList() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Window_QuestJournalList.prototype =
        Object.create(
            Window_Selectable.prototype
        );


    Window_QuestJournalList.prototype.constructor =
        Window_QuestJournalList;


    Window_QuestJournalList.prototype.initialize =
        function() {

        this._quests =
            QuestJournal.data();

        this._questIds =
            Object.keys(this._quests);

        var width = 360;
        var height = Graphics.boxHeight;

        Window_Selectable.prototype.initialize.call(
            this,
            0,
            0,
            width,
            height
        );

        this.refresh();

        if (this.maxItems() > 0) {

            this.select(0);

        }

    };


    Window_QuestJournalList.prototype.maxItems =
        function() {

        return this._questIds.length;

    };


    Window_QuestJournalList.prototype.item =
        function() {

        var id =
            this._questIds[this.index()];

        if (id === undefined) {
            return null;
        }

        return QuestBoard.findQuestById(
            Number(id)
        );

    };


    Window_QuestJournalList.prototype.drawItem =
        function(index) {

        var quest =
            this.itemAt(index);

        if (!quest) {
            return;
        }

        var rect =
            this.itemRectForText(index);

        this.drawText(
            quest.title,
            rect.x,
            rect.y,
            rect.width
        );

    };


    Window_QuestJournalList.prototype.itemAt =
        function(index) {

        var id =
            this._questIds[index];

        if (id === undefined) {
            return null;
        }

        return QuestBoard.findQuestById(
            Number(id)
        );

    };


    Window_QuestJournalList.prototype.refresh =
        function() {

        this._quests =
            QuestJournal.data();

        this._questIds =
            Object.keys(this._quests);

        this.contents.clear();

        this.createContents();

        for (
            var i = 0;
            i < this._questIds.length;
            i++
        ) {

            this.drawItem(i);

        }

    };


    // WINDOW QUEST JOURNAL DESCRIPTION
    function Window_QuestJournalDescription() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Window_QuestJournalDescription.prototype =
        Object.create(
            Window_Base.prototype
        );


    Window_QuestJournalDescription.prototype.constructor =
        Window_QuestJournalDescription;


    Window_QuestJournalDescription.prototype.initialize =
        function() {

        var x = 360;
        var y = 0;

        var width =
            Graphics.boxWidth - 360;

        var height =
            Graphics.boxHeight;

        Window_Base.prototype.initialize.call(
            this,
            x,
            y,
            width,
            height
        );

        this._quest = null;

    };


    Window_QuestJournalDescription.prototype.setQuest =
        function(quest) {

        if (this._quest === quest) {
            return;
        }

        this._quest = quest;

        this.refresh();

    };


    Window_QuestJournalDescription.prototype.wrapText =
        function(text, width) {

        var lines = [];

        var paragraphs =
            String(text).split("\n");

        for (
            var p = 0;
            p < paragraphs.length;
            p++
        ) {

            var paragraph =
                paragraphs[p];

            if (paragraph.length === 0) {

                lines.push("");

                continue;

            }

            var words =
                paragraph.split(" ");

            var line = "";

            for (
                var i = 0;
                i < words.length;
                i++
            ) {

                var word =
                    words[i];

                var testLine =
                    line;

                if (testLine.length > 0) {

                    testLine += " ";

                }

                testLine += word;

                if (
                    this.textWidth(testLine) > width &&
                    line.length > 0
                ) {

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


    Window_QuestJournalDescription.prototype.refresh =
        function() {

        this.contents.clear();

        if (!this._quest) {
            return;
        }

        var quest =
            this._quest;

        var width =
            this.contentsWidth();

        var lines =
            this.wrapText(
                quest.description,
                width
            );

        var x = 0;
        var y = 0;


        // TÍTULO

        this.changeTextColor(
            this.systemColor()
        );

        this.drawText(
            quest.title,
            x,
            y,
            width
        );

        this.resetTextColor();


        y += this.lineHeight();

        y += 16;


        // DESCRIÇÃO

        for (
            var i = 0;
            i < lines.length;
            i++
        ) {

            this.drawText(
                lines[i],
                x,
                y,
                width
            );

            y += this.lineHeight();

        }


        y += 16;


        // RECOMPENSA

        this.changeTextColor(
            this.systemColor()
        );

        this.drawText(
            "Recompensa:",
            x,
            y,
            120
        );

        this.resetTextColor();

        this.drawText(
            String(quest.reward) + " G",
            120,
            y,
            width - 120
        );


        y += this.lineHeight();

        y += 8;


        // STATUS

        this.changeTextColor(
            this.systemColor()
        );

        this.drawText(
            "Status:",
            x,
            y,
            120
        );

        this.resetTextColor();

        var status =
            QuestJournal.getStatus(
                quest.id
            );

        var statusText =
            this.statusText(status);

        this.drawText(
            statusText,
            120,
            y,
            width - 120
        );

    };


    Window_QuestJournalDescription.prototype.statusText =
        function(status) {

        switch (status) {

        case "active":
            return "Ativa";

        case "completed":
            return "Concluída";

        case "failed":
            return "Falhou";

        case "abandoned":
            return "Abandonada";

        default:
            return "Desconhecido";

        }

    };


    // SCENE QUEST JOURNAL
    function Scene_QuestJournal() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Scene_QuestJournal.prototype =
        Object.create(
            Scene_MenuBase.prototype
        );


    Scene_QuestJournal.prototype.constructor =
        Scene_QuestJournal;


    Scene_QuestJournal.prototype.initialize =
        function() {

        Scene_MenuBase.prototype.initialize.call(
            this
        );

    };


    Scene_QuestJournal.prototype.create =
        function() {

        Scene_MenuBase.prototype.create.call(
            this
        );

        this.createQuestWindows();

    };


    Scene_QuestJournal.prototype.createQuestWindows =
        function() {

        this._questList =
            new Window_QuestJournalList();

        this._questDescription =
            new Window_QuestJournalDescription();

        this.addWindow(
            this._questList
        );

        this.addWindow(
            this._questDescription
        );

        var scene = this;


        // CANCELAR

        this._questList.setHandler(
            "cancel",
            function() {

                scene.popScene();

            }
        );


        this._questList.activate();


        this.updateQuestDescription();

    };


    Scene_QuestJournal.prototype.update =
        function() {

        Scene_MenuBase.prototype.update.call(
            this
        );

        this.updateQuestDescription();

    };


    Scene_QuestJournal.prototype.updateQuestDescription =
        function() {

        var quest =
            this._questList.item();

        this._questDescription.setQuest(
            quest
        );

    };


    // MENU PRINCIPAL
    var _Window_MenuCommand_addOriginalCommands =
        Window_MenuCommand.prototype.addOriginalCommands;


    Window_MenuCommand.prototype.addOriginalCommands =
        function() {

        _Window_MenuCommand_addOriginalCommands.call(
            this
        );

        this.addCommand(
            "Diário de Quests",
            "questJournal",
            true
        );

    };


    // HANDLER DO MENU
    var _Scene_Menu_createCommandWindow =
        Scene_Menu.prototype.createCommandWindow;


    Scene_Menu.prototype.createCommandWindow =
        function() {

        _Scene_Menu_createCommandWindow.call(
            this
        );

        this._commandWindow.setHandler(
            "questJournal",
            function() {

                SceneManager.push(
                    Scene_QuestJournal
                );

            }
        );

    };

})();