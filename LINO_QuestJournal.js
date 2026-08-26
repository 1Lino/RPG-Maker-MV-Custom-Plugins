/*:
 * @plugindesc Diário de Quests - gerenciamento e visualização das quests.
 * @author Lino
 *
 * @help
 * Sistema de Diário de Quests.
 *
 * O plugin armazena somente o ID da quest e seu estado.
 *
 * Estados:
 *
 * active
 * completed
 * failed
 * abandoned
 *
 * Exemplos:
 *
 * QuestJournal.addQuest(quest);
 * QuestJournal.completeQuest(id);
 * QuestJournal.failQuest(id);
 * QuestJournal.abandonQuest(id);
 * QuestJournal.getStatus(id);
 *
 * IMPORTANTE:
 * O QuestJournal deve estar acima do QuestBoard
 * na lista de plugins do RPG Maker MV.
 */

(function () {
  "use strict";

  // QUEST JOURNAL

  var QuestJournal = {};

  // INICIALIZAÇÃO

  QuestJournal.initialize = function () {
    if (!$gameSystem._questJournal) {
      $gameSystem._questJournal = {};
    }
  };

  // DADOS DO DIÁRIO

  QuestJournal.data = function () {
    this.initialize();

    return $gameSystem._questJournal;
  };

  // ADICIONAR QUEST

  QuestJournal.addQuest = function (quest) {
    if (!quest) {
      return;
    }

    this.initialize();

    // Não adiciona duas vezes.
    if (this.hasQuest(quest.id)) {
      return;
    }

    $gameSystem._questJournal[quest.id] = {
      status: "active",
    };
  };

  // VERIFICAR EXISTÊNCIA

  QuestJournal.hasQuest = function (id) {
    this.initialize();

    return !!$gameSystem._questJournal[id];
  };

  // OBTER STATUS

  QuestJournal.getStatus = function (id) {
    this.initialize();

    var entry = $gameSystem._questJournal[id];

    if (!entry) {
      return null;
    }

    return entry.status;
  };

  // ALTERAR STATUS

  QuestJournal.setStatus = function (id, status) {
    this.initialize();

    var entry = $gameSystem._questJournal[id];

    if (!entry) {
      return;
    }

    entry.status = status;
  };

  // CONCLUIR

  QuestJournal.completeQuest = function (id) {
    this.setStatus(id, "completed");
  };

  // FALHAR

  QuestJournal.failQuest = function (id) {
    this.setStatus(id, "failed");
  };

  // ABANDONAR

  QuestJournal.abandonQuest = function (id) {
    this.setStatus(id, "abandoned");
  };

  // REMOVER

  QuestJournal.removeQuest = function (id) {
    this.initialize();

    delete $gameSystem._questJournal[id];
  };

  // DISPONIBILIZA GLOBALMENTE

  window.QuestJournal = QuestJournal;

  // GAME SYSTEM

  var _Game_System_initialize = Game_System.prototype.initialize;

  Game_System.prototype.initialize = function () {
    _Game_System_initialize.call(this);

    this._questJournal = {};
  };

  // WINDOW QUEST JOURNAL LIST

  function Window_QuestJournalList() {
    this.initialize.apply(this, arguments);
  }

  Window_QuestJournalList.prototype = Object.create(
    Window_Selectable.prototype,
  );

  Window_QuestJournalList.prototype.constructor = Window_QuestJournalList;

  // INITIALIZE

  Window_QuestJournalList.prototype.initialize = function () {
    // IMPORTANTE:
    // precisa existir antes de maxItems()
    // poder ser chamado.
    this._entries = [];

    var width = 360;
    var height = Graphics.boxHeight;

    Window_Selectable.prototype.initialize.call(this, 0, 0, width, height);

    this.refresh();

    this.selectFirstQuest();
  };

  // CRIA ENTRADAS

  Window_QuestJournalList.prototype.makeEntries = function () {
    var entries = [];

    var data = QuestJournal.data();

    var ids = Object.keys(data);

    var active = [];
    var completed = [];

    // SEPARA POR STATUS

    for (var i = 0; i < ids.length; i++) {
      var id = Number(ids[i]);

      var status = QuestJournal.getStatus(id);

      if (status === "active") {
        active.push(id);
      } else if (status === "completed") {
        completed.push(id);
      }
    }

    // ATIVAS

    if (active.length > 0) {
      entries.push({
        type: "category",
        name: "ATIVAS",
      });

      for (var a = 0; a < active.length; a++) {
        entries.push({
          type: "quest",
          id: active[a],
        });
      }
    }

    // CONCLUÍDAS

    if (completed.length > 0) {
      entries.push({
        type: "category",
        name: "CONCLUÍDAS",
      });

      for (var c = 0; c < completed.length; c++) {
        entries.push({
          type: "quest",
          id: completed[c],
        });
      }
    }

    return entries;
  };

  // MAX ITEMS

  Window_QuestJournalList.prototype.maxItems = function () {
    return this._entries ? this._entries.length : 0;
  };

  // SELECIONA PRIMEIRA QUEST

  Window_QuestJournalList.prototype.selectFirstQuest = function () {
    for (var i = 0; i < this._entries.length; i++) {
      if (this._entries[i].type === "quest") {
        this.select(i);

        return;
      }
    }

    // Diário vazio.

    this.deselect();
  };

  // ITEM ATUAL

  Window_QuestJournalList.prototype.item = function () {
    var entry = this._entries[this.index()];

    if (!entry) {
      return null;
    }

    if (entry.type !== "quest") {
      return null;
    }

    return QuestBoard.findQuestById(Number(entry.id));
  };

  // ITEM POR ÍNDICE

  Window_QuestJournalList.prototype.itemAt = function (index) {
    var entry = this._entries[index];

    if (!entry) {
      return null;
    }

    if (entry.type !== "quest") {
      return null;
    }

    return QuestBoard.findQuestById(Number(entry.id));
  };

  // REFRESH

  Window_QuestJournalList.prototype.refresh = function () {
    this._entries = this.makeEntries();

    this.contents.clear();

    this.createContents();

    // DIÁRIO VAZIO

    if (this._entries.length === 0) {
      this.changeTextColor(this.systemColor());

      this.drawText(
        "Nenhuma quest no diário.",
        0,
        0,
        this.contentsWidth(),
        "center",
      );

      this.resetTextColor();

      return;
    }

    // DESENHA ENTRADAS

    for (var i = 0; i < this._entries.length; i++) {
      this.drawItem(i);
    }
  };

  // DRAW ITEM

  Window_QuestJournalList.prototype.drawItem = function (index) {
    var entry = this._entries[index];

    if (!entry) {
      return;
    }

    var rect = this.itemRectForText(index);

    // CATEGORIA

    if (entry.type === "category") {
      this.changeTextColor(this.systemColor());

      this.drawText(entry.name, rect.x, rect.y, rect.width);

      this.resetTextColor();

      return;
    }

    // QUEST

    var quest = QuestBoard.findQuestById(Number(entry.id));

    if (!quest) {
      return;
    }

    this.drawText(quest.title, rect.x + 16, rect.y, rect.width - 16);
  };

  // PROCESS OK

  Window_QuestJournalList.prototype.processOk = function () {
    var entry = this._entries[this.index()];

    // Não permite OK em categorias
    // ou diário vazio.

    if (!entry || entry.type !== "quest") {
      SoundManager.playBuzzer();

      return;
    }

    Window_Selectable.prototype.processOk.call(this);
  };

  // WINDOW QUEST JOURNAL DESCRIPTION

  function Window_QuestJournalDescription() {
    this.initialize.apply(this, arguments);
  }

  Window_QuestJournalDescription.prototype = Object.create(
    Window_Base.prototype,
  );

  Window_QuestJournalDescription.prototype.constructor =
    Window_QuestJournalDescription;

  // INITIALIZE DESCRIPTION

  Window_QuestJournalDescription.prototype.initialize = function () {
    var x = 360;
    var y = 0;

    var width = Graphics.boxWidth - x;

    var height = Graphics.boxHeight;

    Window_Base.prototype.initialize.call(this, x, y, width, height);

    this._quest = null;
  };

  // SET QUEST

  Window_QuestJournalDescription.prototype.setQuest = function (quest) {
    if (this._quest === quest) {
      return;
    }

    this._quest = quest;

    this.refresh();
  };

  // WRAP TEXT

  Window_QuestJournalDescription.prototype.wrapText = function (text, width) {
    var lines = [];

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

        if (this.textWidth(testLine) > width && line.length > 0) {
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

  // REFRESH DESCRIPTION

  Window_QuestJournalDescription.prototype.refresh = function () {
    this.contents.clear();

    // SEM QUEST

    if (!this._quest) {
      return;
    }

    var quest = this._quest;
    var width = this.contentsWidth();

    // DESCRIÇÃO QUEBRADA
    var lines = this.wrapText(quest.description, width);

    var x = 0;
    var y = 0;

    // TÍTULO
    this.changeTextColor(this.systemColor());

    this.drawText(quest.title, x, y, width);

    this.resetTextColor();

    y += this.lineHeight();

    y += 16;

    // DESCRIÇÃO
    for (var i = 0; i < lines.length; i++) {
      this.drawText(lines[i], x, y, width);
      y += this.lineHeight();
    }

    y += 16;

    // RECOMPENSA
    this.changeTextColor(this.systemColor());

    this.drawText("Recompensa:", x, y, 120);
    this.resetTextColor();

    this.drawText(String(quest.reward) + " G", 120, y, width - 120);

    y += this.lineHeight();
    y += 8;

    // STATUS
    this.changeTextColor(this.systemColor());

    this.drawText("Status:", x, y, 120);
    this.resetTextColor();

    this.drawText(
      this.statusText(QuestJournal.getStatus(quest.id)),
      120,
      y,
      width - 120,
    );
  };

  // STATUS TEXT
  Window_QuestJournalDescription.prototype.statusText = function (status) {
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
    this.initialize.apply(this, arguments);
  }

  Scene_QuestJournal.prototype = Object.create(Scene_MenuBase.prototype);
  Scene_QuestJournal.prototype.constructor = Scene_QuestJournal;

  // INITIALIZE SCENE
  Scene_QuestJournal.prototype.initialize = function () {
    Scene_MenuBase.prototype.initialize.call(this);
  };

  // CREATE
  Scene_QuestJournal.prototype.create = function () {
    Scene_MenuBase.prototype.create.call(this);
    this.createQuestWindows();
  };

  // CREATE WINDOWS
  Scene_QuestJournal.prototype.createQuestWindows = function () {
    // Lista.
    this._questList = new Window_QuestJournalList();

    // Descrição.
    this._questDescription = new Window_QuestJournalDescription();

    // IMPORTANTE:
    // A descrição é adicionada depois,
    // ficando visualmente sobre a lista.
    this.addWindow(this._questList);
    this.addWindow(this._questDescription);

    var scene = this;

    // CANCEL
    this._questList.setHandler("cancel", function () {
      scene.popScene();
    });

    // ATIVA
    this._questList.activate();

    // DESCRIÇÃO INICIAL
    this.updateQuestDescription();
  };

  // UPDATE
  Scene_QuestJournal.prototype.update = function () {
    Scene_MenuBase.prototype.update.call(this);

    this.updateQuestDescription();
  };

  // UPDATE DESCRIPTION
  Scene_QuestJournal.prototype.updateQuestDescription = function () {
    var quest = this._questList.item();

    this._questDescription.setQuest(quest);
  };

  // MENU PRINCIPAL
  var _Window_MenuCommand_addOriginalCommands =
    Window_MenuCommand.prototype.addOriginalCommands;

  Window_MenuCommand.prototype.addOriginalCommands = function () {
    _Window_MenuCommand_addOriginalCommands.call(this);

    this.addCommand("Quest Journal", "questJournal", true);
  };

  // MENU HANDLER
  var _Scene_Menu_createCommandWindow =
    Scene_Menu.prototype.createCommandWindow;

  Scene_Menu.prototype.createCommandWindow = function () {
    _Scene_Menu_createCommandWindow.call(this);

    this._commandWindow.setHandler("questJournal", function () {
      SceneManager.push(Scene_QuestJournal);
    });
  };

  //END
})();
